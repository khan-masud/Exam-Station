"use client"

import { useAuth } from "@/hooks/use-auth"
import { Spinner } from "@/components/ui/spinner"
import LandingPage from "./landing/page"

export default function HomeRedirector() {
  const { user, loading } = useAuth()

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Spinner className="mb-4 h-8 w-8 mx-auto" />
          <p className="text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  return <LandingPage />
}
