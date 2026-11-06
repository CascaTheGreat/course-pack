"use client"

import * as React from "react"
import { UploadCloud, FileArchive, Sparkles, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card"
import { unzipArchive, type UnzipProgress } from "@/lib/imscc/unzip"
import { parseCourse } from "@/lib/imscc/parser"
import { Course } from "@/lib/imscc/types"

interface CourseUploaderProps {
  onCourseLoaded: (course: Course) => void
}

export function CourseUploader({ onCourseLoaded }: CourseUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string>("")
  const [progress, setProgress] = React.useState<UnzipProgress | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const processFile = async (file: File | Blob) => {
    try {
      setLoading(true)
      setError(null)
      setStatusMessage("Opening cartridge archive...")
      setProgress(null)

      const files = await unzipArchive(file, (p) => {
        setProgress(p)
        setStatusMessage(`Extracting: ${p.currentFile.split("/").pop() || p.currentFile} (${p.current}/${p.total})`)
      })

      setStatusMessage("Parsing course structure, modules & content...")
      const course = parseCourse(files)

      setStatusMessage("Course loaded successfully!")
      onCourseLoaded(course)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to parse course export file.")
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (loading) return

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      processFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const handleLoadSample = async () => {
    try {
      setLoading(true)
      setError(null)
      setStatusMessage("Fetching sample course export...")
      setProgress(null)

      const response = await fetch("/test-course-export.imscc")
      if (!response.ok) {
        throw new Error(`Failed to load sample course: HTTP ${response.status}`)
      }

      const blob = await response.blob()
      await processFile(blob)
    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to load sample course.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <Card className="border-2 border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <UploadCloud className="size-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Upload Course Cartridge</CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-1">
            Drop your Canvas-exported <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">.imscc</code> or <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs">.zip</code> file here to explore the course content.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".imscc,.zip,application/zip"
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="size-8 animate-spin text-primary" />
                <div className="text-sm font-medium text-foreground">{statusMessage}</div>
                {progress && (
                  <div className="w-64 bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-150"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <FileArchive className="size-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports Canvas IMS Common Cartridge packages (.imscc, .zip)
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-2 pointer-events-none">
                  Select File
                </Button>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to read course package</p>
                <p className="mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <span className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground font-medium">
              or try with sample data
            </span>
          </div>

          <div className="flex flex-col items-center">
            <Button
              variant="secondary"
              size="lg"
              disabled={loading}
              onClick={handleLoadSample}
              className="gap-2 w-full sm:w-auto"
            >
              <Sparkles className="size-4 text-amber-500 fill-amber-500/20" />
              Load Sample Course (Test Course 1)
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Loads the unzipped example course from <code className="font-mono text-foreground">test-course-export</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

