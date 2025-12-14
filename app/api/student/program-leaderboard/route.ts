import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "student") {
      return NextResponse.json({ error: "Only students can view leaderboard" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json({ error: "Program ID is required" }, { status: 400 })
    }

    const userId = decoded.userId

    // Get leaderboard with all participants
    const leaderboard = await query(`
      SELECT 
        u.id as userId,
        u.full_name as userName,
        COALESCE(SUM(er.percentage), 0) as totalScore,
        COALESCE(ROUND(AVG(er.percentage), 2), 0) as avgScore,
        COUNT(DISTINCT er.exam_id) as examsCompleted,
        IF(u.id = ?, 1, 0) as isCurrentUser
      FROM users u
      JOIN program_enrollments pe ON pe.user_id = u.id AND pe.program_id = ?
      LEFT JOIN exam_results er ON er.student_id = u.id
      LEFT JOIN exams e ON er.exam_id = e.id AND e.program_id = ?
      WHERE pe.status = 'active'
      GROUP BY u.id, u.full_name
      ORDER BY totalScore DESC, avgScore DESC
      LIMIT 100
    `, [userId, programId, programId]) as any[]

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isCurrentUser: entry.isCurrentUser === 1
    }))

    return NextResponse.json(rankedLeaderboard)
  } catch (error: any) {
    console.error('Leaderboard API Error:', error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
