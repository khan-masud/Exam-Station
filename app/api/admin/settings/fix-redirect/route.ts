import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { verifyToken } from '@/lib/auth'

/**
 * POST /api/admin/settings/fix-redirect
 * Updates all OAuth redirect URIs in the database to match current NEXT_PUBLIC_APP_URL
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get correct redirect URI from environment
    const correctRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/callback`

    // Update all OAuth providers
    const [result] = await pool.query(
      `UPDATE oauth_providers 
       SET redirect_uri = ? 
       WHERE redirect_uri IS NOT NULL OR redirect_uri != ?`,
      [correctRedirectUri, correctRedirectUri]
    ) as any

    return NextResponse.json({
      success: true,
      message: 'Redirect URIs updated successfully',
      updatedRedirectUri: correctRedirectUri,
      rowsAffected: result.affectedRows
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update redirect URIs', details: error.message },
      { status: 500 }
    )
  }
}
