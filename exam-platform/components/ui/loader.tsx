import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoaderProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "primary" | "secondary"
}

export function Loader({ className, size = "md", variant = "default", ...props }: LoaderProps) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
    xl: "size-12",
  }

  const variantClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
  }

  return (
    <div
      role="status"
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin", sizeClasses[size], variantClasses[variant])} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
