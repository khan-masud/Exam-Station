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

    const userId = decoded.userId

    // Get global leaderboard (all students across all exams)
    const leaderboard = await query(`
      SELECT 
        u.id as userId,
        u.full_name as userName,
        COUNT(DISTINCT er.exam_id) as totalExams,
        ROUND(AVG(er.percentage), 2) as avgScore,
        ROUND(SUM(er.percentage), 2) as totalScore,
        IF(u.id = ?, 1, 0) as isCurrentUser
      FROM users u
      LEFT JOIN exam_results er ON er.student_id = u.id
      WHERE u.role = 'student'
      GROUP BY u.id, u.full_name
      HAVING totalExams > 0
      ORDER BY totalScore DESC, avgScore DESC
      LIMIT 100
    `, [userId]) as any[]

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isCurrentUser: entry.isCurrentUser === 1
    }))

    return NextResponse.json(rankedLeaderboard)
  } catch (error: any) {
    console.error('Global Leaderboard API Error:', error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
