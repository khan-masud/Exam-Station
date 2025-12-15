import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Simple token retrieval from cookies
    const token = req.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Only admins can export
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const format = searchParams.get('format') || 'csv'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 })
    }

    if (!['csv', 'xml'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

    // Fetch transactions within date range
    const queryStr = `
      SELECT 
        t.id,
        t.amount,
        t.payment_gateway as gateway,
        t.payment_status as status,
        t.created_at as date,
        t.transaction_reference as reference,
        t.payment_method,
        t.payment_details,
        t.admin_notes,
        t.user_id,
        t.exam_id,
        u.full_name as user_name,
        u.email as user_email,
        e.title as exam_title,
        p.title as program_title
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN exams e ON t.exam_id = e.id
      LEFT JOIN programs p ON JSON_UNQUOTE(JSON_EXTRACT(t.payment_details, '$.program_id')) = p.id
      WHERE DATE(t.created_at) >= DATE(?) AND DATE(t.created_at) <= DATE(?)
      ORDER BY t.created_at DESC
    `
    
    const rows = await query(queryStr, [startDate, endDate]) as any[]

    if (format === 'csv') {
      const csvContent = generateCSV(rows)
      
      const response = new NextResponse(csvContent)
      response.headers.set('Content-Type', 'text/csv; charset=utf-8')
      response.headers.set('Content-Disposition', 'attachment; filename="transactions.csv"')
      return response
    } else {
      const xmlContent = generateXML(rows)
      console.log('[Export API] Generated XML, size:', xmlContent.length)
      
      const response = new NextResponse(xmlContent)
      response.headers.set('Content-Type', 'application/xml; charset=utf-8')
      response.headers.set('Content-Dispos
    }
  } catch (error: any) {
    console.error('[Export API] Error:', error)
    console.error('[Export API] Error details:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      stack: error.stack
    })
    return NextResponse.json(
      { error: 'Failed to export transactions', details: error.message },
      { status: 500 }
    )
  }
}

function generateCSV(rows: any[]) {
  const headers = [
    'Transaction ID',
    'Date',
    'Student Name',
    'Email',
    'Amount',
    'Status',
    'Gateway',
    'Payment Method',
    'Exam',
    'Program',
    'Reference',
    'Admin Notes'
  ]

  const csvContent = [
    headers.join(','),
    ...rows.map(row => {
      const date = new Date(row.date).toLocaleString()
      const amount = typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount
      return [
        escapeCSV(row.id),
        escapeCSV(date),
        escapeCSV(row.user_name || 'N/A'),
        escapeCSV(row.user_email || 'N/A'),
        amount.toFixed(2),
        escapeCSV(row.status || 'N/A'),
        escapeCSV(row.gateway || 'N/A'),
        escapeCSV(row.payment_method || 'N/A'),
        escapeCSV(row.exam_title || 'N/A'),
        escapeCSV(row.program_title || 'N/A'),
        escapeCSV(row.reference || 'N/A'),
        escapeCSV(row.admin_notes || '')
      ].join(',')
    })
  ].join('\n')

  return csvContent
}

function generateXML(rows: any[]) {
  let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xmlContent += '<transactions>\n'

  rows.forEach(row => {
    const date = new Date(row.date).toLocaleString()
    const amount = typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount
    xmlContent += '  <transaction>\n'
    xmlContent += `    <id>${escapeXML(row.id)}</id>\n`
    xmlContent += `    <date>${escapeXML(date)}</date>\n`
    xmlContent += `    <student>\n`
    xmlContent += `      <name>${escapeXML(row.user_name || 'N/A')}</name>\n`
    xmlContent += `      <email>${escapeXML(row.user_email || 'N/A')}</email>\n`
    xmlContent += `    </student>\n`
    xmlContent += `    <amount>${amount.toFixed(2)}</amount>\n`
    xmlContent += `    <status>${escapeXML(row.status || 'N/A')}</status>\n`
    xmlContent += `    <payment>\n`
    xmlContent += `      <gateway>${escapeXML(row.gateway || 'N/A')}</gateway>\n`
    xmlContent += `      <method>${escapeXML(row.payment_method || 'N/A')}</method>\n`
    xmlContent += `      <reference>${escapeXML(row.reference || 'N/A')}</reference>\n`
    xmlContent += `    </payment>\n`
    xmlContent += `    <enrollment>\n`
    xmlContent += `      <exam>${escapeXML(row.exam_title || 'N/A')}</exam>\n`
    xmlContent += `      <program>${escapeXML(row.program_title || 'N/A')}</program>\n`
    xmlContent += `    </enrollment>\n`
    if (row.admin_notes) {
      xmlContent += `    <admin_notes>${escapeXML(row.admin_notes)}</admin_notes>\n`
    }
    xmlContent += '  </transaction>\n'
  })

  xmlContent += '</transactions>'

  return xmlContent
}

function escapeCSV(value: string) {
  if (typeof value !== 'string') return String(value)
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"` 
  }
  return value
}

function escapeXML(value: string) {
  if (typeof value !== 'string') return String(value)
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
