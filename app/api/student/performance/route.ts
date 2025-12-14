import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = decoded.userId

    try {
      // Get performance trend (last 10 exams)
      const [trendRows] = await pool.query<RowDataPacket[]>(
        `SELECT 
          e.title,
          er.percentage,
          er.obtained_marks as total_score,
          DATE_FORMAT(er.result_date, '%b %d') as date,
          er.result_date
         FROM exam_results er
         JOIN exams e ON er.exam_id = e.id
         WHERE er.student_id = ? AND er.status IN ('pass', 'fail')
         ORDER BY er.result_date DESC
         LIMIT 10`,
        [userId]
      ) as any

      // Validate trendRows is an array
      if (!Array.isArray(trendRows)) {
        throw new Error('Trend rows query returned invalid result')
      }

      const performanceTrend = trendRows.reverse().map((row: any) => ({
        date: row.date,
        score: row.total_score,
        percentage: row.percentage
      }))

      // Get subject-wise performance
      const [subjectRows] = await pool.query<RowDataPacket[]>(
        `SELECT 
          s.name as subject,
          AVG(er.percentage) as avg_score,
          MAX(er.percentage) as best_score,
          COUNT(*) as exam_count
         FROM exam_results er
         JOIN exams e ON er.exam_id = e.id
         LEFT JOIN subjects s ON e.subject_id = s.id
         WHERE er.student_id = ? AND er.status IN ('pass', 'fail')
         GROUP BY s.id, s.name
         ORDER BY avg_score DESC`,
        [userId]
      ) as any

      // Validate subjectRows is an array
      if (!Array.isArray(subjectRows)) {
        throw new Error('Subject rows query returned invalid result')
      }

      const subjectPerformance = subjectRows.map((row: any) => ({
        subject: row.subject || 'General',
        score: Math.round(row.avg_score),
        average: 75, // Could calculate from all students
        target: 85,
        examCount: row.exam_count,
        bestScore: Math.round(row.best_score)
      }))

      // Get overall metrics
      const [metricsRows] = await pool.query<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total_attempts,
          COALESCE(SUM(er.obtained_marks), 0) as total_score,
          COALESCE(AVG(er.percentage), 0) as average_score,
          COALESCE(MAX(er.percentage), 0) as best_score,
          COALESCE(MIN(er.percentage), 0) as worst_score,
          SUM(CASE WHEN er.percentage >= e.passing_percentage THEN 1 ELSE 0 END) as passed_count,
          COALESCE(SUM(er.time_spent), 0) as total_time_seconds
         FROM exam_results er
         JOIN exams e ON er.exam_id = e.id
         WHERE er.student_id = ? AND er.status IN ('pass', 'fail')`,
        [userId]
      ) as any

      // Validate and get metrics
      if (!Array.isArray(metricsRows) || metricsRows.length === 0) {
        throw new Error('Metrics query returned invalid result')
      }

      const metrics = metricsRows[0] || {
        total_attempts: 0,
        total_score: 0,
        average_score: 0,
        best_score: 0,
        worst_score: 0,
        passed_count: 0,
        total_time_seconds: 0
      }

      // Calculate improvement rate (compare first half vs second half of exams)
      let improvementRate = 0
      if (Array.isArray(trendRows) && trendRows.length >= 4) {
        const halfPoint = Math.floor(trendRows.length / 2)
        const firstHalfAvg = trendRows.slice(0, halfPoint).reduce((sum: number, r: any) => sum + r.percentage, 0) / halfPoint
        const secondHalfAvg = trendRows.slice(halfPoint).reduce((sum: number, r: any) => sum + r.percentage, 0) / (trendRows.length - halfPoint)
        improvementRate = Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
      }

      // Format time spent
      const totalMinutes = Math.floor(metrics.total_time_seconds / 60)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      const timeSpent = `${hours}h ${minutes}m`

      // Get weak areas (topics with low performance)
      const [weakAreasRows] = await pool.query<RowDataPacket[]>(
        `SELECT 
          s.name as topic,
          AVG(CASE WHEN ea.is_correct = 1 THEN 100 ELSE 0 END) as accuracy,
          COUNT(*) as question_count
         FROM exam_answers ea
         JOIN exam_attempts eat ON ea.attempt_id = eat.id
         JOIN questions q ON ea.question_id = q.id
         LEFT JOIN subjects s ON q.subject_id = s.id
         WHERE eat.student_id = ?
         GROUP BY s.id, s.name
         HAVING accuracy < 70
         ORDER BY accuracy ASC
         LIMIT 5`,
        [userId]
      ) as any

      // Validate and map weak areas
      const weakAreas = Array.isArray(weakAreasRows) ? weakAreasRows.map((row: any) => ({
        topic: row.topic || 'General',
        weaknessLevel: Math.round(100 - row.accuracy),
        priority: row.accuracy < 50 ? 'High' : row.accuracy < 60 ? 'Medium' : 'Low',
        suggestion: row.accuracy < 50 ? 'Review fundamentals' : 'More practice needed',
        questionCount: row.question_count
      })) : []

      // Get strong areas (topics with high performance)
      const [strongAreasRows] = await pool.query<RowDataPacket[]>(
        `SELECT 
          s.name as topic,
          AVG(CASE WHEN ea.is_correct = 1 THEN 100 ELSE 0 END) as accuracy,
          COUNT(*) as question_count
         FROM exam_answers ea
         JOIN exam_attempts eat ON ea.attempt_id = eat.id
         JOIN questions q ON ea.question_id = q.id
         LEFT JOIN subjects s ON q.subject_id = s.id
         WHERE eat.student_id = ?
         GROUP BY s.id, s.name
         HAVING accuracy >= 85
         ORDER BY accuracy DESC
         LIMIT 5`,
        [userId]
      ) as any

      // Validate and map strong areas
      const strongAreas = Array.isArray(strongAreasRows) ? strongAreasRows.map((row: any) => ({
        topic: row.topic || 'General',
        strength: Math.round(row.accuracy),
        confidence: row.accuracy >= 95 ? 'Very High' : row.accuracy >= 90 ? 'High' : 'Good',
        questionCount: row.question_count
      })) : []

      const passRate = metrics.total_attempts > 0 
        ? Math.round((metrics.passed_count / metrics.total_attempts) * 100)
        : 0

      return NextResponse.json({
        performanceTrend,
        subjectPerformance,
        metrics: {
          totalAttempts: metrics.total_attempts,
          totalScore: metrics.total_score,
          averageScore: Math.round(metrics.average_score),
          bestScore: Math.round(metrics.best_score),
          worstScore: Math.round(metrics.worst_score),
          passRate,
          improvementRate,
          timeSpent
        },
        weakAreas,
        strongAreas
      })
    } catch (error) {
      console.error('Performance API error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch performance data' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}
