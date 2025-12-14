import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch menu items for a theme
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const themeId = searchParams.get('themeId')
    const menuLocation = searchParams.get('menuLocation')

    if (!themeId) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 })
    }

    let query = `SELECT * FROM theme_menu_items WHERE theme_id = ?`
    const params: any[] = [themeId]

    if (menuLocation) {
      query += ` AND menu_location = ?`
      params.push(menuLocation)
    }

    query += ` ORDER BY menu_location, display_order ASC`

    const [menuItems] = await pool.query(query, params) as any

    return NextResponse.json({ menuItems })
  } catch (error) {
    console.error('Get menu items error:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

// POST - Create menu item
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create menu items' }, { status: 403 })
    }

    const {
      themeId,
      menuLocation,
      menuKey,
      label,
      url,
      icon,
      parentId,
      displayOrder,
      isVisible,
      visibleForRole,
      badgeText,
      badgeColor,
      customClass
    } = await req.json()

    if (!themeId || !menuLocation || !menuKey || !label) {
      return NextResponse.json(
        { error: 'Theme ID, menu location, menu key, and label are required' },
        { status: 400 }
      )
    }

    const menuItemId = uuidv4()

    const [result] = await pool.query(
      `INSERT INTO theme_menu_items (
        id, theme_id, menu_location, menu_key, label, url, icon,
        parent_id, display_order, is_visible, visible_for_role,
        badge_text, badge_color, custom_class
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        menuItemId, themeId, menuLocation, menuKey, label, url, icon,
        parentId || null, displayOrder || 0, isVisible !== false, visibleForRole || 'all',
        badgeText, badgeColor, customClass
      ]
    ) as any

    return NextResponse.json({
      success: true,
      menuItemId,
      menuItem: { id: menuItemId, label, menuKey }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create menu item error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create menu item' },
      { status: 500 }
    )
  }
}

// PATCH - Update menu item
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update menu items' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const menuItemId = searchParams.get('menuItemId')

    if (!menuItemId) {
      return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 })
    }

    const updates = await req.json()

    const setClauses: string[] = []
    const values: any[] = []

    const allowedFields = [
      'label', 'url', 'icon', 'parent_id', 'display_order', 'is_visible',
      'visible_for_role', 'badge_text', 'badge_color', 'custom_class'
    ]

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    values.push(menuItemId)

    const [result] = await pool.query(
      `UPDATE theme_menu_items SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Menu item updated successfully' })
  } catch (error: any) {
    console.error('Update menu item error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

// DELETE - Delete menu item
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete menu items' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const menuItemId = searchParams.get('menuItemId')

    if (!menuItemId) {
      return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 })
    }

    // Delete menu item and its children
    const [result] = await pool.query(
      `DELETE FROM theme_menu_items WHERE id = ? OR parent_id = ?`,
      [menuItemId, menuItemId]
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Menu item and any child items deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete menu item error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}
