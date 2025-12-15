import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { notifyAdminNewTicket } from '@/lib/notification-service'

// Generate sequential ticket ID
async function generateTicketId(): Promise<string> {
  try {
    const [rows] = await pool.query(
      `SELECT id FROM support_tickets ORDER BY created_at DESC LIMIT 1`
    ) as any
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return 'TK-000001'
    }
    
    const lastId = rows[0]?.id
    // Extract number from format TK-XXXXXX
    const match = lastId.match(/TK-(\d+)/)
    if (match) {
      const nextNum = parseInt(match[1]) + 1
      return `TK-${nextNum.toString().padStart(6, '0')}`
    }
    
    return 'TK-000001'
  } catch (error) {
    return `TK-${Date.now().toString().slice(-6)}`
  }
}

// GET - List support tickets
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const offset = (page - 1) * limit

    // For students - show their own tickets
    // For admins - show all tickets or assigned to them
    let query = `
      SELECT st.*, 
             u1.full_name as student_name,
             u2.full_name as admin_name,
             COUNT(stm.id) as message_count
      FROM support_tickets st
      JOIN users u1 ON st.student_id = u1.id
      LEFT JOIN users u2 ON st.admin_id = u2.id
      LEFT JOIN support_ticket_messages stm ON st.id = stm.ticket_id
    `
    const params: any[] = []

    if (decoded.role === 'student') {
      query += ` WHERE st.student_id = ?`
      params.push(decoded.userId)
    } else if (decoded.role === 'admin') {
      // Admins see all tickets
      query += ` WHERE 1=1`
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (status) {
      query += ` AND st.status = ?`
      params.push(status)
    }

    if (priority) {
      query += ` AND st.priority = ?`
      params.push(priority)
    }

    query += ` GROUP BY st.id ORDER BY st.created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const [tickets] = await pool.query(query, params) as any

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM support_tickets st`
    const countParams: any[] = []

    if (decoded.role === 'student') {
      countQuery += ` WHERE st.student_id = ?`
      countParams.push(decoded.userId)
    }

    if (status) {
      countQuery += ` AND st.status = ?`
      countParams.push(status)
    }

    if (priority) {
      countQuery += ` AND st.priority = ?`
      countParams.push(priority)
    }

    const [countResult] = await pool.query(countQuery, countParams) as any
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

// POST - Create new support ticket
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ error: 'Only students can create tickets' }, { status: 403 })
    }

    const formData = await req.formData()
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const priority = formData.get('priority') as string
    const files = formData.getAll('attachments') as File[]

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const ticketId = await generateTicketId()
    const messageId = uuidv4()

    // Create ticket
    await pool.query(
      `INSERT INTO support_tickets (id, student_id, title, description, category, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, 'open')`,
      [ticketId, decoded.userId, title, description, category || 'other', priority || 'medium']
    )

    // Create initial message
    await pool.query(
      `INSERT INTO support_ticket_messages (id, ticket_id, sender_id, message_text, is_admin_response)
       VALUES (?, ?, ?, ?, FALSE)`,
      [messageId, ticketId, decoded.userId, description]
    )

    // Handle file uploads
    if (files && files.length > 0) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'support-tickets', ticketId)
      await mkdir(uploadsDir, { recursive: true })

      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          continue
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filename = `${uuidv4()}-${file.name.replace(/[^a-z0-9.-]/gi, '_')}`
        const filepath = join(uploadsDir, filename)

        await writeFile(filepath, buffer)

        // Save attachment metadata to database
        const attachmentId = uuidv4()
        await pool.query(
          `INSERT INTO support_ticket_attachments (id, ticket_id, file_name, file_path, mime_type, size)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            attachmentId,
            ticketId,
            file.name,
            `/uploads/support-tickets/${ticketId}/${filename}`,
            file.type,
            file.size
          ]
        )
      }
    }

    // Notify all admins about new ticket
    try {
      const [userInfo] = await pool.query(
        `SELECT full_name FROM users WHERE id = ?`,
        [decoded.userId]
      ) as any
      
      const result = await notifyAdminNewTicket(
        ticketId,
        title,
        userInfo[0]?.full_name || 'Student'
      )
      
      // Log for debugging
      if (result && result.length > 0) {
        return NextResponse.json({
          success: true,
          ticket_id: ticketId,
          ticket: {
            id: ticketId,
            title,
            description,
            category,
            priority,
            status: 'open'
          },
          notifications_sent: result.length
        })
      }
    } catch (notifError: any) {
      // Log the error details
      return NextResponse.json({
        success: true,
        ticket_id: ticketId,
        ticket: {
          id: ticketId,
          title,
          description,
          category,
          priority,
          status: 'open'
        },
        notification_error: notifError.message || 'Failed to send notifications'
      })
    }

    return NextResponse.json({
      success: true,
      ticket_id: ticketId,
      ticket: {
        id: ticketId,
        title,
        description,
        category,
        priority,
        status: 'open'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
