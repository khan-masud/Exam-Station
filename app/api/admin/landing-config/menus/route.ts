import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch menu items
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const menuLocation = searchParams.get('location')
    const menuId = searchParams.get('id')

    if (menuId) {
      const [items] = await pool.query(
        `SELECT * FROM landing_menu_items WHERE id = ?`,
        [menuId]
      ) as any

      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
      }

      const item = items[0]
      return NextResponse.json({
        menuItem: {
          ...item,
          visible_for_roles: item.visible_for_roles ? 
            (typeof item.visible_for_roles === 'string' ? JSON.parse(item.visible_for_roles) : item.visible_for_roles) : null,
        }
      })
    }

    // Get active config
    const [configs] = await pool.query(
      `SELECT id FROM landing_config WHERE is_active = TRUE LIMIT 1`
    ) as any

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'Landing configuration not found' }, { status: 404 })
    }

    const configId = configs[0].id

    let query = `SELECT * FROM landing_menu_items WHERE config_id = ?`
    const params: any[] = [configId]

    if (menuLocation) {
      query += ` AND menu_location = ?`
      params.push(menuLocation)
    }

    query += ` ORDER BY menu_location, display_order ASC`

    const [menuItems] = await pool.query(query, params) as any

    const parsedMenuItems = menuItems.map((item: any) => ({
      ...item,
      visible_for_roles: item.visible_for_roles ? 
        (typeof item.visible_for_roles === 'string' ? JSON.parse(item.visible_for_roles) : item.visible_for_roles) : null,
    }))

    // Group by menu location
    const groupedMenus: any = {}
    parsedMenuItems.forEach((item: any) => {
      if (!groupedMenus[item.menu_location]) {
        groupedMenus[item.menu_location] = []
      }
      groupedMenus[item.menu_location].push(item)
    })

    return NextResponse.json({ 
      menuItems: parsedMenuItems,
      groupedMenus 
    })
  } catch (error) {
    console.error('Get menu items error:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

// POST - Create new menu item
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

    const body = await req.json()
    const {
      menuLocation,
      label,
      url,
      linkType = 'internal',
      icon,
      parentId,
      displayOrder,
      isVisible = true,
      visibleForRoles,
      showWhenLoggedIn,
      customClasses,
      badgeText,
      badgeColor,
      openInNewTab = false,
    } = body

    if (!menuLocation || !label) {
      return NextResponse.json({ error: 'Menu location and label are required' }, { status: 400 })
    }

    // Get active config
    const [configs] = await pool.query(
      `SELECT id FROM landing_config WHERE is_active = TRUE LIMIT 1`
    ) as any

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'Landing configuration not found' }, { status: 404 })
    }

    const configId = configs[0].id
    const menuId = uuidv4()

    // If displayOrder not provided, put at the end
    let order = displayOrder
    if (order === undefined || order === null) {
      const [maxOrder] = await pool.query(
        `SELECT MAX(display_order) as max_order FROM landing_menu_items 
         WHERE config_id = ? AND menu_location = ?`,
        [configId, menuLocation]
      ) as any
      order = (maxOrder[0]?.max_order || 0) + 1
    }

    await pool.query(
      `INSERT INTO landing_menu_items (
        id, config_id, menu_location, label, url, link_type, icon,
        parent_id, display_order, is_visible, visible_for_roles, show_when_logged_in,
        custom_classes, badge_text, badge_color, open_in_new_tab
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        menuId, configId, menuLocation, label, url, linkType, icon,
        parentId, order, isVisible, 
        visibleForRoles ? JSON.stringify(visibleForRoles) : null,
        showWhenLoggedIn, customClasses, badgeText, badgeColor, openInNewTab
      ]
    )

    return NextResponse.json({ 
      message: 'Menu item created successfully',
      menuId 
    })
  } catch (error) {
    console.error('Create menu item error:', error)
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}

// PUT - Update menu item
export async function PUT(req: NextRequest) {
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

    const body = await req.json()
    const {
      menuId,
      label,
      url,
      linkType,
      icon,
      parentId,
      displayOrder,
      isVisible,
      visibleForRoles,
      showWhenLoggedIn,
      customClasses,
      badgeText,
      badgeColor,
      openInNewTab,
    } = body

    if (!menuId) {
      return NextResponse.json({ error: 'Menu ID is required' }, { status: 400 })
    }

    await pool.query(
      `UPDATE landing_menu_items SET
        label = COALESCE(?, label),
        url = COALESCE(?, url),
        link_type = COALESCE(?, link_type),
        icon = COALESCE(?, icon),
        parent_id = COALESCE(?, parent_id),
        display_order = COALESCE(?, display_order),
        is_visible = COALESCE(?, is_visible),
        visible_for_roles = COALESCE(?, visible_for_roles),
        show_when_logged_in = COALESCE(?, show_when_logged_in),
        custom_classes = COALESCE(?, custom_classes),
        badge_text = COALESCE(?, badge_text),
        badge_color = COALESCE(?, badge_color),
        open_in_new_tab = COALESCE(?, open_in_new_tab),
        updated_at = NOW()
      WHERE id = ?`,
      [
        label, url, linkType, icon, parentId, displayOrder, isVisible,
        visibleForRoles ? JSON.stringify(visibleForRoles) : null,
        showWhenLoggedIn, customClasses, badgeText, badgeColor, openInNewTab,
        menuId
      ]
    )

    return NextResponse.json({ message: 'Menu item updated successfully' })
  } catch (error) {
    console.error('Update menu item error:', error)
    return NextResponse.json({ error: 'Failed to update menu item' }, { status: 500 })
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
    const menuId = searchParams.get('id')

    if (!menuId) {
      return NextResponse.json({ error: 'Menu ID is required' }, { status: 400 })
    }

    // Check for child menu items
    const [children] = await pool.query(
      `SELECT id FROM landing_menu_items WHERE parent_id = ?`,
      [menuId]
    ) as any

    if (children && children.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete menu item with child items. Please delete children first.' 
      }, { status: 400 })
    }

    await pool.query(`DELETE FROM landing_menu_items WHERE id = ?`, [menuId])

    return NextResponse.json({ message: 'Menu item deleted successfully' })
  } catch (error) {
    console.error('Delete menu item error:', error)
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
}

// PATCH - Reorder menu items (bulk update)
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can reorder menu items' }, { status: 403 })
    }

    const body = await req.json()
    const { menuItems } = body

    if (!Array.isArray(menuItems) || menuItems.length === 0) {
      return NextResponse.json({ error: 'Menu items array is required' }, { status: 400 })
    }

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      for (const item of menuItems) {
        if (item.id && item.displayOrder !== undefined) {
          await connection.query(
            `UPDATE landing_menu_items SET display_order = ? WHERE id = ?`,
            [item.displayOrder, item.id]
          )
        }
      }

      await connection.commit()
      return NextResponse.json({ message: 'Menu items reordered successfully' })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Reorder menu items error:', error)
    return NextResponse.json({ error: 'Failed to reorder menu items' }, { status: 500 })
  }
}
