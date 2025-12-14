"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useEffect, useRef } from "react"

export type UserRole = "admin" | "student" | "proctor" | "teacher"

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  organizationId?: string
  organizationName?: string
  profilePicture?: string
}

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
  isChecking: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    organizationName?: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User | null) => void
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      initialized: false,
      isChecking: false,

      login: async (email: string, password: string) => {
        try {
          set({ loading: true })
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // Important: include cookies
          })

          if (!response.ok) {
            const data = await response.json()
            set({ loading: false })
            return { success: false, error: data.error || "Login failed" }
          }

          const data = await response.json()
          const user: User = {
            id: data.user.id,
            email: data.user.email,
            fullName: data.user.full_name,
            role: data.user.role,
            organizationId: data.user.organizationId,
            profilePicture: data.user.profile_picture,
          }

          set({ user, loading: false })
          return { success: true }
        } catch (error) {
          set({ loading: false })
          return { success: false, error: "Login failed" }
        }
      },

      register: async (
        email: string,
        password: string,
        fullName: string,
        role: UserRole,
        organizationName?: string,
      ) => {
        try {
          set({ loading: true })
          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              full_name: fullName,
              role,
              organization_name: organizationName,
            }),
            credentials: 'include', // Important: include cookies
          })

          if (!response.ok) {
            const data = await response.json()
            return { success: false, error: data.error || "Registration failed" }
          }

          set({ loading: false })
          return { success: true }
        } catch (error) {
          set({ loading: false })
          return { success: false, error: "Registration failed" }
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" })
        } catch (error) {
          console.error("Logout error:", error)
        }
        set({ user: null })
      },

      checkAuth: async () => {
        const state = get()
        
        // Prevent multiple simultaneous checks
        if (state.isChecking || state.initialized) {
          return
        }
        
        set({ isChecking: true })
        
        try {
          set({ loading: true })
          const response = await fetch("/api/auth/me", {
            credentials: 'include' // Important: include cookies
          })
          
          if (response.ok) {
            const data = await response.json()
            const user: User = {
              id: data.user.id,
              email: data.user.email,
              fullName: data.user.full_name,
              role: data.user.role,
              organizationId: data.user.organization_id,
              organizationName: data.user.organization_name,
              profilePicture: data.user.profile_picture,
            }
            set({ user, loading: false, initialized: true, isChecking: false })
          } else {
            set({ user: null, loading: false, initialized: true, isChecking: false })
          }
        } catch (error) {
          console.error('Auth check error:', error)
          set({ user: null, loading: false, initialized: true, isChecking: false })
        }
      },

      setUser: (user: User | null) => {
        set({ user })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
)

// Custom hook WITHOUT auto-initialization - initialization happens in layout.tsx
export const useAuth = () => {
  return useAuthStore()
}

// Export the store for direct access
export { useAuthStore }
