import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { getPaymentSettings } from '@/lib/settings'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { notifyAdminNewPayment } from '@/lib/notification-service'

// Manual payment initiation (admin approval required)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ CHECK: Are manual payments allowed?
    const paymentSettings = await getPaymentSettings()
    if (!paymentSettings.allowManualPayments) {
      return NextResponse.json({ 
        error: 'Manual payments are currently disabled by the administrator. Please use online payment methods.' 
      }, { status: 403 })
    }

    let body: any = {}
    let paymentProofUrl: string | null = null
    const contentType = request.headers.get('content-type') || ''
    
    try {
      if (contentType.includes('application/json')) {
        // Handle JSON request
        const rawBody = await request.text()
        body = JSON.parse(rawBody)
      } else if (contentType.includes('multipart/form-data')) {
        // Handle FormData request
        const formData = await request.formData()
        
        // Handle file upload if present
        const receiptFile = formData.get('receipt') as File | null
        if (receiptFile && receiptFile.size > 0) {
          // Validate file type (images only)
          const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
          if (!allowedTypes.includes(receiptFile.type)) {
            return NextResponse.json({ 
              error: 'Invalid file type. Only images are allowed.' 
            }, { status: 400 })
          }

          // Validate file size (max 5MB)
          const maxSize = 5 * 1024 * 1024 // 5MB
          if (receiptFile.size > maxSize) {
            return NextResponse.json({ 
              error: 'File too large. Maximum size is 5MB.' 
            }, { status: 400 })
          }

          // Create uploads directory if it doesn't exist
          const uploadsDir = join(process.cwd(), 'public', 'uploads', 'payment-receipts')
          if (!existsSync(uploadsDir)) {
            await mkdir(uploadsDir, { recursive: true })
          }

          // Generate unique filename
          const timestamp = Date.now()
          const randomString = Math.random().toString(36).substring(2, 8)
          const extension = receiptFile.name.split('.').pop()
          const filename = `receipt_${timestamp}_${randomString}.${extension}`

          // Save file
          const filepath = join(uploadsDir, filename)
          const bytes = await receiptFile.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filepath, buffer)

          // Store URL
          paymentProofUrl = `/uploads/payment-receipts/${filename}`
        }
        
        // Convert FormData to object
        body = {
          examId: formData.get('examId'),
          programId: formData.get('programId'),
          amount: formData.get('amount'),
          currency: formData.get('currency'),
          paymentMethod: formData.get('paymentMethod') || formData.get('paymentMethodId'),
          paymentDetails: formData.get('paymentDetails') ? JSON.parse(formData.get('paymentDetails') as string) : undefined,
          transactionId: formData.get('transactionId'),
          notes: formData.get('notes'),
          couponId: formData.get('couponId'),
          originalAmount: formData.get('originalAmount'),
          discountAmount: formData.get('discountAmount')
        }
      } else {
        // Try to parse as JSON anyway
        const rawBody = await request.text()
        body = JSON.parse(rawBody)
      }
    } catch (error: any) {
      console.error('Request parsing error:', error)
      console.error('Error message:', error.message)
      return NextResponse.json({ 
        error: 'Invalid request data. Please ensure all fields are filled correctly.' 
      }, { status: 400 })
    }
    
    // ✅ Use currency from settings as default
    const { 
      examId, 
      programId, 
      amount, 
      currency = paymentSettings.currency, 
      paymentMethod, 
      paymentDetails, 
      transactionId: userTransactionId, 
      notes,
      couponId,
      originalAmount,
      discountAmount
    } = body


    // Either examId or programId must be provided
    if ((!examId && !programId) || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields: (examId or programId), amount, paymentMethod' },
        { status: 400 }
      )
    }

    // Validate amount
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a positive number.' },
        { status: 400 }
      )
    }

    // Validate payment method
    const validMethods = ['bank_transfer', 'cash', 'mobile_money', 'cheque', 'other']
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    let itemTitle = ''
    let itemFee = 0

    // Get exam or program details
    if (examId) {
      const examRows = await query(
        'SELECT id, title, exam_fee FROM exams WHERE id = ?',
        [examId]
      ) as any[]

      if (!examRows || examRows.length === 0) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }

      itemTitle = examRows[0].title
      itemFee = examRows[0].exam_fee
    } else if (programId) {
      const programRows = await query(
        'SELECT id, title, enrollment_fee FROM programs WHERE id = ?',
        [programId]
      ) as any[]

      if (!programRows || programRows.length === 0) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 })
      }

      itemTitle = programRows[0].title
      itemFee = programRows[0].enrollment_fee
    }

    const transactionDbId = uuidv4()
    const paymentDetailsObj = {
      payment_method_name: paymentDetails?.payment_method_name || '',
      transaction_id: userTransactionId,
      notes: notes || '',
      item_title: itemTitle,
      payment_proof: paymentProofUrl, // Store the uploaded receipt URL (null if no file uploaded)
      // Store program_id in details since transactions table doesn't have it
      program_id: programId || null,
      exam_id: examId || null
    }

    // ✅ CHECK: Should we auto-approve manual payments?
    const paymentStatus = paymentSettings.autoApprovePayments ? 'approved' : 'pending'

    // Create transaction with existing column names
    // Note: Using payment_gateway and payment_status (not gateway/status) until migration is run
    await query(
      `INSERT INTO transactions 
       (id, user_id, exam_id, amount, currency, payment_gateway, payment_status, payment_method, payment_details, payment_proof, transaction_reference, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        transactionDbId, 
        decoded.userId, 
        examId || null, 
        amount, 
        currency, 
        'manual', 
        paymentStatus, 
        paymentMethod, 
        JSON.stringify(paymentDetailsObj),
        paymentProofUrl,
        userTransactionId
      ]
    )

    // Record coupon usage if coupon was applied
    if (couponId && originalAmount && discountAmount) {
      const couponUsageId = uuidv4()
      try {
        await query(
          `INSERT INTO coupon_usage (id, coupon_id, user_id, transaction_id, original_amount, discount_amount, final_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            couponUsageId,
            couponId,
            decoded.userId,
            transactionDbId,
            parseFloat(originalAmount),
            parseFloat(discountAmount),
            parsedAmount
          ]
        )

        // Increment coupon usage count
        await query(
          'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
          [couponId]
        )
      } catch (couponError) {
        console.error('Failed to record coupon usage:', couponError)
        // Don't fail the payment if coupon tracking fails
      }
    }

    // If auto-approved, enroll student immediately
    if (paymentSettings.autoApprovePayments) {
      if (examId) {
        const enrollmentId = uuidv4()
        
        await query(
          `INSERT INTO exam_enrollments (id, exam_id, student_id, enrollment_date, payment_status)
           VALUES (?, ?, ?, NOW(), 'paid')
           ON DUPLICATE KEY UPDATE payment_status = 'paid', updated_at = NOW()`,
          [enrollmentId, examId, decoded.userId]
        )
      } else if (programId) {
        const enrollmentId = uuidv4()
        
        await query(
          `INSERT INTO program_enrollments (id, program_id, user_id, enrolled_at, status, payment_status, transaction_id)
           VALUES (?, ?, ?, NOW(), 'active', 'paid', ?)
           ON DUPLICATE KEY UPDATE payment_status = 'paid', status = 'active'`,
          [enrollmentId, programId, decoded.userId, transactionDbId]
        )
      }
    }

    // Notify admins about new payment submission
    try {
      const [userInfo] = await query(
        `SELECT full_name FROM users WHERE id = ?`,
        [decoded.userId]
      ) as any;
      
      await notifyAdminNewPayment(
        transactionDbId,
        userInfo[0]?.full_name || 'Student',
        parsedAmount,
        paymentMethod,
        currency
      );
    } catch (notifError) {
      console.error('[Payment] Failed to send admin notification:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      transactionId: transactionDbId,
      message: paymentSettings.autoApprovePayments 
        ? 'Payment approved and enrollment completed'
        : 'Payment submitted for admin approval',
      status: paymentStatus
    })

  } catch (error: any) {
    console.error('Manual payment error:', error)
    return NextResponse.json(
      { error: 'Failed to process manual payment' },
      { status: 500 }
    )
  }
}

// Get manual payment details
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    const transactions = await query(
      `SELECT t.*, e.title as exam_title, u.full_name, u.email
       FROM transactions t
       JOIN exams e ON t.exam_id = e.id
       JOIN users u ON t.user_id = u.id
       WHERE t.id = ? AND (t.user_id = ? OR ? = 'admin')`,
      [transactionId, decoded.userId, decoded.role]
    ) as any[]

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const transaction = transactions[0]
    
    return NextResponse.json({
      success: true,
      transaction: {
        ...transaction,
        payment_details: JSON.parse(transaction.payment_details || '{}')
      }
    })

  } catch (error: any) {
    console.error('Get manual payment error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment details' },
      { status: 500 }
    )
  }
}
