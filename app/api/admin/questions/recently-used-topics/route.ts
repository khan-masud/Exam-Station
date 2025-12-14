import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// GET - Fetch recently used topics (most recent 5)
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

    // Get recently used topics from the questions table
    // Parse topics from the topics column and get unique, recent ones
    const [questions] = await pool.execute<RowDataPacket[]>(
      `SELECT topics, created_at FROM questions 
       WHERE topics IS NOT NULL AND topics != ''
       ORDER BY created_at DESC
       LIMIT 20`
    )

    console.log('[Recently Used Topics] Found questions with topics:', (questions as any[]).length)

    // Parse topics from questions and extract unique topic names, keeping order by recency
    const topicMap = new Map<string, { name: string; lastSeen: Date }>()
    
    for (const q of questions as any[]) {
      const topicNames = q.topics
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0)
      
      console.log('[Recently Used Topics] Question topics:', q.topics, '-> parsed:', topicNames)
      
      for (const name of topicNames) {
        if (!topicMap.has(name)) {
          topicMap.set(name, { name, lastSeen: new Date(q.created_at) })
        }
      }
    }

    // Get unique topic names, sorted by recency
    const uniqueTopics = Array.from(topicMap.values()).slice(0, 5)
    
    console.log('[Recently Used Topics] Unique topics:', uniqueTopics.map(t => t.name))
    
    if (uniqueTopics.length === 0) {
      console.log('[Recently Used Topics] No topics found, returning empty array')
      return NextResponse.json({ topics: [] })
    }

    // Return topic names as simple objects (no need to look up in topics table since it's empty)
    const topicsResult = uniqueTopics.map((t, idx) => ({
      id: `topic-${idx}`,
      name: t.name,
      slug: t.name.toLowerCase().replace(/\s+/g, '-'),
      color: '#3b82f6' // Default blue color
    }))

    console.log('[Recently Used Topics] Returning:', topicsResult.length, 'topics')
    return NextResponse.json({ topics: topicsResult })
  } catch (error) {
    console.error('Fetch recently used topics error:', error)
    return NextResponse.json({ error: 'Failed to fetch recently used topics', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
