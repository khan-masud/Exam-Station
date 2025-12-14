"use client"

import type { ReactNode } from "react"
import { withProtectedRoute } from "@/hooks/protected-route"
import { StudentSidebar } from "./sidebar"
import { ErrorBoundary } from "@/components/error-boundary"

function StudentLayoutWrapperContent({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background">
        <StudentSidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default withProtectedRoute(StudentLayoutWrapperContent, ["student"])
