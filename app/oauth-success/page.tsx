"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"
import { useAuthStore } from "@/hooks/use-auth"

function OAuthSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")

  useEffect(() => {
    const token = searchParams.get("token")
    const isNewUser = searchParams.get("isNewUser") === "true"

    if (!token) {
      setStatus("error")
      setTimeout(() => router.push("/login?error=oauth_failed"), 2000)
      return
    }

    // Check auth to update the store with the cookie that was set by the API
    const checkAuth = useAuthStore.getState().checkAuth
    checkAuth().then(() => {
      setStatus("success")

      // Redirect based on user type
      setTimeout(() => {
        if (isNewUser) {
          router.push("/student/dashboard?welcome=true")
        } else {
          router.push("/student/dashboard")
        }
      }, 1500)
    }).catch(() => {
      setStatus("error")
      setTimeout(() => router.push("/login?error=auth_check_failed"), 2000)
    })
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            {status === "processing" && (
              <>
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <h2 className="text-2xl font-bold">Completing Sign In</h2>
                <p className="text-muted-foreground">Please wait while we set up your account...</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold">Sign In Successful!</h2>
                <p className="text-muted-foreground">Redirecting you to your dashboard...</p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-3xl">✕</span>
                </div>
                <h2 className="text-2xl font-bold text-red-600">Sign In Failed</h2>
                <p className="text-muted-foreground">Something went wrong. Please try again.</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <OAuthSuccessContent />
    </Suspense>
  )
}

