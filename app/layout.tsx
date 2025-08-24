import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ReactQueryProvider } from '@/lib/react-query/provider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { NotificationToast } from '@/components/ui/NotificationToast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body 
        className={`${inter.className} antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen`}
        suppressHydrationWarning
      >
        <ReactQueryProvider>
          <AuthProvider>
            <NotificationToast />
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}