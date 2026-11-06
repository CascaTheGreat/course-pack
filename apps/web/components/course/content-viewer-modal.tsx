"use client"

import * as React from "react"
import {
  FileText,
  FileCheck2,
  HelpCircle,
  MessageSquare,
  ExternalLink,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  RotateCcw,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Course, ModuleItem, Assignment, Quiz, Discussion, WikiPage, CourseFile } from "@/lib/imscc/types"

// Lazy-load the PPTX viewer so it doesn't bloat the initial bundle
const PptxViewer = React.lazy(() =>
  import("@/components/pptx/pptx-viewer").then((m) => ({ default: m.PptxViewer }))
)

function PptxViewerLazy({ file }: { file: CourseFile }) {
  return <PptxViewer file={file} />
}

export interface ActiveModalItem {
  type: "moduleItem" | "assignment" | "quiz" | "discussion" | "page" | "file"
  id: string
  parentModuleTitle?: string
  prevId?: string
  nextId?: string
}

interface ContentViewerModalProps {
  course: Course
  activeItem: ActiveModalItem | null
  onClose: () => void
  onNavigateItem?: (item: ActiveModalItem) => void
}

export function ContentViewerModal({
  course,
  activeItem,
  onClose,
  onNavigateItem,
}: ContentViewerModalProps) {
  if (!activeItem) return null

  // Resolve item based on type and id
  let title = "Item Details"
  let badgeLabel = "Item"
  let badgeVariant: "default" | "secondary" | "success" | "warning" | "info" | "purple" = "default"
  let contentHtml = ""
  let points: number | undefined
  let dueAt: string | undefined
  let assignmentData: Assignment | undefined
  let quizData: Quiz | undefined
  let discussionData: Discussion | undefined
  let pageData: WikiPage | undefined
  let fileData: CourseFile | undefined
  let externalUrl: string | undefined

  if (activeItem.type === "moduleItem") {
    // Find module item in course.modules
    for (const m of course.modules) {
      const it = m.items.find((i) => i.id === activeItem.id)
      if (it) {
        title = it.title
        badgeLabel = it.contentType
        externalUrl = it.url

        // Find linked assignment, quiz, discussion, page, or file
        if (it.contentType === "Assignment") {
          assignmentData = course.assignments.find(
            (a) => a.id === it.identifierref || a.id === it.resolvedTargetId || a.title === it.title
          )
        } else if (it.contentType === "Quizzes::Quiz") {
          quizData = course.quizzes.find(
            (q) => q.id === it.identifierref || q.id === it.resolvedTargetId || q.title === it.title
          )
        } else if (it.contentType === "DiscussionTopic") {
          discussionData = course.discussions.find(
            (d) => d.id === it.identifierref || d.topicId === it.identifierref || d.title === it.title
          )
        } else if (it.contentType === "WikiPage") {
          pageData = course.pages.find(
            (p) => p.id === it.identifierref || p.title === it.title || p.urlSlug === it.identifierref
          )
        } else if (it.contentType === "Attachment") {
          fileData = course.files.find(
            (f) => f.href.includes(it.title) || f.filename === it.title || f.id === it.identifierref
          )
        }
        break
      }
    }
  } else if (activeItem.type === "assignment") {
    assignmentData = course.assignments.find((a) => a.id === activeItem.id)
  } else if (activeItem.type === "quiz") {
    quizData = course.quizzes.find((q) => q.id === activeItem.id)
  } else if (activeItem.type === "discussion") {
    discussionData = course.discussions.find((d) => d.id === activeItem.id)
  } else if (activeItem.type === "page") {
    pageData = course.pages.find((p) => p.id === activeItem.id)
  } else if (activeItem.type === "file") {
    fileData = course.files.find((f) => f.id === activeItem.id)
  }

  // Populate from resolved target
  if (assignmentData) {
    title = assignmentData.title
    badgeLabel = "Assignment"
    badgeVariant = "info"
    points = assignmentData.pointsPossible
    dueAt = assignmentData.dueAt
    contentHtml = assignmentData.htmlDescription || ""
  } else if (quizData) {
    title = quizData.title
    badgeLabel = quizData.quizType === "survey" ? "Survey" : "Quiz"
    badgeVariant = "purple"
    points = quizData.pointsPossible
    contentHtml = quizData.descriptionHtml || ""
  } else if (discussionData) {
    title = discussionData.title
    badgeLabel = "Discussion"
    badgeVariant = "warning"
    points = discussionData.pointsPossible
    contentHtml = discussionData.messageHtml || ""
  } else if (pageData) {
    title = pageData.title
    badgeLabel = "Page"
    badgeVariant = "secondary"
    contentHtml = pageData.bodyHtml || ""
  } else if (fileData) {
    title = fileData.filename
    badgeLabel = "File"
    badgeVariant = "default"
  }

  // ── PPTX: render dedicated full-width viewer dialog ──────────────────────
  if (fileData?.isPptx) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-6xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden">
          <DialogTitle className="sr-only">{fileData.filename}</DialogTitle>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {/* Lazy-load PptxViewer to avoid blocking other modal paths */}
            <React.Suspense fallback={
              <div className="flex items-center justify-center min-h-[400px] text-muted-foreground text-sm">
                Loading presentation viewer…
              </div>
            }>
              <PptxViewerLazy file={fileData} />
            </React.Suspense>
          </div>
          <div className="shrink-0 p-4 border-t border-border bg-card flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            {fileData.blobUrl && (
              <a
                href={fileData.blobUrl}
                download={fileData.filename}
                className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
              >
                <Download className="size-3.5" />
                <span>Download .pptx</span>
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border bg-card">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 flex-wrap">
            <span>{course.title}</span>
            {activeItem.parentModuleTitle && (
              <>
                <span>/</span>
                <span className="font-medium text-foreground">{activeItem.parentModuleTitle}</span>
              </>
            )}
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                {points !== undefined && (
                  <Badge variant="outline" className="gap-1 font-mono">
                    <Award className="size-3 text-amber-500" />
                    <span>{points} pts</span>
                  </Badge>
                )}
                {dueAt && (
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="size-3 text-muted-foreground" />
                    <span>Due {new Date(dueAt).toLocaleDateString()}</span>
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
                {title}
              </DialogTitle>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Assignment Extra Metadata */}
          {assignmentData && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-muted/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground block">Submission Types</span>
                <span className="font-medium text-foreground capitalize mt-0.5 block">
                  {assignmentData.submissionTypes.join(", ").replace(/_/g, " ") || "None"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Grading Type</span>
                <span className="font-medium text-foreground capitalize mt-0.5 block">
                  {assignmentData.gradingType || "Points"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Status</span>
                <span className="font-medium text-foreground capitalize mt-0.5 block">
                  {assignmentData.workflowState || "Published"}
                </span>
              </div>
            </div>
          )}

          {/* Quiz Metadata */}
          {quizData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-muted/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground block">Time Limit</span>
                <span className="font-medium text-foreground mt-0.5 block">
                  {quizData.timeLimitMinutes ? `${quizData.timeLimitMinutes} minutes` : "No limit"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Allowed Attempts</span>
                <span className="font-medium text-foreground mt-0.5 block capitalize">
                  {quizData.allowedAttempts || "1"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Questions</span>
                <span className="font-medium text-foreground mt-0.5 block">
                  {quizData.questions.length} questions
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Quiz Type</span>
                <span className="font-medium text-foreground mt-0.5 block capitalize">
                  {quizData.quizType || "Exam"}
                </span>
              </div>
            </div>
          )}

          {/* External URL if applicable */}
          {externalUrl && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">External Learning Link</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-md">{externalUrl}</p>
              </div>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ size: "sm", className: "gap-1.5 shrink-0" })}
              >
                <span>Open URL</span>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          )}

          {/* Rich HTML Content Body */}
          {contentHtml ? (
            <div
              className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm sm:text-base border-t border-border pt-4 [&_img]:rounded-lg [&_img]:max-w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_a]:text-primary [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : !quizData?.questions.length && !fileData ? (
            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg text-sm italic">
              No written instructions or description provided for this item.
            </div>
          ) : null}

          {/* Quiz Questions Inspector */}
          {quizData && quizData.questions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                <HelpCircle className="size-4 text-purple-500" />
                Questions ({quizData.questions.length})
              </h4>
              <div className="space-y-3">
                {quizData.questions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="p-4 rounded-lg border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Question {qIdx + 1}</span>
                      <Badge variant="outline">{q.pointsPossible} pts</Badge>
                    </div>
                    {q.promptHtml && (
                      <div
                        className="text-sm text-foreground prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: q.promptHtml }}
                      />
                    )}
                    {q.answers.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-border/60">
                        {q.answers.map((ans, aIdx) => (
                          <div
                            key={ans.id || aIdx}
                            className={`p-2.5 rounded-md text-sm flex items-center justify-between gap-3 ${
                              ans.isCorrect
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 font-medium"
                                : "bg-muted/40 border border-border text-foreground"
                            }`}
                          >
                            <span>{ans.text}</span>
                            {ans.isCorrect && (
                              <Badge variant="success" className="gap-1 text-[10px] shrink-0">
                                <CheckCircle2 className="size-3" />
                                <span>Correct Answer</span>
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Preview */}
          {fileData && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-lg border border-border bg-card flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground text-sm">{fileData.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {(fileData.size / 1024).toFixed(1)} KB &bull; {fileData.mimeType}
                  </p>
                </div>
                {fileData.blobUrl && (
                  <a
                    href={fileData.blobUrl}
                    download={fileData.filename}
                    className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
                  >
                    <Download className="size-3.5" />
                    <span>Download</span>
                  </a>
                )}
              </div>

              {/* Live Preview */}
              {fileData.isImage && fileData.blobUrl && (
                <div className="rounded-xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center p-4">
                  <img
                    src={fileData.blobUrl}
                    alt={fileData.filename}
                    className="max-h-[450px] object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}

              {fileData.isVideo && fileData.blobUrl && (
                <div className="rounded-xl overflow-hidden border border-border bg-black flex items-center justify-center">
                  <video controls className="w-full max-h-[450px]">
                    <source src={fileData.blobUrl} type={fileData.mimeType} />
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {fileData.isPdf && fileData.blobUrl && (
                <div className="rounded-xl overflow-hidden border border-border h-[450px]">
                  <iframe src={fileData.blobUrl} className="w-full h-full" title={fileData.filename} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Prev / Next Navigation */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex items-center gap-2">
            {activeItem.prevId && onNavigateItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onNavigateItem({
                    type: "moduleItem",
                    id: activeItem.prevId!,
                    parentModuleTitle: activeItem.parentModuleTitle,
                  })
                }
                className="gap-1"
              >
                <ChevronLeft className="size-4" />
                <span>Previous</span>
              </Button>
            )}

            {activeItem.nextId && onNavigateItem && (
              <Button
                size="sm"
                onClick={() =>
                  onNavigateItem({
                    type: "moduleItem",
                    id: activeItem.nextId!,
                    parentModuleTitle: activeItem.parentModuleTitle,
                  })
                }
                className="gap-1"
              >
                <span>Next</span>
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
