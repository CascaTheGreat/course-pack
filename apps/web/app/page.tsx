"use client"

import * as React from "react"
import { GraduationCap, Sun, Moon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useTheme } from "next-themes"
import { Course } from "@/lib/imscc/types"
import { CourseUploader } from "@/components/course/course-uploader"
import { CourseViewer } from "@/components/course/course-viewer"

export default function Page() {
  const [course, setCourse] = React.useState<Course | null>(null)
  const { theme, setTheme } = useTheme()

  if (course) {
    return <CourseViewer course={course} onResetCourse={() => setCourse(null)} />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Top navbar on upload screen */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <span className="font-bold text-base text-foreground tracking-tight">CoursePack</span>
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">IMSCC Course Visualizer</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle theme"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* Main Upload / Demo Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <CourseUploader onCourseLoaded={setCourse} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Canvas Common Cartridge (.imscc) Visualizer &bull; Zero external upload required (100% in-browser)
      </footer>
    </div>
  )
}
