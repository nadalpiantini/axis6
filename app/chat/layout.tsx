import { Metadata } from 'next'
import { Suspense } from 'react'

import { RealtimeErrorBoundary } from '@/components/error/RealtimeErrorBoundary'

export const metadata: Metadata = {
  title: 'Chat | AXIS6',
  description: 'Connect with your wellness community',
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RealtimeErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-gray-950">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading chat...</p>
            </div>
          </div>
        }
      >
        <div className="min-h-screen bg-gray-950">
          {children}
        </div>
      </Suspense>
    </RealtimeErrorBoundary>
  )
}
