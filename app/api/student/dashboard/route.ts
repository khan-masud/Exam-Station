import { NextRequest, NextResponse } from 'next/server'
import { withStudentAuth } from '@/lib/utils/auth-middleware'
import pool from '@/lib/db'

export async function GET(req: NextRequest) {
  return withStudentAuth(req, async (user) => {
    try {
      const studentId = user.id

    // Get upcoming/available exams from enrolled programs
    const [upcomingExams] = await pool.query(`
      SELECT DISTINCT
        e.id,
        e.title,
        e.description,
        e.exam_date as startDate,
        e.exam_end_time as endDate,
        e.duration_minutes as duration,
        e.total_marks as totalMarks,
        e.passing_percentage as passingMarks,
        e.difficulty_level as difficultyLevel,
        e.allow_multiple_attempts,
        e.max_attempts as maxAttempts,
        e.status,
        e.total_questions as totalQuestions,
        COUNT(DISTINCT ea.id) as attempts,
        s.name as subject_name,
        p.title as program_name
      FROM program_enrollments pe
      JOIN exams e ON pe.program_id = e.program_id
      LEFT JOIN exam_attempts ea ON ea.exam_id = e.id AND ea.student_id = pe.user_id AND ea.status IN ('submitted', 'evaluated')
      LEFT JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN programs p ON e.program_id = p.id
      WHERE pe.user_id = ?
        AND pe.status = 'active'
        AND e.status IN ('scheduled', 'ongoing', 'published')
        AND (
          e.exam_date IS NULL
          OR e.exam_date >= CURDATE()
        )
      GROUP BY e.id
      ORDER BY e.exam_date ASC
      LIMIT 20
    `, [studentId]) as any

    // Get completed exams with results
    const [completedExams] = await pool.query(`
      SELECT 
        er.id as resultId,
        e.id,
        e.title,
        e.total_marks as totalMarks,
        e.passing_percentage as passingMarks,
        er.obtained_marks as score,
        er.percentage,
        er.status as result,
        er.time_spent as timeSpent,
        er.result_date as completedDate,
        er.attempt_number as attemptNumber,
        s.name as subject_name
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE er.student_id = ?
      ORDER BY er.result_date DESC
      LIMIT 20
    `, [studentId]) as any

    // Get live/ongoing exams (currently happening)
    const [liveExams] = await pool.query(`
      SELECT DISTINCT
        e.id,
        e.title,
        e.exam_date as startDate,
        e.exam_end_time as endDate,
        e.duration_minutes as duration,
        e.total_marks as totalMarks,
        e.passing_percentage as passingMarks,
        e.difficulty_level as difficultyLevel,
        e.total_questions as totalQuestions,
        s.name as subject_name,
        p.title as program_name
      FROM program_enrollments pe
      JOIN exams e ON pe.program_id = e.program_id
      LEFT JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN programs p ON e.program_id = p.id
      WHERE pe.user_id = ?
        AND pe.status = 'active'
        AND e.status IN ('ongoing', 'published')
        AND e.exam_date <= NOW()
        AND (e.exam_end_time IS NULL OR e.exam_end_time >= NOW())
      GROUP BY e.id
      ORDER BY e.exam_date DESC
      LIMIT 10
    `, [studentId]) as any

    // Get overall statistics
    const [stats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT er.exam_id) as total_exams_taken,
        AVG(er.percentage) as average_percentage,
        SUM(CASE WHEN er.status = 'pass' THEN 1 ELSE 0 END) as passed_count,
        SUM(CASE WHEN er.status = 'fail' THEN 1 ELSE 0 END) as failed_count,
        MAX(er.percentage) as highest_score,
        MIN(er.percentage) as lowest_score
      FROM exam_results er
      WHERE er.student_id = ?
    `, [studentId]) as any

    // Validate stats is an array
    if (!Array.isArray(stats)) {
      throw new Error('Stats query returned invalid result')
    }

    // Get performance trend (last 10 exams)
    const [performanceTrend] = await pool.query(`
      SELECT 
        e.title,
        er.percentage,
        DATE_FORMAT(er.result_date, '%Y-%m-%d') as date
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      WHERE er.student_id = ?
      ORDER BY er.result_date ASC
      LIMIT 10
    `, [studentId]) as any

    // Get subject-wise performance
    const [subjectPerformance] = await pool.query(`
      SELECT 
        s.name as subject,
        COUNT(DISTINCT er.exam_id) as total_exams,
        AVG(er.percentage) as average_score,
        MAX(er.percentage) as best_score
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE er.student_id = ?
      GROUP BY s.id, s.name
      HAVING s.name IS NOT NULL
      ORDER BY average_score DESC
    `, [studentId]) as any

    // Get recent activity
    const [recentActivity] = await pool.query(`
      SELECT 
        'exam_completed' as type,
        e.title,
        er.percentage as score,
        er.result_date as timestamp
      FROM exam_results er
      JOIN exams e ON er.exam_id = e.id
      WHERE er.student_id = ?
      ORDER BY er.result_date DESC
      LIMIT 5
    `, [studentId]) as any

    // Get enrolled programs count
    const [enrolledCount] = await pool.query(`
      SELECT COUNT(*) as count
      FROM program_enrollments
      WHERE user_id = ? AND status = 'active'
    `, [studentId]) as any
    
    // Validate enrolledCount is an array
    if (!Array.isArray(enrolledCount)) {
      throw new Error('Enrolled count query returned invalid result')
    }

    // Get support ticket statistics
    const [ticketStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM support_tickets
      WHERE student_id = ?
    `, [studentId]) as any
    
    // Validate ticketStats is an array
    if (!Array.isArray(ticketStats)) {
      throw new Error('Ticket stats query returned invalid result')
    }

    return NextResponse.json({
      upcomingExams: Array.isArray(upcomingExams) ? upcomingExams.map((exam: any) => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        status: exam.attempts >= exam.maxAttempts ? 'completed' : 'available',
        startDate: exam.startDate,
        endDate: exam.endDate,
        duration: `${exam.duration} minutes`,
        totalQuestions: exam.totalQuestions || 0,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        difficultyLevel: exam.difficultyLevel,
        attempts: exam.attempts,
        maxAttempts: exam.maxAttempts,
        subject: exam.subject_name,
        program: exam.program_name
      })) : [],
      liveExams: Array.isArray(liveExams) ? liveExams.map((exam: any) => ({
        id: exam.id,
        title: exam.title,
        startDate: exam.startDate,
        endDate: exam.endDate,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        difficultyLevel: exam.difficultyLevel,
        totalQuestions: exam.totalQuestions || 0,
        subject: exam.subject_name,
        program: exam.program_name,
        isLive: true
      })) : [],
      completedExams: Array.isArray(completedExams) ? completedExams.map((exam: any) => ({
        resultId: exam.resultId,  // ✅ Add result ID
        id: exam.id,
        title: exam.title,
        score: exam.score || 0,
        totalMarks: exam.totalMarks,
        percentage: parseFloat(exam.percentage || 0).toFixed(2),
        passingMarks: exam.passingMarks,
        attemptNumber: exam.attemptNumber || 1,
        completedDate: exam.completedDate ? new Date(exam.completedDate).toLocaleDateString() : 'N/A',
        timeSpent: exam.timeSpent ? `${Math.floor(exam.timeSpent / 60)} mins` : 'N/A',
        result: exam.result === 'pass' ? 'passed' : exam.result === 'fail' ? 'failed' : 'pending',
        subject: exam.subject_name
      })) : [],
      stats: {
        totalExamsTaken: (Array.isArray(stats) && stats[0]) ? (stats[0].total_exams_taken || 0) : 0,
        averagePercentage: (Array.isArray(stats) && stats[0]) ? parseFloat(stats[0].average_percentage || 0).toFixed(2) : '0.00',
        passedCount: (Array.isArray(stats) && stats[0]) ? (stats[0].passed_count || 0) : 0,
        failedCount: (Array.isArray(stats) && stats[0]) ? (stats[0].failed_count || 0) : 0,
        highestScore: (Array.isArray(stats) && stats[0]) ? parseFloat(stats[0].highest_score || 0).toFixed(2) : '0.00',
        lowestScore: (Array.isArray(stats) && stats[0]) ? parseFloat(stats[0].lowest_score || 0).toFixed(2) : '0.00',
        enrolledPrograms: (Array.isArray(enrolledCount) && enrolledCount[0]) ? (enrolledCount[0].count || 0) : 0,
        supportTickets: {
          total: (Array.isArray(ticketStats) && ticketStats[0]) ? (ticketStats[0].total || 0) : 0,
          open: (Array.isArray(ticketStats) && ticketStats[0]) ? (ticketStats[0].open || 0) : 0,
          inProgress: (Array.isArray(ticketStats) && ticketStats[0]) ? (ticketStats[0].inProgress || 0) : 0,
          closed: (Array.isArray(ticketStats) && ticketStats[0]) ? (ticketStats[0].closed || 0) : 0
        }
      },
      performanceTrend: Array.isArray(performanceTrend) ? performanceTrend.map((item: any) => ({
        name: item.title.substring(0, 15) + (item.title.length > 15 ? '...' : ''),
        score: parseFloat(item.percentage || 0).toFixed(1),
        date: item.date
      })) : [],
      subjectPerformance: Array.isArray(subjectPerformance) ? subjectPerformance.map((item: any) => ({
        subject: item.subject,
        totalExams: item.total_exams,
        averageScore: parseFloat(item.average_score || 0).toFixed(1),
        bestScore: parseFloat(item.best_score || 0).toFixed(1)
      })) : [],
      recentActivity: Array.isArray(recentActivity) ? recentActivity.map((item: any) => ({
        type: item.type,
        title: item.title,
        score: item.score ? parseFloat(item.score).toFixed(1) : null,
        timestamp: item.timestamp
      })) : []
    })
    } catch (error) {
      console.error('Failed to fetch student dashboard:', error)
      return NextResponse.json({ 
        upcomingExams: [],
        liveExams: [],
        completedExams: [], 
        stats: { 
          totalExamsTaken: 0, 
          averagePercentage: 0, 
          passedCount: 0, 
          failedCount: 0,
          highestScore: 0,
          lowestScore: 0,
          enrolledPrograms: 0
        },
        performanceTrend: [],
        subjectPerformance: [],
        recentActivity: []
      })
    }
  })
}
