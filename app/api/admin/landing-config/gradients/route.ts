import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - Fetch gradient presets
export async function GET(req: NextRequest) {
  try {
    const [presets] = await pool.query(
      `SELECT * FROM landing_gradient_presets ORDER BY usage_count DESC, preset_name ASC`
    ) as any

    const parsedPresets = presets.map((preset: any) => ({
      ...preset,
      gradient_config: typeof preset.gradient_config === 'string' ? 
        JSON.parse(preset.gradient_config) : preset.gradient_config,
    }))

    return NextResponse.json({ presets: parsedPresets })
  } catch (error) {
    console.error('Get gradient presets error:', error)
    return NextResponse.json({ error: 'Failed to fetch gradient presets' }, { status: 500 })
  }
}

// POST - Create new gradient preset
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create gradient presets' }, { status: 403 })
    }

    const body = await req.json()
    const { presetName, gradientConfig } = body

    if (!presetName || !gradientConfig) {
      return NextResponse.json({ error: 'Preset name and gradient config are required' }, { status: 400 })
    }

    // Generate CSS preview
    const { from, via, to, direction } = gradientConfig
    const directionMap: any = {
      'r': 'to right',
      'l': 'to left',
      't': 'to top',
      'b': 'to bottom',
      'br': 'to bottom right',
      'bl': 'to bottom left',
      'tr': 'to top right',
      'tl': 'to top left',
    }
    
    const cssDirection = directionMap[direction] || 'to right'
    let previewCss = `linear-gradient(${cssDirection}, ${from}`
    if (via) previewCss += `, ${via}`
    previewCss += `, ${to})`

    const presetId = uuidv4()

    await pool.query(
      `INSERT INTO landing_gradient_presets (
        id, preset_name, gradient_config, preview_css, created_by
      ) VALUES (?, ?, ?, ?, ?)`,
      [presetId, presetName, JSON.stringify(gradientConfig), previewCss, decoded.userId]
    )

    return NextResponse.json({ 
      message: 'Gradient preset created successfully',
      presetId 
    })
  } catch (error: any) {
    console.error('Create gradient preset error:', error)
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'A preset with this name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create gradient preset' }, { status: 500 })
  }
}

// DELETE - Delete gradient preset
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete gradient presets' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const presetId = searchParams.get('id')

    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 })
    }

    // Check if it's a system preset
    const [presets] = await pool.query(
      `SELECT is_system FROM landing_gradient_presets WHERE id = ?`,
      [presetId]
    ) as any

    if (presets && presets.length > 0 && presets[0].is_system) {
      return NextResponse.json({ error: 'System presets cannot be deleted' }, { status: 400 })
    }

    await pool.query(`DELETE FROM landing_gradient_presets WHERE id = ?`, [presetId])

    return NextResponse.json({ message: 'Gradient preset deleted successfully' })
  } catch (error) {
    console.error('Delete gradient preset error:', error)
    return NextResponse.json({ error: 'Failed to delete gradient preset' }, { status: 500 })
  }
}
