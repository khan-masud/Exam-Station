"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, useAuthStore } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { translate } from "@/lib/i18n"
import { useAppContext } from "@/context/app-context"
import { OAuthButtons } from "@/components/auth/oauth-buttons"

export default function LoginPage() {
  const { isBengali } = useAppContext()
  const router = useRouter()
  const { login, user } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const roleRoutes: Record<string, string> = {
        admin: "/admin/dashboard",
        proctor: "/proctor/dashboard",
        student: "/student/dashboard",
      }
      router.push(roleRoutes[user.role] || "/dashboard")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        // After successful login, get the updated user from the hook
        const loggedInUser = useAuthStore.getState().user
        if (loggedInUser) {
          const roleRoutes: Record<string, string> = {
            admin: "/admin/dashboard",
            proctor: "/proctor/dashboard",
            student: "/student/dashboard",
          }
          router.push(roleRoutes[loggedInUser.role] || "/dashboard")
        } else {
          router.push("/dashboard")
        }
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err) {
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold">{translate("login", isBengali)}</CardTitle>
          <CardDescription>{isBengali ? "আপনার পরীক্ষা অ্যাকাউন্টে সাইন ইন করুন" : "Sign in to your exam account"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                {isBengali ? "ইমেইল" : "Email"}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  {isBengali ? "পাসওয়ার্ড" : "Password"}
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-primary hover:underline"
                >
                  {isBengali ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot Password?"}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (isBengali ? "সাইন ইন করা হচ্ছে..." : "Signing in...") : (isBengali ? "সাইন ইন করুন" : "Sign In")}
            </Button>
          </form>

          <OAuthButtons mode="login" />

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isBengali ? "একটি অ্যাকাউন্ট নেই?" : "Don't have an account?"}{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                {isBengali ? "নিবন্ধন করুন" : "Sign up"}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
