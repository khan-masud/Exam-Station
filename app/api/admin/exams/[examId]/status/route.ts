import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

// PATCH - Update exam status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
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

    const { examId } = await params
    const { status } = await req.json()

    console.log('[Status Update] Received request:', { examId, status })

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['draft', 'published']
    if (!validStatuses.includes(status)) {
      console.error('[Status Update] Invalid status:', status)
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const result = await pool.execute(
      'UPDATE exams SET status = ? WHERE id = ?',
      [status, examId]
    )
    
    console.log('[Status Update] Update result:', result)

    return NextResponse.json({ success: true, message: 'Exam status updated successfully' })
  } catch (error) {
    console.error('Update exam status error:', error)
    return NextResponse.json({ error: 'Failed to update exam status' }, { status: 500 })
  }
}
