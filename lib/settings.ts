import pool from './db'

let settingsCache: Record<string, any> = {}
let cacheExpiry = 0
const CACHE_DURATION = 5 * 60 * 1000

export async function loadSettings(): Promise<Record<string, any>> {
  if (Date.now() < cacheExpiry && Object.keys(settingsCache).length > 0) {
    return settingsCache
  }

  try {
    const [rows] = await pool.query(
      'SELECT setting_key, setting_value FROM admin_settings'
    ) as any

    const settings: Record<string, any> = {}
    rows.forEach((row: any) => {
      try {
        settings[row.setting_key] = JSON.parse(row.setting_value)
      } catch {
        settings[row.setting_key] = row.setting_value
      }
    })

    settingsCache = settings
    cacheExpiry = Date.now() + CACHE_DURATION
    return settings
  } catch (error: any) {
    // Silently ignore table not found errors (expected during installation)
    // Also ignore connection errors (expected during build when no DB available)
    if (error.code === 'ER_NO_SUCH_TABLE' || error.code === 'ECONNREFUSED') {
      return {}
    }
    // Log other errors
    console.error('Failed to load settings:', error)
    return {}
  }
}

async function getLandingConfig() {
  try {
    const [rows] = await pool.query('SELECT * FROM landing_config WHERE is_active = TRUE LIMIT 1') as any
    return rows[0] || null
  } catch (e: any) {
    // Silently ignore table not found errors (expected during installation)
    // Also ignore connection errors (expected during build when no DB available)
    if (e.code === 'ER_NO_SUCH_TABLE' || e.code === 'ECONNREFUSED') {
      return null
    }
    // Log other types of errors
    console.error('Failed to fetch landing config in settings:', e)
    return null
  }
}

export async function getSetting(key: string, envVarName?: string, defaultValue?: any): Promise<any> {
  const settings = await loadSettings()
  if (settings[key] !== undefined) return settings[key]
  if (envVarName && process.env[envVarName] !== undefined) return process.env[envVarName]
  return defaultValue
}

export async function canUserRegister(): Promise<boolean> {
  return await getSetting('userManagement.allowSelfRegistration', undefined, true)
}

export async function isEmailVerificationRequired(): Promise<boolean> {
  return await getSetting('userManagement.requireEmailVerification', undefined, false)
}

export async function isAdminApprovalRequired(): Promise<boolean> {
  return await getSetting('userManagement.requireAdminApproval', undefined, false)
}

export async function getPasswordPolicy() {
  return {
    minLength: await getSetting('userManagement.minPasswordLength', undefined, 8),
    requireStrong: await getSetting('userManagement.requireStrongPassword', undefined, true),
  }
}

export async function getPaymentSettings() {
  return {
    allowManualPayments: await getSetting('payments.allowManualPayments', undefined, true),
    autoApprovePayments: await getSetting('payments.autoApprovePayments', undefined, false),
    currency: await getSetting('payments.paymentCurrency', undefined, 'USD'),
  }
}

export async function getProctoringSettings() {
  return {
    proctoringEnabled: await getSetting('antiCheat.proctoringEnabled', undefined, true),
    faceDetectionEnabled: await getSetting('antiCheat.faceDetectionEnabled', undefined, true),
    tabSwitchDetection: await getSetting('antiCheat.tabSwitchDetection', undefined, true),
    copyPasteDisabled: await getSetting('antiCheat.copyPasteDisabled', undefined, true),
    autoSubmitOnViolation: await getSetting('antiCheat.autoSubmitOnViolation', undefined, false),
    maxViolations: await getSetting('antiCheat.maxViolations', undefined, 5),
  }
}

export async function getExamSettings() {
  return {
    shuffleQuestions: await getSetting('examSettings.shuffleQuestions', undefined, true),
    showResultsImmediately: await getSetting('examSettings.showResultsImmediately', undefined, false),
    allowReviewAfterSubmission: await getSetting('examSettings.allowReviewAfterSubmission', undefined, true),
    maxExamAttemptsPerStudent: await getSetting('userPermissions.maxExamAttemptsPerStudent', undefined, 3),
    allowExamRetake: await getSetting('userPermissions.allowExamRetake', undefined, true),
    retakeCooldownDays: await getSetting('userPermissions.retakeCooldownDays', undefined, 7),
  }
}

export async function getUserPermissions() {
  return {
    studentsCanDownloadCertificates: await getSetting('userPermissions.studentsCanDownloadCertificates', undefined, true),
  }
}

export async function getSecuritySettings() {
  return {
    enableRateLimiting: await getSetting('security.enableRateLimiting', undefined, true),
    maxRequestsPerMinute: await getSetting('security.maxRequestsPerMinute', undefined, 60),
  }
}

export async function getLoginLimits() {
  return {
    maxLoginAttempts: await getSetting('userManagement.maxLoginAttempts', undefined, 5),
    lockoutDuration: await getSetting('userManagement.lockoutDuration', undefined, 30), // minutes
  }
}

export async function getGeneralSettings() {
  const landingConfig = await getLandingConfig()
  const defaultSiteName = await getSetting('general.siteName', undefined, 'Exam System')

  return {
    organizationName: await getSetting('general.organizationName', undefined, 'Exam System'),
    sessionTimeout: await getSetting('general.sessionTimeout', undefined, 30), // minutes
    siteName: landingConfig?.site_name || defaultSiteName,
    siteTagline: landingConfig?.site_tagline || await getSetting('general.siteTagline', undefined, 'Your assessment platform'),
    siteEmail: landingConfig?.contact_email || await getSetting('general.siteEmail', undefined, 'support@example.com'),
    sitePhone: landingConfig?.contact_phone || await getSetting('general.sitePhone', undefined, '+1234567890'),
    siteAddress: landingConfig?.contact_address || await getSetting('general.siteAddress', undefined, 'Your office address'),
    logoUrl: landingConfig?.logo_url || await getSetting('general.logoUrl', undefined, ''),
    faviconUrl: landingConfig?.favicon_url || await getSetting('general.faviconUrl', undefined, ''),
    copyrightText: landingConfig?.copyright_text || await getSetting('general.copyrightText', undefined, `© ${new Date().getFullYear()} Exam System. All rights reserved.`),
  }
}

export async function getSEOSettings() {
  return {
    title: await getSetting('seo.title', undefined, 'Exam System - Online Assessment Platform'),
    description: await getSetting('seo.description', undefined, 'Comprehensive online examination platform for educational institutions'),
    keywords: await getSetting('seo.keywords', undefined, 'exam, assessment, online, test, education'),
    ogImage: await getSetting('seo.ogImage', undefined, ''),
    googleAnalyticsId: await getSetting('seo.googleAnalyticsId', undefined, ''),
  }
}

export function clearSettingsCache() {
  settingsCache = {}
  cacheExpiry = 0
}
