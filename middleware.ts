import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, parseTokenFromHeader } from "@/lib/auth"
import { isInstalledServer } from "@/lib/installation"

// Rate limiting storage (in-memory for now - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Define public routes that don't require authentication
const publicRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/oauth/providers",
  "/api/auth/oauth/login",
  "/api/auth/oauth/callback",
  "/api/install",
  "/api/public",
]

// Define public page routes
const publicPageRoutes = [
  "/login",
  "/register",
  "/",
  "/landing",
  "/install", // Add install page as public
]

// Define routes that should be checked more specifically
const exactPublicRoutes = [
  "/api/programs", // Exact match only - not /api/programs/enroll
]

// Define routes that require specific roles
const roleBasedRoutes: Record<string, string[]> = {
  "/api/admin": ["admin"],
  "/api/exams": ["admin", "teacher", "proctor", "student"],
  "/api/questions": ["admin", "teacher"],
  "/api/subjects": ["admin", "teacher"],
  "/api/payments": ["admin", "student"],
}

// ✅ Rate limiting function
async function checkRateLimit(request: NextRequest, maxRequests: number = 60, identifier?: string): Promise<boolean> {
  // Use identifier (prefer user id) when provided, otherwise fall back to IP
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const key = identifier ? `user:${identifier}` : `ip:${ip}`

  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute window

  const userLimit = rateLimitMap.get(key)

  if (!userLimit || now > userLimit.resetTime) {
    // First request or window expired
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }

  if (userLimit.count >= maxRequests) {
    // Limit exceeded - log only when blocked
    console.warn(`[RateLimit] BLOCKED ${key}: ${userLimit.count}/${maxRequests} (${request.nextUrl.pathname})`)
    return false
  }

  // Increment count
  userLimit.count++
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ FIRST: Check if system is installed
  // Allow only /install route and its API if not installed
  let installed = false
  try {
    installed = await isInstalledServer()
    console.log('[Middleware] Installation status check:', { installed, pathname })
  } catch (error) {
    console.error('[Middleware] Error checking installation status:', error)
    // If we can't check installation status, allow install routes
    if (pathname.startsWith('/install') || pathname.startsWith('/api/install')) {
      return NextResponse.next()
    }
  }
  
  if (!installed) {
    console.log('[Middleware] System not installed, redirecting to install for path:', pathname)
    // Allow install page and API
    if (pathname.startsWith('/install') || pathname.startsWith('/api/install')) {
      return NextResponse.next()
    }
    // Also allow static files
    if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.includes('.')) {
      return NextResponse.next()
    }
    // Redirect everything else to install page
    return NextResponse.redirect(new URL('/install', request.url))
  }

  // ✅ If system IS installed, block access to install routes
  if (pathname.startsWith('/install') || pathname.startsWith('/api/install')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ✅ Apply rate limiting to API routes (opt-in for production safety)
  if (pathname.startsWith("/api/")) {
    // Only apply rate limiting if explicitly enabled
    const rateLimitingEnabled = process.env.ENABLE_RATE_LIMITING === 'true'
    
    if (!rateLimitingEnabled) {
      // Rate limiting disabled - skip for all environments
    } else {
      // Skip settings endpoints to avoid circular dependency
      if (pathname === '/api/admin/settings' || pathname.startsWith('/api/admin/settings/')) {
        // Skip
      } else {
        // Load settings dynamically
        try {
          const { getSecuritySettings } = await import("@/lib/settings")
          const securitySettings = await getSecuritySettings()

          if (securitySettings.enableRateLimiting) {
            // Try to get a stable identifier (user id) from the token when available
            const authHeader = request.headers.get("authorization")
            let token = parseTokenFromHeader(authHeader)
            if (!token) token = request.cookies.get("auth_token")?.value || null

            let identifier: string | undefined
            if (token) {
              const decoded = verifyToken(token)
              if (decoded && decoded.userId) {
                identifier = decoded.userId
              }
            }

            const allowed = await checkRateLimit(request, securitySettings.maxRequestsPerMinute, identifier)
            if (!allowed) {
              return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
              )
            }
          }
        } catch (error) {
          console.error('Rate limiting check failed:', error)
        }
      }
    }
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow public page routes
  if (publicPageRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Allow exact public routes (not subroutes)
  if (exactPublicRoutes.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // Check for authentication token
  const authHeader = request.headers.get("authorization")
  let token = authHeader?.split(" ")[1] || null
  
  if (!token) {
    token = request.cookies.get("auth_token")?.value || null
  }

  // If no token found and route is protected
  if (!token) {
    // For API routes, return JSON error
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    // For page routes, redirect to login
    if (pathname.startsWith("/student") || pathname.startsWith("/admin") || pathname.startsWith("/proctor")) {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
    // No token but route not protected
    return NextResponse.next()
  }

  // Verify token if present
  const decoded = verifyToken(token)
  
  if (!decoded) {
    // Invalid token
    // For API routes, return JSON error
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      )
    }
    // For page routes, redirect to login
    if (pathname.startsWith("/student") || pathname.startsWith("/admin") || pathname.startsWith("/proctor")) {
      const loginUrl = new URL("/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
    // Invalid token but route not protected
    return NextResponse.next()
  }

  // Valid token - check role-based access for specific routes
  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(decoded.role)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        )
      }
    }
  }

  // Add user info to request headers for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-user-id", decoded.userId)
  requestHeaders.set("x-user-email", decoded.email)
  requestHeaders.set("x-user-role", decoded.role)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Configure which routes use this middleware
export const config = {
  runtime: 'nodejs', // Force Node.js runtime (required for jsonwebtoken)
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
