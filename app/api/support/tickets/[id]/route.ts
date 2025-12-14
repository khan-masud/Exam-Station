import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Get ticket details with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params

    // Get ticket
    const [tickets] = await pool.query(
      `SELECT st.*, 
              u1.full_name as student_name, u1.email as student_email,
              u2.full_name as admin_name
       FROM support_tickets st
       JOIN users u1 ON st.student_id = u1.id
       LEFT JOIN users u2 ON st.admin_id = u2.id
       WHERE st.id = ?`,
      [id]
    ) as any

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ticket = tickets[0]

    // Check permission
    if (decoded.role === 'student' && ticket.student_id !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get messages with attachments
    const [messages] = await pool.query(
      `SELECT stm.*, u.full_name as sender_name, u.email as sender_email
       FROM support_ticket_messages stm
       JOIN users u ON stm.sender_id = u.id
       WHERE stm.ticket_id = ?
       ORDER BY stm.created_at ASC`,
      [id]
    ) as any

    // Get attachments for each message
    const [attachments] = await pool.query(
      `SELECT * FROM support_ticket_attachments WHERE ticket_id = ? ORDER BY created_at ASC`,
      [id]
    ) as any

    // Group attachments by message_id if they have one, or assign to ticket
    const attachmentsByMessage = {} as any
    attachments.forEach((att: any) => {
      const key = att.message_id || 'ticket'
      if (!attachmentsByMessage[key]) {
        attachmentsByMessage[key] = []
      }
      attachmentsByMessage[key].push(att)
    })

    return NextResponse.json({
      ticket: { ...ticket, attachments: attachmentsByMessage['ticket'] || [] },
      messages: messages.map((msg: any) => ({
        ...msg,
        attachments: attachmentsByMessage[msg.id] || []
      }))
    })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json({ error: 'Failed to fetch ticket' }, { status: 500 })
  }
}

// PATCH - Update ticket status (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update tickets' }, { status: 403 })
    }

    const { id } = await params
    const { status, admin_id } = await req.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed', 'reopened']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const resolvedAt = (status === 'resolved' || status === 'closed') ? now : null

    await pool.query(
      `UPDATE support_tickets 
       SET status = ?, admin_id = ?, updated_at = ?, resolved_at = ?
       WHERE id = ?`,
      [status, admin_id || decoded.userId, now, resolvedAt, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}
