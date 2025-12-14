import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

// POST - Validate and apply coupon
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

    const { code, amount, itemType, itemId } = await req.json()

    if (!code || !amount) {
      return NextResponse.json({ 
        error: 'Coupon code and amount are required' 
      }, { status: 400 })
    }

    // Fetch coupon
    const [coupons] = await pool.query(
      'SELECT * FROM coupons WHERE code = ? AND is_active = TRUE',
      [code.toUpperCase()]
    ) as any

    if (coupons.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or inactive coupon code',
        valid: false 
      }, { status: 400 })
    }

    const coupon = coupons[0]

    // Check if coupon is valid (date range)
    const now = new Date()
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json({ 
        error: 'Coupon is not yet valid',
        valid: false 
      }, { status: 400 })
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json({ 
        error: 'Coupon has expired',
        valid: false 
      }, { status: 400 })
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ 
        error: 'Coupon usage limit reached',
        valid: false 
      }, { status: 400 })
    }

    // Check per-user limit
    const [userUsage] = await pool.query(
      'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
      [coupon.id, decoded.userId]
    ) as any

    if (coupon.per_user_limit && userUsage[0].count >= coupon.per_user_limit) {
      return NextResponse.json({ 
        error: 'You have already used this coupon the maximum number of times',
        valid: false 
      }, { status: 400 })
    }

    // Check minimum amount
    if (coupon.min_amount && amount < coupon.min_amount) {
      return NextResponse.json({ 
        error: `Minimum amount of ${coupon.min_amount} required to use this coupon`,
        valid: false 
      }, { status: 400 })
    }

    // Check applicable items
    if (coupon.applicable_to !== 'all') {
      if (!itemType || !itemId) {
        return NextResponse.json({ 
          error: 'Item information required for this coupon',
          valid: false 
        }, { status: 400 })
      }

      // Parse applicable items from JSON string
      let applicableIds = []
      if (coupon.applicable_items) {
        try {
          // If it's already an object/array, use it; otherwise parse it
          applicableIds = typeof coupon.applicable_items === 'string' 
            ? JSON.parse(coupon.applicable_items) 
            : coupon.applicable_items
          
          // If it's a comma-separated string of IDs, split it
          if (typeof applicableIds === 'string') {
            applicableIds = applicableIds.split(',').map((id: string) => id.trim()).filter((id: string) => id)
          }
        } catch (e) {
          // If JSON parse fails, try comma-separated
          applicableIds = coupon.applicable_items.split(',').map((id: string) => id.trim()).filter((id: string) => id)
        }
      }
      
      if (coupon.applicable_to === 'programs' && itemType !== 'program') {
        return NextResponse.json({ 
          error: 'This coupon is only valid for specific programs',
          valid: false 
        }, { status: 400 })
      }

      if (coupon.applicable_to === 'exams' && itemType !== 'exam') {
        return NextResponse.json({ 
          error: 'This coupon is only valid for specific exams',
          valid: false 
        }, { status: 400 })
      }

      if (applicableIds.length > 0 && !applicableIds.includes(itemId.toString())) {
        return NextResponse.json({ 
          error: 'This coupon is not applicable to this item',
          valid: false 
        }, { status: 400 })
      }
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = (amount * coupon.discount_value) / 100
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount
      }
    } else {
      discountAmount = coupon.discount_value
    }

    // Ensure discount doesn't exceed amount
    if (discountAmount > amount) {
      discountAmount = amount
    }

    const finalAmount = amount - discountAmount

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value
      },
      originalAmount: amount,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      finalAmount: parseFloat(finalAmount.toFixed(2))
    })
  } catch (error) {
    console.error('Failed to validate coupon:', error)
    return NextResponse.json({ 
      error: 'Failed to validate coupon',
      valid: false 
    }, { status: 500 })
  }
}
