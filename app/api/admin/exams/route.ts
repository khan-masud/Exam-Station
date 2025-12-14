import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// GET - Fetch all exams
export async function GET(req: NextRequest) {
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

    const [exams] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        e.id, 
        e.title, 
        e.description, 
        e.total_questions, 
        e.total_marks, 
        e.duration_minutes,
        e.exam_date,
        e.status,
        e.negative_marking,
        e.passing_marks,
        s.name as subject_name
       FROM exams e
       LEFT JOIN subjects s ON e.subject_id = s.id
       ORDER BY e.created_at DESC`
    )

    return NextResponse.json({ exams })
  } catch (error) {
    console.error('Exams fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}
