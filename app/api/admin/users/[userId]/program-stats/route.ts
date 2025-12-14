import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken, parseTokenFromHeader } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const authHeader = request.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get program stats for the user using actual database tables
    const programs: any = await query(`
      SELECT 
        p.id as programId,
        p.title as programName,
        pe.enrolled_at as enrolledDate,
        COALESCE(COUNT(DISTINCT CASE WHEN er.status = 'completed' THEN er.id END), 0) as completedExams,
        COALESCE(COUNT(DISTINCT e.id), 0) as totalExams,
        COALESCE(ROUND(AVG(CASE WHEN res.percentage IS NOT NULL THEN CAST(res.percentage AS DECIMAL(5,2)) ELSE 0 END)), 2) as averageScore,
        CASE 
          WHEN pe.status = 'active' THEN 'active'
          WHEN pe.status = 'completed' THEN 'completed'
          ELSE 'dropped'
        END as status
      FROM program_enrollments pe
      LEFT JOIN programs p ON pe.program_id = p.id
      LEFT JOIN exam_programs ep ON p.id = ep.program_id
      LEFT JOIN exams e ON ep.exam_id = e.id
      LEFT JOIN exam_registrations er ON e.id = er.exam_id AND er.student_id = ?
      LEFT JOIN exam_results res ON e.id = res.exam_id AND res.student_id = ?
      WHERE pe.user_id = ?
      GROUP BY p.id, pe.enrolled_at, pe.status
      ORDER BY pe.enrolled_at DESC
    `, [userId || null, userId || null, userId || null])

    return NextResponse.json({
      programs: programs || []
    })
  } catch (error) {
    console.error("Fetch program stats error:", error)
    return NextResponse.json({ error: "Failed to fetch program stats" }, { status: 500 })
  }
}
