import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  // Get SMTP settings from environment or database
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '587')
  const smtpUser = process.env.SMTP_USER || ''
  const smtpPassword = process.env.SMTP_PASSWORD || ''
  const fromEmail = process.env.FROM_EMAIL || smtpUser

  if (!smtpUser || !smtpPassword) {
    return null
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  })

  return transporter
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter()
    
    if (!transport) {
      return false
    }

    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@examsystem.com'

    await transport.sendMail({
      from: `"Exam System" <${fromEmail}>`,
      to,
      subject,
      text: text || subject,
      html,
    })

    return true
  } catch (error: any) {
    // Handle SMTP auth errors gracefully
    return false
  }
}

// Email templates
export const emailTemplates = {
  examResult: (studentName: string, examTitle: string, score: number, percentage: number, status: string) => ({
    subject: `Exam Result: ${examTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .result-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .score { font-size: 48px; font-weight: bold; color: ${status === 'pass' ? '#10b981' : '#ef4444'}; text-align: center; margin: 20px 0; }
          .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; background: ${status === 'pass' ? '#d1fae5' : '#fee2e2'}; color: ${status === 'pass' ? '#065f46' : '#991b1b'}; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Exam Result Available</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            <p>Your result for <strong>${examTitle}</strong> is now available.</p>
            
            <div class="result-card">
              <h2 style="margin-top: 0;">Your Score</h2>
              <div class="score">${percentage.toFixed(1)}%</div>
              <p style="text-align: center; font-size: 18px;">
                ${score} marks
              </p>
              <p style="text-align: center;">
                <span class="status">${status === 'pass' ? '✓ PASSED' : '✗ FAILED'}</span>
              </p>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/student/results" class="button">View Detailed Results</a>
            </p>

            <p>Keep up the good work!</p>
            <p>Best regards,<br>Exam System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  examReminder: (studentName: string, examTitle: string, examDate: string, examTime: string) => ({
    subject: `Reminder: ${examTitle} - Starting Soon`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .exam-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Exam Reminder</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            <p>This is a reminder that your exam is scheduled to start soon.</p>
            
            <div class="exam-info">
              <h2 style="margin-top: 0;">${examTitle}</h2>
              <div class="info-row">
                <strong>Date:</strong>
                <span>${examDate}</span>
              </div>
              <div class="info-row">
                <strong>Time:</strong>
                <span>${examTime}</span>
              </div>
            </div>

            <p><strong>Important Reminders:</strong></p>
            <ul>
              <li>Ensure you have a stable internet connection</li>
              <li>Test your webcam and microphone if proctoring is enabled</li>
              <li>Have your ID ready for verification</li>
              <li>Join 10 minutes before the scheduled time</li>
            </ul>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/student/browse-exams" class="button">Go to Browse Exams</a>
            </p>

            <p>Good luck!</p>
            <p>Best regards,<br>Exam System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  newExamAvailable: (studentName: string, examTitle: string, subject: string, examDate: string) => ({
    subject: `New Exam Available: ${examTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .exam-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .badge { display: inline-block; padding: 4px 12px; background: #dbeafe; color: #1e40af; border-radius: 12px; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 New Exam Available</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            <p>A new exam has been published and is now available for enrollment.</p>
            
            <div class="exam-card">
              <h2 style="margin-top: 0;">${examTitle}</h2>
              <p><span class="badge">${subject}</span></p>
              <p><strong>Exam Date:</strong> ${examDate}</p>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/student/browse-exams" class="button">Browse Exams</a>
            </p>

            <p>Enroll now to secure your spot!</p>
            <p>Best regards,<br>Exam System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  emailVerification: (userName: string, verificationCode: string) => ({
    subject: 'Verify Your Email Address',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .code-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>Thank you for registering with Exam System. Please verify your email address using the code below:</p>
            
            <div class="code-box">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Verification Code</p>
              <div class="code">${verificationCode}</div>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">This code expires in 10 minutes</p>
            </div>

            <p>If you didn't request this verification, please ignore this email.</p>
            <p>Best regards,<br>Exam System Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  passwordReset: (userName: string, resetUrl: string, organizationName: string = 'Exam System') => ({
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
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          .link-box { background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We received a request to reset your password for your ${organizationName} account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <div class="link-box">${resetUrl}</div>
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
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
}
