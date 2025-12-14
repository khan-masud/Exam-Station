import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

// Get user permissions and settings
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Get user details
    const users = await query(
      `SELECT id, full_name, email, phone, role, status, email_verified, phone_verified,
              profile_visibility, two_factor_enabled, created_at, last_login
       FROM users WHERE id = ?`,
      [userId]
    ) as any[]

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user permissions
    const permissions = await query(
      `SELECT * FROM user_permissions WHERE user_id = ?`,
      [userId]
    ) as any[]

    // Get user preferences
    const preferences = await query(
      `SELECT * FROM user_preferences WHERE user_id = ?`,
      [userId]
    ) as any[]

    return NextResponse.json({
      success: true,
      user: users[0],
      permissions: permissions[0] || {},
      preferences: preferences[0] || {}
    })

  } catch (error: any) {
    console.error('Get user settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    )
  }
}

// Update user permissions and settings
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, userSettings, permissions, preferences } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Update user basic settings
    if (userSettings) {
      const updates = []
      const values = []

      if (userSettings.status !== undefined) {
        updates.push('status = ?')
        values.push(userSettings.status)
      }
      if (userSettings.role !== undefined) {
        updates.push('role = ?')
        values.push(userSettings.role)
      }
      if (userSettings.email_verified !== undefined) {
        updates.push('email_verified = ?')
        values.push(userSettings.email_verified)
      }
      if (userSettings.phone_verified !== undefined) {
        updates.push('phone_verified = ?')
        values.push(userSettings.phone_verified)
      }

      if (updates.length > 0) {
        values.push(userId)
        await query(
          `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
          values
        )
      }
    }

    // Update permissions
    if (permissions) {
      const permissionColumns = Object.keys(permissions).map(key => `${key} = ?`).join(', ')
      const permissionValues = [...Object.values(permissions), userId]

      await query(
        `INSERT INTO user_permissions (user_id, ${Object.keys(permissions).join(', ')}, created_at, updated_at)
         VALUES (?, ${Object.keys(permissions).map(() => '?').join(', ')}, NOW(), NOW())
         ON DUPLICATE KEY UPDATE ${permissionColumns}, updated_at = NOW()`,
        [userId, ...Object.values(permissions), ...Object.values(permissions)]
      )
    }

    // Update preferences
    if (preferences) {
      const prefColumns = Object.keys(preferences).map(key => `${key} = ?`).join(', ')
      const prefValues = [...Object.values(preferences), userId]

      await query(
        `INSERT INTO user_preferences (user_id, ${Object.keys(preferences).join(', ')}, created_at, updated_at)
         VALUES (?, ${Object.keys(preferences).map(() => '?').join(', ')}, NOW(), NOW())
         ON DUPLICATE KEY UPDATE ${prefColumns}, updated_at = NOW()`,
        [userId, ...Object.values(preferences), ...Object.values(preferences)]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User settings updated successfully'
    })

  } catch (error: any) {
    console.error('Update user settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    )
  }
}
