import { NextResponse } from 'next/server'
import { getGeneralSettings, getSEOSettings } from '@/lib/settings'

// GET - Public settings for footer and site info
export async function GET() {
  try {
    const general = await getGeneralSettings()
    const seo = await getSEOSettings()

    return NextResponse.json({
      siteName: general.siteName || 'Exam System',
      siteTagline: general.siteTagline || 'Your assessment platform',
      siteEmail: general.siteEmail || 'support@example.com',
      sitePhone: general.sitePhone || '+1234567890',
      siteAddress: general.siteAddress || 'Your office address',
      logoUrl: general.logoUrl || '',
      copyrightText: general.copyrightText || `© ${new Date().getFullYear()} Exam System. All rights reserved.`,
      seoTitle: seo.title || 'Exam System - Online Assessment Platform',
    })
  } catch (error) {
    console.error('Failed to load public settings:', error)
    // Return default values on error
    return NextResponse.json({
      siteName: 'Exam System',
      siteTagline: 'Your assessment platform',
      siteEmail: 'support@example.com',
      sitePhone: '+1234567890',
      siteAddress: 'Your office address',
      logoUrl: '',
      copyrightText: `© ${new Date().getFullYear()} Exam System. All rights reserved.`,
      seoTitle: 'Exam System - Online Assessment Platform',
    })
  }
}
