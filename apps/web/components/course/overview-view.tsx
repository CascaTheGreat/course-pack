"use client"

import * as React from "react"
import {
  Layers,
  FileCheck2,
  HelpCircle,
  FolderOpen,
  Award,
  Calendar,
  HardDrive,
  Shield,
  ArrowRight,
  BookOpen,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Course } from "@/lib/imscc/types"
import { NavTab } from "./course-sidebar"

interface OverviewViewProps {
  course: Course
  onNavigateTab: (tab: NavTab) => void
}

export function OverviewView({ course, onNavigateTab }: OverviewViewProps) {
  const formatBytes = (bytes?: number) => {
    if (!bytes) return "Not specified"
    const mb = bytes / (1024 * 1024)
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
    return `${mb.toFixed(0)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-4">
          <CardContent className="px-5 py-0 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Points</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {course.stats.totalPoints} <span className="text-xs font-normal text-muted-foreground">pts</span>
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-5 py-0 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modules</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {course.stats.totalModules}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-5 py-0 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignments & Quizzes</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {course.stats.totalAssignments + course.stats.totalQuizzes}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileCheck2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-5 py-0 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages & Files</p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1">
                {course.stats.totalPages + course.stats.totalFiles}
              </h3>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FolderOpen className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Course Details & Assignment Groups */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="size-5 text-primary" />
              Course Information
            </CardTitle>
            <CardDescription>Metadata and settings extracted from the course export cartridge.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Course Title</span>
                <span className="font-semibold text-foreground mt-1 block">{course.title}</span>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Course Code</span>
                <span className="font-semibold text-foreground mt-1 block">{course.courseCode || "None specified"}</span>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Course Dates</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground mt-1">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  <span>
                    {course.startAt ? new Date(course.startAt).toLocaleDateString() : "Flexible"} &ndash;{" "}
                    {course.concludeAt ? new Date(course.concludeAt).toLocaleDateString() : "Flexible"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Content License</span>
                <div className="flex items-center gap-1.5 font-medium text-foreground mt-1 capitalize">
                  <Shield className="size-3.5 text-muted-foreground" />
                  <span>{course.license || "Private (Copyrighted)"}</span>
                </div>
              </div>

              {course.storageQuota && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border sm:col-span-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">Course Storage Quota</span>
                  <div className="flex items-center gap-1.5 font-medium text-foreground mt-1">
                    <HardDrive className="size-3.5 text-muted-foreground" />
                    <span>{formatBytes(course.storageQuota)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Button onClick={() => onNavigateTab("modules")} className="gap-2">
                <span>Go to Modules</span>
                <ArrowRight className="size-4" />
              </Button>
              {course.syllabusHtml && (
                <Button variant="outline" onClick={() => onNavigateTab("syllabus")} className="gap-2">
                  <BookOpen className="size-4" />
                  <span>Read Syllabus</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assignment Groups / Weights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="size-5 text-amber-500" />
              Grading Structure
            </CardTitle>
            <CardDescription>Assignment groups & categories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {course.assignmentGroups.length > 0 ? (
              course.assignmentGroups.map((grp) => {
                const count = course.assignments.filter((a) => a.assignmentGroupId === grp.id).length
                return (
                  <div key={grp.id} className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{grp.title}</p>
                      <p className="text-xs text-muted-foreground">{count} {count === 1 ? "assignment" : "assignments"}</p>
                    </div>
                    {grp.weight !== undefined && grp.weight > 0 && (
                      <Badge variant="secondary">{grp.weight}%</Badge>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground italic">Standard assignment weights apply.</p>
            )}

            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => onNavigateTab("assignments")} className="w-full">
                View All Assignments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Overview Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Module Sequence Outline</CardTitle>
            <CardDescription>Structure of learning modules in this course.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigateTab("modules")} className="gap-1 text-xs">
            <span>Expand All Modules</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {course.modules.map((m, idx) => (
              <div
                key={m.id}
                onClick={() => onNavigateTab("modules")}
                className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">Module {idx + 1}</span>
                    {m.locked ? (
                      <Badge variant="destructive" className="text-[10px]">Locked</Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px]">Active</Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-foreground">{m.title}</h4>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>{m.items.length} {m.items.length === 1 ? "item" : "items"}</span>
                  <span className="text-primary font-medium flex items-center gap-1 text-[11px]">
                    Open <ArrowRight className="size-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

