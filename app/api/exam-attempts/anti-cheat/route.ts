import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Record anti-cheat event
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { attemptId, eventType, description, severity, metadata } = await request.json()

    // Verify attempt access
    const attemptRows = await query(
      `SELECT * FROM exam_attempts WHERE id = ?`,
      [attemptId]
    ) as any[]

    const attempt = attemptRows && attemptRows[0] ? attemptRows[0] : null

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    // Students can only log for their own attempts
    if (decoded.role === 'student' && attempt.student_id !== decoded.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Insert event
    const eventId = uuidv4()
    await query(
      `INSERT INTO anti_cheat_events 
       (id, attempt_id, event_type, severity, description, screenshot_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        attemptId,
        eventType,
        severity || 'medium',
        description || null,
        metadata?.screenshot_url || null
      ]
    )

    return NextResponse.json({
      success: true,
      eventId,
      message: "Event recorded"
    })

  } catch (error: any) {
    console.error("Anti-cheat event error:", error)
    return NextResponse.json(
      { error: "Failed to record event" },
      { status: 500 }
    )
  }
}

// Get anti-cheat events for an attempt (for proctors/admins)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'proctor')) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get("attemptId")

    if (!attemptId) {
      return NextResponse.json({ error: "Attempt ID required" }, { status: 400 })
    }

    const events = await query(
      `SELECT * FROM anti_cheat_events 
       WHERE attempt_id = ? 
       ORDER BY created_at DESC`,
      [attemptId]
    ) as any[]

    return NextResponse.json({ events })

  } catch (error: any) {
    console.error("Get anti-cheat events error:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}
