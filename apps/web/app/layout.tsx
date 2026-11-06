import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { Manrope } from "next/font/google"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

export const metadata = {
  title: "CoursePack - IMSCC Course Visualizer",
  description: "Upload and visualize Canvas Common Cartridge (.imscc) course exports",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(manrope.variable, "antialiased font-sans")}
    >
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

