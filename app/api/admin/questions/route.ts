import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// GET - Fetch questions from question bank with filters
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

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const difficulty = searchParams.get('difficulty') || ''
    const subjectId = searchParams.get('subjectId') || ''
    const topicId = searchParams.get('topicId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = `
      SELECT 
        q.id,
        q.question_text,
        q.difficulty_level,
        q.marks,
        q.question_type_id,
        qt.name as question_type,
        s.name as subject_name,
        s.id as subject_id,
        GROUP_CONCAT(DISTINCT t.name) as topics,
        (SELECT COUNT(*) FROM question_options WHERE question_id = q.id) as options_count
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN question_types qt ON q.question_type_id = qt.id
      LEFT JOIN question_topics qto ON q.id = qto.question_id
      LEFT JOIN topics t ON qto.topic_id = t.id
      WHERE 1=1
    `

    const params: any[] = []

    // Search filter
    if (search) {
      query += ` AND q.question_text LIKE ?`
      params.push(`%${search}%`)
    }

    // Difficulty filter
    if (difficulty) {
      query += ` AND q.difficulty_level = ?`
      params.push(difficulty)
    }

    // Subject filter
    if (subjectId) {
      query += ` AND q.subject_id = ?`
      params.push(subjectId)
    }

    // Topic filter
    if (topicId) {
      query += ` AND EXISTS (
        SELECT 1 FROM question_topics qt2 
        WHERE qt2.question_id = q.id AND qt2.topic_id = ?
      )`
      params.push(topicId)
    }

    query += ` GROUP BY q.id, q.question_text, q.difficulty_level, q.marks, 
               q.question_type_id, qt.name, s.name, s.id`
    query += ` ORDER BY q.created_at DESC`
    query += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [questions] = await pool.execute<RowDataPacket[]>(query, params)

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT q.id) as total
      FROM questions q
      LEFT JOIN question_topics qto ON q.id = qto.question_id
      WHERE 1=1
    `
    const countParams: any[] = []

    if (search) {
      countQuery += ` AND q.question_text LIKE ?`
      countParams.push(`%${search}%`)
    }
    if (difficulty) {
      countQuery += ` AND q.difficulty_level = ?`
      countParams.push(difficulty)
    }
    if (subjectId) {
      countQuery += ` AND q.subject_id = ?`
      countParams.push(subjectId)
    }
    if (topicId) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM question_topics qt2 
        WHERE qt2.question_id = q.id AND qt2.topic_id = ?
      )`
      countParams.push(topicId)
    }

    const [countResult] = await pool.execute<RowDataPacket[]>(countQuery, countParams)
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Questions fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
