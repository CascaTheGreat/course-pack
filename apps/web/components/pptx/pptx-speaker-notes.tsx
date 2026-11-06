"use client"

import * as React from "react"
import { MessageSquareText, ChevronDown, ChevronUp, Copy, Check } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

interface PptxSpeakerNotesProps {
  notes: string
  slideNumber: number
  isOpen: boolean
  onToggle: () => void
}

export function PptxSpeakerNotes({
  notes,
  slideNumber,
  isOpen,
  onToggle,
}: PptxSpeakerNotesProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notes) return
    navigator.clipboard.writeText(notes)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasNotes = Boolean(notes && notes.trim().length > 0)

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-border bg-card/70 backdrop-blur-xs overflow-hidden transition-all">
      {/* Header Bar */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquareText className="size-4" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">Speaker & Instructor Notes</span>
            <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
              Slide {slideNumber}
            </span>
          </div>
          {hasNotes ? (
            <Badge variant="success" className="text-[10px] py-0 px-2">
              Available
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] py-0 px-2 text-muted-foreground">
              None
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasNotes && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              title="Copy notes"
              className="text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </Button>
          )}
          {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expandable Notes Body */}
      {isOpen && (
        <div className="px-5 py-4 border-t border-border/70 bg-muted/20 text-foreground text-sm leading-relaxed space-y-3 max-h-56 overflow-y-auto">
          {hasNotes ? (
            notes.split(/\n\n+/).map((para, idx) => (
              <p key={idx} className="text-sm text-foreground/90">
                {para}
              </p>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No instructor notes were attached to Slide {slideNumber}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

