import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// GET - Fetch exam details
export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { examId } = await params

    const [examRows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.total_questions, 
        e.total_marks, 
        e.duration_minutes,
        e.exam_date,
        e.exam_start_time,
        e.exam_end_time,
        e.negative_marking,
        e.passing_marks,
        e.status,
        e.instructions,
        e.proctoring_enabled,
        e.allow_answer_change,
        e.show_question_counter,
        e.allow_answer_review,
        s.name as subject_name,
        p.title as program_name,
        e.program_id
       FROM exams e
       LEFT JOIN subjects s ON e.subject_id = s.id
       LEFT JOIN programs p ON e.program_id = p.id
       WHERE e.id = ?`,
      [examId]
    )

    if (examRows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    return NextResponse.json({ exam: examRows[0] })
  } catch (error) {
    console.error('Exam fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
  }
}
