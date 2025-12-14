import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets a color class that adapts to dark mode
 */
export function getDarkModeClass(lightClass: string, darkClass: string): string {
  return `${lightClass} dark:${darkClass}`
}

/**
 * Common dark mode safe colors
 */
export const colors = {
  // Background variants that work in both modes
  surface: {
    primary: "bg-background",
    secondary: "bg-card",
    muted: "bg-muted",
  },
  
  // Text variants
  text: {
    primary: "text-foreground",
    secondary: "text-muted-foreground",
    accent: "text-primary",
  },
  
  // Border variants
  border: {
    default: "border-border",
    muted: "border-muted",
  },
  
  // Status colors that work in both modes
  status: {
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  },
  
  // Alert backgrounds
  alert: {
    success: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
    error: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', options || {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

/**
 * Format time duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 
    ? `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}` 
    : `${hours} hr${hours !== 1 ? 's' : ''}`
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Safe JSON parse with fallback
 */
export function safeJSONParse<T = any>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * Get status badge variant
 */
export function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const statusLower = status.toLowerCase()
  
  if (statusLower.includes('active') || statusLower.includes('approved') || statusLower.includes('completed') || statusLower.includes('pass')) {
    return "default"
  }
  
  if (statusLower.includes('pending') || statusLower.includes('ongoing')) {
    return "secondary"
  }
  
  if (statusLower.includes('failed') || statusLower.includes('rejected') || statusLower.includes('cancelled')) {
    return "destructive"
  }
  
  return "outline"
}
