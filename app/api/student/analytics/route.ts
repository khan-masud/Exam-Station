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
      return NextResponse.json({ error: "Only students can view analytics" }, { status: 403 })
    }

  const userId = decoded.userId
  const url = new URL(request.url)
  const programId = url.searchParams.get('programId')

    // Performance Trend (Last 10 exams)
    const performanceTrend = await query(`
      SELECT 
        DATE_FORMAT(er.result_date, '%m/%d') as date,
        er.percentage as score,
        70 as average
      FROM exam_results er
      ${programId ? 'JOIN exams e ON er.exam_id = e.id' : ''}
      WHERE er.student_id = ?
      ${programId ? 'AND e.program_id = ?' : ''}
      ORDER BY er.result_date DESC
      LIMIT 10
    `, programId ? [userId, programId] : [userId]) as any[]

    // Subject Strengths
    const subjectStrengths = await query(`
      SELECT 
        s.name as subject,
        ROUND(AVG(er.percentage), 2) as score,
        ROUND((SUM(CASE WHEN er.percentage >= 60 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as accuracy
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      JOIN subjects s ON e.subject_id = s.id
      WHERE er.student_id = ?
      ${programId ? 'AND e.program_id = ?' : ''}
      GROUP BY s.id, s.name
      ORDER BY score DESC
    `, programId ? [userId, programId] : [userId]) as any[]

    // Time Analysis (by hour of day)
    const timeAnalysis = await query(`
      SELECT 
        CASE 
          WHEN HOUR(er.result_date) BETWEEN 6 AND 11 THEN 'Morning'
          WHEN HOUR(er.result_date) BETWEEN 12 AND 17 THEN 'Afternoon'
          WHEN HOUR(er.result_date) BETWEEN 18 AND 22 THEN 'Evening'
          ELSE 'Night'
        END as name,
        COUNT(*) as value
      FROM exam_results er
      ${programId ? 'JOIN exams e ON er.exam_id = e.id' : ''}
      WHERE er.student_id = ?
      ${programId ? 'AND e.program_id = ?' : ''}
      GROUP BY name
    `, programId ? [userId, programId] : [userId]) as any[]

    // Accuracy by Question Type (mock data for now)
    const accuracyByType = [
      { type: 'MCQ', accuracy: 75 },
      { type: 'True/False', accuracy: 85 },
      { type: 'Fill-in-Blank', accuracy: 65 },
      { type: 'Essay', accuracy: 70 }
    ]

    // Weekly Activity
    const weeklyActivity = await query(`
      SELECT 
        DAYNAME(er.result_date) as day,
        COUNT(*) as exams
      FROM exam_results er
      ${programId ? 'JOIN exams e ON er.exam_id = e.id' : ''}
      WHERE er.student_id = ?
        AND er.result_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ${programId ? 'AND e.program_id = ?' : ''}
      GROUP BY day, DAYOFWEEK(er.result_date)
      ORDER BY DAYOFWEEK(er.result_date)
    `, programId ? [userId, programId] : [userId]) as any[]

    // Calculate insights
    const [overallStats] = await query(`
      SELECT 
        ROUND(AVG(er.percentage), 2) as overallProgress,
        ROUND(AVG(er.percentage), 2) as avgAccuracy,
        COUNT(DISTINCT DATE(er.result_date)) as studyStreak
      FROM exam_results er
      ${programId ? 'JOIN exams e ON er.exam_id = e.id' : ''}
      WHERE er.student_id = ?
      ${programId ? 'AND e.program_id = ?' : ''}
    `, programId ? [userId, programId] : [userId]) as any[]

    const weakestSubject = subjectStrengths.length > 0 
      ? subjectStrengths[subjectStrengths.length - 1]?.subject 
      : 'N/A'
    
    const strongestSubject = subjectStrengths.length > 0 
      ? subjectStrengths[0]?.subject 
      : 'N/A'

    // If programId provided, compute program leaderboard position for current user
    let programRank = null
    if (programId) {
      const programScores = await query(`
        SELECT u.id as userId, ROUND(COALESCE(SUM(er.percentage),0),2) as score
        FROM users u
        JOIN program_enrollments pe ON pe.user_id = u.id AND pe.program_id = ? AND pe.status = 'active'
        LEFT JOIN exam_results er ON er.student_id = u.id
        LEFT JOIN exams e ON er.exam_id = e.id AND e.program_id = ?
        GROUP BY u.id
        ORDER BY score DESC
        LIMIT 1000
      `, [programId, programId]) as any[]

      const idx = programScores.findIndex((r: any) => r.userId === userId)
      if (idx !== -1) {
        programRank = idx + 1
      } else {
        // If the user is not in the top list, still try to compute approximate rank
        // This is a best-effort; for full accuracy implement a rank query server-side
        programRank = null
      }
    }

    return NextResponse.json({
      performanceTrend: performanceTrend.reverse(),
      subjectStrengths,
      timeAnalysis,
      accuracyByType,
      weeklyActivity,
      insights: {
        overallProgress: overallStats?.overallProgress || 0,
        avgAccuracy: overallStats?.avgAccuracy || 0,
        studyStreak: overallStats?.studyStreak || 0,
        avgTimePerQuestion: 45,
        progressTrend: 'up',
        weakestSubject,
        strongestSubject
      }
    ,
    programRank
    })

  } catch (error: any) {
    console.error('Analytics API Error:', error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
