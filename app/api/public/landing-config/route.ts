import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

// GET - Fetch active landing configuration (public endpoint)
export async function GET(req: NextRequest) {
  try {
    // Get active landing config
    const [configs] = await pool.query(
      `SELECT * FROM landing_config WHERE is_active = TRUE LIMIT 1`
    ) as any

    if (!configs || configs.length === 0) {
      // Return default configuration if none exists
      return NextResponse.json({
        config: {
          site_name: 'Exam System',
          site_tagline: 'Your assessment platform',
          background_type: 'gradient',
          enable_animated_blobs: true,
        },
        sections: [],
        menuItems: [],
      })
    }

    const config = configs[0]

    // Get visible sections
    const [sections] = await pool.query(
      `SELECT * FROM landing_sections 
       WHERE config_id = ? AND is_visible = TRUE 
       ORDER BY display_order ASC`,
      [config.id]
    ) as any

    // Parse JSON fields
    const parsedSections = sections.map((section: any) => ({
      ...section,
      content: typeof section.content === 'string' ? JSON.parse(section.content) : section.content,
      background_gradient: section.background_gradient ? 
        (typeof section.background_gradient === 'string' ? JSON.parse(section.background_gradient) : section.background_gradient) : null,
    }))

    // Get visible menu items
    const [menuItems] = await pool.query(
      `SELECT * FROM landing_menu_items 
       WHERE config_id = ? AND is_visible = TRUE 
       ORDER BY menu_location, display_order ASC`,
      [config.id]
    ) as any

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

    // Group menu items by location
    const groupedMenus: any = {}
    parsedMenuItems.forEach((item: any) => {
      if (!groupedMenus[item.menu_location]) {
        groupedMenus[item.menu_location] = []
      }
      groupedMenus[item.menu_location].push(item)
    })

    return NextResponse.json({
      config: parsedConfig,
      sections: parsedSections,
      menuItems: parsedMenuItems,
      groupedMenus,
    })
  } catch (error) {
    console.error('Get public landing config error:', error)
    // Return default configuration on error
    return NextResponse.json({
      config: {
        site_name: 'Exam System',
        site_tagline: 'Your assessment platform',
        background_type: 'gradient',
        enable_animated_blobs: true,
      },
      sections: [],
      menuItems: [],
    })
  }
}
