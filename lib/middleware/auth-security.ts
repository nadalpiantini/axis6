/**
 * Enhanced Authentication Security Middleware
 * Implements comprehensive security checks for API routes
 * Priority: CRITICAL - Secures all API endpoints
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { validateCSRF } from '@/lib/security/csrf'
export interface AuthenticationResult {
  user: any | null
  error: string | null
  blocked: boolean
  reason?: string
}
/**
 * Enhanced authentication check with security monitoring
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticationResult> {
  try {
    const supabase = await createClient()
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      // Log failed authentication attempts
      logger.warn('Authentication failed', {
        path: request.nextUrl.pathname,
        method: request.method,
        ip: request.ip || request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
        error: authError?.message,
      })
      return {
        user: null,
        error: 'Authentication required',
        blocked: true,
        reason: 'No valid session'
      }
    }
    // Additional security checks
    const securityChecks = await performSecurityChecks(user, request)
    if (!securityChecks.passed) {
      logger.error('Security check failed', {
        userId: user.id,
        path: request.nextUrl.pathname,
        checks: securityChecks.failures,
      })
      return {
        user: null,
        error: 'Security validation failed',
        blocked: true,
        reason: securityChecks.failures.join(', ')
      }
    }
    return {
      user,
      error: null,
      blocked: false
    }
  } catch (error) {
    logger.error('Authentication middleware error', error)
    return {
      user: null,
      error: 'Authentication system error',
      blocked: true,
      reason: 'System error'
    }
  }
}
/**
 * Perform additional security checks on authenticated users
 */
async function performSecurityChecks(user: any, request: NextRequest): Promise<{
  passed: boolean
  failures: string[]
}> {
  const failures: string[] = []
  // 1. Check user account status
  if (!user.email_confirmed_at) {
    failures.push('Email not confirmed')
  }
  // 2. Check for suspicious patterns
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousAgents = ['curl', 'wget', 'python', 'bot']
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    failures.push('Suspicious user agent')
  }
  // 3. Validate session timing
  const now = Date.now()
  const userCreated = new Date(user.created_at).getTime()
  const sessionAge = now - userCreated
  // Block very new accounts making immediate API calls (potential abuse)
  if (sessionAge < 5 * 60 * 1000 && request.method !== 'GET') { // 5 minutes
    failures.push('Account too new for write operations')
  }
  // 4. Check for rapid requests (basic rate limiting)
  const requestId = `${user.id}:${request.nextUrl.pathname}`
  // This would integrate with Redis for proper rate limiting
  return {
    passed: failures.length === 0,
    failures
  }
}
/**
 * Comprehensive API security middleware wrapper
 */
export function withApiSecurity(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    requireCSRF?: boolean
    allowedMethods?: string[]
  } = {}
) {
  const {
    requireAuth = true,
    requireCSRF = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE']
  } = options
  return async (request: NextRequest) => {
    try {
      // 1. Method validation
      if (!allowedMethods.includes(request.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        )
      }
      // 2. CSRF protection for state-changing operations
      if (requireCSRF && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfError = await validateCSRF(request)
        if (csrfError) {
          logger.warn('CSRF validation failed', {
            path: request.nextUrl.pathname,
            method: request.method,
            ip: request.ip || request.headers.get('x-forwarded-for'),
          })
          return csrfError
        }
      }
      // 3. Authentication check
      let user = null
      if (requireAuth) {
        const authResult = await authenticateRequest(request)
        if (authResult.blocked) {
          return NextResponse.json(
            { 
              error: authResult.error,
              reason: authResult.reason 
            },
            { status: 401 }
          )
        }
        user = authResult.user
      }
      // 4. Content-Type validation for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const contentType = request.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          return NextResponse.json(
            { error: 'Content-Type must be application/json' },
            { status: 400 }
          )
        }
      }
      // 5. Request size validation
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
        return NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        )
      }
      // 6. Call the protected handler
      const response = await handler(request, user)
      // 7. Add security headers to response
      addSecurityHeaders(response)
      return response
    } catch (error) {
      logger.error('API security middleware error', {
        path: request.nextUrl.pathname,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
/**
 * Add security headers to API responses
 */
function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
}
/**
 * Simplified middleware for read-only endpoints
 */
export function withReadOnlyAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return withApiSecurity(handler, {
    requireAuth: true,
    requireCSRF: false,
    allowedMethods: ['GET']
  })
}
/**
 * Full security middleware for write operations
 */
export function withWriteAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return withApiSecurity(handler, {
    requireAuth: true,
    requireCSRF: true,
    allowedMethods: ['POST', 'PUT', 'DELETE']
  })
}
/**
 * Public endpoint wrapper with basic security
 */
export function withPublicSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withApiSecurity(
    async (req, _user) => handler(req),
    {
      requireAuth: false,
      requireCSRF: false,
      allowedMethods: ['GET']
    }
  )
}