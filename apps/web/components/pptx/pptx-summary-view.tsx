"use client"

import * as React from "react"
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Copy,
  Check,
  Download,
  ArrowRight,
  Bookmark,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { ParsedPresentation } from "@/lib/pptx/types"
import { exportStudyGuideMarkdown } from "@/lib/pptx/summarizer"

interface PptxSummaryViewProps {
  presentation: ParsedPresentation
  onJumpToSlide: (slideNumber: number) => void
}

export function PptxSummaryView({ presentation, onJumpToSlide }: PptxSummaryViewProps) {
  const [copied, setCopied] = React.useState(false)
  const { summary, stats, slides } = presentation

  const handleCopyMarkdown = () => {
    const md = exportStudyGuideMarkdown(summary, slides)
    navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMarkdown = () => {
    const md = exportStudyGuideMarkdown(summary, slides)
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${summary.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Study_Guide.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Banner & Quick Actions */}
      <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="default" className="gap-1">
              <Sparkles className="size-3" />
              <span>Smart Lecture Summary</span>
            </Badge>
            <Badge variant="outline" className="gap-1 font-mono text-xs">
              <Clock className="size-3 text-muted-foreground" />
              <span>~{summary.estimatedReadMinutes} min read</span>
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
            {summary.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
            Synthesized study guide covering core concepts, terminology, instructor notes, and slide takeaways.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMarkdown}
            className="gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            <span>{copied ? "Copied" : "Copy Study Guide"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadMarkdown}
            className="gap-1.5 cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Export Markdown</span>
          </Button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground block">Total Slides</span>
          <span className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 block">
            {stats.totalSlides}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground block">Slides With Notes</span>
          <span className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 block text-primary">
            {stats.slidesWithNotes}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground block">Total Content Words</span>
          <span className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 block">
            {stats.totalWords.toLocaleString()}
          </span>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <span className="text-xs text-muted-foreground block">Embedded Media</span>
          <span className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 block">
            {stats.totalImages}
          </span>
        </div>
      </div>

      {/* Executive Overview */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            <CardTitle className="text-base font-bold">Executive Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">
            {summary.overview}
          </p>
        </CardContent>
      </Card>

      {/* Key Takeaways */}
      {summary.keyTakeaways.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <CardTitle className="text-base font-bold">Core Learning Takeaways</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Essential principles and questions addressed in this lecture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {summary.keyTakeaways.map((takeaway, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-border bg-muted/20 flex items-start gap-3 text-sm text-foreground"
              >
                <div className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-semibold">
                  {idx + 1}
                </div>
                <span className="leading-relaxed">{takeaway}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Core Vocabulary & Concepts */}
      {summary.vocabularyTerms.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="size-4 text-amber-500" />
              <CardTitle className="text-base font-bold">Key Vocabulary & Models ({summary.vocabularyTerms.length})</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Scientific definitions, evolutionary frameworks, and models introduced.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {summary.vocabularyTerms.map((term, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-border bg-card flex flex-col justify-between gap-2.5 hover:border-primary/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-foreground">{term.term}</span>
                      <button
                        onClick={() => onJumpToSlide(term.slideNumber)}
                        className="text-[11px] font-mono text-primary hover:underline shrink-0 cursor-pointer"
                      >
                        Slide {term.slideNumber}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {term.definition}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border/50 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onJumpToSlide(term.slideNumber)}
                      className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <span>Go to Slide</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lecture Topic Sections */}
      {summary.keyTopics.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-purple-500" />
              <CardTitle className="text-base font-bold">Topic Structure & Modules</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.keyTopics.map((top, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-border transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{top.topic}</span>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      Slides {top.slideNumbers[0]}–{top.slideNumbers[top.slideNumbers.length - 1]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                    {top.summary}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onJumpToSlide(top.slideNumbers[0] || 1)}
                  className="gap-1 shrink-0 text-xs cursor-pointer"
                >
                  <span>Open Section</span>
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

