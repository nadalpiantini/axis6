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
  openGraph: {
    title: 'AXIS6 - Balance Across 6 Life Dimensions',
    description: 'Six axes. One you. Don\'t break your Axis.',
    type: 'website',
    locale: 'en_US',
    url: 'https://axis6.app',
    siteName: 'AXIS6',
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