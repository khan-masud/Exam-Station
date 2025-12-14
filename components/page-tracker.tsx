"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Track page visit
    const trackPageVisit = async () => {
      try {
        const response = await fetch("/api/analytics/track-visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageUrl: pathname,
            referrer: document.referrer,
          }),
          credentials: "include",
        })
        
        if (!response.ok) {
          console.warn("Failed to track page visit:", response.status)
          return
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          try {
            await response.json()
          } catch (parseError) {
            console.debug("Failed to parse tracking response (non-critical)")
          }
        }
      } catch (error) {
        // Silently fail - this shouldn't break the app
        console.debug("Page tracking failed:", error)
      }
    }

    // Track immediately on mount and route changes
    trackPageVisit()
  }, [pathname])

  return null
}
