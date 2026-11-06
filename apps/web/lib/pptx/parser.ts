import { unzipArchive } from "../imscc/unzip"
import { decodeHtmlEntities } from "../imscc/xml-utils"
import {
  ParsedPresentation,
  ParsedSlide,
  SlideTextBlock,
  SlideImage,
  SlideTable,
} from "./types"
import { generatePresentationSummary } from "./summarizer"

/**
 * Determine MIME type based on media filename
 */
function getMediaMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  switch (ext) {
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "gif":
      return "image/gif"
    case "svg":
      return "image/svg+xml"
    case "webp":
      return "image/webp"
    case "mp4":
      return "video/mp4"
    case "mp3":
      return "audio/mpeg"
    default:
      return "application/octet-stream"
  }
}

/**
 * Normalizes file path inside zip
 */
function normalizeZipPath(p: string): string {
  return p.replace(/\\/g, "/").replace(/^\/+/, "")
}

/**
 * Parse an OpenXML PPTX file into a full structured presentation object.
 */
export async function parsePptx(
  input: Uint8Array | ArrayBuffer | Blob | File,
  filename: string = "presentation.pptx"
): Promise<ParsedPresentation> {
  const files = await unzipArchive(input)
  const textDecoder = new TextDecoder("utf-8")

  const getXml = (filePath: string): string | null => {
    const clean = normalizeZipPath(filePath)
    let data = files.get(clean)
    if (!data) {
      // Try with ppt/ prefix or relative search
      for (const [key, val] of files.entries()) {
        if (normalizeZipPath(key) === clean || key.endsWith("/" + clean) || clean.endsWith("/" + key)) {
          data = val
          break
        }
      }
    }
    return data ? textDecoder.decode(data) : null
  }

  // 1. Extract embedded media files into Object URLs
  const mediaMap: Record<string, string> = {}
  for (const [path, data] of files.entries()) {
    const clean = normalizeZipPath(path)
    if (clean.startsWith("ppt/media/") && !clean.endsWith("/")) {
      const mime = getMediaMimeType(clean)
      let url = ""
      if (typeof window !== "undefined" && typeof window.URL?.createObjectURL === "function") {
        try {
          const blob = new Blob([data as unknown as BlobPart], { type: mime })
          url = URL.createObjectURL(blob)
        } catch (e) {
          console.warn("Failed to create blob for media", clean, e)
        }
      }

      if (url) {
        const basename = clean.split("/").pop() || clean
        mediaMap[clean] = url
        mediaMap[`../media/${basename}`] = url
        mediaMap[`media/${basename}`] = url
        mediaMap[basename] = url
      }
    }
  }

  // 2. Parse presentation dimensions and default layout from ppt/presentation.xml
  const presXml = getXml("ppt/presentation.xml")
  let slideWidth = 12192000 // default 16:9 widescreen in EMUs
  let slideHeight = 6858000 // 6858000 EMUs
  let aspectRatio: "16:9" | "4:3" | string = "16:9"

  if (presXml) {
    const sldSzMatch = presXml.match(/<p:sldSz[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"/)
    if (sldSzMatch && sldSzMatch[1] && sldSzMatch[2]) {
      const cx = parseInt(sldSzMatch[1], 10)
      const cy = parseInt(sldSzMatch[2], 10)
      if (cx > 0 && cy > 0) {
        slideWidth = cx
        slideHeight = cy
      }
    }
  }

  const ratio = slideWidth / slideHeight
  if (Math.abs(ratio - 16 / 9) < 0.1) {
    aspectRatio = "16:9"
  } else if (Math.abs(ratio - 4 / 3) < 0.1) {
    aspectRatio = "4:3"
  } else {
    aspectRatio = `${(Math.round(ratio * 100) / 100).toFixed(2)}:1`
  }

  // 3. Resolve slide order from presentation.xml and presentation.xml.rels
  const presRelsXml = getXml("ppt/_rels/presentation.xml.rels")
  const presRelsMap: Record<string, string> = {}
  if (presRelsXml) {
    const relRegex = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g
    let m: RegExpExecArray | null
    while ((m = relRegex.exec(presRelsXml)) !== null) {
      if (m[1] && m[2]) {
        presRelsMap[m[1]] = m[2]
      }
    }
  }

  // Extract ordered slide references from <p:sldIdLst>
  const orderedSlideFiles: string[] = []
  if (presXml) {
    const sldIdRegex = /<p:sldId[^>]*r:id="([^"]+)"/g
    let sm: RegExpExecArray | null
    while ((sm = sldIdRegex.exec(presXml)) !== null) {
      const relId = sm[1]
      if (relId && presRelsMap[relId]) {
        let target = presRelsMap[relId]
        if (!target.startsWith("ppt/")) {
          target = "ppt/" + target.replace(/^\/+/, "")
        }
        orderedSlideFiles.push(target)
      }
    }
  }

  // Fallback: if no ordered list found, scan for slide files in zip
  if (orderedSlideFiles.length === 0) {
    const foundSlideKeys = Array.from(files.keys())
      .filter((k) => /ppt\/slides\/slide\d+\.xml$/i.test(k))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/i)?.[1] || "0", 10)
        const numB = parseInt(b.match(/slide(\d+)\.xml/i)?.[1] || "0", 10)
        return numA - numB
      })
    orderedSlideFiles.push(...foundSlideKeys)
  }

  // 4. Parse each slide in order
  const parsedSlides: ParsedSlide[] = []

  for (let idx = 0; idx < orderedSlideFiles.length; idx++) {
    const slidePath = orderedSlideFiles[idx]
    if (!slidePath) continue
    const slideNumber = idx + 1
    const slideXml = getXml(slidePath)
    if (!slideXml) continue

    const slideBasename = slidePath.split("/").pop() || `slide${slideNumber}.xml`
    const slideRelsPath = `ppt/slides/_rels/${slideBasename}.rels`
    const slideRelsXml = getXml(slideRelsPath)

    // Build relationship map for this slide
    const slideRels: Record<string, { type: string; target: string }> = {}
    let notesSlidePath = ""

    if (slideRelsXml) {
      const relTagRegex = /<Relationship[^>]*Id="([^"]+)"[^>]*Type="([^"]+)"[^>]*Target="([^"]+)"/g
      let rm: RegExpExecArray | null
      while ((rm = relTagRegex.exec(slideRelsXml)) !== null) {
        const [, rId, type, target] = rm
        if (rId && type && target) {
          slideRels[rId] = { type, target }
          if (type.endsWith("/notesSlide")) {
            notesSlidePath = target.startsWith("ppt/")
              ? target
              : "ppt/notesSlides/" + target.split("/").pop()
          }
        }
      }
    }

    // 4a. Parse Speaker Notes if available
    let speakerNotes = ""
    if (notesSlidePath) {
      const notesXml = getXml(notesSlidePath)
      if (notesXml) {
        // Collect paragraphs from notes shape (ignoring slide numbers)
        const spRegex = /<p:sp>([\s\S]*?)<\/p:sp>/g
        let notesSpMatch: RegExpExecArray | null
        const notesLines: string[] = []

        while ((notesSpMatch = spRegex.exec(notesXml)) !== null) {
          const spContent = notesSpMatch[1] || ""
          // Check if placeholder is slide number
          if (spContent.includes('type="sldNum"') || spContent.includes("sldNum")) {
            continue
          }

          // Extract text from this shape's paragraphs
          const pRegex = /<a:p>([\s\S]*?)<\/a:p>/g
          let pMatch: RegExpExecArray | null
          while ((pMatch = pRegex.exec(spContent)) !== null) {
            const pContent = pMatch[1] || ""
            const tRegex = /<a:t>([^<]*)<\/a:t>/g
            let tm: RegExpExecArray | null
            const lineTokens: string[] = []
            while ((tm = tRegex.exec(pContent)) !== null) {
              if (tm[1]) lineTokens.push(decodeHtmlEntities(tm[1]))
            }
            const line = lineTokens.join("").trim()
            if (line && line !== String(slideNumber)) {
              notesLines.push(line)
            }
          }
        }
        speakerNotes = notesLines.join("\n\n").trim()
      }
    }

    // 4b. Parse Slide Shapes & Text
    const textBlocks: SlideTextBlock[] = []
    let detectedTitle = ""
    let detectedSubtitle = ""

    const spRegex = /<p:sp>([\s\S]*?)<\/p:sp>/g
    let spMatch: RegExpExecArray | null
    let shapeCounter = 0

    while ((spMatch = spRegex.exec(slideXml)) !== null) {
      const spContent = spMatch[1] || ""
      shapeCounter++

      // Placeholder detection
      const phMatch = spContent.match(/<p:ph[^>]*type="([^"]+)"/)
      const phType = phMatch ? phMatch[1] : (spContent.includes("<p:ph") ? "body" : "none")

      // Transform / Bounding Box (EMUs -> Percentages)
      let x = 10
      let y = 10
      let width = 80
      let height = 20

      const xfrmMatch = spContent.match(/<a:off\s+x="([^"]+)"\s+y="([^"]+)"\/>\s*<a:ext\s+cx="([^"]+)"\s+cy="([^"]+)"\/>/)
      if (xfrmMatch && xfrmMatch[1] && xfrmMatch[2] && xfrmMatch[3] && xfrmMatch[4]) {
        const offX = parseInt(xfrmMatch[1], 10)
        const offY = parseInt(xfrmMatch[2], 10)
        const extX = parseInt(xfrmMatch[3], 10)
        const extY = parseInt(xfrmMatch[4], 10)
        if (slideWidth > 0 && slideHeight > 0) {
          x = Math.max(0, Math.min(100, Math.round((offX / slideWidth) * 1000) / 10))
          y = Math.max(0, Math.min(100, Math.round((offY / slideHeight) * 1000) / 10))
          width = Math.max(5, Math.min(100, Math.round((extX / slideWidth) * 1000) / 10))
          height = Math.max(5, Math.min(100, Math.round((extY / slideHeight) * 1000) / 10))
        }
      }

      // Paragraphs
      const pRegex = /<a:p>([\s\S]*?)<\/a:p>/g
      let pMatch: RegExpExecArray | null
      while ((pMatch = pRegex.exec(spContent)) !== null) {
        const pContent = pMatch[1] || ""
        const lvlMatch = pContent.match(/<a:pPr[^>]*lvl="([^"]+)"/)
        const level = lvlMatch && lvlMatch[1] ? parseInt(lvlMatch[1], 10) : 0

        const tRegex = /<a:t>([^<]*)<\/a:t>/g
        let tm: RegExpExecArray | null
        const pTokens: string[] = []
        while ((tm = tRegex.exec(pContent)) !== null) {
          if (tm[1]) pTokens.push(decodeHtmlEntities(tm[1]))
        }

        const text = pTokens.join("").trim()
        if (!text) continue

        let type: "title" | "subtitle" | "body" | "bullet" = "body"

        if (phType === "title" || phType === "ctrTitle") {
          type = "title"
          if (!detectedTitle) detectedTitle = text
        } else if (phType === "subTitle") {
          type = "subtitle"
          if (!detectedSubtitle) detectedSubtitle = text
        } else if (level > 0 || text.startsWith("•") || text.startsWith("-") || text.startsWith("–") || text.startsWith("…")) {
          type = "bullet"
        } else if (phType === "body" && text.length < 120 && shapeCounter > 1) {
          type = "bullet"
        }

        textBlocks.push({
          id: `sp-${shapeCounter}-${textBlocks.length}`,
          text,
          type,
          level,
          x,
          y,
          width,
          height,
        })
      }
    }

    // Fallback: If no explicit title placeholder was found, inspect top text blocks
    if (!detectedTitle && textBlocks.length > 0) {
      const topBlock = textBlocks[0]
      if (topBlock && topBlock.text.length < 100 && topBlock.y <= 30) {
        detectedTitle = topBlock.text
        topBlock.type = "title"
      }
    }

    // 4c. Parse Slide Images (<p:pic>)
    const images: SlideImage[] = []
    const picRegex = /<p:pic>([\s\S]*?)<\/p:pic>/g
    let picMatch: RegExpExecArray | null
    let picCounter = 0

    while ((picMatch = picRegex.exec(slideXml)) !== null) {
      const picContent = picMatch[1] || ""
      picCounter++

      const nameMatch = picContent.match(/<p:cNvPr[^>]*name="([^"]+)"/)
      const blipMatch = picContent.match(/<a:blip[^>]*r:embed="([^"]+)"/)
      const xfrmMatch = picContent.match(/<a:off\s+x="([^"]+)"\s+y="([^"]+)"\/>\s*<a:ext\s+cx="([^"]+)"\s+cy="([^"]+)"\/>/)

      const embedId = blipMatch ? blipMatch[1] : ""
      let imgUrl = ""
      if (embedId && slideRels[embedId]) {
        const target = slideRels[embedId].target
        imgUrl = mediaMap[target] || mediaMap[target.split("/").pop() || ""] || ""
      }

      if (imgUrl) {
        let x = 10
        let y = 20
        let width = 40
        let height = 40

        if (xfrmMatch && xfrmMatch[1] && xfrmMatch[2] && xfrmMatch[3] && xfrmMatch[4]) {
          const offX = parseInt(xfrmMatch[1], 10)
          const offY = parseInt(xfrmMatch[2], 10)
          const extX = parseInt(xfrmMatch[3], 10)
          const extY = parseInt(xfrmMatch[4], 10)
          if (slideWidth > 0 && slideHeight > 0) {
            x = Math.max(0, Math.min(100, Math.round((offX / slideWidth) * 1000) / 10))
            y = Math.max(0, Math.min(100, Math.round((offY / slideHeight) * 1000) / 10))
            width = Math.max(5, Math.min(100, Math.round((extX / slideWidth) * 1000) / 10))
            height = Math.max(5, Math.min(100, Math.round((extY / slideHeight) * 1000) / 10))
          }
        }

        images.push({
          id: `pic-${slideNumber}-${picCounter}`,
          url: imgUrl,
          name: nameMatch ? nameMatch[1] || `Image ${picCounter}` : `Image ${picCounter}`,
          relId: embedId || "",
          x,
          y,
          width,
          height,
        })
      }
    }

    // 4d. Parse Slide Tables (<a:tbl>)
    const tables: SlideTable[] = []
    const tblRegex = /<a:tbl>([\s\S]*?)<\/a:tbl>/g
    let tblMatch: RegExpExecArray | null
    let tblCounter = 0

    while ((tblMatch = tblRegex.exec(slideXml)) !== null) {
      const tblContent = tblMatch[1] || ""
      tblCounter++
      const rows: string[][] = []

      const trRegex = /<a:tr[^>]*>([\s\S]*?)<\/a:tr>/g
      let trMatch: RegExpExecArray | null
      while ((trMatch = trRegex.exec(tblContent)) !== null) {
        const trContent = trMatch[1] || ""
        const rowCells: string[] = []

        const tcRegex = /<a:tc[^>]*>([\s\S]*?)<\/a:tc>/g
        let tcMatch: RegExpExecArray | null
        while ((tcMatch = tcRegex.exec(trContent)) !== null) {
          const tcContent = tcMatch[1] || ""
          const tRegex = /<a:t>([^<]*)<\/a:t>/g
          let tm: RegExpExecArray | null
          const cellTokens: string[] = []
          while ((tm = tRegex.exec(tcContent)) !== null) {
            if (tm[1]) cellTokens.push(decodeHtmlEntities(tm[1]))
          }
          rowCells.push(cellTokens.join("").trim())
        }
        if (rowCells.length > 0) rows.push(rowCells)
      }

      if (rows.length > 0) {
        tables.push({
          id: `tbl-${slideNumber}-${tblCounter}`,
          rows,
          x: 10,
          y: 20,
          width: 80,
          height: 60,
        })
      }
    }

    // Combined allText for fast search
    const allTextPieces: string[] = []
    if (detectedTitle) allTextPieces.push(detectedTitle)
    if (detectedSubtitle) allTextPieces.push(detectedSubtitle)
    for (const b of textBlocks) {
      allTextPieces.push(b.text)
    }
    for (const t of tables) {
      for (const row of t.rows) {
        allTextPieces.push(row.join(" "))
      }
    }
    const allText = allTextPieces.join("\n")

    parsedSlides.push({
      slideNumber,
      slideId: slideBasename,
      slideFile: slidePath,
      title: detectedTitle || `Slide ${slideNumber}`,
      subtitle: detectedSubtitle || undefined,
      textBlocks,
      allText,
      speakerNotes,
      images,
      tables,
      keyTakeaway: "", // populated by summarizer
    })
  }

  // 5. Generate comprehensive summaries, topics, vocabulary, and stats
  const { summary, stats } = generatePresentationSummary(parsedSlides, filename)

  return {
    id: filename + "-" + Date.now(),
    filename,
    slideWidth,
    slideHeight,
    aspectRatio,
    aspectRatioDecimal: ratio,
    slides: parsedSlides,
    mediaMap,
    summary,
    stats,
  }
}
