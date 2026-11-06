"use client"

import * as React from "react"
import {
  Presentation,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Loader2,
  AlertCircle,
  MessageSquareText,
  HelpCircle,
} from "lucide-react"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { CourseFile } from "@/lib/imscc/types"
import { ParsedPresentation } from "@/lib/pptx/types"
import { parsePptx } from "@/lib/pptx/parser"
import { PptxSlideCanvas } from "./pptx-slide-canvas"
import { PptxSpeakerNotes } from "./pptx-speaker-notes"
import { PptxThumbnailStrip } from "./pptx-thumbnail-strip"
import { PptxSummaryView } from "./pptx-summary-view"
import { PptxDocumentView } from "./pptx-document-view"

interface PptxViewerProps {
  file?: CourseFile
  initialPresentation?: ParsedPresentation
  fileData?: Uint8Array | ArrayBuffer | Blob | File
  filename?: string
}

export function PptxViewer({
  file,
  initialPresentation,
  fileData,
  filename,
}: PptxViewerProps) {
  const [presentation, setPresentation] = React.useState<ParsedPresentation | null>(
    initialPresentation || null
  )
  const [loading, setLoading] = React.useState<boolean>(!initialPresentation)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"presentation" | "summary" | "document">("presentation")
  const [currentSlideIndex, setCurrentSlideIndex] = React.useState<number>(0)
  const [showNotes, setShowNotes] = React.useState<boolean>(true)
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false)

  const containerRef = React.useRef<HTMLDivElement>(null)

  const effectiveFilename = filename || file?.filename || presentation?.filename || "presentation.pptx"

  // Load and parse presentation if not already provided
  React.useEffect(() => {
    if (presentation) return

    let isMounted = true
    const loadPresentation = async () => {
      try {
        setLoading(true)
        setError(null)

        let bytesToParse: Uint8Array | ArrayBuffer | Blob | File | null = null

        if (fileData) {
          bytesToParse = fileData
        } else if (file?.blobUrl) {
          const res = await fetch(file.blobUrl)
          if (!res.ok) throw new Error(`Failed to load file: HTTP ${res.status}`)
          const buf = await res.arrayBuffer()
          bytesToParse = new Uint8Array(buf)
        }

        if (!bytesToParse) {
          throw new Error("No presentation file data available to parse.")
        }

        const parsed = await parsePptx(bytesToParse, effectiveFilename)
        if (isMounted) {
          setPresentation(parsed)
          setLoading(false)
        }
      } catch (err: unknown) {
        console.error("PPTX parse error:", err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to parse PowerPoint presentation.")
          setLoading(false)
        }
      }
    }

    loadPresentation()
    return () => {
      isMounted = false
    }
  }, [file, fileData, effectiveFilename, presentation])

  // Slide navigation helpers
  const totalSlides = presentation?.slides.length || 0

  const goToSlide = React.useCallback(
    (index: number) => {
      if (!presentation) return
      const clamped = Math.max(0, Math.min(presentation.slides.length - 1, index))
      setCurrentSlideIndex(clamped)
    },
    [presentation]
  )

  const prevSlide = React.useCallback(() => {
    goToSlide(currentSlideIndex - 1)
  }, [goToSlide, currentSlideIndex])

  const nextSlide = React.useCallback(() => {
    goToSlide(currentSlideIndex + 1)
  }, [goToSlide, currentSlideIndex])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener("fullscreenchange", handleFsChange)
    return () => document.removeEventListener("fullscreenchange", handleFsChange)
  }, [])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in search input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return
      }

      if (activeTab === "presentation") {
        if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
          e.preventDefault()
          nextSlide()
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault()
          prevSlide()
        } else if (e.key === "Home") {
          e.preventDefault()
          goToSlide(0)
        } else if (e.key === "End") {
          e.preventDefault()
          goToSlide(totalSlides - 1)
        } else if (e.key.toLowerCase() === "f") {
          e.preventDefault()
          toggleFullscreen()
        } else if (e.key.toLowerCase() === "n") {
          e.preventDefault()
          setShowNotes((prev) => !prev)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeTab, nextSlide, prevSlide, goToSlide, totalSlides])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px] space-y-4">
        <div className="relative">
          <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center animate-pulse">
            <Presentation className="size-6" />
          </div>
          <Loader2 className="size-5 text-amber-500 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Parsing PowerPoint Deck...</p>
          <p className="text-xs text-muted-foreground">
            Extracting slides, speaker notes, high-res diagrams, and generating study summary.
          </p>
        </div>
      </div>
    )
  }

  if (error || !presentation) {
    return (
      <div className="p-8 text-center space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 max-w-md mx-auto my-6">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <div>
          <h3 className="text-base font-semibold text-foreground">Failed to Load Presentation</h3>
          <p className="text-xs text-muted-foreground mt-1">{error || "Unable to read presentation content."}</p>
        </div>
        {file?.blobUrl && (
          <a
            href={file.blobUrl}
            download={effectiveFilename}
            className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
          >
            <Download className="size-3.5" />
            <span>Download .pptx directly</span>
          </a>
        )}
      </div>
    )
  }

  const currentSlide = presentation.slides[currentSlideIndex] || presentation.slides[0]

  return (
    <div
      ref={containerRef}
      className={`flex flex-col w-full h-full bg-background select-none ${
        isFullscreen ? "p-4 sm:p-6 overflow-y-auto" : ""
      }`}
    >
      {/* Top Header & Tabs Bar */}
      <div className="shrink-0 pb-3 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Presentation className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">
                {presentation.summary.title || effectiveFilename}
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {presentation.slides.length} slides
              </Badge>
              {presentation.stats.slidesWithNotes > 0 && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <FileText className="size-2.5 text-blue-500" />
                  <span>{presentation.stats.slidesWithNotes} with notes</span>
                </Badge>
              )}
            </div>
            <span className="text-[11px] text-muted-foreground block truncate max-w-xs sm:max-w-md">
              {effectiveFilename}
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 text-xs self-stretch sm:self-auto justify-between sm:justify-start">
          <button
            onClick={() => setActiveTab("presentation")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "presentation"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Presentation className="size-3.5" />
            <span>Slides</span>
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "summary"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Study Guide & Summary</span>
          </button>

          <button
            onClick={() => setActiveTab("document")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "document"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="size-3.5" />
            <span>Outline & Search</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
            className="text-muted-foreground hover:text-foreground"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>

          {file?.blobUrl && (
            <a
              href={file.blobUrl}
              download={effectiveFilename}
              className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs h-8" })}
              title="Download presentation"
            >
              <Download className="size-3.5" />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Mode Viewport */}
      <div className="flex-1 overflow-y-auto py-3">
        {activeTab === "presentation" && currentSlide && (
          <div className="space-y-4">
            {/* The Slide Canvas */}
            <PptxSlideCanvas
              slide={currentSlide}
              totalSlides={presentation.slides.length}
              aspectRatio={presentation.aspectRatio}
            />

            {/* Navigation & Scrubber Bar */}
            <div className="max-w-5xl mx-auto px-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevSlide}
                  disabled={currentSlideIndex === 0}
                  className="gap-1 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                  <span>Previous</span>
                </Button>

                <Button
                  size="sm"
                  onClick={nextSlide}
                  disabled={currentSlideIndex === presentation.slides.length - 1}
                  className="gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="size-4" />
                </Button>

                <span className="text-xs font-mono text-muted-foreground ml-2">
                  {currentSlideIndex + 1} / {presentation.slides.length}
                </span>
              </div>

              {/* Slider scrubber */}
              <div className="w-full sm:w-64 flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={presentation.slides.length - 1}
                  value={currentSlideIndex}
                  onChange={(e) => goToSlide(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  title="Scrub slides"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={showNotes ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowNotes(!showNotes)}
                  className="gap-1.5 text-xs cursor-pointer"
                  title="Toggle notes (N)"
                >
                  <MessageSquareText className="size-3.5" />
                  <span>Notes</span>
                </Button>
              </div>
            </div>

            {/* Speaker Notes Drawer */}
            {showNotes && (
              <PptxSpeakerNotes
                notes={currentSlide.speakerNotes}
                slideNumber={currentSlide.slideNumber}
                isOpen={showNotes}
                onToggle={() => setShowNotes(!showNotes)}
              />
            )}

            {/* Thumbnail Strip */}
            <div className="max-w-5xl mx-auto pt-2">
              <PptxThumbnailStrip
                slides={presentation.slides}
                currentIndex={currentSlideIndex}
                onSelectSlide={goToSlide}
              />
            </div>
          </div>
        )}

        {activeTab === "summary" && (
          <PptxSummaryView
            presentation={presentation}
            onJumpToSlide={(num) => {
              goToSlide(num - 1)
              setActiveTab("presentation")
            }}
          />
        )}

        {activeTab === "document" && (
          <PptxDocumentView
            presentation={presentation}
            onPresentSlide={(num) => {
              goToSlide(num - 1)
              setActiveTab("presentation")
            }}
          />
        )}
      </div>
    </div>
  )
}

