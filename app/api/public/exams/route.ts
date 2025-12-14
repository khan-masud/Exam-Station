import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Get public exams for landing page (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const offset = (page - 1) * limit

    let sql = `
      SELECT e.*, 
             s.name as subject_name,
             (SELECT COUNT(*) FROM exam_enrollments WHERE exam_id = e.id) as enrolled_count,
             (SELECT AVG(percentage) FROM exam_results WHERE exam_id = e.id) as average_score
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE e.status IN ('scheduled', 'ongoing')
    `
    const params: any[] = []

    if (category) {
      sql += ' AND s.id = ?'
      params.push(category)
    }

    if (search) {
      sql += ' AND (e.title LIKE ? OR e.description LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const exams = await query(sql, params) as any[]

    if (exams.length > 0) {
    }

    // Get total count
    let countSql = `
      SELECT COUNT(*) as total 
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE e.status IN ('scheduled', 'ongoing')
    `
    const countParams: any[] = []

    if (category) {
      countSql += ' AND s.id = ?'
      countParams.push(category)
    }

    if (search) {
      countSql += ' AND (e.title LIKE ? OR e.description LIKE ?)'
      countParams.push(`%${search}%`, `%${search}%`)
    }

    const countResult = await query(countSql, countParams) as any[]
    const total = countResult[0]?.total || 0


    // Also log all exams to debug
    const allExamsDebug = await query(`SELECT id, title, status FROM exams ORDER BY created_at DESC LIMIT 10`) as any[]

    return NextResponse.json({
      success: true,
      exams: exams.map(exam => ({
        ...exam,
        exam_fee: exam.enrollment_fee || 0,
        enrolled_count: parseInt(exam.enrolled_count || '0'),
        average_score: parseFloat(exam.average_score || '0')
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Get public exams error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}
