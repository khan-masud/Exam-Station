import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'

// PUT - Update coupon
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
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

    // Check if coupon exists
    const [existing] = await pool.query(
      'SELECT id FROM coupons WHERE id = ?',
      [id]
    ) as any

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    // If updating code, check for duplicates
    if (code) {
      const [duplicate] = await pool.query(
        'SELECT id FROM coupons WHERE code = ? AND id != ?',
        [code.toUpperCase(), id]
      ) as any

      if (duplicate.length > 0) {
        return NextResponse.json({ 
          error: 'Coupon code already exists' 
        }, { status: 400 })
      }
    }

    await pool.query(`
      UPDATE coupons SET
        code = ?,
        discount_type = ?,
        discount_value = ?,
        min_amount = ?,
        max_discount = ?,
        usage_limit = ?,
        per_user_limit = ?,
        valid_from = ?,
        valid_until = ?,
        applicable_to = ?,
        applicable_items = ?,
        is_active = ?
      WHERE id = ?
    `, [
      code?.toUpperCase(),
      discount_type,
      discount_value,
      min_amount || null,
      max_discount || null,
      usage_limit || null,
      per_user_limit,
      valid_from || null,
      valid_until || null,
      applicable_to,
      applicable_items ? JSON.stringify(applicable_items) : null,
      is_active,
      id
    ])

    return NextResponse.json({ 
      success: true,
      message: 'Coupon updated successfully' 
    })
  } catch (error) {
    console.error('Failed to update coupon:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

// DELETE - Delete coupon
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Check if coupon has been used
    const [usage] = await pool.query(
      'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?',
      [id]
    ) as any

    if (Array.isArray(usage) && usage[0]?.count > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete coupon that has been used. Deactivate it instead.' 
      }, { status: 400 })
    }

    await pool.query('DELETE FROM coupons WHERE id = ?', [id])

    return NextResponse.json({ 
      success: true,
      message: 'Coupon deleted successfully' 
    })
  } catch (error) {
    console.error('Failed to delete coupon:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}
