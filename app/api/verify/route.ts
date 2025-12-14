import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'
import { sendEmail, emailTemplates } from '@/lib/email-service'

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send verification code
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { type, value } = await request.json() // type: 'email' or 'phone', value: email/phone

    if (!type || !value) {
      return NextResponse.json({ error: 'Type and value are required' }, { status: 400 })
    }

    if (type !== 'email' && type !== 'phone') {
      return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 })
    }

    // Get user info
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT full_name, email, phone FROM users WHERE id = ?',
      [decoded.userId]
    )

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userRows[0]

    // Generate OTP
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete existing codes for this user and type
    await pool.query(
      'DELETE FROM verification_codes WHERE user_id = ? AND type = ?',
      [decoded.userId, type]
    )

    // Insert new verification code
    await pool.query(
      `INSERT INTO verification_codes (user_id, ${type}, code, type, expires_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [decoded.userId, value, code, type, expiresAt]
    )

    // Send verification code
    if (type === 'email') {
      const emailTemplate = emailTemplates.emailVerification(user.full_name, code)
      await sendEmail({
        to: value,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      })
    } else {
      // For phone/SMS - would integrate with Twilio or similar
      // For now, just log the code
      // TODO: Integrate SMS service
    }

    return NextResponse.json({ 
      success: true,
      message: type === 'email' 
        ? 'Verification code sent to your email' 
        : 'Verification code sent to your phone',
      expiresIn: 600 // 10 minutes in seconds
    })
  } catch (error) {
    console.error('Send verification code error:', error)
    return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 })
  }
}

// Verify code
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { type, code } = await request.json()

    if (!type || !code) {
      return NextResponse.json({ error: 'Type and code are required' }, { status: 400 })
    }

    // Find verification code
    const [codeRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM verification_codes 
       WHERE user_id = ? AND type = ? AND code = ? AND verified = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [decoded.userId, type, code]
    )

    if (codeRows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 })
    }

    const verificationCode = codeRows[0]

    // Mark as verified
    await pool.query(
      'UPDATE verification_codes SET verified = TRUE WHERE id = ?',
      [verificationCode.id]
    )

    // Update user verification status
    if (type === 'email') {
      await pool.query(
        'UPDATE users SET email_verified = TRUE WHERE id = ?',
        [decoded.userId]
      )
    } else if (type === 'phone') {
      await pool.query(
        'UPDATE users SET phone_verified = TRUE WHERE id = ?',
        [decoded.userId]
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `${type === 'email' ? 'Email' : 'Phone'} verified successfully`
    })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 })
  }
}
