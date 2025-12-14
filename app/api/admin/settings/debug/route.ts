import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

// Temporary debug endpoint (admin-only). Returns admin_settings rows and schema.
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Read table schema and rows
    let schema: any = null
    let rows: any[] = []

    try {
      const [desc] = await pool.query('DESCRIBE admin_settings') as any
      schema = desc
    } catch (err) {
      // Table may not exist or different permissions
      schema = { error: 'DESCRIBE failed', details: String(err) }
    }

    try {
      const [res] = await pool.query('SELECT * FROM admin_settings ORDER BY updated_at DESC LIMIT 500') as any
      rows = res
    } catch (err) {
      rows = [{ error: 'SELECT failed', details: String(err) }]
    }

    return NextResponse.json({ schema, rows })
  } catch (error) {
    console.error('Debug settings endpoint error:', error)
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 })
  }
}
