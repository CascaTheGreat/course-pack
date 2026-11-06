"use client"

import * as React from "react"
import {
  HelpCircle,
  Clock,
  RotateCcw,
  Award,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Course, Quiz } from "@/lib/imscc/types"
import { ActiveModalItem } from "./content-viewer-modal"

interface QuizzesViewProps {
  course: Course
  searchQuery?: string
  onSelectItem: (item: ActiveModalItem) => void
}

export function QuizzesView({
  course,
  searchQuery = "",
  onSelectItem,
}: QuizzesViewProps) {
  const filteredQuizzes = React.useMemo(() => {
    let list = course.quizzes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(q) ||
          quiz.quizType?.toLowerCase().includes(q)
      )
    }
    return list
  }, [course.quizzes, searchQuery])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <HelpCircle className="size-5 text-purple-500" />
          Quizzes & Assessments ({course.quizzes.length})
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          QTI examinations, graded surveys, and practice assessments with question banks.
        </p>
      </div>

      {filteredQuizzes.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <p className="text-sm">No quizzes found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredQuizzes.map((quiz) => (
            <Card
              key={quiz.id}
              onClick={() => onSelectItem({ type: "quiz", id: quiz.id })}
              className="py-4 px-5 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="purple" className="capitalize text-xs">
                    {quiz.quizType || "Quiz"}
                  </Badge>
                  <Badge variant="outline" className="gap-1 font-mono text-xs">
                    <Award className="size-3 text-amber-500" />
                    <span>{quiz.pointsPossible} pts</span>
                  </Badge>
                </div>

                <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                  {quiz.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>{quiz.timeLimitMinutes ? `${quiz.timeLimitMinutes} mins` : "Untimed"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <RotateCcw className="size-3.5" />
                    <span className="capitalize">{quiz.allowedAttempts || 1} attempt(s)</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <HelpCircle className="size-3.5 text-purple-500" />
                    <span>{quiz.questions.length} questions</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {quiz.shuffleAnswers ? "Shuffled answers" : "Fixed order"}
                </span>

                <span className="text-primary text-xs font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>View Questions</span>
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

