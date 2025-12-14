import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/auth/oauth/providers
 * Get list of enabled OAuth providers
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[OAuth Providers] Fetching providers...');
    
    // First check if table exists and has data
    const [allProviders] = await pool.query(
      `SELECT provider_name, is_enabled, client_id, button_color, icon_url 
       FROM oauth_providers`,
      []
    ) as any;
    
    console.log('[OAuth Providers] All providers in database:', allProviders);
    
    // Filter enabled ones
    const enabledProviders = allProviders.filter((p: any) => 
      p.is_enabled === 1 || p.is_enabled === true || p.is_enabled === '1'
    );
    
    console.log('[OAuth Providers] Enabled providers:', enabledProviders);
    console.log('[OAuth Providers] Number of enabled providers:', enabledProviders?.length || 0);
    
    if (enabledProviders && enabledProviders.length > 0) {
      enabledProviders.forEach((p: any) => {
        console.log(`[OAuth Providers] Provider: ${p.provider_name}, Enabled: ${p.is_enabled} (type: ${typeof p.is_enabled})`);
      });
    } else {
      console.log('[OAuth Providers] No enabled providers found');
    }

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
