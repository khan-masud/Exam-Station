import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - List all coupons
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const [coupons] = await pool.query(`
      SELECT 
        c.*,
        u.full_name as created_by_name,
        u.email as created_by_email
      FROM coupons c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `) as any

    // Validate that coupons is an array
    if (!Array.isArray(coupons)) {
      console.error('Expected coupons to be an array, got:', typeof coupons)
      return NextResponse.json({ coupons: [] })
    }

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error('Failed to fetch coupons:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

// POST - Create new coupon
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const {
      code,
      discount_type,
      discount_value,
      min_amount,
      max_discount,
      usage_limit,
      per_user_limit,
      valid_from,
      valid_until,
      applicable_to,
      applicable_items,
      is_active
    } = await req.json()

    // Validate required fields
    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ 
        error: 'Code, discount type, and discount value are required' 
      }, { status: 400 })
    }

    // Validate discount value
    if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
      return NextResponse.json({ 
        error: 'Percentage discount must be between 0 and 100' 
      }, { status: 400 })
    }

    if (discount_value <= 0) {
      return NextResponse.json({ 
        error: 'Discount value must be greater than 0' 
      }, { status: 400 })
    }

    // Check if code already exists
    const [existing] = await pool.query(
      'SELECT id FROM coupons WHERE code = ?',
      [code.toUpperCase()]
    ) as any

    if (existing.length > 0) {
      return NextResponse.json({ 
        error: 'Coupon code already exists' 
      }, { status: 400 })
    }

    const [result] = await pool.query(`
      INSERT INTO coupons (
        code, discount_type, discount_value,
        min_amount, max_discount, usage_limit, per_user_limit,
        valid_from, valid_until, applicable_to, applicable_items,
        is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code.toUpperCase(),
      discount_type,
      discount_value,
      min_amount || null,
      max_discount || null,
      usage_limit || null,
      per_user_limit || 1,
      valid_from || null,
      valid_until || null,
      applicable_to || 'all',
      applicable_items ? JSON.stringify(applicable_items) : null,
      is_active !== undefined ? is_active : true,
      decoded.userId
    ]) as any

    return NextResponse.json({ 
      success: true,
      message: 'Coupon created successfully',
      couponId: result.insertId
    })
  } catch (error) {
    console.error('Failed to create coupon:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}
