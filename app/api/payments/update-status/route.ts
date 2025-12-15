import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { sendEmail } from '@/lib/email'

// Admin update payment status
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
    const { transactionId, status, notes } = body

    if (!transactionId || !status) {
      return NextResponse.json(
        { error: 'Transaction ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'cancelled', 'refunded', 'failed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Get transaction details
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
    const oldStatus = transaction.payment_status || transaction.status

    // Parse payment details to get program_id
    let paymentDetails = {}
    try {
      paymentDetails = typeof transaction.payment_details === 'string' 
        ? JSON.parse(transaction.payment_details) 
        : transaction.payment_details || {}
    } catch (e) {
      // Error parsing payment details
    }

    const programId = (paymentDetails as any).program_id
    const examId = transaction.exam_id || (paymentDetails as any).exam_id

    // Update transaction status
    // Append new notes to existing notes if both exist
    let finalNotes = notes || ''
    if (transaction.admin_notes && notes && transaction.admin_notes.trim() !== notes.trim()) {
      // Only append if the new notes are different from existing ones
      const timestamp = new Date().toLocaleString()
      finalNotes = transaction.admin_notes + '\n---\n' + `[${timestamp}] ` + notes
    }

    await query(
      `UPDATE transactions 
       SET payment_status = ?, 
           admin_notes = ?, 
           approved_by = ?, 
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      [status, finalNotes || '', decoded.userId, transactionId]
    )

    // Handle enrollment based on status change
    if (status === 'approved' && oldStatus !== 'approved') {
      // Enrolling student
      const enrollmentId = require('uuid').v4()
      
      if (programId) {
        // Enroll in program
        const existing = await query(
          'SELECT id FROM program_enrollments WHERE program_id = ? AND user_id = ?',
          [programId, transaction.user_id]
        ) as any[]

        if (existing.length === 0) {
          await query(
            `INSERT INTO program_enrollments (id, program_id, user_id, enrolled_at, payment_status)
             VALUES (?, ?, ?, NOW(), 'paid')`,
            [enrollmentId, programId, transaction.user_id]
          )
        }
      } else if (examId) {
        // Enroll in exam
        const existing = await query(
          'SELECT id FROM exam_enrollments WHERE exam_id = ? AND user_id = ?',
          [examId, transaction.user_id]
        ) as any[]

        if (existing.length === 0) {
          await query(
            `INSERT INTO exam_enrollments (id, exam_id, user_id, enrolled_at, payment_status)
             VALUES (?, ?, ?, NOW(), 'paid')`,
            [enrollmentId, examId, transaction.user_id]
          )
        }
      }
    } else if ((status === 'cancelled' || status === 'refunded') && (oldStatus === 'approved')) {
      // Removing enrollment if payment is cancelled/refunded after approval
      if (programId) {
        await query(
          'DELETE FROM program_enrollments WHERE program_id = ? AND user_id = ?',
          [programId, transaction.user_id]
        )
      } else if (examId) {
        await query(
          'DELETE FROM exam_enrollments WHERE exam_id = ? AND user_id = ?',
          [examId, transaction.user_id]
        )
      }
    }

    // Send email notification to student
    try {
      const statusMessages: Record<string, string> = {
        approved: 'Your payment has been approved and you have been enrolled.',
        cancelled: 'Your payment has been cancelled.',
        refunded: 'Your payment has been refunded.',
        failed: 'Your payment has failed.',
        pending: 'Your payment is pending review.'
      }

      await sendEmail({
        to: transaction.email,
        subject: `Payment Status Updated - ${status.toUpperCase()}`,
        html: `
          <h2>Payment Status Update</h2>
          <p>Dear ${transaction.full_name},</p>
          <p>${statusMessages[status]}</p>
          <p><strong>Transaction Details:</strong></p>
          <ul>
            <li>Amount: $${transaction.amount}</li>
            <li>Status: ${status.toUpperCase()}</li>
            <li>Reference: ${transaction.transaction_reference || transaction.id}</li>
            ${transaction.exam_title ? `<li>Exam: ${transaction.exam_title}</li>` : ''}
            ${transaction.program_title ? `<li>Program: ${transaction.program_title}</li>` : ''}
          </ul>
          ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
          <p>If you have any questions, please contact support.</p>
        `
      })
    } catch (emailError) {
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: `Payment status updated to ${status}`,
      oldStatus,
      newStatus: status
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to update payment status',
      details: error.message
    }, { status: 500 })
  }
}
