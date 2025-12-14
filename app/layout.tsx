import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from 'sonner'
import { AppProvider } from '@/context/app-context'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ServiceWorkerRegistration } from '@/components/service-worker-registration'
import { AuthInitializer } from '@/components/auth-initializer'
import { PageTracker } from '@/components/page-tracker'
import { DynamicTitle } from '@/components/dynamic-title'
import { getGeneralSettings, getSEOSettings } from '@/lib/settings'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: '#667eea',
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [generalSettings, seoSettings] = await Promise.all([
      getGeneralSettings(),
      getSEOSettings()
    ])

    const siteName = generalSettings.siteName || 'Exam System'
    const description = seoSettings.description || 'Advanced online examination management system with real-time updates and offline support'
    const keywords = seoSettings.keywords || ''
    const faviconUrl = generalSettings.faviconUrl || '/placeholder-logo.png'
    const ogImage = seoSettings.ogImage || ''

    return {
      title: siteName,
      description,
      keywords: keywords ? keywords.split(',').map((k: string) => k.trim()) : undefined,
      generator: 'v0.app',
      manifest: '/manifest.json',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: siteName,
      },
      icons: {
        icon: faviconUrl,
        apple: faviconUrl,
      },
      openGraph: {
        title: siteName,
        description,
        siteName: siteName,
        images: ogImage ? [{ url: ogImage }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: siteName,
        description,
        images: ogImage ? [ogImage] : undefined,
      },
    }
  } catch (error) {
    // Fallback to defaults if settings can't be loaded
    return {
      title: 'Exam System - Online Examination Platform',
      description: 'Advanced online examination management system with real-time updates and offline support',
      generator: 'v0.app',
      manifest: '/manifest.json',
      appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Exam System',
      },
      icons: {
        icon: '/placeholder-logo.png',
        apple: '/placeholder-logo.png',
      },
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <AppProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthInitializer />
            <ServiceWorkerRegistration />
            <PageTracker />
            <DynamicTitle />
            {children}
            <Toaster />
            <Sonner position="top-right" richColors />
          </ThemeProvider>
        </AppProvider>
        <Analytics />
      </body>
    </html>
  )
}
