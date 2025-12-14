import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'

// GET - Fetch all subjects
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [subjects] = await pool.execute<RowDataPacket[]>(
      'SELECT id, name, description FROM subjects ORDER BY name'
    )

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error('Subjects fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 })
  }
}
