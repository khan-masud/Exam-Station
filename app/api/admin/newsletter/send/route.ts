import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { sendEmail } from "@/lib/email-service"
import { RowDataPacket } from 'mysql2'

interface Subscriber extends RowDataPacket {
  email: string
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await verifyToken(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { subject, message, sendTo } = await req.json()

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      )
    }

    // Get subscribers
    let subscribers: Subscriber[] = []
    if (sendTo === 'all') {
      const [rows] = await db.query<Subscriber[]>(
        'SELECT email FROM newsletter_subscribers WHERE status = "active"'
      )
      subscribers = rows
    } else if (sendTo === 'test' && user.email) {
      subscribers = [{ email: user.email } as Subscriber]
    } else {
      return NextResponse.json({ error: "Invalid sendTo option" }, { status: 400 })
    }

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No subscribers found" },
        { status: 400 }
      )
    }

    // Send emails
    let successCount = 0
    let failCount = 0

    for (const subscriber of subscribers) {
      try {
        await sendEmail({
          to: subscriber.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">${subject}</h1>
              </div>
              <div style="padding: 30px; background: #f9fafb;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  ${message}
                </div>
                <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
                  <p>You received this email because you subscribed to our newsletter.</p>
                  <p style="margin-top: 10px;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" style="color: #667eea; text-decoration: none;">Visit our website</a>
                  </p>
                </div>
              </div>
            </div>
          `,
        })
        successCount++
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error)
        failCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent successfully`,
      stats: {
        total: subscribers.length,
        success: successCount,
        failed: failCount
      }
    })
  } catch (error: any) {
    console.error("Newsletter send error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send newsletter" },
      { status: 500 }
    )
  }
}
