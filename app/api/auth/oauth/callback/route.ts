import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

/**
 * GET /api/auth/oauth/callback
 * Handle OAuth provider callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.json(
        { error: `OAuth error: ${error}` },
        { status: 400 }
      );
    }

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing OAuth parameters' },
        { status: 400 }
      );
    }

    // Verify state token and get provider_name from database
    const [tokens] = await pool.query(
      `SELECT * FROM oauth_tokens WHERE state = ? AND is_used = FALSE`,
      [state]
    ) as any;

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: 'Invalid state token' },
        { status: 401 }
      );
    }

    const tokenRecord = tokens[0];
    const provider_name = tokenRecord.provider_name;

    // Get OAuth provider configuration
    const [providers] = await pool.query(
      'SELECT * FROM oauth_providers WHERE provider_name = ? AND is_enabled = TRUE',
      [provider_name]
    ) as any;

    if (!providers || providers.length === 0) {
      return NextResponse.json(
        { error: 'OAuth provider not found' },
        { status: 404 }
      );
    }

    const provider = providers[0];

    // Exchange code for access token
    const tokenResponse = await fetch(provider.token_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: provider.client_id,
        client_secret: provider.client_secret,
        code: code,
        redirect_uri: provider.redirect_uri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();
    const access_token = tokenData.access_token;
    const refresh_token = tokenData.refresh_token;
    const expires_in = tokenData.expires_in;

    // Get user info from provider
    const userInfoResponse = await fetch(provider.userinfo_url, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();
    const provider_user_id = userInfo.id;
    const provider_email = userInfo.email;
    const provider_name_full = userInfo.name;
    const provider_avatar_url = userInfo.picture || userInfo.avatar_url;

    // Check if OAuth account exists
    const [existingAccounts] = await pool.query(
      `SELECT * FROM oauth_accounts 
       WHERE provider_name = ? AND provider_user_id = ?`,
      [provider_name, provider_user_id]
    ) as any;

    let user_id: string;
    let isNewUser = false;

    if (existingAccounts && existingAccounts.length > 0) {
      // Link existing OAuth account
      user_id = existingAccounts[0].user_id;
      
      // Update access token
      await pool.query(
        `UPDATE oauth_accounts SET 
          access_token = ?, refresh_token = ?, token_expires_at = DATE_ADD(NOW(), INTERVAL ? SECOND),
          last_synced_at = NOW()
         WHERE user_id = ? AND provider_name = ?`,
        [access_token, refresh_token, expires_in, user_id, provider_name]
      );
    } else {
      // Check if user exists by email
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ?',
        [provider_email]
      ) as any;

      if (existingUsers && existingUsers.length > 0) {
        // Link OAuth to existing user
        user_id = existingUsers[0].id;
      } else {
        // Create new user
        user_id = crypto.randomUUID();
        isNewUser = true;

        const username = provider_email.split('@')[0];

        await pool.query(
          `INSERT INTO users (
            id, email, full_name, password_hash, role, is_verified,
            email_verified, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            user_id,
            provider_email,
            provider_name_full,
            'oauth_' + randomBytes(16).toString('hex'),
            'student',
            true,
            true,
            'active',
          ]
        );
      }

      // Create OAuth account link
      const oauthAccountId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO oauth_accounts (
          id, user_id, provider_name, provider_user_id,
          provider_email, provider_name_full, provider_avatar_url,
          access_token, refresh_token, token_expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NOW())`,
        [
          oauthAccountId,
          user_id,
          provider_name,
          provider_user_id,
          provider_email,
          provider_name_full,
          provider_avatar_url,
          access_token,
          refresh_token,
          expires_in,
        ]
      );
    }

    // Mark state token as used
    await pool.query(
      'UPDATE oauth_tokens SET is_used = TRUE WHERE state = ?',
      [state]
    );

    // Get user data
    const [users] = await pool.query(
      'SELECT id, email, full_name, role, status FROM users WHERE id = ?',
      [user_id]
    ) as any;

    const user = users[0];

    // Create JWT token
    const authToken = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    });

    // Automatically detect the domain from the request
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // Set auth cookie and redirect
    const response = NextResponse.redirect(
      new URL(`${baseUrl}/oauth-success?token=${authToken}&isNewUser=${isNewUser}`)
    );

    response.cookies.set('auth_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    // Automatically detect the domain for error redirect
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    
    return NextResponse.redirect(
      new URL(`${baseUrl}/login?error=oauth_failed`)
    );
  }
}
