"use client"

import * as React from "react"
import {
  FileCheck2,
  HelpCircle,
  MessageSquare,
  FileText,
  Paperclip,
  ExternalLink,
  Lock,
  ChevronDown,
  Layers,
  Award,
  Calendar,
  Sparkles,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Course, CourseModule, ModuleItem, ItemContentType } from "@/lib/imscc/types"
import { ActiveModalItem } from "./content-viewer-modal"

interface ModulesViewProps {
  course: Course
  searchQuery?: string
  onSelectItem: (item: ActiveModalItem) => void
}

export function ModulesView({ course, searchQuery = "", onSelectItem }: ModulesViewProps) {
  // Track expanded state for each module
  const [expandedModules, setExpandedModules] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    course.modules.forEach((m) => {
      initial[m.id] = true
    })
    return initial
  })

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const expandAll = () => {
    const updated: Record<string, boolean> = {}
    course.modules.forEach((m) => {
      updated[m.id] = true
    })
    setExpandedModules(updated)
  }

  const collapseAll = () => {
    setExpandedModules({})
  }

  const getItemIcon = (type: ItemContentType) => {
    switch (type) {
      case "Assignment":
        return <FileCheck2 className="size-4 text-blue-500 shrink-0" />
      case "Quizzes::Quiz":
        return <HelpCircle className="size-4 text-purple-500 shrink-0" />
      case "DiscussionTopic":
        return <MessageSquare className="size-4 text-amber-500 shrink-0" />
      case "WikiPage":
        return <FileText className="size-4 text-muted-foreground shrink-0" />
      case "Attachment":
        return <Paperclip className="size-4 text-emerald-500 shrink-0" />
      case "ExternalUrl":
        return <ExternalLink className="size-4 text-indigo-500 shrink-0" />
      case "ContextExternalTool":
        return <Sparkles className="size-4 text-violet-500 shrink-0" />
      default:
        return <FileText className="size-4 text-muted-foreground shrink-0" />
    }
  }

  const getItemDetails = (item: ModuleItem) => {
    let points: number | undefined
    let dueAt: string | undefined

    if (item.contentType === "Assignment") {
      const a = course.assignments.find(
        (as) => as.id === item.identifierref || as.id === item.resolvedTargetId || as.title === item.title
      )
      if (a) {
        points = a.pointsPossible
        dueAt = a.dueAt
      }
    } else if (item.contentType === "Quizzes::Quiz") {
      const q = course.quizzes.find(
        (qz) => qz.id === item.identifierref || qz.id === item.resolvedTargetId || qz.title === item.title
      )
      if (q) {
        points = q.pointsPossible
      }
    } else if (item.contentType === "DiscussionTopic") {
      const d = course.discussions.find(
        (ds) => ds.id === item.identifierref || ds.topicId === item.identifierref || ds.title === item.title
      )
      if (d) {
        points = d.pointsPossible
      }
    }

    return { points, dueAt }
  }

  // Filter modules and items if search is active
  const filteredModules = React.useMemo(() => {
    if (!searchQuery.trim()) return course.modules
    const q = searchQuery.toLowerCase()

    return course.modules
      .map((m) => {
        const titleMatch = m.title.toLowerCase().includes(q)
        const matchingItems = m.items.filter(
          (it) => it.title.toLowerCase().includes(q) || it.contentType.toLowerCase().includes(q)
        )
        if (titleMatch) return m
        if (matchingItems.length > 0) return { ...m, items: matchingItems }
        return null
      })
      .filter((m): m is CourseModule => m !== null)
  }, [course.modules, searchQuery])

  return (
    <div className="space-y-4">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            Learning Modules
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sequential course outline and learning units. Click any item to inspect its content.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="xs" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="xs" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <p className="text-sm">No modules or items match your search &ldquo;{searchQuery}&rdquo;</p>
        </Card>
      ) : (
        filteredModules.map((m, mIdx) => {
          const isExpanded = expandedModules[m.id] ?? true
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              {/* Module Header Bar */}
              <div
                onClick={() => toggleModule(m.id)}
                className="p-4 bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer flex items-center justify-between gap-4 border-b border-border select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
                      isExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs font-mono text-muted-foreground">Module {mIdx + 1}</span>
                    <h3 className="font-semibold text-base text-foreground truncate">{m.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {m.locked && (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <Lock className="size-3" />
                      <span>Locked</span>
                    </Badge>
                  )}
                  {m.unlockAt && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      Unlocks {new Date(m.unlockAt).toLocaleDateString()}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-background border border-border">
                    {m.items.length} {m.items.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              {/* Module Items List */}
              {isExpanded && (
                <div className="divide-y divide-border">
                  {m.items.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground italic text-center">
                      This module has no learning items.
                    </div>
                  ) : (
                    m.items.map((item, itemIdx) => {
                      const { points, dueAt } = getItemDetails(item)
                      const prevItem = itemIdx > 0 ? m.items[itemIdx - 1] : undefined
                      const nextItem = itemIdx < m.items.length - 1 ? m.items[itemIdx + 1] : undefined

                      return (
                        <div
                          key={item.id}
                          onClick={() =>
                            onSelectItem({
                              type: "moduleItem",
                              id: item.id,
                              parentModuleTitle: m.title,
                              prevId: prevItem?.id,
                              nextId: nextItem?.id,
                            })
                          }
                          style={{
                            paddingLeft: `${Math.max(item.indent * 1.5, 0) + 1.25}rem`,
                          }}
                          className="pr-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {getItemIcon(item.contentType)}
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                                {item.title}
                              </span>
                              <span className="text-xs text-muted-foreground block sm:hidden">
                                {item.contentType.replace(/Quizzes::/g, "")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {dueAt && (
                              <Badge variant="outline" className="hidden sm:inline-flex gap-1 text-[11px] font-normal">
                                <Calendar className="size-3 text-muted-foreground" />
                                <span>{new Date(dueAt).toLocaleDateString()}</span>
                              </Badge>
                            )}

                            {points !== undefined && (
                              <Badge variant="secondary" className="gap-1 text-[11px] font-mono">
                                <Award className="size-3 text-amber-500" />
                                <span>{points} pts</span>
                              </Badge>
                            )}

                            <Badge variant="outline" className="text-[10px] hidden md:inline-flex capitalize">
                              {item.contentType.replace(/Quizzes::/g, "")}
                            </Badge>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

