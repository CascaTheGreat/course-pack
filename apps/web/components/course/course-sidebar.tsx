"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Layers,
  FileCheck2,
  HelpCircle,
  MessageSquare,
  FileText,
  FolderTree,
  BookOpen,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Course } from "@/lib/imscc/types"

export type NavTab =
  | "overview"
  | "modules"
  | "assignments"
  | "quizzes"
  | "discussions"
  | "pages"
  | "files"
  | "syllabus"

interface CourseSidebarProps {
  course: Course
  activeTab: NavTab
  onSelectTab: (tab: NavTab) => void
}

export function CourseSidebar({ course, activeTab, onSelectTab }: CourseSidebarProps) {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "overview",
      label: "Course Overview",
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      id: "modules",
      label: "Modules",
      icon: <Layers className="size-4" />,
      count: course.stats.totalModules,
    },
    {
      id: "assignments",
      label: "Assignments",
      icon: <FileCheck2 className="size-4" />,
      count: course.stats.totalAssignments,
    },
    {
      id: "quizzes",
      label: "Quizzes & Surveys",
      icon: <HelpCircle className="size-4" />,
      count: course.stats.totalQuizzes,
    },
    {
      id: "discussions",
      label: "Discussions",
      icon: <MessageSquare className="size-4" />,
      count: course.stats.totalDiscussions,
    },
    {
      id: "pages",
      label: "Pages",
      icon: <FileText className="size-4" />,
      count: course.stats.totalPages,
    },
    {
      id: "files",
      label: "Files & Media",
      icon: <FolderTree className="size-4" />,
      count: course.stats.totalFiles,
    },
    {
      id: "syllabus",
      label: "Syllabus",
      icon: <BookOpen className="size-4" />,
    },
  ]

  return (
    <aside className="w-full md:w-64 shrink-0 bg-card rounded-xl border border-border p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2 hidden md:block">
        Navigation
      </div>
      {navItems.map((item) => {
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={isActive ? "text-primary-foreground" : "text-muted-foreground"}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
            {item.count !== undefined && item.count > 0 && (
              <Badge
                variant={isActive ? "secondary" : "outline"}
                className={`text-[10px] px-1.5 py-0 h-4 min-w-4 text-center font-mono ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground border-transparent" : ""
                }`}
              >
                {item.count}
              </Badge>
            )}
          </button>
        )
      })}
    </aside>
  )
}

