"use client"

import React, { createContext, useContext, useState, useMemo, useCallback } from "react"

// Define the context state and actions
interface AppContextType {
  isBengali: boolean
  toggleLanguage: () => void
  isExamMode: boolean
  setExamMode: (mode: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Language state (English/Bengali)
  const [isBengali, setIsBengali] = useState(false)
  const toggleLanguage = useCallback(() => {
    setIsBengali(prev => !prev)
  }, [])

  // Exam Mode state (for distraction-free UI)
  const [isExamMode, setIsExamMode] = useState(false)
  const setExamMode = useCallback((mode: boolean) => {
    setIsExamMode(mode)
  }, [])

  const value = useMemo(() => ({
    isBengali,
    toggleLanguage,
    isExamMode,
    setExamMode,
  }), [isBengali, toggleLanguage, isExamMode, setExamMode])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
