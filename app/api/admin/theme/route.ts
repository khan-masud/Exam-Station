import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch all themes or specific theme
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const themeId = searchParams.get('id')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // Get theme(s)
    let query = `SELECT * FROM theme_settings`
    const params: any[] = []

    if (themeId) {
      query += ` WHERE id = ?`
      params.push(themeId)
    } else if (activeOnly) {
      query += ` WHERE is_active = TRUE`
    }

    query += ` ORDER BY created_at DESC`

    const [themes] = await pool.query(query, params) as any

    if (themeId && themes.length === 0) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // If single theme requested, return full config with sections and menus
    if (themeId && themes.length > 0) {
      const theme = themes[0]

      // Get page sections
      const [sections] = await pool.query(
        `SELECT * FROM theme_page_sections WHERE theme_id = ? ORDER BY display_order`,
        [themeId]
      ) as any

      // Get menu items
      const [menuItems] = await pool.query(
        `SELECT * FROM theme_menu_items WHERE theme_id = ? ORDER BY menu_location, display_order`,
        [themeId]
      ) as any

      // Get custom CSS
      const [customCss] = await pool.query(
        `SELECT custom_css FROM theme_custom_css WHERE theme_id = ?`,
        [themeId]
      ) as any

      return NextResponse.json({
        theme,
        sections,
        menuItems,
        customCss: customCss[0]?.custom_css || ''
      })
    }

    return NextResponse.json({ themes })
  } catch (error) {
    console.error('Get theme error:', error)
    return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 })
  }
}

// POST - Create new theme
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create themes' }, { status: 403 })
    }

    const {
      name,
      description,
      primaryColor,
      secondaryColor,
      accentColor,
      backgroundColor,
      textColor,
      borderColor,
      successColor,
      warningColor,
      dangerColor,
      mutedColor,
      fontFamilyHeading,
      fontFamilyBody,
      fontSizeBase,
      fontWeightRegular,
      fontWeightMedium,
      fontWeightBold,
      lineHeightNormal,
      borderRadius,
      containerMaxWidth,
      sidebarWidth,
      headerHeight,
      spacingUnit,
      shadowSm,
      shadowMd,
      shadowLg,
      logoUrl,
      faviconUrl,
      siteName
    } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Theme name is required' }, { status: 400 })
    }

    const themeId = uuidv4()

    const [result] = await pool.query(
      `INSERT INTO theme_settings (
        id, name, description, is_active, 
        primary_color, secondary_color, accent_color, background_color, text_color, border_color,
        success_color, warning_color, danger_color, muted_color,
        font_family_heading, font_family_body, font_size_base,
        font_weight_regular, font_weight_medium, font_weight_bold, line_height_normal,
        border_radius, container_max_width, sidebar_width, header_height, spacing_unit,
        shadow_sm, shadow_md, shadow_lg, logo_url, favicon_url, site_name, created_by
      ) VALUES (?, ?, ?, FALSE, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        themeId, name, description,
        primaryColor || '#3b82f6', secondaryColor || '#8b5cf6', accentColor || '#ec4899',
        backgroundColor || '#ffffff', textColor || '#1f2937', borderColor || '#e5e7eb',
        successColor || '#10b981', warningColor || '#f59e0b', dangerColor || '#ef4444',
        mutedColor || '#6b7280',
        fontFamilyHeading || 'system-ui, -apple-system, sans-serif',
        fontFamilyBody || 'system-ui, -apple-system, sans-serif',
        fontSizeBase || 16,
        fontWeightRegular || 400, fontWeightMedium || 500, fontWeightBold || 700,
        lineHeightNormal || 1.5,
        borderRadius || 6, containerMaxWidth || 1280, sidebarWidth || 256, headerHeight || 64,
        spacingUnit || 4,
        shadowSm, shadowMd, shadowLg,
        logoUrl, faviconUrl, siteName, decoded.userId
      ]
    ) as any

    // Log audit
    await pool.query(
      `INSERT INTO theme_audit_log (id, theme_id, action, changed_by) VALUES (?, ?, 'created', ?)`,
      [uuidv4(), themeId, decoded.userId]
    )

    return NextResponse.json({
      success: true,
      themeId,
      theme: {
        id: themeId,
        name,
        description,
        isActive: false
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create theme error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create theme' },
      { status: 500 }
    )
  }
}

// PATCH - Update theme
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update themes' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const themeId = searchParams.get('id')

    if (!themeId) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 })
    }

    const updates = await req.json()

    // Build dynamic update query
    const setClauses: string[] = []
    const values: any[] = []

    const allowedFields = [
      'name', 'description', 'is_active',
      'primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_color',
      'border_color', 'success_color', 'warning_color', 'danger_color', 'muted_color',
      'font_family_heading', 'font_family_body', 'font_size_base', 'font_weight_regular',
      'font_weight_medium', 'font_weight_bold', 'line_height_normal', 'border_radius',
      'container_max_width', 'sidebar_width', 'header_height', 'spacing_unit',
      'shadow_sm', 'shadow_md', 'shadow_lg', 'logo_url', 'favicon_url', 'site_name'
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

    values.push(themeId)

    // If is_active is true, deactivate all other themes
    if (updates.is_active === true) {
      await pool.query(`UPDATE theme_settings SET is_active = FALSE WHERE id != ?`, [themeId])
    }

    const [result] = await pool.query(
      `UPDATE theme_settings SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    // Log audit
    await pool.query(
      `INSERT INTO theme_audit_log (id, theme_id, action, changed_by, changed_fields)
       VALUES (?, ?, 'updated', ?, ?)`,
      [uuidv4(), themeId, decoded.userId, JSON.stringify(Object.keys(updates))]
    )

    return NextResponse.json({
      success: true,
      message: 'Theme updated successfully'
    })
  } catch (error: any) {
    console.error('Update theme error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update theme' },
      { status: 500 }
    )
  }
}

// DELETE - Delete theme
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete themes' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const themeId = searchParams.get('id')

    if (!themeId) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 })
    }

    // Check if theme is active
    const [themes] = await pool.query(
      `SELECT is_active FROM theme_settings WHERE id = ?`,
      [themeId]
    ) as any

    if (!Array.isArray(themes) || themes.length === 0) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    }

    if (themes[0]?.is_active) {
      return NextResponse.json({ error: 'Cannot delete active theme' }, { status: 400 })
    }

    // Delete theme (cascade will handle related records)
    await pool.query(`DELETE FROM theme_settings WHERE id = ?`, [themeId])

    // Log audit
    await pool.query(
      `INSERT INTO theme_audit_log (id, theme_id, action, changed_by) VALUES (?, ?, 'deleted', ?)`,
      [uuidv4(), themeId, decoded.userId]
    )

    return NextResponse.json({ success: true, message: 'Theme deleted successfully' })
  } catch (error: any) {
    console.error('Delete theme error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete theme' },
      { status: 500 }
    )
  }
}
