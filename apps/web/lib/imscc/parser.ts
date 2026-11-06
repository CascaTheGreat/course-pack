import {
  Course,
  CourseModule,
  ModuleItem,
  Assignment,
  Quiz,
  QuizQuestion,
  QuizAnswer,
  Discussion,
  WikiPage,
  CourseFile,
  AssignmentGroup,
  CourseStats,
  ItemContentType,
} from "./types"
import {
  parseXml,
  decodeHtmlEntities,
  findElementsByLocalName,
  findFirstByLocalName,
  getTextByLocalName,
  getAttrByLocalName,
  getDirectChildren,
} from "./xml-utils"

/**
 * Determine MIME type based on file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "gif":
      return "image/gif"
    case "svg":
      return "image/svg+xml"
    case "webp":
      return "image/webp"
    case "mp4":
      return "video/mp4"
    case "webm":
      return "video/webm"
    case "mp3":
      return "audio/mpeg"
    case "wav":
      return "audio/wav"
    case "pdf":
      return "application/pdf"
    case "pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    case "ppt":
      return "application/vnd.ms-powerpoint"
    case "html":
    case "htm":
      return "text/html"
    case "txt":
      return "text/plain"
    case "json":
      return "application/json"
    case "xml":
      return "application/xml"
    default:
      return "application/octet-stream"
  }
}

/**
 * Normalizes URL path by decoding URI components and slashes
 */
function normalizePath(path: string): string {
  try {
    return decodeURIComponent(path).replace(/\\/g, "/").replace(/^\/+/, "")
  } catch {
    return path.replace(/\\/g, "/").replace(/^\/+/, "")
  }
}

/**
 * Parses an entire unzipped IMSCC archive map into a rich Course object.
 */
export function parseCourse(files: Map<string, Uint8Array>): Course {
  const rawFileNames = Array.from(files.keys())
  const textDecoder = new TextDecoder("utf-8")

  const getFileText = (filename: string): string | null => {
    // Try exact match, then normalized match
    let data = files.get(filename)
    if (!data) {
      const normalized = normalizePath(filename)
      for (const [key, val] of files.entries()) {
        if (normalizePath(key) === normalized) {
          data = val
          break
        }
      }
    }
    return data ? textDecoder.decode(data) : null
  }

  // 1. Process files in web_resources and build file catalog with Blob URLs
  const fileCatalog: CourseFile[] = []
  const fileUrlMap = new Map<string, string>() // relative path -> blobUrl

  for (const [filePath, data] of files.entries()) {
    if (filePath.startsWith("web_resources/") && !filePath.endsWith("/")) {
      const relPath = filePath.substring("web_resources/".length)
      const cleanRelPath = normalizePath(relPath)
      const filename = cleanRelPath.split("/").pop() || cleanRelPath
      const directory = cleanRelPath.includes("/")
        ? cleanRelPath.substring(0, cleanRelPath.lastIndexOf("/"))
        : ""
      const mime = getMimeType(filename)

      let blobUrl = ""
      if (typeof window !== "undefined" && typeof window.URL?.createObjectURL === "function") {
        try {
          const blob = new Blob([data as unknown as BlobPart], { type: mime })
          blobUrl = URL.createObjectURL(blob)
        } catch (e) {
          console.warn("Failed to create blob URL for", filePath, e)
        }
      }

      const isImage = mime.startsWith("image/")
      const isVideo = mime.startsWith("video/")
      const isAudio = mime.startsWith("audio/")
      const isPdf = mime === "application/pdf"
      const isPptx =
        mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        mime === "application/vnd.ms-powerpoint" ||
        filename.toLowerCase().endsWith(".pptx") ||
        filename.toLowerCase().endsWith(".ppt")

      const fileObj: CourseFile = {
        id: filePath,
        href: filePath,
        fullPath: filePath,
        filename,
        directory,
        size: data.length,
        mimeType: mime,
        blobUrl: blobUrl || undefined,
        isImage,
        isVideo,
        isAudio,
        isPdf,
        isPptx,
      }

      fileCatalog.push(fileObj)
      fileUrlMap.set(cleanRelPath, blobUrl)
      fileUrlMap.set(relPath, blobUrl)
      fileUrlMap.set(encodeURI(relPath), blobUrl)
    }
  }

  // Helper to rewrite Canvas internal links inside HTML
  const resolveHtmlLinks = (rawHtml: string): string => {
    if (!rawHtml) return ""
    let html = rawHtml

    // Rewrite $IMS-CC-FILEBASE$ links to Blob URLs
    // Patterns: %24IMS-CC-FILEBASE%24/..., $IMS-CC-FILEBASE$/...
    const fileBaseRegex = /(?:%24|\$)IMS-CC-FILEBASE(?:%24|\$)\/([^"'>\s?#]+)(?:[^"'>\s]*)?/gi
    html = html.replace(fileBaseRegex, (match, path) => {
      const cleanPath = normalizePath(path)
      // Look up in fileUrlMap
      for (const [key, blobUrl] of fileUrlMap.entries()) {
        if (cleanPath === key || cleanPath.endsWith(key) || key.endsWith(cleanPath)) {
          return blobUrl
        }
      }
      return match
    })

    // Rewrite $WIKI_REFERENCE$/pages/slug to internal page link
    const wikiRegex = /(?:%24|\$)WIKI_REFERENCE(?:%24|\$)\/pages\/([^"'>\s]+)/gi
    html = html.replace(wikiRegex, "#page:$1")

    // Rewrite $CANVAS_OBJECT_REFERENCE$/quizzes/id to internal quiz link
    const quizRegex = /(?:%24|\$)CANVAS_OBJECT_REFERENCE(?:%24|\$)\/quizzes\/([^"'>\s]+)/gi
    html = html.replace(quizRegex, "#quiz:$1")

    // Rewrite $CANVAS_OBJECT_REFERENCE$/assignments/id to internal assignment link
    const assignRegex = /(?:%24|\$)CANVAS_OBJECT_REFERENCE(?:%24|\$)\/assignments\/([^"'>\s]+)/gi
    html = html.replace(assignRegex, "#assignment:$1")

    // Fallback for equation_image if it points to localhost
    html = html.replace(/<img([^>]+)class="([^"]*equation_image[^"]*)"([^>]*)>/gi, (tag, before, cls, after) => {
      const combined = before + " " + after
      const titleMatch = combined.match(/title="([^"]*)"/i)
      const altMatch = combined.match(/alt="([^"]*)"/i)
      const math = titleMatch?.[1] || altMatch?.[1]
      if (math) {
        return `<span class="inline-flex items-center font-mono text-sm px-1.5 py-0.5 rounded bg-muted text-foreground border border-border" title="${math}">${math}</span>`
      }
      return tag
    })

    return html
  }

  // 2. Parse course_settings/course_settings.xml
  let courseTitle = "Imported Course"
  let courseCode = ""
  let startAt: string | undefined
  let concludeAt: string | undefined
  let license: string | undefined
  let storageQuota: number | undefined

  const settingsXml = getFileText("course_settings/course_settings.xml")
  if (settingsXml) {
    try {
      const doc = parseXml(settingsXml)
      courseTitle = getTextByLocalName(doc, "title") || courseTitle
      courseCode = getTextByLocalName(doc, "course_code") || courseCode
      startAt = getTextByLocalName(doc, "start_at") || undefined
      concludeAt = getTextByLocalName(doc, "conclude_at") || undefined
      license = getTextByLocalName(doc, "license") || undefined
      const quotaStr = getTextByLocalName(doc, "storage_quota")
      if (quotaStr) storageQuota = parseInt(quotaStr, 10)
    } catch (e) {
      console.warn("Error parsing course_settings.xml", e)
    }
  }

  // 3. Parse course_settings/syllabus.html
  let syllabusHtml = ""
  const syllabusText = getFileText("course_settings/syllabus.html")
  if (syllabusText) {
    syllabusHtml = resolveHtmlLinks(syllabusText)
  }

  // 4. Parse course_settings/assignment_groups.xml
  const assignmentGroups: AssignmentGroup[] = []
  const groupsXml = getFileText("course_settings/assignment_groups.xml")
  if (groupsXml) {
    try {
      const doc = parseXml(groupsXml)
      const groups = findElementsByLocalName(doc, "assignmentGroup")
      for (const grp of groups) {
        const id = grp.getAttribute("identifier") || ""
        const title = getTextByLocalName(grp, "title") || "Assignments"
        const weightStr = getTextByLocalName(grp, "group_weight")
        assignmentGroups.push({
          id,
          title,
          weight: weightStr ? parseFloat(weightStr) : undefined,
        })
      }
    } catch (e) {
      console.warn("Error parsing assignment_groups.xml", e)
    }
  }

  // 5. Parse Wiki Pages (wiki_content/*.html)
  const pages: WikiPage[] = []
  for (const filePath of rawFileNames) {
    if (filePath.startsWith("wiki_content/") && filePath.endsWith(".html")) {
      const html = getFileText(filePath)
      if (html) {
        const slug = filePath.substring("wiki_content/".length).replace(/\.html$/, "")
        let title = slug.replace(/[-_]/g, " ")
        let identifier = slug
        let workflowState = "active"
        let editingRoles = "teachers"

        try {
          const doc = parseXml(html)
          const titleEl = findFirstByLocalName(doc, "title")
          if (titleEl?.textContent) title = titleEl.textContent.trim()

          const metas = findElementsByLocalName(doc, "meta")
          for (const m of metas) {
            const name = m.getAttribute("name")
            const content = m.getAttribute("content") || ""
            if (name === "identifier") identifier = content
            if (name === "workflow_state") workflowState = content
            if (name === "editing_roles") editingRoles = content
          }
        } catch {
          // If parse fails, extract title with regex
          const m = html.match(/<title>([^<]*)<\/title>/i)
          if (m && m[1]) title = m[1].trim()
        }

        pages.push({
          id: identifier,
          title,
          bodyHtml: resolveHtmlLinks(html),
          urlSlug: slug,
          workflowState,
          editingRoles,
        })
      }
    }
  }

  // 6. Parse Assignments
  const assignments: Assignment[] = []
  // Check any directory with assignment_settings.xml
  for (const filePath of rawFileNames) {
    if (filePath.endsWith("assignment_settings.xml")) {
      const xml = getFileText(filePath)
      if (xml) {
        try {
          const doc = parseXml(xml)
          const assignEl = findFirstByLocalName(doc, "assignment")
          const id = assignEl?.getAttribute("identifier") || filePath.split("/")[0] || ""
          const title = getTextByLocalName(doc, "title") || "Untitled Assignment"
          const pointsStr = getTextByLocalName(doc, "points_possible")
          const pointsPossible = pointsStr ? parseFloat(pointsStr) : 0
          const dueAt = getTextByLocalName(doc, "due_at") || undefined
          const lockAt = getTextByLocalName(doc, "lock_at") || undefined
          const unlockAt = getTextByLocalName(doc, "unlock_at") || undefined
          const workflowState = getTextByLocalName(doc, "workflow_state") || "published"
          const submissionTypesStr = getTextByLocalName(doc, "submission_types")
          const submissionTypes = submissionTypesStr ? submissionTypesStr.split(",").map(s => s.trim()) : []
          const gradingType = getTextByLocalName(doc, "grading_type") || undefined
          const assignmentGroupId = getTextByLocalName(doc, "assignment_group_identifierref") || undefined
          const posStr = getTextByLocalName(doc, "position")
          const position = posStr ? parseInt(posStr, 10) : undefined

          // Look for associated HTML instruction file in the same folder
          const dir = filePath.substring(0, filePath.lastIndexOf("/"))
          let htmlDescription = ""
          for (const sibling of rawFileNames) {
            if (sibling.startsWith(dir + "/") && sibling.endsWith(".html")) {
              const html = getFileText(sibling)
              if (html) {
                htmlDescription = resolveHtmlLinks(html)
                break
              }
            }
          }

          assignments.push({
            id,
            title,
            pointsPossible,
            dueAt,
            lockAt,
            unlockAt,
            workflowState,
            submissionTypes,
            gradingType,
            htmlDescription,
            assignmentGroupId,
            position,
          })
        } catch (e) {
          console.warn("Error parsing assignment", filePath, e)
        }
      }
    }
  }

  // 7. Parse Discussions
  const discussions: Discussion[] = []
  for (const filePath of rawFileNames) {
    if (filePath.endsWith(".xml") && !filePath.includes("/") && !filePath.startsWith("imsmanifest")) {
      const xml = getFileText(filePath)
      if (xml && xml.includes("imsdt_v1p1")) {
        try {
          const doc = parseXml(xml)
          const id = filePath.replace(/\.xml$/, "")
          const title = getTextByLocalName(doc, "title") || "Discussion"
          let messageHtml = getTextByLocalName(doc, "text")
          messageHtml = decodeHtmlEntities(messageHtml)
          messageHtml = resolveHtmlLinks(messageHtml)

          // Check for corresponding metadata in other xml files
          let discussionType = "topic"
          let pointsPossible: number | undefined
          let workflowState = "active"

          // Search in all topicMeta files for this topic_id
          for (const metaPath of rawFileNames) {
            if (metaPath.endsWith(".xml") && metaPath !== filePath) {
              const metaXml = getFileText(metaPath)
              if (metaXml && metaXml.includes("<topicMeta") && metaXml.includes(id)) {
                try {
                  const metaDoc = parseXml(metaXml)
                  const dt = getTextByLocalName(metaDoc, "discussion_type")
                  if (dt) discussionType = dt
                  const ws = getTextByLocalName(metaDoc, "workflow_state")
                  if (ws) workflowState = ws
                  const pts = getTextByLocalName(metaDoc, "points_possible")
                  if (pts) pointsPossible = parseFloat(pts)
                } catch {
                  // ignore
                }
              }
            }
          }

          discussions.push({
            id,
            topicId: id,
            title,
            messageHtml,
            discussionType,
            pointsPossible,
            workflowState,
          })
        } catch (e) {
          console.warn("Error parsing discussion", filePath, e)
        }
      }
    }
  }

  // 8. Parse Quizzes and Questions
  const quizzes: Quiz[] = []
  // Find all assessment_meta.xml or assessments
  for (const filePath of rawFileNames) {
    if (filePath.endsWith("assessment_meta.xml")) {
      const xml = getFileText(filePath)
      if (xml) {
        try {
          const doc = parseXml(xml)
          const quizEl = findFirstByLocalName(doc, "quiz")
          const id = quizEl?.getAttribute("identifier") || filePath.split("/")[0] || ""
          const title = getTextByLocalName(doc, "title") || "Untitled Quiz"
          let desc = getTextByLocalName(doc, "description")
          desc = decodeHtmlEntities(desc)
          desc = resolveHtmlLinks(desc)

          const ptsStr = getTextByLocalName(doc, "points_possible")
          const pointsPossible = ptsStr ? parseFloat(ptsStr) : 0
          const quizType = getTextByLocalName(doc, "quiz_type") || "assignment"
          const allowedAttempts = getTextByLocalName(doc, "allowed_attempts") || 1
          const shuffleAnswers = getTextByLocalName(doc, "shuffle_answers") === "true"
          const showCorrectAnswers = getTextByLocalName(doc, "show_correct_answers") === "true"
          const workflowState = getTextByLocalName(doc, "workflow_state") || "published"

          // Check assessment_qti.xml or non_cc_assessments for questions
          const dir = filePath.substring(0, filePath.lastIndexOf("/"))
          const questions: QuizQuestion[] = []
          let timeLimitMinutes: number | undefined

          const qtiFiles = [
            `${dir}/assessment_qti.xml`,
            `non_cc_assessments/${id}.xml.qti`,
          ]

          for (const qtiPath of qtiFiles) {
            const qtiXml = getFileText(qtiPath)
            if (qtiXml) {
              try {
                const qtiDoc = parseXml(qtiXml)
                // Check time limit
                const timeFields = findElementsByLocalName(qtiDoc, "qtimetadatafield")
                for (const field of timeFields) {
                  const lbl = getTextByLocalName(field, "fieldlabel")
                  const entry = getTextByLocalName(field, "fieldentry")
                  if (lbl === "qmd_timelimit" && entry) {
                    timeLimitMinutes = parseInt(entry, 10)
                  }
                }

                // Parse questions (<item>)
                const items = findElementsByLocalName(qtiDoc, "item")
                for (const item of items) {
                  const qId = item.getAttribute("ident") || Math.random().toString()
                  const qTitle = item.getAttribute("title") || "Question"
                  let qType = "multiple_choice_question"
                  let qPoints = 1.0

                  const itemFields = findElementsByLocalName(item, "qtimetadatafield")
                  for (const f of itemFields) {
                    const l = getTextByLocalName(f, "fieldlabel")
                    const e = getTextByLocalName(f, "fieldentry")
                    if (l === "question_type") qType = e
                    if (l === "points_possible") qPoints = parseFloat(e) || 1.0
                  }

                  // Prompt
                  const mattext = findFirstByLocalName(item, "mattext")
                  let prompt = mattext?.textContent || ""
                  prompt = decodeHtmlEntities(prompt)
                  prompt = resolveHtmlLinks(prompt)

                  // Answers / choices
                  const answers: QuizAnswer[] = []
                  const correctAnswers = new Set<string>()

                  // Parse correct response from resprocessing
                  const resproc = findFirstByLocalName(item, "resprocessing")
                  if (resproc) {
                    const varequals = findElementsByLocalName(resproc, "varequal")
                    for (const ve of varequals) {
                      const ansId = ve.textContent?.trim()
                      if (ansId) correctAnswers.add(ansId)
                    }
                  }

                  const labels = findElementsByLocalName(item, "response_label")
                  for (const lbl of labels) {
                    const aId = lbl.getAttribute("ident") || ""
                    const aTextEl = findFirstByLocalName(lbl, "mattext")
                    const aText = aTextEl?.textContent?.trim() || ""
                    answers.push({
                      id: aId,
                      text: decodeHtmlEntities(aText),
                      isCorrect: correctAnswers.has(aId),
                    })
                  }

                  questions.push({
                    id: qId,
                    title: qTitle,
                    questionType: qType,
                    pointsPossible: qPoints,
                    promptHtml: prompt,
                    answers,
                  })
                }
              } catch (e) {
                console.warn("Error parsing QTI for quiz", qtiPath, e)
              }
            }
          }

          quizzes.push({
            id,
            title,
            descriptionHtml: desc,
            quizType,
            pointsPossible,
            timeLimitMinutes,
            allowedAttempts,
            shuffleAnswers,
            showCorrectAnswers,
            workflowState,
            questions,
          })
        } catch (e) {
          console.warn("Error parsing quiz", filePath, e)
        }
      }
    }
  }

  // 9. Parse Modules
  // First attempt from course_settings/module_meta.xml (Canvas specific, richest source)
  const modules: CourseModule[] = []
  const moduleMetaXml = getFileText("course_settings/module_meta.xml")

  if (moduleMetaXml) {
    try {
      const doc = parseXml(moduleMetaXml)
      const moduleEls = findElementsByLocalName(doc, "module")

      for (const mEl of moduleEls) {
        const id = mEl.getAttribute("identifier") || ""
        const title = getTextByLocalName(mEl, "title") || "Module"
        const posStr = getTextByLocalName(mEl, "position")
        const position = posStr ? parseInt(posStr, 10) : modules.length + 1
        const workflowState = getTextByLocalName(mEl, "workflow_state")
        const unlockAt = getTextByLocalName(mEl, "unlock_at") || undefined
        const locked = getTextByLocalName(mEl, "locked") === "true"

        const items: ModuleItem[] = []
        const itemEls = findElementsByLocalName(mEl, "item")

        for (const it of itemEls) {
          const itemId = it.getAttribute("identifier") || ""
          const contentType = (getTextByLocalName(it, "content_type") || "Unknown") as ItemContentType
          const itemTitle = getTextByLocalName(it, "title") || "Untitled Item"
          const itemPosStr = getTextByLocalName(it, "position")
          const itemPos = itemPosStr ? parseInt(itemPosStr, 10) : items.length + 1
          const itemIndentStr = getTextByLocalName(it, "indent")
          const indent = itemIndentStr ? parseInt(itemIndentStr, 10) : 0
          const identifierref = getTextByLocalName(it, "identifierref") || undefined
          const url = getTextByLocalName(it, "url") || undefined
          const itemState = getTextByLocalName(it, "workflow_state") || "active"

          items.push({
            id: itemId,
            identifierref,
            title: itemTitle,
            contentType,
            position: itemPos,
            indent,
            url,
            workflowState: itemState,
            resolvedTargetId: identifierref,
          })
        }

        modules.push({
          id,
          title,
          position,
          workflowState,
          unlockAt,
          locked,
          items,
        })
      }
    } catch (e) {
      console.warn("Error parsing module_meta.xml", e)
    }
  }

  // If no modules from module_meta.xml, fallback to imsmanifest.xml
  if (modules.length === 0) {
    const manifestXml = getFileText("imsmanifest.xml")
    if (manifestXml) {
      try {
        const doc = parseXml(manifestXml)
        // Check title if not set
        if (!courseTitle || courseTitle === "Imported Course") {
          const titleStr = getTextByLocalName(doc, "string") || getTextByLocalName(doc, "title")
          if (titleStr) courseTitle = titleStr
        }

        const org = findFirstByLocalName(doc, "organization")
        if (org) {
          const topItems = getDirectChildren(org, "item")
          // If root is LearningModules
          const moduleParents = topItems[0]?.getAttribute("identifier") === "LearningModules"
            ? getDirectChildren(topItems[0], "item")
            : topItems

          for (let mIdx = 0; mIdx < moduleParents.length; mIdx++) {
            const mEl = moduleParents[mIdx]
            if (!mEl) continue
            const id = mEl.getAttribute("identifier") || `mod_${mIdx}`
            const title = getTextByLocalName(mEl, "title") || `Module ${mIdx + 1}`

            const items: ModuleItem[] = []
            const subItems = getDirectChildren(mEl, "item")

            for (let iIdx = 0; iIdx < subItems.length; iIdx++) {
              const it = subItems[iIdx]
              if (!it) continue
              const itId = it.getAttribute("identifier") || `item_${iIdx}`
              const itRef = it.getAttribute("identifierref") || undefined
              const itTitle = getTextByLocalName(it, "title") || "Item"

              items.push({
                id: itId,
                identifierref: itRef,
                title: itTitle,
                contentType: "Unknown",
                position: iIdx + 1,
                indent: 0,
                resolvedTargetId: itRef,
              })
            }

            modules.push({
              id,
              title,
              position: mIdx + 1,
              locked: false,
              items,
            })
          }
        }
      } catch (e) {
        console.warn("Error parsing imsmanifest.xml fallback", e)
      }
    }
  }

  // Sort modules and items by position
  modules.sort((a, b) => a.position - b.position)
  for (const m of modules) {
    m.items.sort((a, b) => a.position - b.position)
  }

  // Calculate statistics
  let totalPoints = 0
  for (const a of assignments) {
    totalPoints += a.pointsPossible || 0
  }
  for (const q of quizzes) {
    totalPoints += q.pointsPossible || 0
  }
  for (const d of discussions) {
    totalPoints += d.pointsPossible || 0
  }

  const stats: CourseStats = {
    totalModules: modules.length,
    totalAssignments: assignments.length,
    totalQuizzes: quizzes.length,
    totalDiscussions: discussions.length,
    totalPages: pages.length,
    totalFiles: fileCatalog.length,
    totalPresentations: fileCatalog.filter((f) => f.isPptx).length,
    totalPoints,
  }

  return {
    id: "course_" + Date.now(),
    title: courseTitle,
    courseCode,
    startAt,
    concludeAt,
    license,
    storageQuota,
    syllabusHtml,
    modules,
    assignments,
    quizzes,
    discussions,
    pages,
    files: fileCatalog,
    assignmentGroups,
    stats,
    rawFileNames,
  }
}
