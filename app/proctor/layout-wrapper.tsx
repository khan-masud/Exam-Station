"use client"

import type { ReactNode } from "react"
import { withProtectedRoute } from "@/hooks/protected-route"

function ProctorLayoutWrapperContent({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export default withProtectedRoute(ProctorLayoutWrapperContent, ["proctor"])
