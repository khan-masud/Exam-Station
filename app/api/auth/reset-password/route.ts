import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { hashPassword } from "@/lib/auth"
import { validatePassword } from "@/lib/utils/validators"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Verify reset token
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Check if token exists and is valid
    const resets: any = await query(
      `SELECT id, user_id, email, expires_at, used 
       FROM password_resets 
       WHERE token = ? AND used = 0 AND expires_at > NOW()
       LIMIT 1`,
      [token]
    )

    if (!Array.isArray(resets) || resets.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      email: resets[0].email
    })

  } catch (error: any) {
    console.error('Verify reset token error:', error)
    return NextResponse.json(
      { error: "Failed to verify reset token" },
      { status: 500 }
    )
  }
}

// Reset password
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] || "Password does not meet requirements" },
        { status: 400 }
      )
    }

    // Check if token exists and is valid
    const resets: any = await query(
      `SELECT id, user_id, email, expires_at, used 
       FROM password_resets 
       WHERE token = ? AND used = 0 AND expires_at > NOW()
       LIMIT 1`,
      [token]
    )

    if (!Array.isArray(resets) || resets.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    const reset = resets[0]

    // Hash new password
    const passwordHash = await hashPassword(password)

    // Update user password
    await query(
      `UPDATE users SET password_hash = ?, failed_login_attempts = 0, last_failed_login = NULL 
       WHERE id = ?`,
      [passwordHash, reset.user_id]
    )

    // Mark token as used
    await query(
      `UPDATE password_resets SET used = 1, used_at = NOW() WHERE id = ?`,
      [reset.id]
    )

    // Invalidate all other sessions for this user (security measure)
    await query(
      `UPDATE user_sessions SET is_active = 0 WHERE user_id = ?`,
      [reset.user_id]
    ).catch(() => {
      // Ignore if table doesn't exist
    })

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    })

  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
