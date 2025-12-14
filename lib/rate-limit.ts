// Rate limiting utilities for exam endpoints
// Prevents abuse and DDoS attacks

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const rateLimitStore: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  max: number       // Max requests per window
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  
  // Get or initialize rate limit entry
  if (!rateLimitStore[key] || rateLimitStore[key].resetTime < now) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }
  
  const entry = rateLimitStore[key]
  
  // Check if limit exceeded
  if (entry.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  // Increment counter
  entry.count++
  
  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime
  }
}

// Preset configurations for different exam operations
export const RATE_LIMITS = {
  EXAM_START: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5                     // 5 exam starts per 15 min
  },
  EXAM_SUBMIT: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    max: 3                     // 3 submissions per 5 min (includes retries)
  },
  AUTOSAVE: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    max: 10                    // 10 autosaves per minute (one every 6s)
  },
  ANTI_CHEAT_LOG: {
    windowMs: 1 * 60 * 1000,  // 1 minute
    max: 30                    // 30 anti-cheat events per minute
  }
} as const

export function getRateLimitIdentifier(userId: string, action: string): string {
  return `${action}:${userId}`
}
