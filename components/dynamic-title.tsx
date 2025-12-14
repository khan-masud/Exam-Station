"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function DynamicTitle() {
  const pathname = usePathname()
  const [siteSettings, setSiteSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Fetch fresh settings (always fetch, no cache on first load)
    const fetchSettings = async () => {
      try {
        // Try landing config first with cache buster
        const landingRes = await fetch(`/api/public/landing-config?t=${Date.now()}`)
        if (landingRes.ok) {
          const landingData = await landingRes.json()
          if (landingData.config && isMounted) {
            const settings = {
              siteName: landingData.config.site_name || 'Exam System',
              siteTagline: landingData.config.site_tagline || '',
              faviconUrl: landingData.config.favicon_url || '/placeholder-logo.png'
            }
            setSiteSettings(settings)
            updateTitle(pathname, settings)
            localStorage.setItem('siteSettings', JSON.stringify(settings))
            setIsLoading(false)
            return
          }
        }

        // Fallback to general settings
        const settingsRes = await fetch(`/api/public/settings?t=${Date.now()}`)
        if (settingsRes.ok && isMounted) {
          const data = await settingsRes.json()
          setSiteSettings(data)
          updateTitle(pathname, data)
          localStorage.setItem('siteSettings', JSON.stringify(data))
        }
      } catch (error) {
        // Failed to fetch site settings
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchSettings()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (siteSettings && !isLoading) {
      updateTitle(pathname, siteSettings)
    }
  }, [pathname, siteSettings, isLoading])

  const updateTitle = (path: string, settings: any) => {
    if (typeof document === 'undefined') return

    const siteName = settings?.siteName || 'Exam System'
    const siteTagline = settings?.siteTagline || ''
    
    let pageTitle = ''
    
    if (path === '/' || path === '/landing') {
      pageTitle = siteTagline ? `${siteName} - ${siteTagline}` : siteName
    } else if (path.startsWith('/admin')) {
      const section = path.split('/')[2]
      if (section === 'dashboard') {
        pageTitle = `Admin Dashboard - ${siteName}`
      } else if (section === 'programs') {
        pageTitle = `Programs - ${siteName}`
      } else if (section === 'exams') {
        pageTitle = `Exams - ${siteName}`
      } else if (section === 'users') {
        pageTitle = `Users - ${siteName}`
      } else if (section === 'settings') {
        pageTitle = `Settings - ${siteName}`
      } else if (section === 'newsletter') {
        pageTitle = `Newsletter - ${siteName}`
      } else if (section === 'theme-editor') {
        pageTitle = `Theme Editor - ${siteName}`
      } else if (section === 'analytics') {
        pageTitle = `Analytics - ${siteName}`
      } else if (section === 'support') {
        pageTitle = `Support Tickets - ${siteName}`
      } else {
        pageTitle = `Admin Panel - ${siteName}`
      }
    } else if (path.startsWith('/student')) {
      const section = path.split('/')[2]
      if (section === 'dashboard') {
        pageTitle = `Student Dashboard - ${siteName}`
      } else if (section === 'browse-exams') {
        pageTitle = `Browse Exams - ${siteName}`
      } else if (section === 'programs') {
        pageTitle = `My Programs - ${siteName}`
      } else if (section === 'results') {
        pageTitle = `Results - ${siteName}`
      } else if (section === 'performance') {
        pageTitle = `Performance - ${siteName}`
      } else if (section === 'leaderboard') {
        pageTitle = `Leaderboard - ${siteName}`
      } else if (section === 'analytics') {
        pageTitle = `Analytics - ${siteName}`
      } else if (section === 'achievements') {
        pageTitle = `Achievements - ${siteName}`
      } else if (section === 'support') {
        pageTitle = `Support - ${siteName}`
      } else if (section === 'profile') {
        pageTitle = `Profile - ${siteName}`
      } else if (section === 'settings') {
        pageTitle = `Settings - ${siteName}`
      } else {
        pageTitle = `Student Portal - ${siteName}`
      }
    } else if (path.startsWith('/proctor')) {
      const section = path.split('/')[2]
      if (section === 'dashboard') {
        pageTitle = `Proctor Dashboard - ${siteName}`
      } else {
        pageTitle = `Proctor Panel - ${siteName}`
      }
    } else if (path === '/login') {
      pageTitle = `Login - ${siteName}`
    } else if (path === '/register') {
      pageTitle = `Register - ${siteName}`
    } else if (path === '/forgot-password') {
      pageTitle = `Forgot Password - ${siteName}`
    } else if (path === '/profile') {
      pageTitle = `Profile - ${siteName}`
    } else {
      pageTitle = siteName
    }

    document.title = pageTitle
    
    // Update favicon
    if (settings?.faviconUrl) {
      let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      if (!favicon) {
        favicon = document.createElement('link')
        favicon.rel = 'icon'
        document.head.appendChild(favicon)
      }
      favicon.href = settings.faviconUrl
    }
  }

  return null
}
