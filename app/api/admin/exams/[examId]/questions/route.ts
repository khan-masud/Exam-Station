import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// GET - Fetch exam details and assigned questions
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

    // Get exam details
    const [examRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, description, total_questions, total_marks, duration_minutes, subject_id
       FROM exams WHERE id = ?`,
      [examId]
    ) as any

    if (!Array.isArray(examRows) || examRows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const exam = examRows[0]

    // Get assigned questions
    const [questions] = await pool.query<RowDataPacket[]>(
      `SELECT 
        eq.id as assignment_id,
        eq.sequence,
        eq.marks,
        q.id,
        q.question_text,
        q.difficulty_level,
        q.question_type_id,
        qt.name as question_type,
        s.name as subject_name
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       LEFT JOIN subjects s ON q.subject_id = s.id
       LEFT JOIN question_types qt ON q.question_type_id = qt.id
       WHERE eq.exam_id = ?
       ORDER BY eq.sequence`,
      [examId]
    ) as any

    return NextResponse.json({
      exam,
      questions: Array.isArray(questions) ? questions : []
    })
  } catch (error) {
    console.error('Exam questions fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch exam questions' }, { status: 500 })
  }
}

// POST - Assign questions to exam
export async function POST(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
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
    let questionIds: any[] = []
    
    try {
      const body = await req.json()
      questionIds = body.questionIds || []
    } catch (parseError: any) {
      console.error('Failed to parse request body:', parseError.message)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json({ error: 'Question IDs are required' }, { status: 400 })
    }

    try {
      // First, delete existing questions
      await pool.query(
        'DELETE FROM exam_questions WHERE exam_id = ?',
        [examId]
      )

      // Insert new questions with sequence
      let totalMarks = 0
      for (let i = 0; i < questionIds.length; i++) {
        const questionId = questionIds[i]
        
        // Get question marks
        const [questionRows] = await pool.query(
          'SELECT marks FROM questions WHERE id = ?',
          [questionId]
        ) as any

        if (!Array.isArray(questionRows) || questionRows.length === 0) {
          throw new Error(`Question with ID ${questionId} not found`)
        }

        const marks = questionRows[0]?.marks || 1
        totalMarks += marks

        await pool.query(
          `INSERT INTO exam_questions (exam_id, question_id, sequence, marks)
           VALUES (?, ?, ?, ?)`,
          [examId, questionId, i + 1, marks]
        )
      }

      // Update exam total_questions and total_marks
      await pool.query(
        `UPDATE exams 
         SET total_questions = ?, total_marks = ? 
         WHERE id = ?`,
        [questionIds.length, totalMarks, examId]
      )

      return NextResponse.json({ 
        success: true,
        message: 'Questions assigned successfully',
        totalQuestions: questionIds.length,
        totalMarks
      })
    } catch (dbError: any) {
      console.error('Database error in questions assignment:', dbError)
      throw dbError
    }
  } catch (error: any) {
    console.error('Assign questions error:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
    })
    return NextResponse.json({ 
      error: 'Failed to assign questions',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Remove specific question from exam
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
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
    const searchParams = req.nextUrl.searchParams
    const questionId = searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
    }

    try {
      // Delete the question
      await pool.query(
        'DELETE FROM exam_questions WHERE exam_id = ? AND question_id = ?',
        [examId, questionId]
      )

      // Update exam totals
      const [countResult] = await pool.query<RowDataPacket[]>(
        'SELECT COUNT(*) as total, SUM(marks) as totalMarks FROM exam_questions WHERE exam_id = ?',
        [examId]
      ) as any

      const result = Array.isArray(countResult) && countResult[0] ? countResult[0] : { total: 0, totalMarks: 0 }

      await pool.query(
        'UPDATE exams SET total_questions = ?, total_marks = ? WHERE id = ?',
        [result.total || 0, result.totalMarks || 0, examId]
      )

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      console.error('Database error in question deletion:', dbError)
      throw dbError
    }
  } catch (error: any) {
    console.error('Remove question error:', error)
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
    })
    return NextResponse.json({ 
      error: 'Failed to remove question',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}
