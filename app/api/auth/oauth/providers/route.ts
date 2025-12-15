import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/auth/oauth/providers
 * Get list of enabled OAuth providers
 */
export async function GET(request: NextRequest) {
  try {
    // First check if table exists and has data
    const [allProviders] = await pool.query(
      `SELECT provider_name, is_enabled, client_id, button_color, icon_url 
       FROM oauth_providers`,
      []
    ) as any;
    
    // Filter enabled ones
    const enabledProviders = allProviders.filter((p: any) => 
      p.is_enabled === 1 || p.is_enabled === true || p.is_enabled === '1'
    );

    return NextResponse.json({
      providers: enabledProviders || []
    });
  } catch (error) {
    console.error('[OAuth Providers] Database error:', error);
    return NextResponse.json(
      { providers: [], error: String(error) },
      { status: 200 } // Return empty array instead of error
    );
  }
}
