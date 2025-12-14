import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

/**
 * POST /api/auth/oauth/login
 * Initiate OAuth login flow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider_name } = body;

    if (!provider_name) {
      return NextResponse.json(
        { error: 'Provider name is required' },
        { status: 400 }
      );
    }

    // Get OAuth provider configuration
    const [providers] = await pool.query(
      'SELECT * FROM oauth_providers WHERE provider_name = ? AND is_enabled = TRUE',
      [provider_name]
    ) as any;

    if (!providers || providers.length === 0) {
      return NextResponse.json(
        { error: 'OAuth provider not found or disabled' },
        { status: 404 }
      );
    }

    const provider = providers[0];
    
    // Generate state and nonce
    const state = crypto.randomBytes(32).toString('hex');
    const nonce = crypto.randomBytes(32).toString('hex');

    // Store state in oauth_tokens table
    const tokenId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO oauth_tokens (id, provider_name, state, nonce, expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [tokenId, provider_name, state, nonce]
    );

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: provider.client_id,
      redirect_uri: provider.redirect_uri,
      response_type: 'code',
      scope: provider.scopes,
      state: state,
      nonce: nonce,
    });

    const authorizationUrl = `${provider.authorization_url}?${params.toString()}`;

    return NextResponse.json({
      authorization_url: authorizationUrl,
      state: state,
    });
  } catch (error) {
    console.error('[OAuth Login API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth login' },
      { status: 500 }
    );
  }
}
