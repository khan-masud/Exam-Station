import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch all sections or specific section
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get('id')
    const sectionKey = searchParams.get('key')

    if (sectionId) {
      const [sections] = await pool.query(
        `SELECT * FROM landing_sections WHERE id = ?`,
        [sectionId]
      ) as any

      if (!sections || sections.length === 0) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 })
      }

      const section = sections[0]
      return NextResponse.json({
        section: {
          ...section,
          content: typeof section.content === 'string' ? JSON.parse(section.content) : section.content,
          background_gradient: section.background_gradient ? 
            (typeof section.background_gradient === 'string' ? JSON.parse(section.background_gradient) : section.background_gradient) : null,
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

    let query = `SELECT * FROM landing_sections WHERE config_id = ?`
    const params: any[] = [configId]

    if (sectionKey) {
      query += ` AND section_key = ?`
      params.push(sectionKey)
    }

    query += ` ORDER BY display_order ASC`

    const [sections] = await pool.query(query, params) as any

    const parsedSections = sections.map((section: any) => ({
      ...section,
      content: typeof section.content === 'string' ? JSON.parse(section.content) : section.content,
      background_gradient: section.background_gradient ? 
        (typeof section.background_gradient === 'string' ? JSON.parse(section.background_gradient) : section.background_gradient) : null,
    }))

    return NextResponse.json({ sections: parsedSections })
  } catch (error) {
    console.error('Get sections error:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

// POST - Create new section
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

    const body = await req.json()
    const {
      sectionKey,
      sectionName,
      sectionType,
      isVisible = true,
      displayOrder,
      containerWidth,
      paddingTop,
      paddingBottom,
      minHeight,
      backgroundType,
      backgroundColor,
      backgroundGradient,
      backgroundImageUrl,
      backgroundImagePosition,
      backgroundImageSize,
      backgroundOpacity,
      backgroundOverlay,
      backgroundOverlayOpacity,
      content,
      customClasses,
      enableAnimations,
      animationType,
    } = body

    if (!sectionKey || !sectionName || !sectionType) {
      return NextResponse.json({ error: 'Section key, name, and type are required' }, { status: 400 })
    }

    // Get active config
    const [configs] = await pool.query(
      `SELECT id FROM landing_config WHERE is_active = TRUE LIMIT 1`
    ) as any

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'Landing configuration not found' }, { status: 404 })
    }

    const configId = configs[0].id

    // Check if section key already exists
    const [existing] = await pool.query(
      `SELECT id FROM landing_sections WHERE config_id = ? AND section_key = ?`,
      [configId, sectionKey]
    ) as any

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Section key already exists' }, { status: 400 })
    }

    const sectionId = uuidv4()

    // If displayOrder not provided, put at the end
    let order = displayOrder
    if (order === undefined || order === null) {
      const [maxOrder] = await pool.query(
        `SELECT MAX(display_order) as max_order FROM landing_sections WHERE config_id = ?`,
        [configId]
      ) as any
      order = (maxOrder[0]?.max_order || 0) + 1
    }

    await pool.query(
      `INSERT INTO landing_sections (
        id, config_id, section_key, section_name, section_type,
        is_visible, display_order, container_width, padding_top, padding_bottom, min_height,
        background_type, background_color, background_gradient, background_image_url,
        background_image_position, background_image_size, background_opacity,
        background_overlay, background_overlay_opacity,
        content, custom_classes, enable_animations, animation_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sectionId, configId, sectionKey, sectionName, sectionType,
        isVisible, order, containerWidth, paddingTop, paddingBottom, minHeight,
        backgroundType, backgroundColor, 
        backgroundGradient ? JSON.stringify(backgroundGradient) : null,
        backgroundImageUrl, backgroundImagePosition, backgroundImageSize, backgroundOpacity,
        backgroundOverlay, backgroundOverlayOpacity,
        content ? JSON.stringify(content) : null,
        customClasses, enableAnimations, animationType
      ]
    )

    return NextResponse.json({ 
      message: 'Section created successfully',
      sectionId 
    })
  } catch (error) {
    console.error('Create section error:', error)
    return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
  }
}

// PUT - Update section
export async function PUT(req: NextRequest) {
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

    const body = await req.json()
    const {
      sectionId,
      sectionName,
      sectionType,
      isVisible,
      displayOrder,
      containerWidth,
      paddingTop,
      paddingBottom,
      minHeight,
      backgroundType,
      backgroundColor,
      backgroundGradient,
      backgroundImageUrl,
      backgroundImagePosition,
      backgroundImageSize,
      backgroundOpacity,
      backgroundOverlay,
      backgroundOverlayOpacity,
      content,
      customClasses,
      enableAnimations,
      animationType,
    } = body

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    await pool.query(
      `UPDATE landing_sections SET
        section_name = COALESCE(?, section_name),
        section_type = COALESCE(?, section_type),
        is_visible = COALESCE(?, is_visible),
        display_order = COALESCE(?, display_order),
        container_width = COALESCE(?, container_width),
        padding_top = COALESCE(?, padding_top),
        padding_bottom = COALESCE(?, padding_bottom),
        min_height = COALESCE(?, min_height),
        background_type = COALESCE(?, background_type),
        background_color = COALESCE(?, background_color),
        background_gradient = COALESCE(?, background_gradient),
        background_image_url = COALESCE(?, background_image_url),
        background_image_position = COALESCE(?, background_image_position),
        background_image_size = COALESCE(?, background_image_size),
        background_opacity = COALESCE(?, background_opacity),
        background_overlay = COALESCE(?, background_overlay),
        background_overlay_opacity = COALESCE(?, background_overlay_opacity),
        content = COALESCE(?, content),
        custom_classes = COALESCE(?, custom_classes),
        enable_animations = COALESCE(?, enable_animations),
        animation_type = COALESCE(?, animation_type),
        updated_at = NOW()
      WHERE id = ?`,
      [
        sectionName, sectionType, isVisible, displayOrder,
        containerWidth, paddingTop, paddingBottom, minHeight,
        backgroundType, backgroundColor,
        backgroundGradient ? JSON.stringify(backgroundGradient) : null,
        backgroundImageUrl, backgroundImagePosition, backgroundImageSize, backgroundOpacity,
        backgroundOverlay, backgroundOverlayOpacity,
        content ? JSON.stringify(content) : null,
        customClasses, enableAnimations, animationType,
        sectionId
      ]
    )

    return NextResponse.json({ message: 'Section updated successfully' })
  } catch (error) {
    console.error('Update section error:', error)
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 })
  }
}

// DELETE - Delete section
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
    const sectionId = searchParams.get('id')

    if (!sectionId) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    await pool.query(`DELETE FROM landing_sections WHERE id = ?`, [sectionId])

    return NextResponse.json({ message: 'Section deleted successfully' })
  } catch (error) {
    console.error('Delete section error:', error)
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
  }
}
