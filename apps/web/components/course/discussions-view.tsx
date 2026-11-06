"use client"

import * as React from "react"
import { MessageSquare, Award, ArrowRight } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Card } from "@workspace/ui/components/card"
import { Course } from "@/lib/imscc/types"
import { ActiveModalItem } from "./content-viewer-modal"

interface DiscussionsViewProps {
  course: Course
  searchQuery?: string
  onSelectItem: (item: ActiveModalItem) => void
}

export function DiscussionsView({
  course,
  searchQuery = "",
  onSelectItem,
}: DiscussionsViewProps) {
  const filteredDiscussions = React.useMemo(() => {
    let list = course.discussions
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((d) => d.title.toLowerCase().includes(q))
    }
    return list
  }, [course.discussions, searchQuery])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="size-5 text-amber-500" />
          Course Discussions ({course.discussions.length})
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Discussion forums, debate threads, and collaborative topics.
        </p>
      </div>

      {filteredDiscussions.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <p className="text-sm">No discussions found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDiscussions.map((d) => (
            <Card
              key={d.id}
              onClick={() => onSelectItem({ type: "discussion", id: d.id })}
              className="py-4 px-5 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer flex flex-col justify-between gap-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="warning" className="capitalize text-xs">
                    {d.discussionType?.replace(/_/g, " ") || "Topic"}
                  </Badge>
                  {d.pointsPossible !== undefined && (
                    <Badge variant="outline" className="gap-1 font-mono text-xs">
                      <Award className="size-3 text-amber-500" />
                      <span>{d.pointsPossible} pts</span>
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                  {d.title}
                </h3>

                {d.messageHtml && (
                  <div
                    className="text-xs text-muted-foreground line-clamp-2 mt-2 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: d.messageHtml }}
                  />
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground capitalize">
                  {d.workflowState || "Active"}
                </span>

                <span className="text-primary text-xs font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Open Topic</span>
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

