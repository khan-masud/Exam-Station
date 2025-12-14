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
      return NextResponse.json({ error: "Only students can view program stats" }, { status: 403 })
    }

    const userId = decoded.userId

    // Get total enrolled programs
    const [programCounts] = await query(`
      SELECT 
        COUNT(*) as totalPrograms,
        SUM(CASE WHEN pe.status = 'active' THEN 1 ELSE 0 END) as activePrograms
      FROM program_enrollments pe
      WHERE pe.user_id = ?
    `, [userId]) as any[]

    // Get completed exams across all programs
    const [examCounts] = await query(`
      SELECT 
        COUNT(DISTINCT er.exam_id) as completedExams,
        ROUND(AVG(er.percentage), 2) as avgProgramScore
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      JOIN program_enrollments pe ON pe.program_id = e.program_id AND pe.user_id = ?
      WHERE er.student_id = ?
    `, [userId, userId]) as any[]

    // Get count of programs where student scored 80%+
    const [topPrograms] = await query(`
      SELECT COUNT(DISTINCT e.program_id) as topPrograms
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      JOIN program_enrollments pe ON pe.program_id = e.program_id AND pe.user_id = ?
      WHERE er.student_id = ?
        AND er.percentage >= 80
    `, [userId, userId]) as any[]

    return NextResponse.json({
      totalPrograms: programCounts?.totalPrograms || 0,
      activePrograms: programCounts?.activePrograms || 0,
      completedExams: examCounts?.completedExams || 0,
      avgProgramScore: examCounts?.avgProgramScore || 0,
      topPrograms: topPrograms?.topPrograms || 0
    })
  } catch (error: any) {
    console.error('Program Stats API Error:', error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
