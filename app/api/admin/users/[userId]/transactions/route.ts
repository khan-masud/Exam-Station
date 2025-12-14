import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { verifyToken, parseTokenFromHeader } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const authHeader = request.headers.get("authorization")
    let token = parseTokenFromHeader(authHeader)
    
    if (!token) {
      token = request.cookies.get("auth_token")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get transaction history for the user from actual transactions table
    const transactions: any = await query(`
      SELECT 
        t.id,
        'payment' as type,
        CONCAT(t.payment_gateway, ' - Payment') as description,
        t.amount,
        t.created_at as date,
        t.payment_status as status,
        t.transaction_reference as referenceId,
        t.payment_proof as proofImage
      FROM transactions t
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 100
    `, [userId || null])

    // Also get program enrollment history as transactions
    const enrollments: any = await query(`
      SELECT 
        CONCAT('enrollment-', pe.id) as id,
        'enrollment' as type,
        CONCAT('Enrolled in: ', p.title) as description,
        CAST(p.enrollment_fee AS DECIMAL(10,2)) as amount,
        pe.enrolled_at as date,
        CASE 
          WHEN pe.payment_status = 'completed' OR pe.payment_status = 'paid' THEN 'completed'
          ELSE pe.payment_status
        END as status,
        pe.id as referenceId
      FROM program_enrollments pe
      LEFT JOIN programs p ON pe.program_id = p.id
      WHERE pe.user_id = ?
      ORDER BY pe.enrolled_at DESC
      LIMIT 100
    `, [userId || null])

    // Combine and sort all transactions by date
    const allTransactions = [...(transactions || []), ...(enrollments || [])]
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      transactions: allTransactions || []
    })
  } catch (error) {
    console.error("Fetch transaction history error:", error)
    return NextResponse.json({ error: "Failed to fetch transaction history" }, { status: 500 })
  }
}
