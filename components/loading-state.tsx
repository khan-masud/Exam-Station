"use client"

import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
  variant?: "default" | "card" | "inline"
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12"
}

export function LoadingState({ 
  message = "Loading...", 
  fullScreen = false,
  variant = "default",
  size = "md"
}: LoadingStateProps) {
  const spinnerSize = sizeClasses[size]

  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center gap-2 p-4">
        <Loader2 className={`${spinnerSize} animate-spin text-primary`} />
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    )
  }

  if (variant === "card") {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className={`${spinnerSize} mx-auto mb-4 animate-spin text-primary`} />
          {message && <p className="text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    )
  }

  const content = (
    <div className="text-center">
      <Loader2 className={`${spinnerSize} mx-auto mb-4 animate-spin text-primary`} />
      {message && <p className="text-muted-foreground">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-12">
      {content}
    </div>
  )
}

// Skeleton components for better UX
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-10 bg-muted animate-pulse rounded flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="h-4 w-24 bg-muted animate-pulse rounded mb-3" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ListSkeleton({ items = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="w-12 h-12 bg-muted animate-pulse rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
