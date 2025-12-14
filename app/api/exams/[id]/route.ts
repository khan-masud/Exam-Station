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
    // Note: Exams are linked to programs through exam_programs table (many-to-many)
    const examRows = await query(
      `SELECT e.*, s.name as subject_name, p.instructions as program_instructions, p.id as program_id
       FROM exams e 
       LEFT JOIN subjects s ON e.subject_id = s.id 
       LEFT JOIN exam_programs ep ON e.id = ep.exam_id
       LEFT JOIN programs p ON ep.program_id = p.id
       WHERE e.id = ?
       LIMIT 1`,
      [examId]
    ) as any[]

    const exam = examRows && examRows[0] ? examRows[0] : null

    if (!exam) {
      console.log('[Get exam details] Exam not found:', examId)
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    console.log('[Get exam details] Exam found:', exam.title)
    console.log('[Get exam details] Exam program_id:', exam.program_id)
    console.log('[Get exam details] Program instructions from DB:', exam.program_instructions)
    console.log('[Get exam details] Exam instructions from DB:', exam.instructions)

    // Get exam control settings
    const examControls = {
      allow_answer_change: exam.allow_answer_change ?? true,
      show_question_counter: exam.show_question_counter ?? true,
      allow_answer_review: exam.allow_answer_review ?? true,
    }

    console.log('[Get exam details] Returning programInstructions:', exam.program_instructions || '')
    
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

/**
 * PATCH /api/exams/[id] - Update exam details (e.g., instructions)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update exams' }, { status: 403 })
    }

    const { id: examId } = await params
    const body = await request.json()
    
    console.log('[Update exam] Updating exam:', examId)
    console.log('[Update exam] Body:', body)

    // Build dynamic update query based on provided fields
    const updates: string[] = []
    const values: any[] = []

    if (body.instructions !== undefined) {
      updates.push('instructions = ?')
      values.push(body.instructions)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(examId)

    await query(
      `UPDATE exams SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    console.log('[Update exam] Exam updated successfully')

    return NextResponse.json({ 
      success: true,
      message: 'Exam updated successfully' 
    })
  } catch (error) {
    console.error('Update exam error:', error)
    return NextResponse.json({ error: 'Failed to update exam', details: String(error) }, { status: 500 })
  }
}
