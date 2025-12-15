import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import Stripe from 'stripe'

// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover'
    })
  : null

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

    const body = await request.json()
    const { examId, gateway, amount, currency = 'USD' } = body

    if (!examId || !gateway || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: examId, gateway, amount' },
        { status: 400 }
      )
    }

    const validGateways = ['stripe', 'paypal', 'sslcommerz', 'bkash']
    if (!validGateways.includes(gateway)) {
      return NextResponse.json({ error: 'Invalid payment gateway' }, { status: 400 })
    }

    const examRows = await query(
      'SELECT id, title, exam_fee FROM exams WHERE id = ?',
      [examId]
    ) as any[]

    if (!examRows || examRows.length === 0) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    const exam = examRows[0]
    const transactionId = uuidv4()

    await query(
      'INSERT INTO transactions (id, user_id, exam_id, amount, currency, gateway, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [transactionId, decoded.userId, examId, amount, currency, gateway, 'pending']
    )

    let paymentData: any = {}

    if (gateway === 'stripe') {
      if (!stripe) {
        return NextResponse.json({ 
          error: 'Stripe is not configured. Please contact administrator.' 
        }, { status: 500 })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { name: exam.title },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: process.env.NEXT_PUBLIC_APP_URL + '/student/payments/success?session_id={CHECKOUT_SESSION_ID}&transaction_id=' + transactionId,
        cancel_url: process.env.NEXT_PUBLIC_APP_URL + '/student/payments/cancel?transaction_id=' + transactionId,
        customer_email: decoded.email,
        metadata: { transactionId, userId: decoded.userId },
      })

      paymentData = {
        gatewayTransactionId: session.id,
        checkoutUrl: session.url,
        metadata: { sessionId: session.id }
      }
    } else {
      paymentData = {
        gatewayTransactionId: transactionId,
        checkoutUrl: process.env.NEXT_PUBLIC_APP_URL + '/student/payments/' + gateway + '?transaction_id=' + transactionId,
        metadata: { amount, currency, description: exam.title }
      }
    }

    await query(
      'UPDATE transactions SET gateway_transaction_id = ?, metadata = ? WHERE id = ?',
      [paymentData.gatewayTransactionId || null, JSON.stringify(paymentData.metadata || {}), transactionId]
    )

    return NextResponse.json({
      success: true,
      transactionId,
      gateway,
      ...paymentData
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Payment initiation failed' },
      { status: 500 }
    )
  }
}
