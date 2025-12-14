import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken, parseTokenFromHeader, hashPassword } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function GET(req: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const authHeader = req.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = req.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    let sql = `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.profile_picture,
        u.role,
        u.status,
        u.is_verified,
        u.created_at,
        u.is_blocked,
        u.blocked_until,
        u.last_login_at,
        u.last_login_ip,
        u.notification_preference,
        u.max_attempts,
        u.time_limit_hours,
        u.admin_notes
      FROM users u
      WHERE 1=1
    `
    
    const params: any[] = []
    
    if (role && role !== 'all') {
      sql += ` AND u.role = ?`
      params.push(role)
    }
    
    if (search) {
      sql += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM')
    const [countResult]: any = await query(countSql, params)
    const total = countResult?.total || 0
    
    sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const users: any = await query(sql, params)

    return NextResponse.json({ 
      users: users || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Fetch users error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const authHeader = request.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only admin can create users
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      email, 
      password, 
      full_name, 
      phone,
      profile_picture,
      role,
      is_verified,
      notification_preference,
      max_attempts,
      time_limit_hours,
      admin_notes 
    } = body

    // Validation
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers: any = await query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      [email]
    )

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    const userId = uuidv4()
    const hashedPassword = await hashPassword(password)

    // Create user
    const insertUserSql = `
      INSERT INTO users (
        id, 
        email, 
        password_hash, 
        full_name, 
        phone,
        profile_picture,
        role, 
        status,
        is_verified,
        notification_preference,
        max_attempts,
        time_limit_hours,
        admin_notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
    `
    await query(insertUserSql, [
      userId, 
      email, 
      hashedPassword, 
      full_name,
      phone || null,
      profile_picture || null,
      role,
      is_verified || false,
      notification_preference || 'all',
      max_attempts || null,
      time_limit_hours || null,
      admin_notes || null
    ])

    return NextResponse.json({ 
      message: "User created successfully", 
      userId 
    }, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const authHeader = request.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only admin can update users
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id, 
      email, 
      full_name, 
      phone,
      profile_picture,
      role, 
      status,
      is_verified,
      notification_preference,
      max_attempts,
      time_limit_hours,
      admin_notes,
      new_password
    } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    let sql = `UPDATE users SET `
    const params: any[] = []
    const updates: string[] = []

    if (email) {
      updates.push(`email = ?`)
      params.push(email)
    }
    if (full_name) {
      updates.push(`full_name = ?`)
      params.push(full_name)
    }
    if (phone !== undefined) {
      updates.push(`phone = ?`)
      params.push(phone || null)
    }
    if (profile_picture !== undefined) {
      updates.push(`profile_picture = ?`)
      params.push(profile_picture || null)
    }
    if (role) {
      updates.push(`role = ?`)
      params.push(role)
    }
    if (status) {
      updates.push(`status = ?`)
      params.push(status)
    }
    if (is_verified !== undefined) {
      updates.push(`is_verified = ?`)
      params.push(is_verified ? 1 : 0)
    }
    if (notification_preference) {
      updates.push(`notification_preference = ?`)
      params.push(notification_preference)
    }
    if (max_attempts !== undefined) {
      updates.push(`max_attempts = ?`)
      params.push(max_attempts)
    }
    if (time_limit_hours !== undefined) {
      updates.push(`time_limit_hours = ?`)
      params.push(time_limit_hours)
    }
    if (admin_notes !== undefined) {
      updates.push(`admin_notes = ?`)
      params.push(admin_notes || null)
    }
    if (new_password) {
      const hashedPassword = await hashPassword(new_password)
      updates.push(`password_hash = ?`)
      params.push(hashedPassword)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    sql += updates.join(', ') + ` WHERE id = ?`
    params.push(id)

    await query(sql, params)

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const authHeader = request.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only admin can delete users
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Don't allow deleting yourself
    if (userId === decoded.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Delete user (cascade will handle organization_members)
    await query(`DELETE FROM users WHERE id = ?`, [userId])

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
