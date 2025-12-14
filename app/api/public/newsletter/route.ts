import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { RowDataPacket } from 'mysql2'

interface ExistingSubscriber extends RowDataPacket {
  id: string
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const [existing] = await db.query<ExistingSubscriber[]>(
      'SELECT id FROM newsletter_subscribers WHERE email = ?',
      [email]
    )

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email already subscribed" },
        { status: 400 }
      )
    }

    // Insert new subscriber
    await db.query(
      `INSERT INTO newsletter_subscribers (email, subscribed_at, status) 
       VALUES (?, NOW(), 'active')`,
      [email]
    )

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to newsletter"
    })
  } catch (error: any) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    )
  }
}
