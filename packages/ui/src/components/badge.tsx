import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@workspace/ui/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive/15 text-destructive border-destructive/25 [a&]:hover:bg-destructive/20",
        outline:
          "text-foreground border-border [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 [a&]:hover:bg-emerald-500/20",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 [a&]:hover:bg-amber-500/20",
        info:
          "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400 [a&]:hover:bg-blue-500/20",
        purple:
          "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400 [a&]:hover:bg-purple-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

