"use client"

import * as React from "react"
import { Image as ImageIcon, ZoomIn, FileText, ChevronRight } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog"
import { ParsedSlide } from "@/lib/pptx/types"

interface PptxSlideCanvasProps {
  slide: ParsedSlide
  totalSlides: number
  aspectRatio?: "16:9" | "4:3" | string
}

export function PptxSlideCanvas({
  slide,
  totalSlides,
  aspectRatio = "16:9",
}: PptxSlideCanvasProps) {
  const [zoomedImage, setZoomedImage] = React.useState<{ url: string; name: string } | null>(null)

  const isWide = aspectRatio !== "4:3"
  const ratioClass = isWide ? "aspect-[16/9]" : "aspect-[4/3]"

  // Group slide content
  const titleBlock = slide.textBlocks.find((b) => b.type === "title") || { text: slide.title }
  const subtitleBlock = slide.textBlocks.find((b) => b.type === "subtitle")
  const contentBlocks = slide.textBlocks.filter(
    (b) => b.type !== "title" && b.type !== "subtitle"
  )

  const hasImages = slide.images.length > 0
  const hasTables = slide.tables.length > 0
  const hasText = contentBlocks.length > 0 || Boolean(subtitleBlock)

  // Layout decision: side-by-side if both text and images exist
  const useSplitLayout = (hasText || hasTables) && hasImages

  return (
    <div className="relative w-full flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Aspect-ratio Canvas Container */}
      <div
        className={`w-full max-w-5xl ${ratioClass} relative rounded-xl border border-border bg-card shadow-md flex flex-col justify-between overflow-hidden p-6 sm:p-10 transition-all`}
        style={{
          background: "radial-gradient(ellipse at top left, var(--card) 0%, var(--background) 100%)",
        }}
      >
        {/* Slide Header: Title & Subtitle */}
        <div className="space-y-1.5 shrink-0 z-10 border-b border-border/50 pb-3">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-snug">
              {titleBlock.text || `Slide ${slide.slideNumber}`}
            </h2>
            <Badge variant="outline" className="font-mono text-xs shrink-0 text-muted-foreground">
              {slide.slideNumber} / {totalSlides}
            </Badge>
          </div>

          {subtitleBlock && (
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              {subtitleBlock.text}
            </p>
          )}
        </div>

        {/* Slide Content Body */}
        <div className="flex-1 my-4 overflow-y-auto pr-1">
          {useSplitLayout ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full items-center">
              {/* Left Column: Text & Tables */}
              <div className="md:col-span-7 space-y-3.5">
                {contentBlocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-start gap-2.5 text-foreground leading-relaxed"
                    style={{
                      marginLeft: `${Math.min(b.level * 20, 60)}px`,
                    }}
                  >
                    {b.type === "bullet" ? (
                      <span className="mt-2 size-1.5 rounded-full bg-primary shrink-0" />
                    ) : (
                      <ChevronRight className="mt-1 size-3.5 text-primary/70 shrink-0" />
                    )}
                    <span className="text-sm sm:text-base">{b.text}</span>
                  </div>
                ))}

                {/* Tables */}
                {slide.tables.map((tbl) => (
                  <div key={tbl.id} className="overflow-x-auto rounded-lg border border-border my-2">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <tbody>
                        {tbl.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={rIdx === 0 ? "bg-muted/60 font-semibold" : "border-t border-border"}
                          >
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5 border-r border-border last:border-r-0">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>

              {/* Right Column: Images */}
              <div className="md:col-span-5 flex flex-col items-center justify-center gap-3">
                {slide.images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative rounded-lg border border-border/70 overflow-hidden bg-muted/20 p-2 cursor-pointer hover:border-primary/50 transition-all max-h-[340px] flex items-center justify-center"
                    onClick={() => setZoomedImage({ url: img.url, name: img.name })}
                    title="Click to zoom image"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="max-h-[300px] w-auto max-w-full object-contain rounded transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="rounded-full bg-background/90 text-foreground p-2 shadow-md">
                        <ZoomIn className="size-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : hasImages ? (
            /* Image-heavy or Full Image Slide */
            <div className="h-full flex flex-col items-center justify-center gap-4">
              {slide.images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl border border-border/80 overflow-hidden bg-muted/20 p-2 cursor-pointer hover:border-primary/50 transition-all flex items-center justify-center max-h-[380px]"
                  onClick={() => setZoomedImage({ url: img.url, name: img.name })}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="max-h-[340px] w-auto max-w-full object-contain rounded-lg shadow-xs transition-transform group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="rounded-full bg-background/90 text-foreground p-2 shadow-md">
                      <ZoomIn className="size-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Text-only Slide */
            <div className="space-y-4 max-w-3xl mx-auto py-2">
              {contentBlocks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-start gap-3 text-foreground leading-relaxed"
                  style={{
                    marginLeft: `${Math.min(b.level * 24, 72)}px`,
                  }}
                >
                  {b.type === "bullet" ? (
                    <span className="mt-2.5 size-2 rounded-full bg-primary shrink-0" />
                  ) : (
                    <ChevronRight className="mt-1 size-4 text-primary/70 shrink-0" />
                  )}
                  <span className="text-base sm:text-lg">{b.text}</span>
                </div>
              ))}

              {/* Tables */}
              {slide.tables.map((tbl) => (
                <div key={tbl.id} className="overflow-x-auto rounded-lg border border-border my-4">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      {tbl.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx === 0 ? "bg-muted/60 font-semibold" : "border-t border-border"}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 border-r border-border last:border-r-0">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {contentBlocks.length === 0 && slide.tables.length === 0 && !subtitleBlock && (
                <div className="py-12 text-center text-muted-foreground italic text-sm">
                  {slide.speakerNotes ? "Detailed instructor discussion provided in Speaker Notes." : "Title slide or visual break."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info line */}
        <div className="shrink-0 flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40">
          <div className="flex items-center gap-3">
            {slide.speakerNotes && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <FileText className="size-3.5" />
                <span>Notes available</span>
              </span>
            )}
            {slide.images.length > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon className="size-3.5" />
                <span>{slide.images.length} {slide.images.length === 1 ? "image" : "images"}</span>
              </span>
            )}
          </div>
          <span className="font-mono">Slide {slide.slideNumber}</span>
        </div>
      </div>

      {/* Image Lightbox Dialog */}
      {zoomedImage && (
        <Dialog open={true} onOpenChange={() => setZoomedImage(null)}>
          <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur-md">
            <DialogTitle className="text-sm font-semibold p-2 text-foreground">
              {zoomedImage.name || "Slide Image"}
            </DialogTitle>
            <div className="flex items-center justify-center max-h-[80vh] overflow-hidden rounded-lg p-2">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.name}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

