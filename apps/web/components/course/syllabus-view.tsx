"use client"

import * as React from "react"
import { BookOpen, Calendar, Award, FileCheck2, ArrowRight } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Course } from "@/lib/imscc/types"
import { ActiveModalItem } from "./content-viewer-modal"

interface SyllabusViewProps {
  course: Course
  onSelectItem: (item: ActiveModalItem) => void
}

export function SyllabusView({ course, onSelectItem }: SyllabusViewProps) {
  // Build chronological list of assignments & quizzes
  const events = React.useMemo(() => {
    const list: {
      id: string
      type: "assignment" | "quiz"
      title: string
      date?: string
      points: number
    }[] = []

    course.assignments.forEach((a) => {
      list.push({
        id: a.id,
        type: "assignment",
        title: a.title,
        date: a.dueAt,
        points: a.pointsPossible,
      })
    })

    course.quizzes.forEach((q) => {
      list.push({
        id: q.id,
        type: "quiz",
        title: q.title,
        points: q.pointsPossible,
      })
    })

    // Sort: items with dates first (chronologically), then items without dates
    list.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }
      if (a.date) return -1
      if (b.date) return 1
      return a.title.localeCompare(b.title)
    })

    return list
  }, [course.assignments, course.quizzes])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          Course Syllabus & Schedule
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Course expectations, grading policies, and assignment calendar.
        </p>
      </div>

      {/* Syllabus Content Card */}
      <Card className="p-6">
        <CardHeader className="p-0 pb-4 mb-4 border-b border-border">
          <CardTitle className="text-lg">Syllabus Description</CardTitle>
          <CardDescription>Instructor course overview and objectives.</CardDescription>
        </CardHeader>

        {course.syllabusHtml ? (
          <div
            className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm sm:text-base [&_img]:rounded-lg [&_img]:max-w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_a]:text-primary [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: course.syllabusHtml }}
          />
        ) : (
          <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg text-sm italic">
            No formal syllabus document included in this course export.
          </div>
        )}
      </Card>

      {/* Course Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="size-5 text-blue-500" />
            Course Schedule Summary
          </CardTitle>
          <CardDescription>Chronological overview of assignments, deliverables, and evaluations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {events.map((ev, idx) => (
              <div
                key={idx}
                onClick={() => onSelectItem({ type: ev.type, id: ev.id })}
                className="p-4 hover:bg-muted/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileCheck2 className="size-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors block">
                      {ev.title}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {ev.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  {ev.date ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>{new Date(ev.date).toLocaleDateString()}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No due date</span>
                  )}

                  {ev.points > 0 && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {ev.points} pts
                    </Badge>
                  )}

                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

