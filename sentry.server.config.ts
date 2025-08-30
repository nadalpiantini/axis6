/**
 * Sentry Server Configuration for AXIS6
 *
 * This file configures Sentry for server-side error tracking
 * and performance monitoring.
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Performance monitoring
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.npm_package_version || '1.0.0',

  // Server name (useful for multi-server deployments)
  serverName: process.env.VERCEL_REGION || process.env.HOSTNAME || 'unknown',

  // Additional context
  initialScope: {
    tags: {
      component: 'server',
      runtime: 'node'
    },
    contexts: {
      app: {
        name: 'AXIS6',
        version: process.env.npm_package_version || '1.0.0'
      },
      runtime: {
        name: 'node',
        version: process.version
      }
    }
  },

  // Configure error filtering for server
  beforeSend(event, hint) {
    // Don't send certain development errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry server event:', event)
    }

    // Filter out expected errors
    if (event.exception) {
      const error = hint.originalException

      // Filter out authentication errors (expected)
      if (error && typeof error === 'object' && 'message' in error &&
          typeof error.message === 'string' && error.message.includes('unauthorized')) {
        return null
      }

      // Filter out validation errors (expected)
      if (error && typeof error === 'object' && 'message' in error &&
          typeof error.message === 'string' && error.message.includes('validation')) {
        return null
      }

      // Filter out rate limit errors (expected)
      if (error && typeof error === 'object' && 'message' in error &&
          typeof error.message === 'string' && error.message.includes('rate limit')) {
        return null
      }
    }

    return event
  },

  // Integrations for server-side - using the new API
  integrations: [
    // Node.js specific integrations
    Sentry.nodeProfilingIntegration(),
    
    // HTTP integration for API monitoring
    Sentry.httpIntegration({
      tracing: true,
      breadcrumbs: true
    }),

    // File system integration
    Sentry.onUncaughtExceptionIntegration({
      onFatalError: (err) => {
        console.error('Fatal error:', err)
        process.exit(1)
      }
    }),

    // Express integration (if using Express middleware)
    // Sentry.expressIntegration({ app: undefined }),
  ],

  // Configure beforeBreadcrumb for server
  beforeBreadcrumb(breadcrumb, hint) {
    // Don't capture sensitive HTTP headers
    if (breadcrumb.category === 'http') {
      if (breadcrumb.data) {
        // Remove sensitive headers
        const sensitiveHeaders = ['authorization', 'cookie', 'x-csrf-token']
        sensitiveHeaders.forEach(header => {
          if (breadcrumb.data && breadcrumb.data[header]) {
            breadcrumb.data[header] = '[Filtered]'
          }
        })
      }
    }

    // Filter out database queries that might contain PII
    if (breadcrumb.category === 'query') {
      if (breadcrumb.message && breadcrumb.message.includes('email')) {
        breadcrumb.message = breadcrumb.message.replace(/email = '[^']*'/g, "email = '[Filtered]'")
      }
    }

    return breadcrumb
  },

  // Configure transaction filtering
  tracesSampler(samplingContext) {
    // Don't sample health checks
    if (samplingContext.request?.url?.includes('/health')) {
      return 0
    }

    // Don't sample static assets
    if (samplingContext.request?.url?.includes('/_next/')) {
      return 0
    }

    // Sample API routes more heavily
    if (samplingContext.request?.url?.includes('/api/')) {
      return process.env.NODE_ENV === 'production' ? 0.2 : 1.0
    }

    // Default sampling rate
    return process.env.NODE_ENV === 'production' ? 0.1 : 1.0
  },
})

// Add server-specific context
Sentry.setContext('server', {
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.version,
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage(),
  pid: process.pid,
  ppid: process.ppid,
  timestamp: new Date().toISOString(),
})

// Configure tags
Sentry.setTag('server', true)
Sentry.setTag('environment', process.env.NODE_ENV)

if (process.env.VERCEL) {
  Sentry.setTag('platform', 'vercel')
  Sentry.setTag('region', process.env.VERCEL_REGION)
}
