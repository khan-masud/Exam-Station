import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { validateEmail } from "@/lib/utils/validators"
import { v4 as uuidv4 } from "uuid"
import crypto from "crypto"
import { sendEmail } from "@/lib/email-service"
import { getGeneralSettings } from "@/lib/settings"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if user exists
    const users: any = await query(
      `SELECT id, email, full_name FROM users WHERE email = ? LIMIT 1`,
      [email]
    )

    // Always return success message to prevent email enumeration attacks
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link shortly."
      })
    }

    const user = users[0]

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetId = uuidv4()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Delete any existing unused reset tokens for this user
    await query(
      `DELETE FROM password_resets WHERE user_id = ? AND used = 0`,
      [user.id]
    )

    // Store reset token in database
    await query(
      `INSERT INTO password_resets (id, user_id, email, token, expires_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [resetId, user.id, email, resetToken, expiresAt]
    )

    // Get organization settings for email
    const { organizationName } = await getGeneralSettings()
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.error('[Forgot Password] SMTP not configured - cannot send email')
      
      // In development, log the reset URL
      if (process.env.NODE_ENV === 'development') {
        console.log('\n==============================================')
        console.log('🔐 PASSWORD RESET LINK (Development Only):')
        console.log(resetUrl)
        console.log('==============================================\n')
      }
      
      return NextResponse.json({
        error: "Email service is not configured. Please contact the administrator to set up SMTP credentials.",
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      }, { status: 500 })
    }

    // Send password reset email
    const emailSent = await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${user.full_name || 'there'},</p>
              <p>We received a request to reset your password for your ${organizationName} account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px; font-size: 12px;">
                ${resetUrl}
              </p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0;">
                  <li>This link will expire in <strong>1 hour</strong></li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
              <p>If you have any questions or concerns, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${organizationName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (!emailSent) {
      console.error('[Forgot Password] Failed to send reset email')
      return NextResponse.json({
        error: "Failed to send reset email. Please contact support or try again later.",
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link shortly."
    })

  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    // Handle specific SMTP errors
    if (error.code === 'EAUTH') {
      return NextResponse.json({
        error: "Email authentication failed. Please contact the administrator to configure SMTP settings."
      }, { status: 500 })
    }
    
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    )
  }
}
