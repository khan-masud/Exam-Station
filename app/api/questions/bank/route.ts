import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

// Search and filter questions from question bank
export async function GET(request: NextRequest) {
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
    const search = searchParams.get('search') || ''
    const subjectId = searchParams.get('subjectId')
    const type = searchParams.get('type')
    const difficulty = searchParams.get('difficulty')
    const topicId = searchParams.get('topicId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let sql = `
      SELECT DISTINCT q.*, 
             s.name as subject_name,
             GROUP_CONCAT(DISTINCT t.name) as topic_names,
             GROUP_CONCAT(DISTINCT t.id) as topic_ids
      FROM questions q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN question_topics qt ON q.id = qt.question_id
      LEFT JOIN topics t ON qt.topic_id = t.id
      WHERE 1=1
    `
    const params: any[] = []

    // Search filter
    if (search) {
      sql += ' AND (q.question_text LIKE ? OR q.explanation LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    // Subject filter
    if (subjectId) {
      sql += ' AND q.subject_id = ?'
      params.push(subjectId)
    }

    // Type filter
    if (type) {
      sql += ' AND q.type = ?'
      params.push(type)
    }

    // Difficulty filter
    if (difficulty) {
      sql += ' AND q.difficulty_level = ?'
      params.push(difficulty)
    }

    // Topic filter
    if (topicId) {
      sql += ' AND qt.topic_id = ?'
      params.push(topicId)
    }

    sql += ' GROUP BY q.id ORDER BY q.created_at DESC'

    // Get total count
    const countSql = `SELECT COUNT(DISTINCT q.id) as total FROM questions q 
                      LEFT JOIN question_topics qt ON q.id = qt.question_id
                      WHERE 1=1 ${search ? 'AND (q.question_text LIKE ? OR q.explanation LIKE ?)' : ''}
                      ${subjectId ? 'AND q.subject_id = ?' : ''}
                      ${type ? 'AND q.type = ?' : ''}
                      ${difficulty ? 'AND q.difficulty_level = ?' : ''}
                      ${topicId ? 'AND qt.topic_id = ?' : ''}`

    const countResult = await query(countSql, params) as any[]
    const total = countResult[0]?.total || 0

    // Get paginated results
    sql += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const questions = await query(sql, params) as any[]

    // Parse topic IDs and names
    const formattedQuestions = questions.map(q => ({
      ...q,
      topics: q.topic_ids ? q.topic_ids.split(',').map((id: string, idx: number) => ({
        id,
        name: q.topic_names?.split(',')[idx] || ''
      })) : [],
      tags: q.tags ? JSON.parse(q.tags) : []
    }))

    return NextResponse.json({
      success: true,
      questions: formattedQuestions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Question bank search error:', error)
    return NextResponse.json(
      { error: 'Failed to search questions' },
      { status: 500 }
    )
  }
}
