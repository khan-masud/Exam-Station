import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Fetch a single program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    let decoded = null
    if (token) {
      decoded = await verifyToken(token)
    }

    const { id: programId } = await params

    const [program] = await query(
      `SELECT p.*, 
              u.full_name as created_by_name,
              (SELECT COUNT(*) FROM program_enrollments WHERE program_id = p.id AND status = 'active') as enrolled_count,
              (SELECT COUNT(*) FROM exam_programs WHERE program_id = p.id) as exam_count
       FROM programs p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [programId]
    ) as any[]

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      program: {
        ...program,
        enrollment_fee: Number(program.enrollment_fee) || 0,
        max_students: program.max_students ? Number(program.max_students) : null,
        enrolled_count: Number(program.enrolled_count) || 0,
        exam_count: Number(program.exam_count) || 0,
      }
    })
  } catch (error: any) {
    console.error('Get program error:', error)
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 })
  }
}

// PATCH - Update a program
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Only admins and teachers can update programs' }, { status: 403 })
    }

    const { id: programId } = await params
    const body = await request.json()
    const {
      title,
      description,
      instructions,
      cover_image,
      enrollment_fee,
      max_students,
      status,
      start_date,
      end_date,
      proctoring_enabled,
      allow_answer_change,
      show_question_counter,
      allow_answer_review
    } = body

    const updateFields: string[] = []
    const values: any[] = []

    if (title !== undefined) {
      updateFields.push('title = ?')
      values.push(title)
    }
    if (description !== undefined) {
      updateFields.push('description = ?')
      values.push(description)
    }
    if (instructions !== undefined) {
      updateFields.push('instructions = ?')
      values.push(instructions)
    }
    if (cover_image !== undefined) {
      updateFields.push('cover_image = ?')
      values.push(cover_image)
    }
    if (enrollment_fee !== undefined) {
      updateFields.push('enrollment_fee = ?')
      values.push(enrollment_fee)
    }
    if (max_students !== undefined) {
      updateFields.push('max_students = ?')
      values.push(max_students)
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      values.push(status)
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?')
      values.push(start_date)
    }
    if (end_date !== undefined) {
      updateFields.push('end_date = ?')
      values.push(end_date)
    }
    if (proctoring_enabled !== undefined) {
      updateFields.push('proctoring_enabled = ?')
      values.push(proctoring_enabled ? 1 : 0)
    }
    if (allow_answer_change !== undefined) {
      updateFields.push('allow_answer_change = ?')
      values.push(allow_answer_change ? 1 : 0)
    }
    if (show_question_counter !== undefined) {
      updateFields.push('show_question_counter = ?')
      values.push(show_question_counter ? 1 : 0)
    }
    if (allow_answer_review !== undefined) {
      updateFields.push('allow_answer_review = ?')
      values.push(allow_answer_review ? 1 : 0)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    values.push(programId)

    await query(
      `UPDATE programs SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    )

    const [updatedProgram] = await query(
      'SELECT * FROM programs WHERE id = ?',
      [programId]
    ) as any[]

    return NextResponse.json({
      success: true,
      message: 'Program updated successfully',
      program: updatedProgram
    })
  } catch (error: any) {
    console.error('Update program error:', error)
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 })
  }
}

// DELETE - Delete a program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete programs' }, { status: 403 })
    }

    const { id: programId } = await params

    // Check if program has enrollments
    const [enrollments] = await query(
      'SELECT COUNT(*) as count FROM program_enrollments WHERE program_id = ?',
      [programId]
    ) as any[]

    if (enrollments.count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete program with active enrollments. Archive it instead.' 
      }, { status: 400 })
    }

    await query('DELETE FROM programs WHERE id = ?', [programId])

    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete program error:', error)
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 })
  }
}
