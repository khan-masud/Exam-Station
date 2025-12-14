import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/utils/auth-middleware'
import { hashPassword, verifyPassword } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// Get profile data
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const connection = await pool.getConnection()

    try {
      const [userRows] = await connection.execute<RowDataPacket[]>(
        `SELECT id, full_name, email, phone, role, profile_picture,
                email_verified, phone_verified, created_at, last_login_at
         FROM users WHERE id = ?`,
        [user.id]
      )

      if (userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const userData = userRows[0]

      return NextResponse.json({
        id: userData.id,
        fullName: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        profilePicture: userData.profile_picture,
        emailVerified: userData.email_verified === 1,
        phoneVerified: userData.phone_verified === 1,
        createdAt: userData.created_at,
        lastLogin: userData.last_login_at
      })
    } catch (error) {
      console.error('Get profile error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    } finally {
      connection.release()
    }
  })
}

// Update profile data
export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json()
    const { fullName, email, phone, profilePicture } = body

    const connection = await pool.getConnection()

    try {
      // Check if email is already taken by another user
      if (email) {
        const [existingUsers] = await connection.execute<RowDataPacket[]>(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, user.id]
        )

        if (existingUsers.length > 0) {
          return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
        }
      }

      // Update user profile
      const updateFields: string[] = []
      const updateValues: any[] = []

      if (fullName !== undefined) {
        updateFields.push('full_name = ?')
        updateValues.push(fullName)
      }
      if (email !== undefined) {
        updateFields.push('email = ?')
        updateValues.push(email)
        // Reset email verification if email changed
        updateFields.push('email_verified = 0')
      }
      if (phone !== undefined) {
        updateFields.push('phone = ?')
        updateValues.push(phone)
        // Reset phone verification if phone changed
        updateFields.push('phone_verified = 0')
      }
      if (profilePicture !== undefined) {
        updateFields.push('profile_picture = ?')
        updateValues.push(profilePicture)
      }

      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
      }

      updateValues.push(user.id)

      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      )

      // Get updated user data
      const [updatedUser] = await connection.execute<RowDataPacket[]>(
        `SELECT id, full_name, email, phone, role, profile_picture,
                email_verified, phone_verified
         FROM users WHERE id = ?`,
        [user.id]
      )

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser[0].id,
          fullName: updatedUser[0].full_name,
          email: updatedUser[0].email,
          phone: updatedUser[0].phone,
          role: updatedUser[0].role,
          profilePicture: updatedUser[0].profile_picture,
          emailVerified: updatedUser[0].email_verified === 1,
          phoneVerified: updatedUser[0].phone_verified === 1
        }
      })
    } catch (error) {
      console.error('Update profile error:', error)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    } finally {
      connection.release()
    }
  })
}

// Change password
export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Current password and new password are required' 
      }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: 'New password must be at least 6 characters long' 
      }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      // Get current password hash
      const [userRows] = await connection.execute<RowDataPacket[]>(
        'SELECT password_hash FROM users WHERE id = ?',
        [user.id]
      )

      if (userRows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Verify current password
      const isValidPassword = await verifyPassword(currentPassword, userRows[0].password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword)

      // Update password
      await connection.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [newPasswordHash, user.id]
      )

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully'
      })
    } catch (error) {
      console.error('Change password error:', error)
      return NextResponse.json(
        { error: 'Failed to change password' },
        { status: 500 }
      )
    } finally {
      connection.release()
    }
  })
}
