"use client"

import * as React from "react"
import { Course } from "@/lib/imscc/types"
import { CourseHeader } from "./course-header"
import { CourseSidebar, NavTab } from "./course-sidebar"
import { OverviewView } from "./overview-view"
import { ModulesView } from "./modules-view"
import { AssignmentsView } from "./assignments-view"
import { QuizzesView } from "./quizzes-view"
import { DiscussionsView } from "./discussions-view"
import { PagesView } from "./pages-view"
import { FilesView } from "./files-view"
import { SyllabusView } from "./syllabus-view"
import { ContentViewerModal, ActiveModalItem } from "./content-viewer-modal"

interface CourseViewerProps {
  course: Course
  onResetCourse: () => void
}

export function CourseViewer({ course, onResetCourse }: CourseViewerProps) {
  const [activeTab, setActiveTab] = React.useState<NavTab>("overview")
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [activeModalItem, setActiveModalItem] = React.useState<ActiveModalItem | null>(null)

  // Intercept internal #page:, #quiz:, #assignment: links clicked in rendered HTML
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a")
      if (!target) return

      const href = target.getAttribute("href")
      if (!href) return

      if (href.startsWith("#page:")) {
        e.preventDefault()
        const slug = href.substring("#page:".length)
        const found = course.pages.find((p) => p.urlSlug === slug || p.id === slug || p.title.toLowerCase() === slug.toLowerCase())
        if (found) {
          setActiveModalItem({ type: "page", id: found.id })
        }
      } else if (href.startsWith("#quiz:")) {
        e.preventDefault()
        const id = href.substring("#quiz:".length)
        setActiveModalItem({ type: "quiz", id })
      } else if (href.startsWith("#assignment:")) {
        e.preventDefault()
        const id = href.substring("#assignment:".length)
        setActiveModalItem({ type: "assignment", id })
      }
    }

    document.addEventListener("click", handleDocumentClick)
    return () => {
      document.removeEventListener("click", handleDocumentClick)
    }
  }, [course])

  const renderActiveView = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewView course={course} onNavigateTab={setActiveTab} />
      case "modules":
        return (
          <ModulesView
            course={course}
            searchQuery={searchQuery}
            onSelectItem={setActiveModalItem}
          />
        )
      case "assignments":
        return (
          <AssignmentsView
            course={course}
            searchQuery={searchQuery}
            onSelectItem={setActiveModalItem}
          />
        )
      case "quizzes":
        return (
          <QuizzesView
            course={course}
            searchQuery={searchQuery}
            onSelectItem={setActiveModalItem}
          />
        )
      case "discussions":
        return (
          <DiscussionsView
            course={course}
            searchQuery={searchQuery}
            onSelectItem={setActiveModalItem}
          />
        )
      case "pages":
        return (
          <PagesView
            course={course}
            searchQuery={searchQuery}
            onSelectItem={setActiveModalItem}
          />
        )
      case "files":
        return (
          <FilesView
            course={course}
            searchQuery={searchQuery}
            onSelectItem={setActiveModalItem}
          />
        )
      case "syllabus":
        return <SyllabusView course={course} onSelectItem={setActiveModalItem} />
      default:
        return <OverviewView course={course} onNavigateTab={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CourseHeader
        course={course}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResetCourse={onResetCourse}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <CourseSidebar
            course={course}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

          <div className="flex-1 min-w-0 w-full">
            {renderActiveView()}
          </div>
        </div>
      </main>

      {/* Content Viewer Detail Modal */}
      <ContentViewerModal
        course={course}
        activeItem={activeModalItem}
        onClose={() => setActiveModalItem(null)}
        onNavigateItem={setActiveModalItem}
      />
    </div>
  )
}

