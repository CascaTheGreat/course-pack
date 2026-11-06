"use client"

import * as React from "react"
import {
  GraduationCap,
  Calendar,
  Layers,
  FileText,
  HelpCircle,
  FolderOpen,
  Search,
  Upload,
  Sun,
  Moon,
  X,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Input } from "@workspace/ui/components/input"
import { useTheme } from "next-themes"
import { Course } from "@/lib/imscc/types"

interface CourseHeaderProps {
  course: Course
  searchQuery: string
  onSearchChange: (query: string) => void
  onResetCourse: () => void
}

export function CourseHeader({
  course,
  searchQuery,
  onSearchChange,
  onResetCourse,
}: CourseHeaderProps) {
  const { theme, setTheme } = useTheme()

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return null
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch {
      return isoStr
    }
  }

  const startDateStr = formatDate(course.startAt)
  const endDateStr = formatDate(course.concludeAt)

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
        {/* Top row: Title, badges, and controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap className="size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate text-foreground">
                  {course.title}
                </h1>
                {course.courseCode && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {course.courseCode}
                  </Badge>
                )}
                {course.license && (
                  <Badge variant="secondary" className="capitalize text-xs">
                    {course.license}
                  </Badge>
                )}
              </div>
              {(startDateStr || endDateStr) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Calendar className="size-3.5" />
                  <span>
                    {startDateStr || "Anytime"} &ndash; {endDateStr || "Self-paced"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetCourse}
              className="gap-1.5"
            >
              <Upload className="size-3.5" />
              <span>Change Course</span>
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>

        {/* Bottom row: Search bar and quick stats */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search modules, assignments, quizzes, pages..."
              className="pl-9 pr-8 h-9 text-sm bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs text-muted-foreground">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60">
              <Layers className="size-3.5 text-primary" />
              <span className="font-semibold text-foreground">{course.stats.totalModules}</span>
              <span>Modules</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60">
              <FileText className="size-3.5 text-blue-500" />
              <span className="font-semibold text-foreground">{course.stats.totalAssignments}</span>
              <span>Assignments</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60">
              <HelpCircle className="size-3.5 text-purple-500" />
              <span className="font-semibold text-foreground">{course.stats.totalQuizzes}</span>
              <span>Quizzes</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60">
              <FolderOpen className="size-3.5 text-amber-500" />
              <span className="font-semibold text-foreground">{course.stats.totalFiles}</span>
              <span>Files</span>
            </div>
            {course.stats.totalPoints > 0 && (
              <Badge variant="success" className="font-semibold">
                {course.stats.totalPoints} pts total
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

