import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { clearSettingsCache } from '@/lib/settings'
import { v4 as uuidv4 } from 'uuid'

// GET - Load settings (enhanced with SEO, OAuth, and notifications)
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Load all settings from database
    const [rows] = await pool.query(
      'SELECT setting_key, setting_value FROM admin_settings'
    ) as any

    // Load new settings from site_settings table
    const [siteSettings] = await pool.query(
      'SELECT * FROM site_settings ORDER BY created_at DESC LIMIT 1'
    ) as any

    // Load OAuth providers
    const [oauthProviders] = await pool.query(
      'SELECT provider_name, client_id, client_secret, is_enabled, button_color, icon_url FROM oauth_providers'
    ) as any

    // Convert to nested object structure
    const settings: any = {
      general: {},
      userManagement: {},
      userPermissions: {},
      verification: {},
      notifications: {},
      content: {},
      security: {},
      payments: {},
      email: {},
      sms: {},
      antiCheat: {},
      seo: siteSettings[0] || {},
      oauth: {}
    }

    // Map OAuth providers to settings structure
    if (oauthProviders && oauthProviders.length > 0) {
      oauthProviders.forEach((provider: any) => {
        if (provider.provider_name === 'google') {
          settings.oauth.googleEnabled = provider.is_enabled === 1
          settings.oauth.googleClientId = provider.client_id || ''
          settings.oauth.googleClientSecret = provider.client_secret || ''
        } else if (provider.provider_name === 'facebook') {
          settings.oauth.facebookEnabled = provider.is_enabled === 1
          settings.oauth.facebookAppId = provider.client_id || ''
          settings.oauth.facebookAppSecret = provider.client_secret || ''
        }
      })
    }

    rows.forEach((row: any) => {
      const [section, key] = row.setting_key.split('.')
      if (settings[section]) {
        try {
          settings[section][key] = JSON.parse(row.setting_value)
        } catch {
          settings[section][key] = row.setting_value
        }
      }
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Settings load error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

// POST - Save settings
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    
    // Support both formats: { section, settings } and { settings: flatSettings }
    let settingsToSave: Record<string, any> = {}
    
    if (body.section && body.settings) {
      // Old format: { section, settings }
      const { section, settings } = body
      for (const [key, value] of Object.entries(settings)) {
        settingsToSave[`${section}.${key}`] = value
      }
    } else if (body.settings) {
      // New format: { settings: { "section.key": value } }
      settingsToSave = body.settings
    } else {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Log OAuth settings being saved
    const oauthSettings = Object.keys(settingsToSave).filter(k => k.startsWith('oauth.'))
    console.log('[Settings Save] OAuth settings received:', oauthSettings.map(k => ({ key: k, value: settingsToSave[k] })))

    // Save each setting
    const savedKeys: string[] = []

    for (const [settingKey, value] of Object.entries(settingsToSave)) {
      const settingValue = JSON.stringify(value)

      try {
        await pool.query(
          `INSERT INTO admin_settings (id, setting_key, setting_value) 
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [uuidv4(), settingKey, settingValue, settingValue]
        )
        savedKeys.push(settingKey)
      } catch (err) {
        console.error('Failed to save setting', settingKey, err)
      }
    }

    // Handle OAuth provider configurations specially
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/callback`
    
    // Update or insert Google OAuth if any Google setting is present
    if (settingsToSave['oauth.googleClientId'] !== undefined || settingsToSave['oauth.googleClientSecret'] !== undefined || settingsToSave['oauth.googleEnabled'] !== undefined) {
      // Only update fields that are provided
      const updates: string[] = []
      const params: any[] = []
      
      if (settingsToSave['oauth.googleClientId'] !== undefined) {
        updates.push('client_id = ?')
        params.push(settingsToSave['oauth.googleClientId'] || '')
      }
      
      if (settingsToSave['oauth.googleClientSecret'] !== undefined) {
        updates.push('client_secret = ?')
        params.push(settingsToSave['oauth.googleClientSecret'] || '')
      }
      
      if (settingsToSave['oauth.googleEnabled'] !== undefined) {
        const googleEnabled = settingsToSave['oauth.googleEnabled'] === true || settingsToSave['oauth.googleEnabled'] === 'true' ? 1 : 0
        updates.push('is_enabled = ?')
        params.push(googleEnabled)
      }
      
      updates.push('redirect_uri = ?')
      params.push(redirectUri)
      
      console.log('[Settings] Saving Google OAuth:', { updates, values: params })
      
      const googleId = uuidv4()
      
      try {
        // Try to insert first, if exists it will fail and we'll update
        const [existing] = await pool.query(
          `SELECT id FROM oauth_providers WHERE provider_name = 'google'`
        ) as any
        
        if (existing && existing.length > 0) {
          // Update existing
          await pool.query(
            `UPDATE oauth_providers SET ${updates.join(', ')} WHERE provider_name = 'google'`,
            params
          )
          console.log('[Settings] Google OAuth updated successfully')
        } else {
          // Insert new
          const clientId = settingsToSave['oauth.googleClientId'] || ''
          const clientSecret = settingsToSave['oauth.googleClientSecret'] || ''
          const enabled = settingsToSave['oauth.googleEnabled'] === true || settingsToSave['oauth.googleEnabled'] === 'true' ? 1 : 0
          
          await pool.query(
            `INSERT INTO oauth_providers 
             (id, provider_name, provider_type, client_id, client_secret, is_enabled, redirect_uri, 
              authorization_url, token_url, userinfo_url, scopes)
             VALUES (?, 'google', 'oauth2', ?, ?, ?, ?, 
                     'https://accounts.google.com/o/oauth2/v2/auth',
                     'https://oauth2.googleapis.com/token',
                     'https://www.googleapis.com/oauth2/v2/userinfo',
                     'openid email profile')`,
            [googleId, clientId, clientSecret, enabled, redirectUri]
          )
          console.log('[Settings] Google OAuth created successfully')
        }
      } catch (error) {
        console.error('[Settings] Failed to save Google OAuth:', error)
      }
    }

    // Update or insert Facebook OAuth if any Facebook setting is present
    if (settingsToSave['oauth.facebookAppId'] !== undefined || settingsToSave['oauth.facebookAppSecret'] !== undefined || settingsToSave['oauth.facebookEnabled'] !== undefined) {
      // Only update fields that are provided
      const updates: string[] = []
      const params: any[] = []
      
      if (settingsToSave['oauth.facebookAppId'] !== undefined) {
        updates.push('client_id = ?')
        params.push(settingsToSave['oauth.facebookAppId'] || '')
      }
      
      if (settingsToSave['oauth.facebookAppSecret'] !== undefined) {
        updates.push('client_secret = ?')
        params.push(settingsToSave['oauth.facebookAppSecret'] || '')
      }
      
      if (settingsToSave['oauth.facebookEnabled'] !== undefined) {
        const facebookEnabled = settingsToSave['oauth.facebookEnabled'] === true || settingsToSave['oauth.facebookEnabled'] === 'true' ? 1 : 0
        updates.push('is_enabled = ?')
        params.push(facebookEnabled)
      }
      
      updates.push('redirect_uri = ?')
      params.push(redirectUri)
      
      console.log('[Settings] Saving Facebook OAuth:', { updates, values: params })
      
      const facebookId = uuidv4()
      
      try {
        // Try to insert first, if exists it will fail and we'll update
        const [existing] = await pool.query(
          `SELECT id FROM oauth_providers WHERE provider_name = 'facebook'`
        ) as any
        
        if (existing && existing.length > 0) {
          // Update existing
          await pool.query(
            `UPDATE oauth_providers SET ${updates.join(', ')} WHERE provider_name = 'facebook'`,
            params
          )
          console.log('[Settings] Facebook OAuth updated successfully')
        } else {
          // Insert new
          const appId = settingsToSave['oauth.facebookAppId'] || ''
          const appSecret = settingsToSave['oauth.facebookAppSecret'] || ''
          const enabled = settingsToSave['oauth.facebookEnabled'] === true || settingsToSave['oauth.facebookEnabled'] === 'true' ? 1 : 0
          
          await pool.query(
            `INSERT INTO oauth_providers 
             (id, provider_name, provider_type, client_id, client_secret, is_enabled, redirect_uri,
              authorization_url, token_url, userinfo_url, scopes)
             VALUES (?, 'facebook', 'oauth2', ?, ?, ?, ?,
                     'https://www.facebook.com/v12.0/dialog/oauth',
                     'https://graph.facebook.com/v12.0/oauth/access_token',
                     'https://graph.facebook.com/me?fields=id,name,email',
                     'email public_profile')`,
            [facebookId, appId, appSecret, enabled, redirectUri]
          )
          console.log('[Settings] Facebook OAuth created successfully')
        }
      } catch (error) {
        console.error('[Settings] Failed to save Facebook OAuth:', error)
      }
    }

    // Sync with landing_config
    const landingUpdates: string[] = []
    const landingValues: any[] = []

    if (settingsToSave['general.siteName'] !== undefined) { landingUpdates.push('site_name = ?'); landingValues.push(settingsToSave['general.siteName']) }
    if (settingsToSave['general.siteTagline'] !== undefined) { landingUpdates.push('site_tagline = ?'); landingValues.push(settingsToSave['general.siteTagline']) }
    if (settingsToSave['general.siteEmail'] !== undefined) { landingUpdates.push('contact_email = ?'); landingValues.push(settingsToSave['general.siteEmail']) }
    if (settingsToSave['general.sitePhone'] !== undefined) { landingUpdates.push('contact_phone = ?'); landingValues.push(settingsToSave['general.sitePhone']) }
    if (settingsToSave['general.siteAddress'] !== undefined) { landingUpdates.push('contact_address = ?'); landingValues.push(settingsToSave['general.siteAddress']) }
    if (settingsToSave['general.copyrightText'] !== undefined) { landingUpdates.push('copyright_text = ?'); landingValues.push(settingsToSave['general.copyrightText']) }
    if (settingsToSave['general.logoUrl'] !== undefined) { landingUpdates.push('logo_url = ?'); landingValues.push(settingsToSave['general.logoUrl']) }
    if (settingsToSave['general.faviconUrl'] !== undefined) { landingUpdates.push('favicon_url = ?'); landingValues.push(settingsToSave['general.faviconUrl']) }

    if (landingUpdates.length > 0) {
      try {
        // Check if active config exists
        const [configs] = await pool.query('SELECT id FROM landing_config WHERE is_active = TRUE LIMIT 1') as any
        if (configs && configs.length > 0) {
          landingValues.push(configs[0].id)
          await pool.query(
            `UPDATE landing_config SET ${landingUpdates.join(', ')} WHERE id = ?`,
            landingValues
          )
          console.log('Synced settings to landing_config')
        }
      } catch (err) {
        console.error('Failed to sync landing_config', err)
      }
    }

    // Clear settings cache to force reload
    clearSettingsCache()

    // Read back what we saved so the client can verify persistence
    let savedSettings: Record<string, any> = {}
    if (savedKeys.length > 0) {
      try {
        const placeholders = savedKeys.map(() => '?').join(',')
        const [rows] = await pool.query(
          `SELECT setting_key, setting_value FROM admin_settings WHERE setting_key IN (${placeholders})`,
          savedKeys
        ) as any

        rows.forEach((row: any) => {
          try {
            savedSettings[row.setting_key] = JSON.parse(row.setting_value)
          } catch {
            savedSettings[row.setting_key] = row.setting_value
          }
        })
      } catch (err) {
        console.error('Failed to read back saved settings', err)
      }
    }

    return NextResponse.json({ success: true, saved: savedSettings })
  } catch (error) {
    console.error('Settings save error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
