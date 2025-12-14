import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'
import { notifySupportReply, notifyAdminTicketReply } from '@/lib/notification-service'

// POST - Add message to ticket with optional attachments
export async function POST(req: NextRequest) {
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

    const contentType = req.headers.get('content-type') || ''
    let finalTicketId: string
    let finalMessage: string
    let files: File[] = []

    // Handle both JSON and FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      finalTicketId = formData.get('ticket_id') as string || formData.get('ticketId') as string
      finalMessage = formData.get('message_text') as string || formData.get('message') as string
      
      // Get all attached files
      const fileEntries = formData.getAll('attachments')
      files = fileEntries.filter(f => f instanceof File) as File[]
    } else {
      const body = await req.json()
      finalTicketId = body.ticket_id || body.ticketId
      finalMessage = body.message_text || body.message
    }

    if (!finalTicketId || !finalMessage) {
      return NextResponse.json({ error: 'Ticket ID and message are required' }, { status: 400 })
    }

    // Verify ticket exists and user has permission
    const [tickets] = await pool.query(
      `SELECT * FROM support_tickets WHERE id = ?`,
      [finalTicketId]
    ) as any

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ticket = tickets[0]

    // Check permission
    if (decoded.role === 'student' && ticket.student_id !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (decoded.role === 'admin' && ticket.admin_id && ticket.admin_id !== decoded.userId) {
      // Admin can only respond to their assigned tickets
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messageId = uuidv4()
    const isAdminResponse = decoded.role === 'admin'

    // Add message
    await pool.query(
      `INSERT INTO support_ticket_messages (id, ticket_id, sender_id, message_text, is_admin_response)
       VALUES (?, ?, ?, ?, ?)`,
      [messageId, finalTicketId, decoded.userId, finalMessage, isAdminResponse]
    )

    // Update ticket status if it was closed and student is responding
    if (ticket.status === 'closed' && decoded.role === 'student') {
      await pool.query(
        `UPDATE support_tickets SET status = 'reopened', updated_at = NOW() WHERE id = ?`,
        [finalTicketId]
      )
    }

    // If admin is responding, set ticket to in_progress if not already
    if (isAdminResponse && ticket.status === 'open') {
      await pool.query(
        `UPDATE support_tickets SET status = 'in_progress', admin_id = ?, updated_at = NOW() WHERE id = ?`,
        [decoded.userId, finalTicketId]
      )
    }

    // Send in-app notification if admin replied to student ticket
    if (isAdminResponse && ticket.student_id) {
      try {
        console.log('[Support Message] Sending reply notification to student:', ticket.student_id);
        const notificationId = await notifySupportReply(
          ticket.student_id,
          finalTicketId,
          ticket.title || ticket.subject || 'your ticket'
        );
        console.log('[Support Message] Reply notification sent:', notificationId);
      } catch (notifError: any) {
        console.error('[Support Message] Failed to send support reply notification:', notifError);
        console.error('[Support Message] Error details:', {
          message: notifError.message,
          stack: notifError.stack,
          studentId: ticket.student_id,
          ticketId: finalTicketId
        });
        // Don't fail the request if notification fails
      }
    }

    // Send notification to admin if student replied to ticket
    if (!isAdminResponse && ticket.student_id) {
      try {
        console.log('[Support Message] Sending ticket reply notification to admins');
        const [userInfo] = await pool.query(
          `SELECT full_name FROM users WHERE id = ?`,
          [decoded.userId]
        ) as any;
        
        const notificationId = await notifyAdminTicketReply(
          finalTicketId,
          ticket.title || ticket.subject || 'Support Ticket',
          userInfo[0]?.full_name || 'Student'
        );
        console.log('[Support Message] Admin notification sent:', notificationId);
      } catch (notifError: any) {
        console.error('[Support Message] Failed to send admin notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    // Handle file attachments
    const attachmentData = []
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'support-tickets', finalTicketId)
      
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        const uniqueFilename = `${uuidv4()}-${file.name}`
        const filepath = path.join(uploadDir, uniqueFilename)
        
        await writeFile(filepath, buffer)
        
        const attachmentId = uuidv4()
        const dbFilePath = `/uploads/support-tickets/${finalTicketId}/${uniqueFilename}`
        
        await pool.query(
          `INSERT INTO support_ticket_attachments (id, ticket_id, message_id, file_name, file_path, mime_type, size)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [attachmentId, finalTicketId, messageId, file.name, dbFilePath, file.type, file.size]
        )

        attachmentData.push({
          id: attachmentId,
          file_name: file.name,
          file_path: dbFilePath,
          mime_type: file.type,
          size: file.size
        })
      }
    }

    return NextResponse.json({
      success: true,
      message_id: messageId,
      sender_id: decoded.userId,
      attachments: attachmentData,
      message: {
        id: messageId,
        ticket_id: finalTicketId,
        senderId: decoded.userId,
        messageText: finalMessage,
        isAdminResponse,
        createdAt: new Date().toISOString(),
        attachments: attachmentData
      }
    })
  } catch (error) {
    console.error('Add message error:', error)
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 })
  }
}
