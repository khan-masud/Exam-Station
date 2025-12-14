import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = decoded.userId

    const { examId } = await request.json()

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      // Check if exam exists and is available
      const [examRows] = await connection.execute<RowDataPacket[]>(
        `SELECT e.*, s.name as subject_name
         FROM exams e
         LEFT JOIN subjects s ON e.subject_id = s.id
         WHERE e.id = ? AND e.status = 'published'`,
        [examId]
      )

      if (examRows.length === 0) {
        return NextResponse.json({ error: 'Exam not found or not available' }, { status: 404 })
      }

      const exam = examRows[0]

      // Check registration deadline
      if (exam.registration_end_date && new Date(exam.registration_end_date) < new Date()) {
        return NextResponse.json({ error: 'Registration period has ended' }, { status: 400 })
      }

      // Check if already registered
      const [existingRegistration] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM exam_enrollments WHERE user_id = ? AND exam_id = ?',
        [userId, examId]
      )

      if (existingRegistration.length > 0) {
        return NextResponse.json({ error: 'Already registered for this exam' }, { status: 400 })
      }

      // Check student capacity limit if set
      if (exam.max_students) {
        const [enrollmentCount] = await connection.execute<RowDataPacket[]>(
          'SELECT COUNT(*) as count FROM exam_enrollments WHERE exam_id = ?',
          [examId]
        )

        if (Array.isArray(enrollmentCount) && enrollmentCount[0]?.count >= exam.max_students) {
          return NextResponse.json({ error: 'Exam is full. Maximum capacity reached.' }, { status: 400 })
        }
      }

      // Check prerequisites if any
      if (exam.prerequisite_exam_id) {
        const [prerequisiteResults] = await connection.execute<RowDataPacket[]>(
          `SELECT er.percentage_score, e.passing_percentage
           FROM exam_results er
           JOIN exams e ON er.exam_id = e.id
           WHERE er.user_id = ? AND er.exam_id = ? AND er.status = 'completed'
           ORDER BY er.completed_at DESC LIMIT 1`,
          [userId, exam.prerequisite_exam_id]
        )

        if (prerequisiteResults.length === 0) {
          return NextResponse.json({ 
            error: 'You must complete the prerequisite exam first' 
          }, { status: 400 })
        }

        const prerequisite = prerequisiteResults[0]
        if (prerequisite.percentage_score < prerequisite.passing_percentage) {
          return NextResponse.json({ 
            error: 'You must pass the prerequisite exam to register for this exam' 
          }, { status: 400 })
        }
      }

      // Register the student
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO exam_enrollments (user_id, exam_id, enrolled_at, status)
         VALUES (?, ?, NOW(), 'enrolled')`,
        [userId, examId]
      )

      const enrollmentId = result.insertId

      // Get the complete enrollment data
      const [enrollmentData] = await connection.execute<RowDataPacket[]>(
        `SELECT ee.*, e.title, e.start_date, e.duration_minutes, e.total_marks
         FROM exam_enrollments ee
         JOIN exams e ON ee.exam_id = e.id
         WHERE ee.id = ?`,
        [enrollmentId]
      )

      return NextResponse.json({
        success: true,
        message: 'Successfully registered for exam',
        enrollment: {
          id: enrollmentData[0].id,
          examId: enrollmentData[0].exam_id,
          examTitle: enrollmentData[0].title,
          startDate: enrollmentData[0].start_date,
          duration: enrollmentData[0].duration_minutes,
          totalMarks: enrollmentData[0].total_marks,
          enrolledAt: enrollmentData[0].enrolled_at,
          status: enrollmentData[0].status
        }
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Exam registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register for exam' },
      { status: 500 }
    )
  }
}

// Check registration status
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = decoded.userId

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      const [enrollmentRows] = await connection.execute<RowDataPacket[]>(
        `SELECT ee.*, e.title, e.start_date, e.duration_minutes
         FROM exam_enrollments ee
         JOIN exams e ON ee.exam_id = e.id
         WHERE ee.user_id = ? AND ee.exam_id = ?`,
        [userId, examId]
      )

      if (enrollmentRows.length === 0) {
        return NextResponse.json({
          isRegistered: false,
          enrollment: null
        })
      }

      return NextResponse.json({
        isRegistered: true,
        enrollment: {
          id: enrollmentRows[0].id,
          examId: enrollmentRows[0].exam_id,
          examTitle: enrollmentRows[0].title,
          startDate: enrollmentRows[0].start_date,
          duration: enrollmentRows[0].duration_minutes,
          enrolledAt: enrollmentRows[0].enrolled_at,
          status: enrollmentRows[0].status
        }
      })
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Check registration error:', error)
    return NextResponse.json(
      { error: 'Failed to check registration status' },
      { status: 500 }
    )
  }
}
