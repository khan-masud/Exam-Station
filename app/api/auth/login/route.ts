import { verifyPassword, generateToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { validateEmail } from "@/lib/utils/validators"
import { type NextRequest, NextResponse } from "next/server"
import { isEmailVerificationRequired, isAdminApprovalRequired, getLoginLimits } from "@/lib/settings"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Get login limits from settings
    const loginLimits = await getLoginLimits()

    // Get user from the real database
    const users: any = await query(`
      SELECT id, email, password_hash, full_name, role, status, is_blocked, blocked_until, email_verified, 
             failed_login_attempts, last_failed_login
      FROM users 
      WHERE email = ? 
      LIMIT 1
    `, [email])
    const user = Array.isArray(users) && users.length > 0 ? users[0] : null
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Get user's organization if they are an admin
    let organizationId = null
    if (user.role === 'admin') {
      const orgMembers: any = await query(`
        SELECT organization_id FROM organization_members WHERE user_id = ? LIMIT 1
      `, [user.id])
      organizationId = orgMembers && orgMembers.length > 0 ? orgMembers[0].organization_id : null
    }

    // ✅ CHECK: Login attempt limits
    if (user.failed_login_attempts >= loginLimits.maxLoginAttempts && user.last_failed_login) {
      const lockoutEnd = new Date(user.last_failed_login)
      lockoutEnd.setMinutes(lockoutEnd.getMinutes() + loginLimits.lockoutDuration)
      const now = new Date()

      if (now < lockoutEnd) {
        const minutesRemaining = Math.ceil((lockoutEnd.getTime() - now.getTime()) / (1000 * 60))
        return NextResponse.json({ 
          error: `Account locked due to too many failed login attempts. Try again in ${minutesRemaining} minute(s).` 
        }, { status: 403 })
      } else {
        // Lockout expired, reset failed attempts
        await query(`
          UPDATE users 
          SET failed_login_attempts = 0, last_failed_login = NULL 
          WHERE id = ?
        `, [user.id])
      }
    }

    // ✅ CHECK: Email verification required?
    const requiresEmailVerification = await isEmailVerificationRequired()
    if (requiresEmailVerification && !user.email_verified) {
      return NextResponse.json({ 
        error: "Please verify your email address before logging in. Check your inbox for the verification link." 
      }, { status: 403 })
    }

    // ✅ CHECK: Admin approval required?
    const requiresAdminApproval = await isAdminApprovalRequired()
    if (requiresAdminApproval && user.status === 'pending') {
      return NextResponse.json({ 
        error: "Your account is pending admin approval. Please wait for an administrator to activate your account." 
      }, { status: 403 })
    }

    // Check if user is blocked
    if (user.is_blocked) {
      // Check if temporary block has expired
      if (user.blocked_until) {
        const now = new Date()
        const blockedUntil = new Date(user.blocked_until)
        
        if (now < blockedUntil) {
          return NextResponse.json({ 
            error: `Account is blocked until ${blockedUntil.toLocaleString()}` 
          }, { status: 403 })
        } else {
          // Block expired, unblock user
          await query(`
            UPDATE users 
            SET is_blocked = FALSE, blocked_until = NULL 
            WHERE id = ?
          `, [user.id])
          
          await query(`
            UPDATE user_blocks 
            SET is_active = FALSE 
            WHERE user_id = ? AND is_active = TRUE
          `, [user.id])
        }
      } else {
        // Permanent block
        return NextResponse.json({ error: "Account is permanently blocked" }, { status: 403 })
      }
    }

    // Check status
    if (user.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 })
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.password_hash)
    if (!passwordMatch) {
      // ✅ Increment failed login attempts
      await query(`
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1, 
            last_failed_login = NOW() 
        WHERE id = ?
      `, [user.id])

      const newAttempts = (user.failed_login_attempts || 0) + 1
      const remainingAttempts = loginLimits.maxLoginAttempts - newAttempts

      if (remainingAttempts > 0) {
        return NextResponse.json({ 
          error: `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lockout.` 
        }, { status: 401 })
      } else {
        return NextResponse.json({ 
          error: `Invalid credentials. Account locked for ${loginLimits.lockoutDuration} minutes due to too many failed attempts.` 
        }, { status: 401 })
      }
    }

    // ✅ Successful login - reset failed attempts
    await query(`
      UPDATE users 
      SET failed_login_attempts = 0, last_failed_login = NULL 
      WHERE id = ?
    `, [user.id])

    // Generate token
    const token = generateToken(user.id, user.email, user.role, organizationId)

    // Get IP address and user agent
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = req.headers.get('user-agent') || ''

    // Update last login info in users table
    await query(`
      UPDATE users 
      SET last_login_at = NOW(), last_login_ip = ?
      WHERE id = ?
    `, [ip, user.id])

    // Create session record
    try {
      const sessionId = uuidv4()
      // Delete any existing sessions with the same token (shouldn't happen but just in case)
      await query(`
        DELETE FROM user_sessions WHERE session_token = ?
      `, [token])
      
      // Insert new session
      await query(`
        INSERT INTO user_sessions (id, user_id, ip_address, user_agent, session_token, expires_at)
        VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))
      `, [sessionId, user.id, ip, userAgent, token])
    } catch (sessionError) {
      console.error('[v0] Database query error:', sessionError)
      // If table doesn't exist yet, just continue (migration not run)
    }

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          organizationId: organizationId || undefined,
        },
        token,
      },
      { status: 200 },
    )

    // Set httpOnly cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from "strict" to "lax" for better compatibility
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json(
      { error: "Login failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
