"use client"

import * as React from "react"
import {
  FileCheck2,
  Calendar,
  Award,
  UploadCloud,
  FileCode,
  ArrowRight,
  Filter,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Course, Assignment } from "@/lib/imscc/types"
import { ActiveModalItem } from "./content-viewer-modal"

interface AssignmentsViewProps {
  course: Course
  searchQuery?: string
  onSelectItem: (item: ActiveModalItem) => void
}

export function AssignmentsView({
  course,
  searchQuery = "",
  onSelectItem,
}: AssignmentsViewProps) {
  const [selectedGroup, setSelectedGroup] = React.useState<string>("all")

  const filteredAssignments = React.useMemo(() => {
    let list = course.assignments
    if (selectedGroup !== "all") {
      list = list.filter((a) => a.assignmentGroupId === selectedGroup)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.submissionTypes.some((s) => s.toLowerCase().includes(q))
      )
    }
    return list
  }, [course.assignments, selectedGroup, searchQuery])

  return (
    <div className="space-y-6">
      {/* Header and Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileCheck2 className="size-5 text-blue-500" />
            Course Assignments ({course.assignments.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Graded assignments, tasks, and submission prompts.
          </p>
        </div>

        {course.assignmentGroups.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-muted-foreground" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="text-xs border border-border rounded-md px-2.5 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Assignment Groups</option>
              {course.assignmentGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {filteredAssignments.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <p className="text-sm">No assignments found matching the criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((a) => {
            const groupName = course.assignmentGroups.find((g) => g.id === a.assignmentGroupId)?.title
            return (
              <Card
                key={a.id}
                onClick={() => onSelectItem({ type: "assignment", id: a.id })}
                className="py-4 px-5 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {groupName ? (
                      <span className="text-xs font-mono text-muted-foreground">{groupName}</span>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">Assignment</span>
                    )}
                    <Badge variant="outline" className="gap-1 font-mono text-xs">
                      <Award className="size-3 text-amber-500" />
                      <span>{a.pointsPossible} pts</span>
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                    {a.title}
                  </h3>

                  {a.dueAt && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                      <Calendar className="size-3.5" />
                      <span>Due {new Date(a.dueAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {a.submissionTypes.length > 0 ? (
                      a.submissionTypes.map((sub, sIdx) => (
                        <Badge key={sIdx} variant="secondary" className="text-[10px] capitalize">
                          {sub.replace(/_/g, " ")}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-[10px]">No Submission</Badge>
                    )}
                  </div>

                  <span className="text-primary text-xs font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect</span>
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

