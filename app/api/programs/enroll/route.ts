import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Get enrollable programs for student
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token) // Remove await - verifyToken is synchronous
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can view enrollable programs' }, { status: 403 })
    }

    const programs = await query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM program_enrollments WHERE program_id = p.id AND status = 'active') as enrolled_count,
              (SELECT COUNT(*) FROM exam_programs ep WHERE ep.program_id = p.id) as exam_count,
              pe.id as enrollment_id,
              pe.status as enrollment_status,
              pe.enrolled_at
       FROM programs p
       LEFT JOIN program_enrollments pe ON p.id = pe.program_id AND pe.user_id = ?
       WHERE p.status = 'published'
       ORDER BY p.created_at DESC`,
      [decoded.userId]
    ) as any[]

    return NextResponse.json({
      success: true,
      programs: programs.map(program => ({
        ...program,
        enrollment_fee: Number(program.enrollment_fee) || 0,
        max_students: program.max_students ? Number(program.max_students) : null,
        enrolled_count: Number(program.enrolled_count) || 0,
        exam_count: Number(program.exam_count) || 0,
        isEnrolled: !!program.enrollment_id,
        enrollmentStatus: program.enrollment_status,
        enrolledAt: program.enrolled_at,
        isFull: program.max_students && program.enrolled_count >= program.max_students
      }))
    })
  } catch (error: any) {
    console.error('Get programs error:', error)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

// POST - Enroll in a program
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token) // Remove await - verifyToken is synchronous
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can enroll in programs' }, { status: 403 })
    }

    const { programId, paymentId } = await request.json()

    if (!programId) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 })
    }

    const userId = decoded.userId

    // Check if user is already actively enrolled in the program
    const existing = await query(
      'SELECT id FROM program_enrollments WHERE program_id = ? AND user_id = ? AND status = "active"',
      [programId, userId]
    ) as any[]

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Already actively enrolled in this program' }, { status: 400 })
    }

    // Get program details
    const [program] = await query(
      'SELECT * FROM programs WHERE id = ? AND status = "published"',
      [programId]
    ) as any[]

    if (program.length === 0) {
      return NextResponse.json({ error: 'Program not found or not available' }, { status: 404 })
    }

    const programData = program[0]

    // Check if program is full
    if (programData.max_students) {
      const [enrollmentCount] = await query(
        'SELECT COUNT(*) as count FROM program_enrollments WHERE program_id = ? AND status = "active"',
        [programId]
      ) as any[]

      if (Array.isArray(enrollmentCount) && enrollmentCount[0]?.count >= programData.max_students) {
        return NextResponse.json({ error: 'Program is full' }, { status: 400 })
      }
    }

    // Check if payment is required
    let transactionId = null
    let paymentStatus = 'completed'

    if (programData.enrollment_fee > 0) {
      if (!paymentId) {
        return NextResponse.json({ error: 'Payment required for this program' }, { status: 402 })
      }

      // Verify payment
      const [payment] = await query(
        'SELECT * FROM transactions WHERE id = ? AND user_id = ? AND payment_status = "completed"',
        [paymentId, userId]
      ) as any[]

      if (payment.length === 0) {
        return NextResponse.json({ error: 'Invalid or incomplete payment' }, { status: 402 })
      }

      transactionId = paymentId
      paymentStatus = 'completed'
    }

    // Create enrollment
    const enrollmentId = uuidv4()
    await query(
      `INSERT INTO program_enrollments 
       (id, program_id, user_id, status, payment_status, transaction_id) 
       VALUES (?, ?, ?, 'active', ?, ?)`,
      [enrollmentId, programId, userId, paymentStatus, transactionId]
    )

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in the program',
      enrollmentId
    })
  } catch (error: any) {
    console.error('Program enrollment error:', error)
    return NextResponse.json({ error: 'Failed to enroll in program' }, { status: 500 })
  }
}

// DELETE - Cancel enrollment
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token) // Remove await - verifyToken is synchronous
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can cancel enrollments' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const programId = searchParams.get('programId')

    if (!programId) {
      return NextResponse.json({ error: 'Program ID is required' }, { status: 400 })
    }

    const userId = decoded.userId

    // Check if has taken any exams in this program
    const [examAttempts] = await query(
      `SELECT COUNT(*) as count 
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.id
       WHERE e.program_id = ? AND ea.student_id = ?`,
      [programId, userId]
    ) as any[]

    if (Array.isArray(examAttempts) && examAttempts[0]?.count > 0) {
      return NextResponse.json({ 
        error: 'Cannot cancel enrollment after taking exams in this program' 
      }, { status: 400 })
    }

    // Update enrollment status to cancelled
    const result = await query(
      'UPDATE program_enrollments SET status = ? WHERE program_id = ? AND user_id = ? AND status = ?',
      ['cancelled', programId, userId, 'active']
    ) as any[]

    if (!Array.isArray(result) || result[0]?.affectedRows === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment cancelled successfully'
    })
  } catch (error: any) {
    console.error('Cancel enrollment error:', error)
    return NextResponse.json({ error: 'Failed to cancel enrollment' }, { status: 500 })
  }
}
