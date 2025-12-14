"use client"

import * as React from "react"
import { Moon, Sun, Globe } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { useAppContext } from "@/context/app-context"

export function ThemeAndLanguageToggle() {
  const { setTheme, theme } = useTheme()
  const { isBengali, toggleLanguage } = useAppContext()

  return (
    <div className="flex items-center space-x-2">
      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label="Toggle theme"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Language Toggle */}
      <Button
        variant="ghost"
        onClick={toggleLanguage}
        className="text-sm font-medium px-2"
        aria-label="Toggle language between English and Bengali"
      >
        <Globe className="h-4 w-4 mr-2" />
        {isBengali ? "English" : "বাংলা"}
      </Button>
    </div>
  )
}
