"use client"

import type { ReactNode } from "react"
import { withProtectedRoute } from "@/hooks/protected-route"
import { AdminSidebar } from "@/app/admin/sidebar"
import { ErrorBoundary } from "@/components/error-boundary"

function AdminLayoutWrapperContent({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </ErrorBoundary>
  )
}

export default withProtectedRoute(AdminLayoutWrapperContent, ["admin"])
