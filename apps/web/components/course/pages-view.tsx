"use client"

import * as React from "react"
import { FileText, ArrowRight, BookOpen } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@workspace/ui/components/card"
import { Course, WikiPage } from "@/lib/imscc/types"
import { ActiveModalItem } from "./content-viewer-modal"

interface PagesViewProps {
  course: Course
  searchQuery?: string
  onSelectItem: (item: ActiveModalItem) => void
}

export function PagesView({ course, searchQuery = "", onSelectItem }: PagesViewProps) {
  const [selectedPageId, setSelectedPageId] = React.useState<string>(() => {
    return course.pages[0]?.id || ""
  })

  const filteredPages = React.useMemo(() => {
    let list = course.pages
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((p) => p.title.toLowerCase().includes(q))
    }
    return list
  }, [course.pages, searchQuery])

  const selectedPage = course.pages.find((p) => p.id === selectedPageId) || filteredPages[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="size-5 text-muted-foreground" />
          Course Wiki Pages ({course.pages.length})
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Rich content pages, reference reading materials, and instructional guides.
        </p>
      </div>

      {filteredPages.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <p className="text-sm">No wiki pages found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pages List */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Select a Page
            </div>
            <div className="space-y-1.5">
              {filteredPages.map((page) => {
                const isSelected = selectedPage?.id === page.id
                return (
                  <button
                    key={page.id}
                    onClick={() => setSelectedPageId(page.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card hover:bg-muted/50 border-border text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className={`size-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium truncate">{page.title}</span>
                    </div>
                    <ArrowRight className={`size-3.5 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Page Content Reader */}
          <div className="md:col-span-2">
            {selectedPage ? (
              <Card className="p-6">
                <div className="border-b border-border pb-4 mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="secondary">Wiki Page</Badge>
                    {selectedPage.editingRoles && (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        Editable by {selectedPage.editingRoles}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    {selectedPage.title}
                  </h3>
                </div>

                {selectedPage.bodyHtml ? (
                  <div
                    className="prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm sm:text-base [&_img]:rounded-lg [&_img]:max-w-full [&_table]:border-collapse [&_table]:border [&_table]:border-border [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:p-2 [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-md [&_a]:text-primary [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: selectedPage.bodyHtml }}
                  />
                ) : (
                  <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg text-sm italic">
                    This page has no content.
                  </div>
                )}
              </Card>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

