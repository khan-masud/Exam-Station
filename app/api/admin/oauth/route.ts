import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

/**
 * GET /api/admin/oauth
 * Get all OAuth provider configurations
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const [providers] = await pool.query(
      `SELECT id, provider_name, provider_type, is_enabled, icon_url, button_color, scopes
       FROM oauth_providers ORDER BY provider_name`
    ) as any;

    return NextResponse.json(providers || []);
  } catch (error) {
    console.error('[OAuth API] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OAuth providers' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/oauth/:id
 * Update OAuth provider configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, client_id, client_secret, redirect_uri, is_enabled, scopes, button_color } = body;

    await pool.query(
      `UPDATE oauth_providers SET 
        client_id = ?, client_secret = ?, redirect_uri = ?,
        is_enabled = ?, scopes = ?, button_color = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [client_id, client_secret, redirect_uri, is_enabled, scopes, button_color, id]
    );

    return NextResponse.json({
      success: true,
      message: 'OAuth provider updated successfully',
    });
  } catch (error) {
    console.error('[OAuth API] Put error:', error);
    return NextResponse.json(
      { error: 'Failed to update OAuth provider' },
      { status: 500 }
    );
  }
}
