"use client"

import * as React from "react"
import {
  FolderTree,
  File,
  FileImage,
  FileVideo,
  FileText,
  Presentation,
  Download,
  Eye,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Course, CourseFile } from "@/lib/imscc/types"
import { ActiveModalItem } from "./content-viewer-modal"

interface FilesViewProps {
  course: Course
  searchQuery?: string
  onSelectItem: (item: ActiveModalItem) => void
}

export function FilesView({ course, searchQuery = "", onSelectItem }: FilesViewProps) {
  const [typeFilter, setTypeFilter] = React.useState<"all" | "presentations" | "images" | "videos" | "pdfs" | "other">("all")

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getFileIcon = (file: CourseFile) => {
    if (file.isPptx) return <Presentation className="size-5 text-amber-500 shrink-0" />
    if (file.isImage) return <FileImage className="size-5 text-blue-500 shrink-0" />
    if (file.isVideo) return <FileVideo className="size-5 text-purple-500 shrink-0" />
    if (file.isPdf) return <FileText className="size-5 text-red-500 shrink-0" />
    return <File className="size-5 text-muted-foreground shrink-0" />
  }

  const pptxCount = course.files.filter((f) => f.isPptx).length

  const filteredFiles = React.useMemo(() => {
    let list = course.files

    if (typeFilter === "presentations") list = list.filter((f) => f.isPptx)
    else if (typeFilter === "images") list = list.filter((f) => f.isImage)
    else if (typeFilter === "videos") list = list.filter((f) => f.isVideo)
    else if (typeFilter === "pdfs") list = list.filter((f) => f.isPdf)
    else if (typeFilter === "other") list = list.filter((f) => !f.isPptx && !f.isImage && !f.isVideo && !f.isPdf)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (f) =>
          f.filename.toLowerCase().includes(q) ||
          f.directory.toLowerCase().includes(q) ||
          f.mimeType.toLowerCase().includes(q)
      )
    }

    return list
  }, [course.files, typeFilter, searchQuery])

  const filterButton = (
    id: "all" | "presentations" | "images" | "videos" | "pdfs" | "other",
    label: string
  ) => (
    <button
      onClick={() => setTypeFilter(id)}
      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
        typeFilter === id ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6">
      {/* Header and Type Filter Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderTree className="size-5 text-amber-500" />
            Course Files &amp; Assets ({course.files.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Documents, images, multimedia, and course attachments extracted from the cartridge.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/60 text-xs overflow-x-auto">
          {filterButton("all", `All (${course.files.length})`)}
          {pptxCount > 0 && filterButton("presentations", `Slides (${pptxCount})`)}
          {filterButton("images", `Images (${course.files.filter((f) => f.isImage).length})`)}
          {filterButton("videos", `Videos (${course.files.filter((f) => f.isVideo).length})`)}
          {filterButton("pdfs", `PDFs (${course.files.filter((f) => f.isPdf).length})`)}
          {filterButton("other", `Other`)}
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          <p className="text-sm">No files found matching the criteria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="p-4 flex flex-col justify-between gap-3 hover:border-primary/50 transition-colors">
              <div>
                <div className="flex items-start gap-3">
                  {getFileIcon(file)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-foreground truncate" title={file.filename}>
                        {file.filename}
                      </h4>
                      {file.isPptx && (
                        <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                          <Presentation className="size-2.5 text-amber-500" />
                          <span>Presentation</span>
                        </Badge>
                      )}
                    </div>
                    {file.directory && (
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5" title={file.directory}>
                        /{file.directory}
                      </p>
                    )}
                  </div>
                </div>

                {/* Image preview thumbnail */}
                {file.isImage && file.blobUrl && (
                  <div
                    onClick={() => onSelectItem({ type: "file", id: file.id })}
                    className="mt-3 h-28 rounded-md overflow-hidden bg-muted/40 border border-border flex items-center justify-center cursor-pointer group"
                  >
                    <img
                      src={file.blobUrl}
                      alt={file.filename}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                {/* PPTX preview banner */}
                {file.isPptx && (
                  <div
                    onClick={() => onSelectItem({ type: "file", id: file.id })}
                    className="mt-3 h-20 rounded-md overflow-hidden bg-amber-500/5 border border-amber-500/20 flex items-center justify-center cursor-pointer group hover:bg-amber-500/10 transition-colors gap-3"
                  >
                    <Presentation className="size-8 text-amber-500/60 group-hover:text-amber-500 transition-colors shrink-0" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-foreground">PowerPoint Presentation</p>
                      <p className="text-[11px] text-muted-foreground">Click to open slide viewer & study guide</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatSize(file.size)}</span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant={file.isPptx ? "default" : "ghost"}
                    size="xs"
                    onClick={() => onSelectItem({ type: "file", id: file.id })}
                    className="gap-1 text-xs"
                  >
                    <Eye className="size-3.5" />
                    <span>{file.isPptx ? "Open Viewer" : "Preview"}</span>
                  </Button>

                  {file.blobUrl && (
                    <a
                      href={file.blobUrl}
                      download={file.filename}
                      className={buttonVariants({ variant: "outline", size: "xs", className: "gap-1 text-xs" })}
                    >
                      <Download className="size-3.5" />
                      <span>Save</span>
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
