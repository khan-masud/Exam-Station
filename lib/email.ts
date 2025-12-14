import nodemailer from 'nodemailer'
import { getGeneralSettings } from '@/lib/settings'

interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  attachments?: any[]
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    })

    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    throw new Error('Failed to send email: ' + error.message)
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  // ✅ Use organization name from settings
  const { organizationName } = await getGeneralSettings()
  
  return sendEmail({
    to: email,
    subject: `Welcome to ${organizationName}`,
    html: `<div><h1>Welcome ${name}!</h1><p>Thank you for registering with ${organizationName}.</p><p>You can now login and start taking exams.</p></div>`
  })
}

export async function sendExamResultEmail(email: string, name: string, examTitle: string, score: number, percentage: number, passed: boolean) {
  // ✅ Use organization name from settings
  const { organizationName } = await getGeneralSettings()
  
  return sendEmail({
    to: email,
    subject: `Exam Result - ${examTitle}`,
    html: `<div>
      <h1>Exam Result</h1>
      <p>Dear ${name},</p>
      <p>Your results for <strong>${examTitle}</strong> are ready:</p>
      <ul>
        <li>Score: ${score}</li>
        <li>Percentage: ${percentage.toFixed(2)}%</li>
        <li>Status: ${passed ? '<span style="color: green;">PASSED</span>' : '<span style="color: red;">FAILED</span>'}</li>
      </ul>
      <p>Login to view detailed results.</p>
      <br/>
      <p>Best regards,<br/>${organizationName}</p>
    </div>`
  })
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // ✅ Use organization name from settings
  const { organizationName } = await getGeneralSettings()
  const resetUrl = process.env.NEXT_PUBLIC_APP_URL + '/reset-password?token=' + resetToken
  
  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: `<div>
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email.</p>
      <br/>
      <p>Best regards,<br/>${organizationName}</p>
    </div>`
  })
}
