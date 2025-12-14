"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type UserRole } from "./use-auth"

export function withProtectedRoute<P extends object>(Component: React.ComponentType<P>, allowedRoles?: UserRole[]) {
  return function ProtectedComponent(props: P) {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push("/login")
        } else if (allowedRoles && !allowedRoles.includes(user.role)) {
          router.push("/unauthorized")
        }
      }
    }, [user, loading, router])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 mx-auto rounded-full bg-primary/20 animate-pulse" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    }

    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
      return null
    }

    return <Component {...props} />
  }
}

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Only redirect after auth check is complete and we're not loading
    if (!loading && !isRedirecting) {
      if (!user) {
        setIsRedirecting(true)
        router.push("/login")
      } else if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
        if (!allowedRoles.includes(user.role)) {
          setIsRedirecting(true)
          router.push("/unauthorized")
        }
      }
    }
  }, [user, loading, router, requiredRole, isRedirecting])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 mx-auto rounded-full bg-primary/20 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!allowedRoles.includes(user.role)) {
      return null
    }
  }

  return <>{children}</>
}
