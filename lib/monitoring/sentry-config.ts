import * as Sentry from '@sentry/nextjs'
import { CaptureContext, EventHint, SeverityLevel } from '@sentry/types'

/**
 * Initialize Sentry for error monitoring and performance tracking
 */
export function initSentry() {
  const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
  const environment = process.env.NODE_ENV || 'development'

  if (!SENTRY_DSN) {
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment,
    
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in production
    
    // Session Replay
    replaysSessionSampleRate: 0.01, // 1% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Integrations
    integrations: [
      // Browser tracing
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.nextRouterInstrumentation,
        tracePropagationTargets: [
          'localhost',
          'axis6.app',
          /^https:\/\/.*\.supabase\.co/
        ]
      }),
      
      // Replay integration for session recording
      new Sentry.Replay({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: false
      })
    ],

    // Filtering
    beforeSend(event, hint) {
      // Filter out non-error events in development
      if (environment === 'development' && event.level !== 'error') {
        return null
      }

      // Scrub sensitive data
      if (event.request) {
        delete event.request.cookies
        delete event.request.headers?.authorization
        delete event.request.headers?.['x-supabase-auth']
      }

      // Filter out known non-critical errors
      const error = hint.originalException
      if (error instanceof Error) {
        // Ignore network errors during development
        if (environment === 'development' && error.message?.includes('NetworkError')) {
          return null
        }

        // Ignore canceled requests
        if (error.message?.includes('AbortError')) {
          return null
        }

        // Ignore WebSocket auth errors (normal during login)
        if (error.message?.includes('WebSocket') && error.message?.includes('auth')) {
          return null
        }
      }

      return event
    },

    // Ignore specific errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed',
      'Non-Error promise rejection captured',
      'Navigation cancelled',
      'Network request failed'
    ],

    // Only send errors from our domain
    allowUrls: [
      /https:\/\/axis6\.app/,
      /http:\/\/localhost:6789/
    ]
  })
}

/**
 * Enhanced error logging with context
 */
export function logError(
  error: Error | string,
  context?: {
    level?: SeverityLevel
    user?: { id: string; email?: string }
    tags?: Record<string, string>
    extra?: Record<string, any>
    fingerprint?: string[]
  }
) {
  const errorMessage = error instanceof Error ? error.message : error
  const errorObj = error instanceof Error ? error : new Error(errorMessage)

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('🔴 Error:', errorMessage, context?.extra);
  }

  // Send to Sentry
  Sentry.captureException(errorObj, {
    level: context?.level || 'error',
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
    fingerprint: context?.fingerprint
  } as CaptureContext)
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  // Log slow operations
  if (duration > 1000) {
    logError(`Slow operation: ${operation}`, {
      level: 'warning',
      tags: { operation },
      extra: {
        duration,
        ...metadata
      }
    })
  }

  // Send performance data to Sentry
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction()
  if (transaction) {
    const span = transaction.startChild({
      op: 'custom',
      description: operation
    })
    span.setData('duration', duration)
    span.setData('metadata', metadata)
    span.finish()
  }
}

/**
 * User identification for error tracking
 */
export function identifyUser(user: { id: string; email?: string; name?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name
  })
}

/**
 * Clear user context on logout
 */
export function clearUser() {
  Sentry.setUser(null)
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000
  })
}

/**
 * Capture custom message
 */
export function logMessage(
  message: string,
  level: SeverityLevel = 'info',
  context?: Record<string, any>
) {
  if (process.env.NODE_ENV === 'development') {
    }]`, message, context)
  }

  Sentry.captureMessage(message, {
    level,
    extra: context
  } as CaptureContext)
}

/**
 * Performance monitoring transaction
 */
export function startTransaction(name: string, op: string = 'navigation') {
  return Sentry.startTransaction({ name, op })
}

/**
 * Monitor async operations
 */
export async function withMonitoring<T>(
  operation: string,
  fn: () => Promise<T>,
  options?: {
    userId?: string
    metadata?: Record<string, any>
    warnThreshold?: number
  }
): Promise<T> {
  const startTime = performance.now()
  const transaction = startTransaction(operation, 'task')
  
  try {
    addBreadcrumb(`Starting ${operation}`, 'operation', options?.metadata)
    const result = await fn()
    
    const duration = performance.now() - startTime
    logPerformance(operation, duration, options?.metadata)
    
    if (options?.warnThreshold && duration > options.warnThreshold) {
      logMessage(
        `Operation "${operation}" took ${duration}ms (threshold: ${options.warnThreshold}ms)`,
        'warning',
        options?.metadata
      )
    }
    
    transaction.setStatus('ok')
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    logError(error as Error, {
      tags: { operation },
      extra: {
        duration,
        ...options?.metadata
      }
    })
    
    transaction.setStatus('internal_error')
    throw error
  } finally {
    transaction.finish()
  }
}

/**
 * React Error Boundary integration
 */
export function logErrorBoundary(
  error: Error,
  errorInfo: { componentStack: string }
) {
  logError(error, {
    level: 'error',
    tags: { source: 'error_boundary' },
    extra: {
      componentStack: errorInfo.componentStack
    }
  })
}

/**
 * API route error handler
 */
export function handleAPIError(
  error: unknown,
  context?: {
    endpoint: string
    method: string
    userId?: string
    params?: Record<string, any>
  }
) {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  
  logError(errorObj, {
    level: 'error',
    tags: {
      endpoint: context?.endpoint || 'unknown',
      method: context?.method || 'unknown'
    },
    extra: context?.params,
    user: context?.userId ? { id: context.userId } : undefined
  })

  // Return user-friendly error response
  return {
    error: 'An unexpected error occurred',
    message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
    statusCode: 500
  }
}