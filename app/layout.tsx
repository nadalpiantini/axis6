import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ReactQueryProvider } from '@/lib/react-query/provider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { NotificationToast } from '@/components/ui/NotificationToast'
import { SupabaseErrorBoundary } from '@/components/error/SupabaseErrorBoundary'
import { Toaster } from 'sonner'
import { headers } from 'next/headers'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Improves loading performance and prevents FOUT
  preload: false // Disable preload to avoid PWA conflict
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:6789'),
  title: 'AXIS6 - Balance Across 6 Life Dimensions',
  description: 'Transform your life by achieving perfect balance across 6 essential dimensions: Physical, Mental, Emotional, Social, Spiritual, and Material.',
  keywords: 'wellness, balance, productivity, mental health, personal development, habits',
  authors: [{ name: 'AXIS6' }],
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '512x512', type: 'image/png' },
      { url: '/brand/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/brand/icons/icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'AXIS6 - Balance Across 6 Life Dimensions',
    description: 'Six axes. One you. Don\'t break your Axis.',
    type: 'website',
    locale: 'en_US',
    url: 'https://axis6.app',
    siteName: 'AXIS6',
    images: [
      {
        url: '/brand/social/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AXIS6 - Balance Across 6 Life Dimensions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AXIS6 - Balance Across 6 Life Dimensions',
    description: 'Six axes. One you. Don\'t break your Axis.',
    images: ['/brand/social/twitter-card.png'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get CSP nonce from headers if available (for future enhancement)
  const headersList = await headers()
  const nonce = headersList.get('x-csp-nonce') || undefined
  
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags for better CSP compatibility */}
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
        
        {/* Enhanced mobile viewport with safe area and pinch zoom control */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, maximum-scale=5, minimum-scale=1, user-scalable=yes, viewport-fit=cover"
        />
        
        {/* Mobile web app capabilities */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AXIS6" />
        <meta name="application-name" content="AXIS6" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="msapplication-TileColor" content="#1e293b" />
        <meta name="msapplication-navbutton-color" content="#1e293b" />
        
        {/* Prevent text size adjustment on mobile devices */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        
        {/* Touch and gesture optimization */}
        <meta name="touch-action" content="manipulation" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Safe area CSS variables setup */}
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --safe-area-inset-top: env(safe-area-inset-top, 0px);
              --safe-area-inset-right: env(safe-area-inset-right, 0px);
              --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
              --safe-area-inset-left: env(safe-area-inset-left, 0px);
            }
            
            /* Prevent overscroll bounce on iOS */
            html, body {
              overscroll-behavior: none;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Optimize font rendering on mobile */
            html {
              -webkit-text-size-adjust: 100%;
              text-size-adjust: 100%;
            }
          `
        }} />
        
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://nvpnhqhjttgwfwvkgmpk.supabase.co" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//nvpnhqhjttgwfwvkgmpk.supabase.co" />
        
        {/* Splash screen for iOS */}
        <link rel="apple-touch-startup-image" href="/brand/splash/iphone5_splash.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/brand/splash/iphone6_splash.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/brand/splash/iphoneplus_splash.png" media="(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/brand/splash/iphonex_splash.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/brand/splash/iphonexr_splash.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/brand/splash/iphonexsmax_splash.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/brand/splash/ipad_splash.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/brand/splash/ipadpro1_splash.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/brand/splash/ipadpro2_splash.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)" />
        <link rel="apple-touch-startup-image" href="/brand/splash/ipadpro3_splash.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)" />
      </head>
      <body 
        className={`${inter.className} antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen`}
        style={{
          // Mobile-specific body styling with safe area support
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          // Prevent text selection on non-text elements
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          KhtmlUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
          // Enhance touch scrolling
          WebkitOverflowScrolling: 'touch',
          // Prevent zoom on input focus (iOS)
          fontSize: '16px',
        }}
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          <SupabaseErrorBoundary>
            <AuthProvider>
              <NotificationToast />
              <Toaster 
                theme="dark"
                position="bottom-center"
                richColors
                closeButton
                // Mobile-optimized toast configuration
                toastOptions={{
                  style: {
                    marginBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
                    maxWidth: 'calc(100vw - 2rem)',
                    fontSize: '14px',
                    padding: '12px 16px',
                  },
                  className: 'touch-manipulation',
                }}
                // Ensure toasts are above all content on mobile
                style={{
                  zIndex: 9999,
                }}
              />
              {children}
            </AuthProvider>
          </SupabaseErrorBoundary>
        </ReactQueryProvider>
        
        {/* Supabase auth helper script - conditionally add nonce if available */}
        {nonce ? (
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `
                // Supabase auth state sync helper
                window.supabaseAuthStateSync = true;
              `
            }}
          />
        ) : null}
      </body>
    </html>
  )
}