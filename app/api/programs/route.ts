import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch all programs
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    
    let decoded = null
    if (token) {
      decoded = await verifyToken(token)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

    let sql = `
      SELECT p.*, 
             u.full_name as created_by_name,
             (SELECT COUNT(*) FROM program_enrollments WHERE program_id = p.id AND status = 'active') as enrolled_count,
             (SELECT COUNT(*) FROM exams WHERE program_id = p.id) as exam_count
      FROM programs p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `
    const params: any[] = []

    // If not authenticated, only show published programs
    if (!decoded) {
      sql += ' AND p.status = ?'
      params.push('published')
    } else {
      // Only admin sees all programs, others see their organization's programs
      if (decoded.role !== 'admin' && decoded.organizationId) {
        sql += ' AND p.organization_id = ?'
        params.push(decoded.organizationId)
      }
    }

    if (status && decoded) {
      // Only allow status filter for authenticated users
      sql += ' AND p.status = ?'
      params.push(status)
    }

    if (search) {
      sql += ' AND (p.title LIKE ? OR p.description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const programs = await query(sql, params) as any[]

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM programs p WHERE 1=1'
    const countParams: any[] = []

    if (!decoded) {
      countSql += ' AND p.status = ?'
      countParams.push('published')
    } else {
      if (decoded.role !== 'admin' && decoded.organizationId) {
        countSql += ' AND p.organization_id = ?'
        countParams.push(decoded.organizationId)
      }
    }

    if (status && decoded) {
      countSql += ' AND p.status = ?'
      countParams.push(status)
    }

    if (search) {
      countSql += ' AND (p.title LIKE ? OR p.description LIKE ?)'
      countParams.push(`%${search}%`, `%${search}%`)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      programs: programs.map(program => ({
        ...program,
        enrollment_fee: Number(program.enrollment_fee) || 0,
        max_students: program.max_students ? Number(program.max_students) : null,
        enrolled_count: Number(program.enrolled_count) || 0,
        exam_count: Number(program.exam_count) || 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Get programs error:', error)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

// POST - Create a new program
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'teacher')) {
      return NextResponse.json({ error: 'Only admins and teachers can create programs' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      instructions,
      cover_image,
      enrollment_fee = 0,
      max_students,
      status = 'draft',
      start_date,
      end_date,
      proctoring_enabled,
      allow_answer_change,
      show_question_counter,
      allow_answer_review
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const programId = uuidv4()

    await query(
      `INSERT INTO programs 
       (id, organization_id, created_by, title, description, instructions, cover_image, enrollment_fee, max_students, status, start_date, end_date, proctoring_enabled, allow_answer_change, show_question_counter, allow_answer_review) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        programId,
        decoded.organizationId || null,
        decoded.userId,
        title,
        description || null,
        instructions || null,
        cover_image || null,
        enrollment_fee,
        max_students || null,
        status,
        start_date || null,
        end_date || null,
        proctoring_enabled ? 1 : 0,
        allow_answer_change !== false ? 1 : 0,
        show_question_counter !== false ? 1 : 0,
        allow_answer_review !== false ? 1 : 0
      ]
    )

    const [newProgram] = await query(
      'SELECT * FROM programs WHERE id = ?',
      [programId]
    ) as any[]

    return NextResponse.json({
      success: true,
      message: 'Program created successfully',
      program: newProgram
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create program error:', error)
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
  }
}
