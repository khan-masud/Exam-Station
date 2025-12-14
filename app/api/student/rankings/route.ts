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
      return NextResponse.json({ error: "Only students can view rankings" }, { status: 403 })
    }

  const currentUserId = decoded.userId
  const url = new URL(request.url)
  const programId = url.searchParams.get('programId')

    // Weekly Rankings (last 7 days)
    const weeklyRankings = await query(`
      SELECT 
        u.id as userId,
        u.full_name as fullName,
        u.email,
        COUNT(DISTINCT er.id) as examsTaken,
        ROUND(AVG(er.percentage), 2) as averagePercentage,
        ROUND(SUM(er.percentage), 2) as score
      FROM users u
      LEFT JOIN exam_results er ON u.id = er.student_id
      ${programId ? 'LEFT JOIN exams e ON er.exam_id = e.id' : ''}
      ${programId ? 'JOIN program_enrollments pe ON pe.user_id = u.id AND pe.program_id = ? AND pe.status = \'active\'' : ''}
      WHERE u.role = 'student'
        AND er.result_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ${programId ? "AND e.program_id = ?" : ''}
      GROUP BY u.id, u.full_name, u.email
      HAVING examsTaken > 0
      ORDER BY score DESC, averagePercentage DESC
      LIMIT 50
    `, programId ? [programId, programId] : []) as any[]

    // Monthly Rankings (last 30 days)
    const monthlyRankings = await query(`
      SELECT 
        u.id as userId,
        u.full_name as fullName,
        u.email,
        COUNT(DISTINCT er.id) as examsTaken,
        ROUND(AVG(er.percentage), 2) as averagePercentage,
        ROUND(SUM(er.percentage), 2) as score
      FROM users u
      LEFT JOIN exam_results er ON u.id = er.student_id
      ${programId ? 'LEFT JOIN exams e ON er.exam_id = e.id' : ''}
      ${programId ? 'JOIN program_enrollments pe ON pe.user_id = u.id AND pe.program_id = ? AND pe.status = \'active\'' : ''}
      WHERE u.role = 'student'
        AND er.result_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY u.id, u.full_name, u.email
      HAVING examsTaken > 0
      ORDER BY score DESC, averagePercentage DESC
      LIMIT 50
    `, programId ? [programId, programId] : []) as any[]

    // All-Time Rankings
    const allTimeRankings = await query(`
      SELECT 
        u.id as userId,
        u.full_name as fullName,
        u.email,
        COUNT(DISTINCT er.id) as examsTaken,
        ROUND(AVG(er.percentage), 2) as averagePercentage,
        ROUND(SUM(er.percentage), 2) as score
      FROM users u
      LEFT JOIN exam_results er ON u.id = er.student_id
      ${programId ? 'LEFT JOIN exams e ON er.exam_id = e.id' : ''}
      ${programId ? 'JOIN program_enrollments pe ON pe.user_id = u.id AND pe.program_id = ? AND pe.status = \'active\'' : ''}
      WHERE u.role = 'student'
      GROUP BY u.id, u.full_name, u.email
      HAVING examsTaken > 0
      ORDER BY score DESC, averagePercentage DESC
      LIMIT 100
    `, programId ? [programId, programId] : []) as any[]

    // Add rank and isCurrentUser flag
    const addRankings = (rankings: any[]) => {
      return rankings.map((ranking, index) => ({
        ...ranking,
        rank: index + 1,
        isCurrentUser: ranking.userId === currentUserId
      }))
    }

    return NextResponse.json({
      weekly: addRankings(weeklyRankings),
      monthly: addRankings(monthlyRankings),
      allTime: addRankings(allTimeRankings)
    })

  } catch (error: any) {
    console.error('Rankings API Error:', error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
