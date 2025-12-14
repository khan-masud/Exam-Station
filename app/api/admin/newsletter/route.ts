import { NextRequest, NextResponse } from "next/server"
import db from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { RowDataPacket } from 'mysql2'

interface Subscriber extends RowDataPacket {
  id: string
  email: string
  subscribed_at: string
  status: string
  unsubscribed_at?: string
}

interface Stats extends RowDataPacket {
  total: number
  active: number
  unsubscribed: number
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await verifyToken(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [subscribers] = await db.query<Subscriber[]>(
      `SELECT id, email, subscribed_at, status, unsubscribed_at 
       FROM newsletter_subscribers 
       ORDER BY subscribed_at DESC`
    )

    const [stats] = await db.query<Stats[]>(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) as unsubscribed
       FROM newsletter_subscribers`
    )

    return NextResponse.json({
      subscribers,
      stats: stats[0] || { total: 0, active: 0, unsubscribed: 0 }
    })
  } catch (error: any) {
    console.error("Newsletter GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await verifyToken(token)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 })
    }

    await db.query('DELETE FROM newsletter_subscribers WHERE id = ?', [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Newsletter DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 }
    )
  }
}
