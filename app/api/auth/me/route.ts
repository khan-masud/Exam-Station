import { verifyToken, parseTokenFromHeader } from "@/lib/auth"
import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    // Try multiple ways to get the token
    let token = null
    
    // Method 1: From cookies() function
    try {
      const cookieStore = await cookies()
      token = cookieStore.get('auth_token')?.value
    } catch (cookieError) {
      // Silently fail - try next method
    }
    
    // Method 2: From request cookies (fallback)
    if (!token) {
      token = req.cookies.get("auth_token")?.value
    }
    
    // Method 3: From Authorization header (fallback)
    if (!token) {
      const authHeader = req.headers.get("authorization")
      token = parseTokenFromHeader(authHeader)
    }

    if (!token) {
      return NextResponse.json({ error: "No authentication token provided" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get user from MySQL database with organization info
    const users: any = await query(`
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role, 
        u.status,
        u.profile_picture,
        om.organization_id,
        o.name as organization_name
      FROM users u
      LEFT JOIN organization_members om ON u.id = om.user_id
      LEFT JOIN organizations o ON om.organization_id = o.id
      WHERE u.id = ? 
      LIMIT 1
    `, [decoded.userId])
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          status: user.status,
          profile_picture: user.profile_picture,
          organization_id: user.organization_id,
          organization_name: user.organization_name,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}
