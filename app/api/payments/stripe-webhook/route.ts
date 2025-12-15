import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import Stripe from 'stripe'
import { sendEmail } from '@/lib/email'

// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover'
    })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ 
        error: 'Stripe is not configured' 
      }, { status: 500 })
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const transactionId = session.metadata?.transactionId

      if (transactionId) {
        await query(
          'UPDATE transactions SET status = ?, paid_at = NOW(), updated_at = NOW() WHERE id = ?',
          ['completed', transactionId]
        )

        const txnRows = await query(
          'SELECT t.*, u.email, u.full_name, e.title as exam_title FROM transactions t JOIN users u ON t.user_id = u.id JOIN exams e ON t.exam_id = e.id WHERE t.id = ?',
          [transactionId]
        ) as any[]

        if (txnRows && txnRows.length > 0) {
          const txn = txnRows[0]
          
          await sendEmail({
            to: txn.email,
            subject: 'Payment Successful - ' + txn.exam_title,
            html: '<h1>Payment Confirmed</h1><p>Your payment of ' + txn.amount + ' ' + txn.currency + ' has been received for ' + txn.exam_title + '.</p><p>Transaction ID: ' + transactionId + '</p>'
          })
        }
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const transactionId = session.metadata?.transactionId

      if (transactionId) {
        await query(
          'UPDATE transactions SET status = ?, updated_at = NOW() WHERE id = ?',
          ['failed', transactionId]
        )
      }
    }

    return NextResponse.json({ received: true })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
