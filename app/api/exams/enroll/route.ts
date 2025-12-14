import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

// GET - Get all exams available for enrollment
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    // Get all exams from programs the student is enrolled in
    const [exams] = await pool.query(`
      SELECT 
        e.*,
        s.name as subject_name,
        e.total_questions,
        p.title as program_name,
        p.enrollment_fee as program_enrollment_fee,
        pe.id as program_enrollment_id,
        pe.status as program_enrollment_status,
        pe.enrolled_at as program_enrolled_at,
        (SELECT COUNT(*) FROM program_enrollments WHERE program_id = e.program_id AND status = 'active') as enrolled_count
      FROM exams e
      INNER JOIN program_enrollments pe ON e.program_id = pe.program_id AND pe.user_id = ? AND pe.status = 'active'
      LEFT JOIN programs p ON e.program_id = p.id
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE e.status IN ('scheduled', 'ongoing')
      ORDER BY e.created_at DESC
    `, [userId]) as any

    const formattedExams = exams.map((exam: any) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject_name,
      duration: exam.duration,
      totalMarks: exam.total_marks,
      passingMarks: exam.passing_marks,
      difficultyLevel: exam.difficulty_level,
      totalQuestions: exam.total_questions,
      programName: exam.program_name,
      programEnrollmentFee: parseFloat(exam.program_enrollment_fee || 0),
      startDate: exam.start_date,
      endDate: exam.end_date,
      maxAttempts: exam.max_attempts,
      isEnrolled: true, // All exams here are from enrolled programs
      enrollmentStatus: exam.program_enrollment_status,
      enrolledAt: exam.program_enrolled_at,
      enrolledCount: exam.enrolled_count
    }))

    return NextResponse.json({ exams: formattedExams })
  } catch (error) {
    console.error('Failed to fetch exams:', error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}
