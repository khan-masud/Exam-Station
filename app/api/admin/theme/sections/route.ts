import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch page sections for a theme
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const themeId = searchParams.get('themeId')
    const pagePath = searchParams.get('pagePath')

    if (!themeId) {
      return NextResponse.json({ error: 'Theme ID is required' }, { status: 400 })
    }

    let query = `SELECT * FROM theme_page_sections WHERE theme_id = ?`
    const params: any[] = [themeId]

    if (pagePath) {
      query += ` AND page_path = ?`
      params.push(pagePath)
    }

    query += ` ORDER BY display_order ASC`

    const [sections] = await pool.query(query, params) as any

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Get sections error:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

// POST - Create or bulk create page sections
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create sections' }, { status: 403 })
    }

    const {
      themeId,
      pagePath,
      sectionKey,
      sectionName,
      sectionType,
      title,
      subtitle,
      description,
      content,
      backgroundColor,
      textColor,
      paddingTop,
      paddingBottom,
      minHeight,
      backgroundImageUrl,
      backgroundImagePosition,
      backgroundImageRepeat,
      backgroundImageOverlay,
      backgroundImageOpacity,
      ctaText,
      ctaLink,
      ctaVariant
    } = await req.json()

    if (!themeId || !pagePath || !sectionKey) {
      return NextResponse.json(
        { error: 'Theme ID, page path, and section key are required' },
        { status: 400 }
      )
    }

    const sectionId = uuidv4()

    const [result] = await pool.query(
      `INSERT INTO theme_page_sections (
        id, theme_id, page_path, section_key, section_name, section_type,
        title, subtitle, description, content,
        background_color, text_color, padding_top, padding_bottom, min_height,
        background_image_url, background_image_position, background_image_repeat,
        background_image_overlay, background_image_opacity,
        cta_text, cta_link, cta_variant
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sectionId, themeId, pagePath, sectionKey, sectionName, sectionType || 'custom',
        title, subtitle, description, content ? JSON.stringify(content) : null,
        backgroundColor, textColor, paddingTop, paddingBottom, minHeight,
        backgroundImageUrl, backgroundImagePosition, backgroundImageRepeat ? 1 : 0,
        backgroundImageOverlay, backgroundImageOpacity,
        ctaText, ctaLink, ctaVariant
      ]
    ) as any

    return NextResponse.json({
      success: true,
      sectionId,
      section: { id: sectionId, sectionKey, sectionName }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Create section error:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Section already exists for this page' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create section' },
      { status: 500 }
    )
  }
}

// PATCH - Update page section
export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update sections' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get('sectionId')

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    const updates = await req.json()

    const setClauses: string[] = []
    const values: any[] = []

    const allowedFields = [
      'section_name', 'title', 'subtitle', 'description', 'content',
      'is_visible', 'display_order', 'background_color', 'text_color',
      'padding_top', 'padding_bottom', 'min_height', 'background_image_url',
      'background_image_position', 'background_image_repeat', 'background_image_overlay',
      'background_image_opacity', 'cta_text', 'cta_link', 'cta_variant'
    ]

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'content' && typeof value === 'object') {
          setClauses.push(`${key} = ?`)
          values.push(JSON.stringify(value))
        } else {
          setClauses.push(`${key} = ?`)
          values.push(value)
        }
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    values.push(sectionId)

    const [result] = await pool.query(
      `UPDATE theme_page_sections SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Section updated successfully' })
  } catch (error: any) {
    console.error('Update section error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update section' },
      { status: 500 }
    )
  }
}

// DELETE - Delete page section
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete sections' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get('sectionId')

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    const [result] = await pool.query(
      `DELETE FROM theme_page_sections WHERE id = ?`,
      [sectionId]
    ) as any

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Section deleted successfully' })
  } catch (error: any) {
    console.error('Delete section error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete section' },
      { status: 500 }
    )
  }
}
