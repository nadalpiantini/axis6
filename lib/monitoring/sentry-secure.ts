/**
 * Enhanced Sentry Configuration with Security Focus
 * Comprehensive error tracking and security monitoring
 * Priority: HIGH - Critical for production security monitoring
 */
import * as Sentry from '@sentry/nextjs'
import { 
  httpIntegration,
  dedupeIntegration,
  consoleIntegration,
  rewriteFramesIntegration,
  globalHandlersIntegration
} from '@sentry/nextjs'
import { logger } from '@/lib/logger'
// =====================================================
// SECURITY-FOCUSED SENTRY CONFIGURATION
// =====================================================
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'
/**
 * Enhanced Sentry initialization with security monitoring
 */
export function initializeSecureSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Environment and release tracking
    environment: process.env.NODE_ENV || 'development',
    release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    // Performance monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    profilesSampleRate: isProduction ? 0.1 : 1.0,
    // Security-focused error filtering
    beforeSend(event) {
      // Security enhancements for error data
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['cookie']
          delete event.request.headers['x-csrf-token']
          delete event.request.headers['x-api-key']
        }
        // Remove sensitive query parameters
        if (event.request.query_string) {
          const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth']
          sensitiveParams.forEach(param => {
            event.request.query_string = event.request.query_string?.replace(
              new RegExp(`${param}=[^&]*`, 'gi'),
              `${param}=[REDACTED]`
            )
          })
        }
        // Remove sensitive POST data
        if (event.request.data) {
          event.request.data = sanitizeRequestData(event.request.data)
        }
      }
      // Remove sensitive context data
      if (event.contexts?.trace?.data) {
        delete event.contexts.trace.data.password
        delete event.contexts.trace.data.token
        delete event.contexts.trace.data.secret
      }
      // Security incident tagging
      if (event.message || event.exception) {
        const securityKeywords = ['injection', 'xss', 'csrf', 'unauthorized', 'attack', 'exploit']
        const errorText = (event.message || '').toLowerCase()
        if (securityKeywords.some(keyword => errorText.includes(keyword))) {
          event.tags = {
            ...event.tags,
            security_incident: true,
            priority: 'high',
          }
          event.level = 'error'
        }
      }
      return event
    },
    // Enhanced error filtering
    ignoreErrors: [
      // Network errors that aren't security issues
      'NetworkError',
      'fetch aborted',
      'Connection refused',
      // Browser extension interference
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      // Known Next.js development issues
      ...(isDevelopment ? [
        'ChunkLoadError',
        'Loading chunk',
        'Loading CSS chunk',
      ] : []),
    ],
    // Security-focused transaction monitoring
    beforeSendTransaction(event) {
      // Monitor security-sensitive operations
      if (event.transaction) {
        const securityRoutes = ['/api/auth/', '/api/admin/', '/api/settings/']
        if (securityRoutes.some(route => event.transaction?.includes(route))) {
          event.tags = {
            ...event.tags,
            security_sensitive: true,
          }
        }
      }
      return event
    },
    // Enhanced integrations
    integrations: [
      // HTTP integration with security filtering
      httpIntegration({
        tracing: true,
        breadcrumbs: true,
        // Filter sensitive URLs
        urlFilter: (url) => {
          const sensitivePatterns = [
            /password/i,
            /secret/i,
            /token/i,
            /key/i,
          ]
          return !sensitivePatterns.some(pattern => pattern.test(url))
        },
      }),
      // Console integration (limited in production)
      consoleIntegration({
        levels: isProduction ? ['error'] : ['warn', 'error'],
      }),
      // Dedupe integration to reduce noise
      dedupeIntegration(),
      // Performance monitoring
      ...(isProduction ? [
        rewriteFramesIntegration({
          root: process.cwd(),
        }),
      ] : []),
    ],
    // Debug settings
    debug: isDevelopment,
    // Security-focused session replay (production only)
    ...(isProduction && {
      replaysSessionSampleRate: 0.01, // Very low rate for privacy
      replaysOnErrorSampleRate: 0.1,
    }),
  })
  logger.info('Secure Sentry monitoring initialized', {
    environment: process.env.NODE_ENV,
    securityMode: true,
    hasDSN: !!process.env.SENTRY_DSN,
  })
}
/**
 * Sanitize request data for error reporting
 */
function sanitizeRequestData(data: any): any {
  if (!data || typeof data !== 'object') return data
  const sanitized = { ...data }
  // Remove sensitive fields
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'authorization',
    'csrf', 'session', 'cookie', 'signature', 'hash'
  ]
  sensitiveFields.forEach(field => {
    Object.keys(sanitized).forEach(key => {
      if (key.toLowerCase().includes(field)) {
        sanitized[key] = '[REDACTED]'
      }
    })
  })
  return sanitized
}
/**
 * Enhanced error reporting with security context
 */
export function reportSecurityEvent(
  error: Error | string,
  context: {
    type: 'auth_failure' | 'csrf_violation' | 'rate_limit' | 'injection_attempt' | 'unauthorized_access'
    severity: 'low' | 'medium' | 'high' | 'critical'
    userId?: string
    ip?: string
    userAgent?: string
    endpoint?: string
    metadata?: Record<string, any>
  }
) {
  const { type, severity, userId, ip, userAgent, endpoint, metadata } = context
  // Create enhanced error context
  const enhancedContext = {
    tags: {
      security_event: true,
      event_type: type,
      severity,
      endpoint: endpoint || 'unknown',
    },
    user: userId ? { id: userId } : undefined,
    extra: {
      ip: ip ? ip.split(',')[0]?.trim() : undefined, // First IP only
      userAgent: userAgent?.substring(0, 100), // Truncate long user agents
      timestamp: new Date().toISOString(),
      ...metadata,
    },
    level: severity === 'critical' ? 'fatal' : 
           severity === 'high' ? 'error' :
           severity === 'medium' ? 'warning' : 'info',
  }
  // Report to Sentry with enhanced context
  Sentry.withScope((scope) => {
    // Set security context
    scope.setTag('security_incident', true)
    scope.setTag('event_type', type)
    scope.setLevel(enhancedContext.level as any)
    // Add security-specific context
    scope.setContext('security', {
      type,
      severity,
      endpoint,
      timestamp: enhancedContext.extra.timestamp,
    })
    // Add user context (if available)
    if (userId) {
      scope.setUser({ id: userId })
    }
    // Add additional context
    if (enhancedContext.extra) {
      scope.setContext('incident_details', enhancedContext.extra)
    }
    // Capture the event
    if (typeof error === 'string') {
      Sentry.captureMessage(error, enhancedContext.level as any)
    } else {
      Sentry.captureException(error)
    }
  })
  // Also log locally for immediate visibility
  logger[enhancedContext.level as keyof typeof logger]('Security event reported', {
    type,
    severity,
    endpoint,
    userId: userId ? `user_${userId.substring(0, 8)}...` : undefined,
    message: typeof error === 'string' ? error : error.message,
  })
}
/**
 * Rate limiting violation reporter
 */
export function reportRateLimitViolation(details: {
  endpoint: string
  identifier: string
  limit: number
  current: number
  window: string
  userAgent?: string
}) {
  reportSecurityEvent(
    `Rate limit exceeded: ${details.current}/${details.limit} in ${details.window}`,
    {
      type: 'rate_limit',
      severity: details.current > details.limit * 2 ? 'high' : 'medium',
      endpoint: details.endpoint,
      metadata: {
        limit: details.limit,
        current: details.current,
        window: details.window,
        identifier: details.identifier.split(':')[0] + ':***', // Anonymize
        userAgent: details.userAgent?.substring(0, 50),
      },
    }
  )
}
/**
 * Authentication failure reporter
 */
export function reportAuthFailure(details: {
  endpoint: string
  reason: string
  userId?: string
  ip?: string
  userAgent?: string
  attempts?: number
}) {
  const severity = details.attempts && details.attempts > 5 ? 'high' : 
                   details.attempts && details.attempts > 3 ? 'medium' : 'low'
  reportSecurityEvent(
    `Authentication failure: ${details.reason}`,
    {
      type: 'auth_failure',
      severity,
      userId: details.userId,
      ip: details.ip,
      userAgent: details.userAgent,
      endpoint: details.endpoint,
      metadata: {
        reason: details.reason,
        attempts: details.attempts,
      },
    }
  )
}
/**
 * CSRF violation reporter
 */
export function reportCSRFViolation(details: {
  endpoint: string
  userId?: string
  ip?: string
  userAgent?: string
  method: string
}) {
  reportSecurityEvent(
    `CSRF token validation failed`,
    {
      type: 'csrf_violation',
      severity: 'high',
      userId: details.userId,
      ip: details.ip,
      userAgent: details.userAgent,
      endpoint: details.endpoint,
      metadata: {
        method: details.method,
      },
    }
  )
}
/**
 * Injection attempt reporter
 */
export function reportInjectionAttempt(details: {
  endpoint: string
  injectionType: 'xss' | 'sql' | 'command' | 'path_traversal'
  payload: string
  userId?: string
  ip?: string
  userAgent?: string
}) {
  reportSecurityEvent(
    `${details.injectionType.toUpperCase()} injection attempt detected`,
    {
      type: 'injection_attempt',
      severity: 'critical',
      userId: details.userId,
      ip: details.ip,
      userAgent: details.userAgent,
      endpoint: details.endpoint,
      metadata: {
        injectionType: details.injectionType,
        payload: details.payload.substring(0, 200), // Truncate long payloads
      },
    }
  )
}
/**
 * Unauthorized access attempt reporter
 */
export function reportUnauthorizedAccess(details: {
  endpoint: string
  resource: string
  userId?: string
  ip?: string
  userAgent?: string
  attemptedUserId?: string
}) {
  reportSecurityEvent(
    `Unauthorized access attempt to ${details.resource}`,
    {
      type: 'unauthorized_access',
      severity: 'high',
      userId: details.userId,
      ip: details.ip,
      userAgent: details.userAgent,
      endpoint: details.endpoint,
      metadata: {
        resource: details.resource,
        attemptedUserId: details.attemptedUserId,
      },
    }
  )
}
/**
 * Security metrics collector
 */
export function collectSecurityMetrics(): {
  authFailures: number
  rateLimitViolations: number
  csrfViolations: number
  injectionAttempts: number
  timestamp: string
} {
  // This would integrate with your metrics store (Redis, etc.)
  // For now, return basic structure
  return {
    authFailures: 0,
    rateLimitViolations: 0,
    csrfViolations: 0,
    injectionAttempts: 0,
    timestamp: new Date().toISOString(),
  }
}
/**
 * Enhanced performance monitoring with security context
 */
export function startSecurityPerformanceMonitoring() {
  // Monitor API response times for security endpoints
  const securityEndpoints = [
    '/api/auth/',
    '/api/csrf',
    '/api/admin/',
  ]
  // Set up performance observers for security-sensitive operations
  if (typeof window !== 'undefined') {
    // Client-side monitoring
    window.addEventListener('securityEvent', (event: any) => {
      reportSecurityEvent(event.detail.message, event.detail.context)
    })
  }
  logger.info('Security performance monitoring started')
}
// =====================================================
// SENTRY CONFIGURATION WITH SECURITY ENHANCEMENTS
// =====================================================
/**
 * Configure Sentry with security-first settings
 */
export const secureSentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  // Sampling rates optimized for security monitoring
  tracesSampleRate: isProduction ? 0.2 : 1.0, // Higher rate for better security visibility
  profilesSampleRate: isProduction ? 0.1 : 1.0,
  // Enhanced error capture
  attachStacktrace: true,
  sendDefaultPii: false, // NEVER send PII to Sentry
  // Security-focused beforeSend
  beforeSend(event, hint) {
    // Enhanced PII removal
    if (event.request) {
      // Remove all cookies and auth headers
      if (event.request.headers) {
        const sensitiveHeaders = [
          'authorization', 'cookie', 'x-csrf-token', 'x-api-key',
          'x-auth-token', 'bearer', 'api-key', 'access-token'
        ]
        sensitiveHeaders.forEach(header => {
          Object.keys(event.request!.headers!).forEach(key => {
            if (key.toLowerCase().includes(header)) {
              delete event.request!.headers![key]
            }
          })
        })
      }
      // Sanitize request data
      if (event.request.data) {
        event.request.data = sanitizeForSentry(event.request.data)
      }
    }
    // Remove sensitive user data
    if (event.user) {
      delete (event.user as any).password
      delete (event.user as any).token
      delete (event.user as any).secret
    }
    // Security tagging
    const errorMessage = hint.originalException?.message || event.message || ''
    const isSecurityRelated = checkIfSecurityRelated(errorMessage)
    if (isSecurityRelated) {
      event.tags = {
        ...event.tags,
        security_related: true,
        review_required: true,
      }
      // Increase priority for security-related errors
      event.level = 'error'
    }
    return event
  },
  // Performance monitoring for security endpoints
  beforeSendTransaction(event) {
    if (event.transaction) {
      const securityRoutes = ['/api/auth/', '/api/admin/', '/api/csrf', '/api/settings/security']
      if (securityRoutes.some(route => event.transaction?.includes(route))) {
        event.tags = {
          ...event.tags,
          security_endpoint: true,
        }
      }
      // Monitor slow security operations
      if (event.spans) {
        const slowSpans = event.spans.filter(span => (span.timestamp - span.start_timestamp) > 1000)
        if (slowSpans.length > 0) {
          event.tags = {
            ...event.tags,
            slow_security_operation: true,
          }
        }
      }
    }
    return event
  },
  // Integration configuration
  integrations: [
    httpIntegration({
      tracing: true,
      breadcrumbs: true,
    }),
    // Console integration (errors only in production)
    consoleIntegration({
      levels: isProduction ? ['error'] : ['warn', 'error'],
    }),
    // Dedupe to reduce noise
    dedupeIntegration(),
    // Enhanced error boundaries
    ...(typeof window !== 'undefined' ? [
      globalHandlersIntegration({
        onerror: true,
        onunhandledrejection: true,
      }),
    ] : []),
  ],
  // Release and deployment tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
  dist: process.env.VERCEL_GIT_COMMIT_REF || 'main',
  // Development-specific settings
  debug: isDevelopment && process.env.SENTRY_DEBUG === 'true',
}
// =====================================================
// UTILITY FUNCTIONS
// =====================================================
/**
 * Sanitize data for Sentry reporting
 */
function sanitizeForSentry(data: any): any {
  if (!data || typeof data !== 'object') return data
  const sanitized = { ...data }
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'auth', 'csrf',
    'ssn', 'credit_card', 'bank_account', 'social_security'
  ]
  function recursiveSanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) {
      return obj.map(recursiveSanitize)
    }
    const result: any = {}
    Object.keys(obj).forEach(key => {
      const lowerKey = key.toLowerCase()
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        result[key] = '[REDACTED]'
      } else if (typeof obj[key] === 'object') {
        result[key] = recursiveSanitize(obj[key])
      } else if (typeof obj[key] === 'string' && obj[key].length > 1000) {
        result[key] = obj[key].substring(0, 1000) + '...[TRUNCATED]'
      } else {
        result[key] = obj[key]
      }
    })
    return result
  }
  return recursiveSanitize(sanitized)
}
/**
 * Check if error is security-related
 */
function checkIfSecurityRelated(message: string): boolean {
  const securityKeywords = [
    'unauthorized', 'forbidden', 'access denied',
    'csrf', 'xss', 'injection', 'sql', 'script',
    'attack', 'exploit', 'vulnerability', 'breach',
    'malicious', 'suspicious', 'blocked'
  ]
  const lowerMessage = message.toLowerCase()
  return securityKeywords.some(keyword => lowerMessage.includes(keyword))
}
/**
 * Security dashboard integration
 */
export function getSecurityDashboardData() {
  // This would integrate with your security metrics
  return {
    securityEvents: collectSecurityMetrics(),
    sentryConfig: {
      environment: secureSentryConfig.environment,
      release: secureSentryConfig.release,
      securityMode: true,
    },
    monitoring: {
      active: !!process.env.SENTRY_DSN,
      lastUpdated: new Date().toISOString(),
    },
  }
}
// Initialize Sentry on module load
if (process.env.SENTRY_DSN) {
  initializeSecureSentry()
  startSecurityPerformanceMonitoring()
} else if (isProduction) {
  logger.warn('Sentry DSN not configured for production environment')
}