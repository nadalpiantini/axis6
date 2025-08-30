'use client'

import { ReactNode } from 'react'

import { reportError, initializeErrorTracking } from '@/lib/monitoring/error-tracking'
import { logger } from '@/lib/utils/logger'

import { ErrorBoundary } from './ErrorBoundary'

interface GlobalErrorBoundaryProps {
  children: ReactNode
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  // Initialize error tracking on mount
  if (typeof window !== 'undefined') {
    initializeErrorTracking()
  }

  const handleGlobalError = (error: Error, errorInfo: any) => {
    logger.error('Global error boundary triggered', error)

    reportError(error, 'critical', {
      component: 'GlobalErrorBoundary',
      action: 'global_error',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      metadata: {
        ...errorInfo,
        timestamp: new Date().toISOString(),
        sessionStorage: typeof window !== 'undefined' ?
          JSON.stringify(Object.keys(window.sessionStorage || {})) : undefined,
        localStorage: typeof window !== 'undefined' ?
          JSON.stringify(Object.keys(window.localStorage || {})) : undefined,
      },
    })
  }

  return (
    <ErrorBoundary onError={handleGlobalError}>
      {children}
    </ErrorBoundary>
  )
}
