/**
 * Sentry Edge Runtime Configuration for AXIS6
 *
 * This file configures Sentry for edge runtime functions
 * like middleware and edge API routes.
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Lower sampling rate for edge functions
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

  // No profiling for edge runtime
  profilesSampleRate: 0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.npm_package_version || '1.0.0',

  // Additional context for edge
  initialScope: {
    tags: {
      component: 'edge',
      runtime: 'edge'
    },
    contexts: {
      app: {
        name: 'AXIS6',
        version: process.env.npm_package_version || '1.0.0'
      },
      runtime: {
        name: 'edge',
        version: 'unknown'
      }
    }
  },

  // Configure error filtering for edge
  beforeSend(event, hint) {
    // Don't send development errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry edge event:', event)
    }

    // Filter out expected middleware errors
    if (event.exception) {
      const error = hint.originalException

      // Filter out authentication redirects (expected)
      if (error && typeof error === 'object' && 'message' in error &&
          typeof error.message === 'string' && error.message.includes('redirect')) {
        return null
      }

      // Filter out CORS preflight errors (expected)
      if (error && typeof error === 'object' && 'message' in error &&
          typeof error.message === 'string' && error.message.includes('CORS')) {
        return null
      }
    }

    return event
  },

  // Minimal integrations for edge runtime - using the new API
  integrations: [
    // HTTP integration for edge runtime
    Sentry.httpIntegration({
      tracing: true,
      breadcrumbs: false // Disable breadcrumbs for better performance
    })
  ],

  // Configure transaction filtering for edge
  tracesSampler(samplingContext) {
    // Don't sample static assets
    if (samplingContext.request?.url?.includes('/_next/')) {
      return 0
    }

    // Don't sample health checks
    if (samplingContext.request?.url?.includes('/health')) {
      return 0
    }

    // Sample middleware traces at lower rate
    if (samplingContext.name === 'middleware') {
      return process.env.NODE_ENV === 'production' ? 0.01 : 0.1
    }

    // Default sampling rate
    return process.env.NODE_ENV === 'production' ? 0.05 : 0.5
  },

  // Disable breadcrumbs for performance
  beforeBreadcrumb() {
    return null
  },
})

// Add edge-specific context
Sentry.setContext('edge', {
  timestamp: new Date().toISOString(),
  userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
})

// Configure tags
Sentry.setTag('edge', true)
Sentry.setTag('environment', process.env.NODE_ENV)

if (process.env.VERCEL) {
  Sentry.setTag('platform', 'vercel-edge')
  Sentry.setTag('region', process.env.VERCEL_REGION)
}
