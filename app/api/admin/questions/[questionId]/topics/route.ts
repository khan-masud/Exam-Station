import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// GET - Fetch topics for a question
export async function GET(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
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

    const { questionId } = await params

    const [topics] = await pool.execute<RowDataPacket[]>(
      `SELECT t.id, t.name, t.slug, t.color
       FROM topics t
       JOIN question_topics qt ON t.id = qt.topic_id
       WHERE qt.question_id = ?`,
      [questionId]
    )

    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Fetch question topics error:', error)
    return NextResponse.json({ error: 'Failed to fetch question topics' }, { status: 500 })
  }
}

// POST - Add topics to question
export async function POST(req: NextRequest, { params }: { params: Promise<{ questionId: string }> }) {
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

    const { questionId } = await params
    const { topicIds } = await req.json()

    if (!Array.isArray(topicIds)) {
      return NextResponse.json({ error: 'Topic IDs must be an array' }, { status: 400 })
    }

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Delete existing topics
      await connection.execute(
        'DELETE FROM question_topics WHERE question_id = ?',
        [questionId]
      )

      // Insert new topics
      for (const topicId of topicIds) {
        await connection.execute(
          'INSERT INTO question_topics (question_id, topic_id) VALUES (?, ?)',
          [questionId, topicId]
        )
      }

      await connection.commit()

      return NextResponse.json({ 
        success: true, 
        message: 'Question topics updated successfully' 
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Update question topics error:', error)
    return NextResponse.json({ error: 'Failed to update question topics' }, { status: 500 })
  }
}
