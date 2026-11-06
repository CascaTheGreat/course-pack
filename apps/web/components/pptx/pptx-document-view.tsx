"use client"

import * as React from "react"
import { Search, Presentation, FileText, Image as ImageIcon, ChevronRight, X } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { ParsedPresentation, ParsedSlide } from "@/lib/pptx/types"

interface PptxDocumentViewProps {
  presentation: ParsedPresentation
  onPresentSlide: (slideNumber: number) => void
}

export function PptxDocumentView({
  presentation,
  onPresentSlide,
}: PptxDocumentViewProps) {
  const [query, setQuery] = React.useState("")
  const { slides } = presentation

  // Filter slides based on query
  const filteredSlides = React.useMemo(() => {
    if (!query.trim()) return slides
    const q = query.toLowerCase()
    return slides.filter((s) => {
      return (
        s.title.toLowerCase().includes(q) ||
        s.allText.toLowerCase().includes(q) ||
        s.speakerNotes.toLowerCase().includes(q)
      )
    })
  }, [slides, query])

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Search Bar & Header */}
      <div className="sticky top-0 z-20 p-4 rounded-xl border border-border bg-card/90 backdrop-blur-md shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search slides & speaker notes..."
            className="pl-9 pr-8 text-xs sm:text-sm bg-muted/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto justify-between sm:justify-end">
          <span>
            Showing <strong className="text-foreground">{filteredSlides.length}</strong> of {slides.length} slides
          </span>
          {query && (
            <Badge variant="outline" className="font-mono text-[10px]">
              Filtered
            </Badge>
          )}
        </div>
      </div>

      {/* Slide Document List */}
      <div className="space-y-6">
        {filteredSlides.map((s) => {
          const contentBlocks = s.textBlocks.filter(
            (b) => b.type !== "title" && b.type !== "subtitle"
          )
          const hasImages = s.images.length > 0
          const hasNotes = Boolean(s.speakerNotes && s.speakerNotes.trim().length > 0)

          return (
            <div
              key={s.slideNumber}
              className="p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs space-y-4 hover:border-border transition-all"
            >
              {/* Slide Title Bar */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="font-mono text-xs">
                      Slide {s.slideNumber}
                    </Badge>
                    {hasNotes && (
                      <Badge variant="outline" className="gap-1 text-[10px] text-blue-600 dark:text-blue-400">
                        <FileText className="size-3" />
                        <span>Notes</span>
                      </Badge>
                    )}
                    {hasImages && (
                      <Badge variant="outline" className="gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                        <ImageIcon className="size-3" />
                        <span>{s.images.length} {s.images.length === 1 ? "image" : "images"}</span>
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    {s.title || `Slide ${s.slideNumber}`}
                  </h3>
                  {s.subtitle && (
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      {s.subtitle}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPresentSlide(s.slideNumber)}
                  className="gap-1.5 shrink-0 text-xs cursor-pointer"
                >
                  <Presentation className="size-3.5" />
                  <span className="hidden sm:inline">Present Slide</span>
                </Button>
              </div>

              {/* Text Blocks */}
              {contentBlocks.length > 0 && (
                <div className="space-y-2 py-1">
                  {contentBlocks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-start gap-2.5 text-sm text-foreground/90 leading-relaxed"
                      style={{
                        marginLeft: `${Math.min(b.level * 18, 54)}px`,
                      }}
                    >
                      {b.type === "bullet" ? (
                        <span className="mt-2 size-1.5 rounded-full bg-primary shrink-0" />
                      ) : (
                        <ChevronRight className="mt-1 size-3.5 text-primary/70 shrink-0" />
                      )}
                      <span>{b.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tables */}
              {s.tables.map((tbl) => (
                <div key={tbl.id} className="overflow-x-auto rounded-lg border border-border my-2">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      {tbl.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx === 0 ? "bg-muted/60 font-semibold" : "border-t border-border"}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-border last:border-r-0">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Images Preview in Document View */}
              {hasImages && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {s.images.map((img) => (
                    <div
                      key={img.id}
                      className="rounded-lg border border-border/80 overflow-hidden bg-muted/20 p-1.5 max-h-48 flex items-center justify-center"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="max-h-44 w-auto max-w-full object-contain rounded"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Speaker Notes Callout */}
              {hasNotes && (
                <div className="p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-foreground/90 space-y-1.5 mt-2">
                  <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <FileText className="size-3" />
                    Instructor Notes
                  </span>
                  <div className="leading-relaxed space-y-1">
                    {s.speakerNotes.split(/\n\n+/).map((p, pIdx) => (
                      <p key={pIdx}>{p}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredSlides.length === 0 && (
          <div className="p-12 text-center text-muted-foreground border border-dashed rounded-xl space-y-2">
            <Search className="size-6 mx-auto opacity-50" />
            <p className="text-sm">No slides matching &ldquo;{query}&rdquo; were found.</p>
            <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
              Clear search filter
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

