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
      return NextResponse.json({ error: "Only students can view performance" }, { status: 403 })
    }

    const userId = decoded.userId

    // Get performance for each enrolled program
    const performance = await query(`
      SELECT 
        p.id as programId,
        p.title as programTitle,
        COALESCE(SUM(er.obtained_marks), 0) as totalScore,
        COALESCE(ROUND(AVG(er.percentage), 2), 0) as avgScore,
        COUNT(DISTINCT er.exam_id) as examsCompleted,
        (
          SELECT COUNT(DISTINCT ep_sub.exam_id) 
          FROM exam_programs ep_sub 
          JOIN exams e_sub ON ep_sub.exam_id = e_sub.id 
          WHERE ep_sub.program_id = p.id AND e_sub.status = 'published'
        ) as totalExams,
        (SELECT COUNT(DISTINCT user_id) FROM program_enrollments WHERE program_id = p.id AND status = 'active') as totalParticipants
      FROM program_enrollments pe
      JOIN programs p ON pe.program_id = p.id
      LEFT JOIN exam_programs ep ON ep.program_id = p.id
      LEFT JOIN exams e ON e.id = ep.exam_id
      LEFT JOIN exam_results er ON er.exam_id = e.id AND er.student_id = ?
      WHERE pe.user_id = ? AND pe.status = 'active'
      GROUP BY p.id, p.title
    `, [userId, userId]) as any[]

    // Calculate rank and percentile for each program
    const performanceWithRank = await Promise.all(
      performance.map(async (perf) => {
        // Get all users' scores for this program to calculate rank
        const allScores = await query(`
          SELECT 
            u.id as userId,
            COALESCE(SUM(er.obtained_marks), 0) as totalScore
          FROM users u
          JOIN program_enrollments pe ON pe.user_id = u.id AND pe.program_id = ?
          LEFT JOIN exam_results er ON er.student_id = u.id
          LEFT JOIN exam_programs ep ON er.exam_id = ep.exam_id AND ep.program_id = ?
          WHERE pe.status = 'active'
          AND (er.id IS NULL OR ep.id IS NOT NULL)
          GROUP BY u.id
          ORDER BY totalScore DESC
        `, [perf.programId, perf.programId]) as any[]

        const userRank = allScores.findIndex(s => s.userId === userId) + 1
        const percentile = Math.round((1 - (userRank - 1) / allScores.length) * 100)

        // Calculate trend (compare last 3 exams vs previous 3)
        const recentExams = await query(`
          SELECT percentage
          FROM exam_results er
          JOIN exam_programs ep ON er.exam_id = ep.exam_id
          WHERE er.student_id = ? AND ep.program_id = ?
          ORDER BY er.result_date DESC
          LIMIT 6
        `, [userId, perf.programId]) as any[]

        let trend: 'up' | 'down' | 'stable' = 'stable'
        if (recentExams.length >= 6) {
          const recent3Avg = recentExams.slice(0, 3).reduce((sum, e) => sum + e.percentage, 0) / 3
          const previous3Avg = recentExams.slice(3, 6).reduce((sum, e) => sum + e.percentage, 0) / 3
          if (recent3Avg > previous3Avg + 5) trend = 'up'
          else if (recent3Avg < previous3Avg - 5) trend = 'down'
        }

        return {
          ...perf,
          rank: userRank,
          totalParticipants: allScores.length,
          percentile,
          trend
        }
      })
    )

    return NextResponse.json(performanceWithRank)
  } catch (error: any) {
    console.error('My Program Performance API Error:', error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
