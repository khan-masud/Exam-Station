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
      return NextResponse.json({ error: "Only students can view program comparison" }, { status: 403 })
    }

    const userId = decoded.userId

    // Get performance data for each enrolled program
    const programPerformance = await query(`
      SELECT 
        p.id as programId,
        p.title as programTitle,
        COUNT(DISTINCT er.exam_id) as examsCompleted,
        ROUND(AVG(er.percentage), 2) as avgScore,
        MAX(er.percentage) as bestScore,
        MIN(er.percentage) as worstScore,
        SUM(CASE WHEN er.percentage >= 60 THEN 1 ELSE 0 END) as passedExams,
        COUNT(DISTINCT er.exam_id) as totalAttempts
      FROM program_enrollments pe
      JOIN programs p ON pe.program_id = p.id
      LEFT JOIN exams e ON e.program_id = p.id
      LEFT JOIN exam_results er ON er.exam_id = e.id AND er.student_id = ?
      WHERE pe.user_id = ? AND pe.status = 'active'
      GROUP BY p.id, p.title
      HAVING examsCompleted > 0
      ORDER BY avgScore DESC
    `, [userId, userId]) as any[]

    return NextResponse.json(programPerformance)
  } catch (error: any) {
    console.error('Program Comparison API Error:', error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
