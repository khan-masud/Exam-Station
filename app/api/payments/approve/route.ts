import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { notifyPaymentReceived, notifyPaymentRejected } from '@/lib/notification-service'

// Admin approve/reject manual payment
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { transactionId, action, adminNotes, approve, notes } = body

    // Support both 'action' and 'approve' parameters
    const approvePayment = approve !== undefined ? approve : action === 'approve'
    const finalAction = approvePayment ? 'approve' : 'reject'
    const finalNotes = notes || adminNotes || ''

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      )
    }

    // Get transaction details - handle both exam and program payments
    const transactions = await query(
      `SELECT t.*, 
              e.title as exam_title, 
              p.title as program_title,
              u.email, u.full_name
       FROM transactions t
       LEFT JOIN exams e ON t.exam_id = e.id
       LEFT JOIN programs p ON JSON_EXTRACT(t.payment_details, '$.program_id') = p.id
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ?`,
      [transactionId]
    ) as any[]

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const transaction = transactions[0]
    const currency = transaction.currency || 'BDT' // Default to BDT if not set
    
    // Parse payment details to get program_id
    let paymentDetails = {}
    try {
      paymentDetails = typeof transaction.payment_details === 'string' 
        ? JSON.parse(transaction.payment_details) 
        : transaction.payment_details || {}
    } catch (e) {
      console.error('Error parsing payment details:', e)
    }

    const programId = (paymentDetails as any).program_id
    const examId = transaction.exam_id || (paymentDetails as any).exam_id

    // Check if already processed (using payment_status column)
    const currentStatus = transaction.payment_status || transaction.status
    if (currentStatus === 'approved' || currentStatus === 'completed' || currentStatus === 'cancelled' || currentStatus === 'rejected') {
      return NextResponse.json(
        { error: 'Transaction has already been processed' },
        { status: 400 }
      )
    }

    const newStatus = finalAction === 'approve' ? 'approved' : 'cancelled'
    
    // Update transaction (using payment_status for compatibility)
    await query(
      `UPDATE transactions 
       SET payment_status = ?, 
           admin_notes = ?, 
           approved_by = ?, 
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [newStatus, finalNotes, decoded.userId, transactionId]
    )

    // If approved, enroll student in exam or program
    if (finalAction === 'approve') {
      const enrollmentId = require('uuid').v4()
      
      if (programId) {
        // Enroll in program
        const existing = await query(
          'SELECT id FROM program_enrollments WHERE program_id = ? AND user_id = ?',
          [programId, transaction.user_id]
        ) as any[]

        if (existing.length === 0) {
          await query(
            `INSERT INTO program_enrollments (id, program_id, user_id, enrolled_at, status, payment_status, transaction_id)
             VALUES (?, ?, ?, NOW(), 'active', 'paid', ?)`,
            [enrollmentId, programId, transaction.user_id, transactionId]
          )
        } else {
          await query(
            `UPDATE program_enrollments 
             SET payment_status = 'paid', status = 'active', transaction_id = ?
             WHERE program_id = ? AND user_id = ?`,
            [transactionId, programId, transaction.user_id]
          )
        }
      } else if (examId) {
        // Enroll in exam
        await query(
          `INSERT INTO exam_enrollments (id, exam_id, student_id, enrollment_date, payment_status)
           VALUES (?, ?, ?, NOW(), 'paid')
           ON DUPLICATE KEY UPDATE payment_status = 'paid', updated_at = NOW()`,
          [enrollmentId, examId, transaction.user_id]
        )
      }
    }

    // Send in-app notification
    try {
      const itemTitle = transaction.program_title || transaction.exam_title || 'Item'
      
      console.log('[Payment Approve] Sending notification to user:', transaction.user_id);
      
      if (finalAction === 'approve') {
        const notificationId = await notifyPaymentReceived(
          transaction.user_id,
          transactionId,
          transaction.amount,
          itemTitle,
          currency
        );
        console.log('[Payment Approve] Approval notification sent:', notificationId);
      } else {
        const notificationId = await notifyPaymentRejected(
          transaction.user_id,
          transactionId,
          transaction.amount,
          finalNotes,
          currency
        );
        console.log('[Payment Approve] Rejection notification sent:', notificationId);
      }
    } catch (notifError: any) {
      console.error('[Payment Approve] Failed to send in-app notification:', notifError);
      console.error('[Payment Approve] Error details:', {
        message: notifError.message,
        stack: notifError.stack,
        userId: transaction.user_id,
        transactionId
      });
      // Don't fail the request if notification fails
    }

    // Send email notification
    try {
      const itemTitle = transaction.program_title || transaction.exam_title || 'Item'
      
      await sendEmail({
        to: transaction.email,
        subject: `Payment ${finalAction === 'approve' ? 'Approved' : 'Rejected'} - ${itemTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${finalAction === 'approve' ? '#10b981' : '#ef4444'};">
              Payment ${finalAction === 'approve' ? 'Approved' : 'Rejected'}
            </h2>
            <p>Dear ${transaction.full_name},</p>
            <p>Your manual payment for <strong>${itemTitle}</strong> has been ${finalAction === 'approve' ? 'approved' : 'rejected'}.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Amount:</strong> ${transaction.currency || 'USD'} ${transaction.amount}</p>
              <p><strong>Payment Method:</strong> ${transaction.payment_method || 'N/A'}</p>
              <p><strong>Status:</strong> ${newStatus}</p>
            </div>

            ${finalNotes ? `<p><strong>Admin Notes:</strong> ${finalNotes}</p>` : ''}

            ${finalAction === 'approve' 
              ? '<p style="color: #10b981;">You are now enrolled. Good luck!</p>' 
              : '<p style="color: #ef4444;">Please contact support for more information.</p>'}

            <p>Best regards,<br/>Exam System Team</p>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: `Payment ${finalAction}d successfully`,
      status: newStatus
    })

  } catch (error: any) {
    console.error('Approve payment error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment approval' },
      { status: 500 }
    )
  }
}

// Get all pending manual payments (Admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending_approval'

    const transactions = await query(
      `SELECT t.*, e.title as exam_title, u.full_name, u.email, u.phone
       FROM transactions t
       JOIN exams e ON t.exam_id = e.id
       JOIN users u ON t.user_id = u.id
       WHERE t.gateway = 'manual' AND t.status = ?
       ORDER BY t.created_at DESC`,
      [status]
    ) as any[]

    const formattedTransactions = transactions.map(t => ({
      ...t,
      payment_details: JSON.parse(t.payment_details || '{}')
    }))

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions
    })

  } catch (error: any) {
    console.error('Get pending payments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending payments' },
      { status: 500 }
    )
  }
}
