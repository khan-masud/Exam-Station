import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Get all blocked users
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const allBlocks = searchParams.get('all') === 'true'

    // If userId is provided, get all blocks for that user (including inactive)
    if (userId) {
      const userBlocks = await query(`
        SELECT 
          ub.*,
          u.full_name as user_name,
          u.email as user_email,
          u.role as user_role,
          admin.full_name as blocked_by_name,
          unblock_admin.full_name as unblocked_by_name
        FROM user_blocks ub
        JOIN users u ON ub.user_id = u.id
        LEFT JOIN users admin ON ub.blocked_by = admin.id
        LEFT JOIN users unblock_admin ON ub.unblocked_by = unblock_admin.id
        WHERE ub.user_id = ?
        ORDER BY ub.blocked_at DESC
      `, [userId]) as any[]

      return NextResponse.json({ blocks: userBlocks })
    }

    // Otherwise, get all active blocks
    const blocks = await query(`
      SELECT 
        ub.*,
        u.full_name as user_name,
        u.email as user_email,
        u.role as user_role,
        admin.full_name as blocked_by_name
      FROM user_blocks ub
      JOIN users u ON ub.user_id = u.id
      LEFT JOIN users admin ON ub.blocked_by = admin.id
      WHERE ub.is_active = TRUE
      ORDER BY ub.blocked_at DESC
    `) as any[]

    return NextResponse.json({ blocks })

  } catch (error: any) {
    console.error('Get Blocks Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Block a user
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId, reason, duration, isPermanent } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]) as any[]
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Don't allow blocking admins
    if (user.role === 'admin') {
      return NextResponse.json({ error: "Cannot block admin users" }, { status: 400 })
    }

    // Calculate expiration time
    let expiresAt = null
    let blockedUntil = null
    
    if (!isPermanent && duration) {
      const now = new Date()
      expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000) // duration in hours
      blockedUntil = expiresAt
    }

    // Create block record
    const blockId = uuidv4()
    await query(`
      INSERT INTO user_blocks (
        id, user_id, blocked_by, reason, expires_at, is_permanent
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [blockId, userId, decoded.userId, reason, expiresAt, isPermanent || false])

    // Update user status
    await query(`
      UPDATE users 
      SET is_blocked = TRUE, blocked_until = ?
      WHERE id = ?
    `, [blockedUntil, userId])

    return NextResponse.json({ 
      success: true, 
      message: "User blocked successfully",
      blockId 
    })

  } catch (error: any) {
    console.error('Block User Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const blockId = searchParams.get('blockId')

    if (!userId && !blockId) {
      return NextResponse.json({ error: "User ID or Block ID is required" }, { status: 400 })
    }

    // Deactivate all active blocks for the user
    if (userId) {
      await query(`
        UPDATE user_blocks 
        SET is_active = FALSE, unblocked_at = NOW(), unblocked_by = ?
        WHERE user_id = ? AND is_active = TRUE
      `, [decoded.userId, userId])

      // Update user status
      await query(`
        UPDATE users 
        SET is_blocked = FALSE, blocked_until = NULL
        WHERE id = ?
      `, [userId])
    } else if (blockId) {
      // Deactivate specific block
      const [block] = await query(
        'SELECT user_id FROM user_blocks WHERE id = ?',
        [blockId]
      ) as any[]

      if (block) {
        await query(`
          UPDATE user_blocks 
          SET is_active = FALSE, unblocked_at = NOW(), unblocked_by = ?
          WHERE id = ?
        `, [decoded.userId, blockId])

        await query(`
          UPDATE users 
          SET is_blocked = FALSE, blocked_until = NULL
          WHERE id = ?
        `, [block.user_id])
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "User unblocked successfully" 
    })

  } catch (error: any) {
    console.error('Unblock User Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
