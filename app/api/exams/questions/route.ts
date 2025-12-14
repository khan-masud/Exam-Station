import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// Get selected questions for an exam
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID required' }, { status: 400 })
    }

    const selections = await query(
      `SELECT eqs.*, q.question_text, q.type, q.difficulty_level, q.marks as default_marks
       FROM exam_question_selections eqs
       JOIN questions q ON eqs.question_id = q.id
       WHERE eqs.exam_id = ?
       ORDER BY eqs.question_order ASC`,
      [examId]
    ) as any[]

    return NextResponse.json({
      success: true,
      questions: selections
    })

  } catch (error: any) {
    console.error('Get exam questions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exam questions' },
      { status: 500 }
    )
  }
}

// Add questions to exam
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !['admin', 'teacher'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Admin/Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { examId, questionIds, marks } = body

    if (!examId || !questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    // Get current max order
    const maxOrderResult = await query(
      'SELECT MAX(question_order) as max_order FROM exam_question_selections WHERE exam_id = ?',
      [examId]
    ) as any[]
    
    let currentOrder = (maxOrderResult[0]?.max_order || 0) + 1

    // Add questions
    for (const questionId of questionIds) {
      const selectionId = uuidv4()
      const questionMarks = marks?.[questionId] || 1

      await query(
        `INSERT INTO exam_question_selections 
         (id, exam_id, question_id, question_order, marks, added_by)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE marks = ?, question_order = ?`,
        [selectionId, examId, questionId, currentOrder, questionMarks, decoded.userId, questionMarks, currentOrder]
      )

      // Update usage count
      await query(
        'UPDATE questions SET usage_count = usage_count + 1 WHERE id = ?',
        [questionId]
      )

      currentOrder++
    }

    // Update exam total marks
    const totalMarksResult = await query(
      'SELECT SUM(marks) as total FROM exam_question_selections WHERE exam_id = ?',
      [examId]
    ) as any[]

    const totalMarks = totalMarksResult[0]?.total || 0

    await query(
      'UPDATE exams SET total_marks = ? WHERE id = ?',
      [totalMarks, examId]
    )

    return NextResponse.json({
      success: true,
      message: `${questionIds.length} question(s) added to exam`,
      totalMarks
    })

  } catch (error: any) {
    console.error('Add exam questions error:', error)
    return NextResponse.json(
      { error: 'Failed to add questions' },
      { status: 500 }
    )
  }
}

// Remove question from exam
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !['admin', 'teacher'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Admin/Teacher access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const questionId = searchParams.get('questionId')

    if (!examId || !questionId) {
      return NextResponse.json({ error: 'Exam ID and Question ID required' }, { status: 400 })
    }

    await query(
      'DELETE FROM exam_question_selections WHERE exam_id = ? AND question_id = ?',
      [examId, questionId]
    )

    // Update exam total marks
    const totalMarksResult = await query(
      'SELECT SUM(marks) as total FROM exam_question_selections WHERE exam_id = ?',
      [examId]
    ) as any[]

    const totalMarks = totalMarksResult[0]?.total || 0

    await query(
      'UPDATE exams SET total_marks = ? WHERE id = ?',
      [totalMarks, examId]
    )

    return NextResponse.json({
      success: true,
      message: 'Question removed from exam',
      totalMarks
    })

  } catch (error: any) {
    console.error('Remove exam question error:', error)
    return NextResponse.json(
      { error: 'Failed to remove question' },
      { status: 500 }
    )
  }
}

// Update question order or marks
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !['admin', 'teacher'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Admin/Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { examId, questionId, order, marks, isRequired } = body

    if (!examId || !questionId) {
      return NextResponse.json({ error: 'Exam ID and Question ID required' }, { status: 400 })
    }

    const updates = []
    const values = []

    if (order !== undefined) {
      updates.push('question_order = ?')
      values.push(order)
    }
    if (marks !== undefined) {
      updates.push('marks = ?')
      values.push(marks)
    }
    if (isRequired !== undefined) {
      updates.push('is_required = ?')
      values.push(isRequired)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    values.push(examId, questionId)
    await query(
      `UPDATE exam_question_selections SET ${updates.join(', ')} WHERE exam_id = ? AND question_id = ?`,
      values
    )

    // Update exam total marks if marks changed
    if (marks !== undefined) {
      const totalMarksResult = await query(
        'SELECT SUM(marks) as total FROM exam_question_selections WHERE exam_id = ?',
        [examId]
      ) as any[]

      const totalMarks = totalMarksResult[0]?.total || 0

      await query(
        'UPDATE exams SET total_marks = ? WHERE id = ?',
        [totalMarks, examId]
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Question updated successfully'
    })

  } catch (error: any) {
    console.error('Update exam question error:', error)
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    )
  }
}
