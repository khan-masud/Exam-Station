import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch landing configuration
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const includeInvisible = searchParams.get('includeInvisible') === 'true'

    // Get active landing config
    const [configs] = await pool.query(
      `SELECT * FROM landing_config WHERE is_active = TRUE LIMIT 1`
    ) as any

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'Landing configuration not found' }, { status: 404 })
    }

    const config = configs[0]

    // Get sections
    let sectionsQuery = `
      SELECT * FROM landing_sections 
      WHERE config_id = ?
    `
    if (!includeInvisible) {
      sectionsQuery += ` AND is_visible = TRUE`
    }
    sectionsQuery += ` ORDER BY display_order ASC`

    const [sections] = await pool.query(sectionsQuery, [config.id]) as any

    // Parse JSON fields
    const parsedSections = sections.map((section: any) => ({
      ...section,
      content: typeof section.content === 'string' ? JSON.parse(section.content) : section.content,
      background_gradient: section.background_gradient ? 
        (typeof section.background_gradient === 'string' ? JSON.parse(section.background_gradient) : section.background_gradient) : null,
    }))

    // Get menu items
    let menuQuery = `
      SELECT * FROM landing_menu_items 
      WHERE config_id = ?
    `
    if (!includeInvisible) {
      menuQuery += ` AND is_visible = TRUE`
    }
    menuQuery += ` ORDER BY menu_location, display_order ASC`

    const [menuItems] = await pool.query(menuQuery, [config.id]) as any

    // Parse JSON fields in menu items
    const parsedMenuItems = menuItems.map((item: any) => ({
      ...item,
      visible_for_roles: item.visible_for_roles ? 
        (typeof item.visible_for_roles === 'string' ? JSON.parse(item.visible_for_roles) : item.visible_for_roles) : null,
    }))

    // Parse config JSON fields
    const parsedConfig = {
      ...config,
      background_gradient: config.background_gradient ? 
        (typeof config.background_gradient === 'string' ? JSON.parse(config.background_gradient) : config.background_gradient) : null,
      blob_colors: config.blob_colors ? 
        (typeof config.blob_colors === 'string' ? JSON.parse(config.blob_colors) : config.blob_colors) : null,
    }

    return NextResponse.json({
      config: parsedConfig,
      sections: parsedSections,
      menuItems: parsedMenuItems,
    })
  } catch (error) {
    console.error('Get landing config error:', error)
    return NextResponse.json({ error: 'Failed to fetch landing configuration' }, { status: 500 })
  }
}

// PUT - Update landing configuration
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can update landing configuration' }, { status: 403 })
    }

    const body = await req.json()
    const {
      siteName,
      siteTagline,
      siteDescription,
      metaTitle,
      metaDescription,
      metaKeywords,
      logoUrl,
      logoWidth,
      logoHeight,
      faviconUrl,
      backgroundType,
      backgroundColor,
      backgroundGradient,
      backgroundImageUrl,
      backgroundImageFixed,
      enableAnimatedBlobs,
      blobColors,
      navSticky,
      navTransparent,
      navBlur,
      contactEmail,
      contactPhone,
      contactAddress,
      facebookUrl,
      twitterUrl,
      instagramUrl,
      linkedinUrl,
      youtubeUrl,
      copyrightText,
      showPoweredBy,
    } = body

    // Get current config
    const [configs] = await pool.query(
      `SELECT id, version FROM landing_config WHERE is_active = TRUE LIMIT 1`
    ) as any

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'Landing configuration not found' }, { status: 404 })
    }

    const configId = configs[0].id
    const newVersion = configs[0].version + 1

    // Build dynamic UPDATE query to only update provided fields
    const updates: string[] = []
    const values: any[] = []

    if (siteName !== undefined) { updates.push('site_name = ?'); values.push(siteName) }
    if (siteTagline !== undefined) { updates.push('site_tagline = ?'); values.push(siteTagline) }
    if (siteDescription !== undefined) { updates.push('site_description = ?'); values.push(siteDescription) }
    if (metaTitle !== undefined) { updates.push('meta_title = ?'); values.push(metaTitle) }
    if (metaDescription !== undefined) { updates.push('meta_description = ?'); values.push(metaDescription) }
    if (metaKeywords !== undefined) { updates.push('meta_keywords = ?'); values.push(metaKeywords) }
    if (logoUrl !== undefined) { updates.push('logo_url = ?'); values.push(logoUrl) }
    if (logoWidth !== undefined) { updates.push('logo_width = ?'); values.push(logoWidth) }
    if (logoHeight !== undefined) { updates.push('logo_height = ?'); values.push(logoHeight) }
    if (faviconUrl !== undefined) { updates.push('favicon_url = ?'); values.push(faviconUrl) }
    if (backgroundType !== undefined) { updates.push('background_type = ?'); values.push(backgroundType) }
    if (backgroundColor !== undefined) { updates.push('background_color = ?'); values.push(backgroundColor) }
    if (backgroundGradient !== undefined) { updates.push('background_gradient = ?'); values.push(backgroundGradient ? JSON.stringify(backgroundGradient) : null) }
    if (backgroundImageUrl !== undefined) { updates.push('background_image_url = ?'); values.push(backgroundImageUrl) }
    if (backgroundImageFixed !== undefined) { updates.push('background_image_fixed = ?'); values.push(backgroundImageFixed) }
    if (enableAnimatedBlobs !== undefined) { updates.push('enable_animated_blobs = ?'); values.push(enableAnimatedBlobs) }
    if (blobColors !== undefined) { updates.push('blob_colors = ?'); values.push(blobColors ? JSON.stringify(blobColors) : null) }
    if (navSticky !== undefined) { updates.push('nav_sticky = ?'); values.push(navSticky) }
    if (navTransparent !== undefined) { updates.push('nav_transparent = ?'); values.push(navTransparent) }
    if (navBlur !== undefined) { updates.push('nav_blur = ?'); values.push(navBlur) }
    if (contactEmail !== undefined) { updates.push('contact_email = ?'); values.push(contactEmail) }
    if (contactPhone !== undefined) { updates.push('contact_phone = ?'); values.push(contactPhone) }
    if (contactAddress !== undefined) { updates.push('contact_address = ?'); values.push(contactAddress) }
    if (facebookUrl !== undefined) { updates.push('facebook_url = ?'); values.push(facebookUrl) }
    if (twitterUrl !== undefined) { updates.push('twitter_url = ?'); values.push(twitterUrl) }
    if (instagramUrl !== undefined) { updates.push('instagram_url = ?'); values.push(instagramUrl) }
    if (linkedinUrl !== undefined) { updates.push('linkedin_url = ?'); values.push(linkedinUrl) }
    if (youtubeUrl !== undefined) { updates.push('youtube_url = ?'); values.push(youtubeUrl) }
    if (copyrightText !== undefined) { updates.push('copyright_text = ?'); values.push(copyrightText) }
    if (showPoweredBy !== undefined) { updates.push('show_powered_by = ?'); values.push(showPoweredBy) }

    // Always update version and metadata
    updates.push('version = ?', 'updated_at = NOW()', 'updated_by = ?')
    values.push(newVersion, decoded.userId)

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Add configId at the end for WHERE clause
    values.push(configId)

    await pool.query(
      `UPDATE landing_config SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    // Sync back to admin_settings
    const adminSettingsUpdates: Record<string, any> = {}
    if (siteName !== undefined) adminSettingsUpdates['general.siteName'] = siteName
    if (siteTagline !== undefined) adminSettingsUpdates['general.siteTagline'] = siteTagline
    if (contactEmail !== undefined) adminSettingsUpdates['general.siteEmail'] = contactEmail
    if (contactPhone !== undefined) adminSettingsUpdates['general.sitePhone'] = contactPhone
    if (contactAddress !== undefined) adminSettingsUpdates['general.siteAddress'] = contactAddress
    if (copyrightText !== undefined) adminSettingsUpdates['general.copyrightText'] = copyrightText
    if (logoUrl !== undefined) adminSettingsUpdates['general.logoUrl'] = logoUrl
    if (faviconUrl !== undefined) adminSettingsUpdates['general.faviconUrl'] = faviconUrl

    if (Object.keys(adminSettingsUpdates).length > 0) {
      try {
        for (const [key, value] of Object.entries(adminSettingsUpdates)) {
          const settingValue = JSON.stringify(value)
          await pool.query(
            `INSERT INTO admin_settings (id, setting_key, setting_value) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE setting_value = ?`,
            [uuidv4(), key, settingValue, settingValue]
          )
        }
        // Synced landing_config to admin_settings
      } catch (err) {
        // Failed to sync admin_settings
      }
    }

    return NextResponse.json({ 
      message: 'Landing configuration updated successfully',
      version: newVersion
    })
  } catch (error) {
    console.error('Update landing config error:', error)
    return NextResponse.json({ error: 'Failed to update landing configuration' }, { status: 500 })
  }
}
