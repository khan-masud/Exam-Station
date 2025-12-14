import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// Get all topics
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
    const parentId = searchParams.get('parentId')
    const activeOnly = searchParams.get('activeOnly') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let sql = 'SELECT * FROM topics WHERE 1=1'
    const params: any[] = []

    if (parentId) {
      sql += ' AND parent_id = ?'
      params.push(parentId)
    } else if (parentId === null) {
      sql += ' AND parent_id IS NULL'
    }

    if (activeOnly) {
      sql += ' AND is_active = TRUE'
    }

    // Get total count
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
    const [countResult] = await query(countSql, params) as any[]
    const total = countResult?.total || 0

    sql += ' ORDER BY name ASC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const topics = await query(sql, params) as any[]

    // Get question count for each topic
    const topicsWithCount = await Promise.all(
      topics.map(async (topic) => {
        const counts = await query(
          'SELECT COUNT(*) as count FROM question_topics WHERE topic_id = ?',
          [topic.id]
        ) as any[]
        return {
          ...topic,
          questionCount: counts[0]?.count || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      topics: topicsWithCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Get topics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    )
  }
}

// Create new topic
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
    const { name, description, parentId, color, icon } = body

    if (!name) {
      return NextResponse.json({ error: 'Topic name required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const topicId = uuidv4()

    await query(
      `INSERT INTO topics (id, name, slug, description, parent_id, color, icon)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [topicId, name, slug, description || null, parentId || null, color || '#3b82f6', icon || null]
    )

    return NextResponse.json({
      success: true,
      topicId,
      message: 'Topic created successfully'
    })

  } catch (error: any) {
    console.error('Create topic error:', error)
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    )
  }
}

// Update topic
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
    const { topicId, name, description, color, icon, isActive } = body

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID required' }, { status: 400 })
    }

    const updates = []
    const values = []

    if (name !== undefined) {
      updates.push('name = ?')
      values.push(name)
      updates.push('slug = ?')
      values.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    }
    if (description !== undefined) {
      updates.push('description = ?')
      values.push(description)
    }
    if (color !== undefined) {
      updates.push('color = ?')
      values.push(color)
    }
    if (icon !== undefined) {
      updates.push('icon = ?')
      values.push(icon)
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?')
      values.push(isActive)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    values.push(topicId)
    await query(
      `UPDATE topics SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    )

    return NextResponse.json({
      success: true,
      message: 'Topic updated successfully'
    })

  } catch (error: any) {
    console.error('Update topic error:', error)
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    )
  }
}

// Delete topic
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('topicId')

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID required' }, { status: 400 })
    }

    await query('DELETE FROM topics WHERE id = ?', [topicId])

    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete topic error:', error)
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    )
  }
}
