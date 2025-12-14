import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Log anti-cheat events
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attemptId, eventType, severity, description } = await request.json()

    // Verify attempt belongs to user
    const attemptRows = await query(
      `SELECT * FROM exam_attempts WHERE id = ? AND student_id = ?`,
      [attemptId, decoded.userId]
    ) as any[]

    const attempt = attemptRows && attemptRows[0] ? attemptRows[0] : null

    if (!attempt) {
      return NextResponse.json({ error: "Invalid attempt" }, { status: 404 })
    }

    // Log the anti-cheat event
    const eventId = uuidv4()
    await query(
      `INSERT INTO anti_cheat_events 
       (id, attempt_id, event_type, severity, description, timestamp) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [eventId, attemptId, eventType, severity, description]
    )

    // Get total critical events count
    const criticalCountRows = await query(
      `SELECT COUNT(*) as count 
       FROM anti_cheat_events 
       WHERE attempt_id = ? AND severity IN ('high', 'critical')`,
      [attemptId]
    ) as any[]

    const criticalCount = criticalCountRows && criticalCountRows[0] ? criticalCountRows[0] : { count: 0 }

    // Auto-submit if too many critical violations (e.g., 5 or more)
    if (criticalCount.count >= 5) {
      await query(
        `UPDATE exam_attempts 
         SET status = 'auto_submitted', 
             end_time = NOW() 
         WHERE id = ?`,
        [attemptId]
      )

      return NextResponse.json({
        success: true,
        warning: "Too many violations detected. Exam auto-submitted.",
        autoSubmitted: true
      })
    }

    return NextResponse.json({ success: true, eventId })

  } catch (error: any) {
    console.error("Log anti-cheat event error:", error)
    return NextResponse.json(
      { error: "Failed to log event" },
      { status: 500 }
    )
  }
}

// Get anti-cheat events for an attempt (for proctor dashboard)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || (decoded.role !== "admin" && decoded.role !== "proctor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get("attemptId")

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId required" }, { status: 400 })
    }

    const events = await query(
      `SELECT * FROM anti_cheat_events 
       WHERE attempt_id = ? 
       ORDER BY timestamp DESC`,
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
