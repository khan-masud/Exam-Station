import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// GET - Fetch all topics
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      console.log('[Topics API] No auth token provided')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      console.log('[Topics API] Invalid token')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('[Topics API] Fetching topics for user:', decoded.userId)

    const [topics] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, slug, color FROM topics WHERE is_active = 1 ORDER BY name'
    )

    console.log('[Topics API] Found', topics.length, 'topics')

    return NextResponse.json({ topics: topics || [] })
  } catch (error) {
    console.error('[Topics API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch topics', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
