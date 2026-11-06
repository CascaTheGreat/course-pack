"use client"

import * as React from "react"
import { FileText, Image as ImageIcon } from "lucide-react"
import { ParsedSlide } from "@/lib/pptx/types"

interface PptxThumbnailStripProps {
  slides: ParsedSlide[]
  currentIndex: number
  onSelectSlide: (index: number) => void
}

export function PptxThumbnailStrip({
  slides,
  currentIndex,
  onSelectSlide,
}: PptxThumbnailStripProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const activeThumbRef = React.useRef<HTMLButtonElement>(null)

  // Auto-scroll active thumbnail into view
  React.useEffect(() => {
    if (activeThumbRef.current && containerRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      })
    }
  }, [currentIndex])

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center gap-2.5 overflow-x-auto py-2 px-1 scrollbar-thin select-none"
    >
      {slides.map((s, idx) => {
        const isActive = idx === currentIndex
        const hasNotes = Boolean(s.speakerNotes && s.speakerNotes.trim().length > 0)
        const hasImages = s.images.length > 0

        return (
          <button
            key={s.slideId || idx}
            ref={isActive ? activeThumbRef : null}
            onClick={() => onSelectSlide(idx)}
            className={`group shrink-0 w-28 sm:w-32 h-20 rounded-lg border text-left p-2 flex flex-col justify-between transition-all cursor-pointer ${
              isActive
                ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                : "border-border/80 bg-card hover:bg-muted/40 hover:border-border"
            }`}
          >
            {/* Top row: slide number & mini badges */}
            <div className="flex items-center justify-between w-full text-[10px] text-muted-foreground">
              <span className={`font-mono font-bold ${isActive ? "text-primary" : ""}`}>
                {s.slideNumber}
              </span>
              <div className="flex items-center gap-1">
                {hasNotes && (
                  <span title="Has notes">
                    <FileText className="size-2.5 text-blue-500" />
                  </span>
                )}
                {hasImages && (
                  <span title="Has images">
                    <ImageIcon className="size-2.5 text-amber-500" />
                  </span>
                )}
              </div>
            </div>

            {/* Bottom: slide title preview */}
            <p className="text-[11px] font-medium text-foreground line-clamp-2 leading-tight">
              {s.title || `Slide ${s.slideNumber}`}
            </p>
          </button>
        )
      })}
    </div>
  )
}
