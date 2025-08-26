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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://nvpnhqhjttgwfwvkgmpk.supabase.co" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//nvpnhqhjttgwfwvkgmpk.supabase.co" />
      </head>
      <body 
        className={`${inter.className} antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen`}
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