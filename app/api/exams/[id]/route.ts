import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/exams/[id] - Fetch exam details and instructions (without starting attempt)
 * Used to load exam details before the student clicks "Start Exam"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can view exams' }, { status: 403 })
    }

    const { id: examId } = await params
    console.log('[Get exam details] Fetching exam:', examId)

    // Get exam details (includes exam instructions and program instructions)
    const examRows = await query(
      `SELECT e.*, s.name as subject_name, p.instructions as program_instructions
       FROM exams e 
       LEFT JOIN subjects s ON e.subject_id = s.id 
       LEFT JOIN programs p ON e.program_id = p.id
       WHERE e.id = ?`,
      [examId]
    ) as any[]

    const exam = examRows && examRows[0] ? examRows[0] : null

    if (!exam) {
      console.log('[Get exam details] Exam not found:', examId)
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    console.log('[Get exam details] Exam found:', exam.title)

    // Get exam control settings
    const examControls = {
      allow_answer_change: exam.allow_answer_change ?? true,
      show_question_counter: exam.show_question_counter ?? true,
      allow_answer_review: exam.allow_answer_review ?? true,
    }

    return NextResponse.json({
      exam,
      examControls,
      programInstructions: exam.program_instructions || '',
    })
  } catch (error) {
    console.error('Get exam error:', error)
    return NextResponse.json({ error: 'Failed to fetch exam', details: String(error) }, { status: 500 })
  }
}
