import { ParsedSlide, PresentationSummary, PresentationStats, TopicSection, VocabularyTerm, OutlineItem } from "./types"

/**
 * Clean and normalize text strings
 */
function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

/**
 * Distills a single slide's core takeaway
 */
export function extractSlideTakeaway(slide: ParsedSlide): string {
  // If speaker notes exist, the first sentence often explains the slide's thesis
  if (slide.speakerNotes && slide.speakerNotes.trim().length > 10) {
    const firstSentence = slide.speakerNotes.split(/(?<=[.!?])\s+/)[0]?.trim()
    if (firstSentence && firstSentence.length > 20 && firstSentence.length < 220) {
      return firstSentence
    }
  }

  // Look for prominent bullet point or body paragraph
  const bodyBlock = slide.textBlocks.find((b) => b.type === "bullet" || b.type === "body")
  if (bodyBlock && bodyBlock.text.trim().length > 10) {
    const text = cleanText(bodyBlock.text)
    if (text.length < 180) return text
    return text.substring(0, 175) + "..."
  }

  // Fallback to title
  return slide.title ? `Focus: ${slide.title}` : `Slide ${slide.slideNumber}`
}

/**
 * Extracts key domain terminology and definitions from slide text & notes
 */
function extractVocabulary(slides: ParsedSlide[]): VocabularyTerm[] {
  const terms: VocabularyTerm[] = []
  const seenTerms = new Set<string>()

  // Regex patterns to detect defined concepts
  // e.g. "Biological Species Concept: species are groups of..."
  // e.g. "Allopatric speciation is the evolution of..."
  const defPatternColon = /([A-Z][a-zA-Z0-9\s\-]{2,35}):\s+([A-Za-z0-9\s,;'’"()\-]{15,200}[.!?])/
  const defPatternIs = /([A-Z][a-zA-Z0-9\s\-]{2,35})\s+(?:is defined as|refers to|is a|is the|describes|represents)\s+([A-Za-z0-9\s,;'’"()\-]{15,200}[.!?])/

  for (const slide of slides) {
    const fullSource = `${slide.allText}\n${slide.speakerNotes}`

    // Check title as potential concept
    if (slide.title && slide.title.length > 3 && slide.title.length < 40 && !slide.title.toLowerCase().includes("outline")) {
      const lower = slide.title.toLowerCase()
      if (
        (lower.includes("concept") || lower.includes("model") || lower.includes("theory") || lower.includes("speciation") || lower.includes("isolation")) &&
        !seenTerms.has(lower)
      ) {
        // Find supporting definition text
        const bodySnippet = slide.textBlocks.find((b) => b.type === "bullet" || b.type === "body")?.text || slide.speakerNotes
        if (bodySnippet && bodySnippet.length > 20) {
          const defSentence = bodySnippet.split(/(?<=[.!?])\s+/)[0] || bodySnippet
          terms.push({
            term: slide.title,
            definition: cleanText(defSentence).substring(0, 200),
            slideNumber: slide.slideNumber,
          })
          seenTerms.add(lower)
        }
      }
    }

    // Check colon pattern in text lines
    const lines = fullSource.split(/\n+/)
    for (const line of lines) {
      const colonMatch = line.match(defPatternColon)
      if (colonMatch && colonMatch[1] && colonMatch[2]) {
        const rawTerm = cleanText(colonMatch[1])
        const rawDef = cleanText(colonMatch[2])
        const lower = rawTerm.toLowerCase()
        if (rawTerm.length > 3 && rawTerm.length < 40 && !seenTerms.has(lower) && !rawTerm.toLowerCase().startsWith("slide")) {
          terms.push({
            term: rawTerm,
            definition: rawDef,
            slideNumber: slide.slideNumber,
          })
          seenTerms.add(lower)
        }
      }

      const isMatch = line.match(defPatternIs)
      if (isMatch && isMatch[1] && isMatch[2]) {
        const rawTerm = cleanText(isMatch[1])
        const rawDef = cleanText(isMatch[2])
        const lower = rawTerm.toLowerCase()
        if (rawTerm.length > 3 && rawTerm.length < 40 && !seenTerms.has(lower) && !rawTerm.toLowerCase().startsWith("this") && !rawTerm.toLowerCase().startsWith("there")) {
          terms.push({
            term: rawTerm,
            definition: rawDef,
            slideNumber: slide.slideNumber,
          })
          seenTerms.add(lower)
        }
      }
    }
  }

  return terms.slice(0, 10)
}

/**
 * Clusters slides into topical lecture sections
 */
function clusterTopicSections(slides: ParsedSlide[]): TopicSection[] {
  if (slides.length === 0) return []

  const sections: TopicSection[] = []
  const clusterSize = Math.max(4, Math.ceil(slides.length / 5))

  for (let i = 0; i < slides.length; i += clusterSize) {
    const chunk = slides.slice(i, i + clusterSize)
    const firstSlide = chunk[0]
    const slideNumbers = chunk.map((s) => s.slideNumber)

    // Topic title from first slide in chunk or most prominent slide
    let topicName = firstSlide?.title || `Part ${sections.length + 1}`
    if (i === 0 && chunk.length > 1 && !firstSlide?.title) {
      topicName = chunk[1]?.title || "Introduction & Foundations"
    }

    // Synthesize chunk summary
    const takeaways = chunk
      .map((s) => s.keyTakeaway)
      .filter((t) => t && !t.startsWith("Focus:") && !t.startsWith("Slide"))
      .slice(0, 3)

    const summary = takeaways.length > 0
      ? takeaways.join(" ")
      : `Covers slides ${slideNumbers[0]} through ${slideNumbers[slideNumbers.length - 1]}, examining key concepts, definitions, and observational evidence.`

    sections.push({
      topic: topicName,
      slideNumbers,
      summary: cleanText(summary),
    })
  }

  return sections
}

/**
 * Synthesizes top-level key takeaways
 */
function extractKeyTakeaways(slides: ParsedSlide[]): string[] {
  const takeaways: string[] = []

  // 1. Look for explicit Goal / Objective / Summary slides
  for (const slide of slides) {
    const titleLower = slide.title.toLowerCase()
    if (
      titleLower.includes("goal") ||
      titleLower.includes("objective") ||
      titleLower.includes("summary") ||
      titleLower.includes("conclusion") ||
      titleLower.includes("takeaway")
    ) {
      for (const block of slide.textBlocks) {
        if ((block.type === "bullet" || block.type === "body") && block.text.trim().length > 12) {
          const cleaned = cleanText(block.text)
          if (!takeaways.includes(cleaned)) {
            takeaways.push(cleaned)
          }
        }
      }
    }
  }

  // 2. If fewer than 5 takeaways, pull strongest takeaways from content slides
  if (takeaways.length < 5) {
    for (const slide of slides) {
      if (slide.keyTakeaway && slide.keyTakeaway.length > 25 && !slide.keyTakeaway.startsWith("Focus:")) {
        if (!takeaways.includes(slide.keyTakeaway)) {
          takeaways.push(slide.keyTakeaway)
        }
      }
      if (takeaways.length >= 7) break
    }
  }

  return takeaways.slice(0, 8)
}

/**
 * Builds the comprehensive presentation summary
 */
export function generatePresentationSummary(
  slides: ParsedSlide[],
  filename: string
): { summary: PresentationSummary; stats: PresentationStats } {
  // Determine primary presentation title
  let title = ""
  for (let i = 0; i < Math.min(3, slides.length); i++) {
    const s = slides[i]
    if (s && s.title && s.title.length > 2 && !s.title.toLowerCase().includes("outline")) {
      title = s.title
      break
    }
  }

  if (!title) {
    title = filename
      .replace(/\.pptx$/i, "")
      .replace(/^[0-9]+[_\s-]+/i, "")
      .replace(/[_-]+/g, " ")
      .trim()
  }

  // Populate key takeaways per slide
  slides.forEach((s) => {
    s.keyTakeaway = extractSlideTakeaway(s)
  })

  // Calculate statistics
  let totalWords = 0
  let slidesWithNotes = 0
  let totalImages = 0

  for (const slide of slides) {
    if (slide.speakerNotes && slide.speakerNotes.trim().length > 0) {
      slidesWithNotes++
      totalWords += slide.speakerNotes.split(/\s+/).filter(Boolean).length
    }
    if (slide.allText) {
      totalWords += slide.allText.split(/\s+/).filter(Boolean).length
    }
    totalImages += slide.images.length
  }

  const estimatedReadMinutes = Math.max(2, Math.round(totalWords / 160))

  const keyTakeaways = extractKeyTakeaways(slides)
  const keyTopics = clusterTopicSections(slides)
  const vocabularyTerms = extractVocabulary(slides)

  // Build outline
  const outline: OutlineItem[] = slides.map((s) => ({
    slideNumber: s.slideNumber,
    title: s.title || `Slide ${s.slideNumber}`,
    takeaway: s.keyTakeaway,
  }))

  // Synthesize executive overview
  let overview = `This presentation comprises ${slides.length} slides covering "${title}". `
  if (slidesWithNotes > 0) {
    overview += `It includes detailed instructor speaker notes across ${slidesWithNotes} slides providing contextual depth and scientific rationale. `
  }
  if (keyTopics.length > 0) {
    overview += `The material is organized into ${keyTopics.length} primary thematic sections: ${keyTopics.map((t) => `"${t.topic}"`).join(", ")}. `
  }
  if (keyTakeaways.length > 0) {
    overview += `Key learning targets emphasize ${keyTakeaways[0]?.toLowerCase().replace(/[.]+$/, "") || "core principles"}, accompanied by analytical frameworks and empirical examples.`
  }

  const summary: PresentationSummary = {
    title,
    overview: cleanText(overview),
    keyTopics,
    keyTakeaways,
    vocabularyTerms,
    outline,
    estimatedReadMinutes,
  }

  const stats: PresentationStats = {
    totalSlides: slides.length,
    slidesWithNotes,
    totalWords,
    totalImages,
  }

  return { summary, stats }
}

/**
 * Formats a clean study guide into Markdown for export or copy
 */
export function exportStudyGuideMarkdown(summary: PresentationSummary, slides: ParsedSlide[]): string {
  let md = `# Study Guide: ${summary.title}\n\n`
  md += `**Reading Time:** ~${summary.estimatedReadMinutes} min | **Slides:** ${slides.length} | **Key Concepts:** ${summary.vocabularyTerms.length}\n\n`

  md += `## Executive Overview\n${summary.overview}\n\n`

  if (summary.keyTakeaways.length > 0) {
    md += `## Key Takeaways\n`
    for (const t of summary.keyTakeaways) {
      md += `- ${t}\n`
    }
    md += `\n`
  }

  if (summary.vocabularyTerms.length > 0) {
    md += `## Core Vocabulary & Models\n`
    for (const v of summary.vocabularyTerms) {
      md += `- **${v.term}** (Slide ${v.slideNumber}): ${v.definition}\n`
    }
    md += `\n`
  }

  if (summary.keyTopics.length > 0) {
    md += `## Lecture Topics\n`
    for (const top of summary.keyTopics) {
      md += `### ${top.topic} (Slides ${top.slideNumbers.join(", ")})\n`
      md += `${top.summary}\n\n`
    }
  }

  md += `## Slide-by-Slide Outline & Notes\n\n`
  for (const slide of slides) {
    md += `### Slide ${slide.slideNumber}: ${slide.title || "Untitled"}\n`
    if (slide.keyTakeaway) {
      md += `*Takeaway:* ${slide.keyTakeaway}\n\n`
    }
    if (slide.speakerNotes) {
      md += `> **Instructor Notes:** ${slide.speakerNotes}\n\n`
    }
  }

  return md
}

