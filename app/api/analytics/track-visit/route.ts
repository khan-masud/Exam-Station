import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { parseTokenFromHeader } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

// Force Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    }

    const { pageUrl, referrer } = body

    if (!pageUrl) {
      return NextResponse.json(
        { error: "pageUrl is required" },
        { status: 400 }
      )
    }

    // Get user ID from token if available
    const authHeader = req.headers.get("authorization")
    let userId = null
    let token = parseTokenFromHeader(authHeader)

    if (!token) {
      token = req.cookies.get("auth_token")?.value || null
    }

    let userRole = null
    if (token) {
      try {
        const { verifyToken } = await import("@/lib/auth")
        const decoded = verifyToken(token)
        userId = decoded?.sub || null
        userRole = decoded?.role || null
      } catch (err) {
        // Token invalid or expired, continue without user ID
        console.debug("Token verification failed for page tracking")
      }
    }

    // Skip tracking for admin users
    if (userRole === "admin") {
      return NextResponse.json({ success: true, skipped: true, reason: "Admin traffic not tracked" })
    }

    // Get IP address and user agent - with better fallback
    let ip = req.headers.get("x-forwarded-for") ||
             req.headers.get("x-real-ip") ||
             req.headers.get("cf-connecting-ip") ||
             req.headers.get("client-ip") ||
             "127.0.0.1"
    
    // Handle multiple IPs (take first one)
    if (ip.includes(",")) {
      ip = ip.split(",")[0].trim()
    }
    
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Insert page visit record
    try {
      await query(
        `INSERT INTO page_visits (user_id, page_path, referrer, user_agent, ip_address, visited_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, pageUrl, referrer || null, userAgent, ip]
      )
      
      console.log(`[Page Visit] URL: ${pageUrl}, IP: ${ip}, UserID: ${userId || 'anonymous'}`)
    } catch (err: any) {
      // Table might not exist yet - this is handled gracefully in the API
      console.warn("Failed to record page visit:", err.message)
      // Still return success to not break the UI
      return NextResponse.json({ success: true, recorded: false, reason: "Database error" })
    }

    return NextResponse.json({ success: true, pageUrl, ip, userId })
  } catch (error: any) {
    console.error("Track visit error:", error)
    return NextResponse.json(
      { error: "Failed to track visit", details: error.message || "Unknown error" },
      { status: 500 }
    )
  }
}
