import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    // Try multiple ways to get the token
    let token = null
    
    // Method 1: From cookies() function
    try {
      const cookieStore = await cookies()
      token = cookieStore.get('auth_token')?.value
    } catch (cookieError: any) {
    }
    
    // Method 2: From request headers (fallback)
    if (!token) {
      token = req.cookies.get('auth_token')?.value
    }
    
    // Method 3: From Authorization header (fallback)
    if (!token) {
      const authHeader = req.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }


    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (decoded) {
    }
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit


    const statusFilter = (new URL(req.url)).searchParams.get('status') || 'all'
    const search = (new URL(req.url)).searchParams.get('search') || ''

    // Build base select
    let queryStr = `
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
    `

    // Build WHERE clauses depending on role, status and search
    const whereClauses: string[] = []
    const whereParams: any[] = []

    if (decoded.role === 'student') {
      whereClauses.push('t.user_id = ?')
      whereParams.push(decoded.userId)
    }

    if (statusFilter && statusFilter !== 'all') {
      whereClauses.push('t.payment_status = ?')
      whereParams.push(statusFilter)
    }

    if (search) {
      whereClauses.push(`(
        t.id LIKE ? OR
        t.transaction_reference LIKE ? OR
        u.full_name LIKE ? OR
        u.email LIKE ? OR
        e.title LIKE ? OR
        p.title LIKE ? OR
        JSON_UNQUOTE(JSON_EXTRACT(t.payment_details, '\$.transaction_id')) LIKE ?
      )`)
      const like = `%${search}%`
      whereParams.push(like, like, like, like, like, like, like)
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const params: any[] = [...whereParams]

    if (whereClause) {
      queryStr += ` ${whereClause}`
    }

    queryStr += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    // Prepare count query with same filters - include JOINs for search filters
    let countQuery = `
      SELECT COUNT(*) as total FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN exams e ON t.exam_id = e.id
      LEFT JOIN programs p ON JSON_UNQUOTE(JSON_EXTRACT(t.payment_details, '$.program_id')) = p.id
    `


    let rows: any[] = []
    try {
      rows = await query(queryStr, params) as any[]
    } catch (dbError: any) {
      return NextResponse.json({ 
        error: 'Database query failed',
        details: dbError.message
      }, { status: 500 })
    }

    // Fetch total count for pagination
    let totalCount = 0
    try {
      if (whereClause) {
        countQuery += ` ${whereClause}`
      }
      const [countRow]: any = await query(countQuery, whereParams)
      totalCount = countRow?.total || 0
    } catch (countError: any) {
      totalCount = 0
    }

    // Get summary statistics
    let summaryQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN payment_status IN ('approved', 'completed') THEN amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN amount ELSE 0 END), 0) as refunded_amount,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN payment_status IN ('failed', 'cancelled', 'rejected') THEN 1 ELSE 0 END), 0) as failed_count
      FROM transactions
    `
    const summaryParams: any[] = []
    if (decoded.role === 'student') {
      summaryQuery += ' WHERE user_id = ?'
      summaryParams.push(decoded.userId)
    }
    
    let summaryRows: any[] = []
    try {
      summaryRows = await query(summaryQuery, summaryParams) as any[]
    } catch (summaryError: any) {
      return NextResponse.json({ 
        error: 'Summary query failed',
        details: summaryError.message
      }, { status: 500 })
    }

    const transactions = rows.map((row: any) => ({
      id: row.id,
      amount: parseFloat(row.amount),
      gateway: row.gateway,
      payment_gateway: row.gateway,
      status: row.status,
      payment_status: row.status,
      date: row.date,
      created_at: row.date,
      reference: row.reference,
      transaction_reference: row.reference,
      payment_method: row.payment_method,
      payment_details: row.payment_details,
      user_id: row.user_id,
      exam_id: row.exam_id,
      userName: row.user_name,
      userEmail: row.user_email,
      examTitle: row.exam_title,
      programTitle: row.program_title
    }))


    return NextResponse.json({ 
      transactions,
      summary: {
        totalTransactions: summaryRows[0]?.total_transactions || 0,
        totalRevenue: parseFloat(summaryRows[0]?.total_revenue || '0'),
        refundedAmount: parseFloat(summaryRows[0]?.refunded_amount || '0'),
        pendingAmount: parseFloat(summaryRows[0]?.pending_amount || '0'),
        failedCount: summaryRows[0]?.failed_count || 0
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit))
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch payments',
      details: error.message
    }, { status: 500 })
  }
}
