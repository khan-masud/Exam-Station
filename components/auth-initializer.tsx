"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"

export function AuthInitializer() {
  const { checkAuth, initialized, isChecking } = useAuth()
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Only initialize auth once across the entire app
    if (!hasInitialized.current && !initialized && !isChecking) {
      hasInitialized.current = true
      checkAuth()
    }
  }, []) // Empty array - truly run once
  
  return null
}
