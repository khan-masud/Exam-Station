import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

// GET - Fetch programs for a student (enrolled programs)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: "Only students can access this endpoint" }, { status: 403 })
    }

    const userId = decoded.userId

    // Get all programs with enrollment status
    const programs = await query(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM program_enrollments WHERE program_id = p.id AND status = 'active') as enrolled_count,
        (SELECT COUNT(*) FROM exam_programs WHERE program_id = p.id) as exam_count,
        pe.id IS NOT NULL as isEnrolled,
        pe.status as enrollmentStatus,
        pe.enrolled_at as enrolledAt,
        (p.max_students IS NOT NULL AND 
         (SELECT COUNT(*) FROM program_enrollments WHERE program_id = p.id AND status = 'active') >= p.max_students) as isFull
      FROM programs p
      LEFT JOIN program_enrollments pe ON p.id = pe.program_id AND pe.user_id = ?
      WHERE p.status = 'published'
      ORDER BY 
        CASE WHEN pe.id IS NOT NULL THEN 0 ELSE 1 END,
        p.created_at DESC
    `, [userId]) as any[]

    return NextResponse.json(programs)
  } catch (error) {
    console.error('Failed to fetch student programs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
