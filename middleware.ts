/**
 * ENHANCED SECURITY MIDDLEWARE
 * Comprehensive protection for AXIS6 production deployment
 * Priority: CRITICAL - Main security layer
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'
import { applyRateLimit, detectEndpointType } from '@/lib/security/production-rate-limit'
import { getEnhancedSecurityHeaders, generateSecureNonce } from '@/lib/security/csp-enhanced'
import { validateCSRF } from '@/lib/security/csrf'
import { logger } from '@/lib/logger'

// =====================================================
// ROUTE CONFIGURATION
// =====================================================

const protectedRoutes = [
  '/dashboard', '/settings', '/stats', '/profile', 
  '/analytics', '/achievements', '/chat', '/my-day'
]

const publicRoutes = [
  '/', '/auth/login', '/auth/register', 
  '/auth/forgot-password', '/auth/reset-password', '/about', '/privacy', '/terms'
]

const apiPublicRoutes = [
  '/api/health', '/api/csp-report', '/api/auth/login', 
  '/api/auth/register', '/api/auth/forgot-password'
]

const sensitiveApiRoutes = [
  '/api/analytics', '/api/settings', '/api/auth/reset-password',
  '/api/admin', '/api/export', '/api/data'
]

// =====================================================
// SECURITY AUDIT LOGGING
// =====================================================

function logSecurityEvent(
  type: 'auth_failure' | 'csrf_failure' | 'rate_limit' | 'suspicious_request',
  request: NextRequest,
  details: Record<string, any>
): void {
  const ip = request.ip || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('cf-connecting-ip') || 
    'unknown'
  
  const userAgent = request.headers.get('user-agent')
  const referer = request.headers.get('referer')
  
  logger.warn(`Security event: ${type}`, {
    type,
    ip: ip.split(',')[0]?.trim(), // Get first IP from forwarded list
    userAgent: userAgent?.substring(0, 200), // Truncate long user agents
    referer,
    path: request.nextUrl.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),
    ...details,
  })
}

// =====================================================
// ENHANCED AUTHENTICATION CHECK
// =====================================================

async function performEnhancedAuth(request: NextRequest): Promise<{
  user: any | null
  response: NextResponse | null
  securityViolations: string[]
}> {
  const securityViolations: string[] = []
  
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Enhanced cookie security validation
              if (value && value.length > 8000) {
                securityViolations.push('Oversized cookie value')
                return
              }
              
              // Validate base64 encoded values
              if (value && value.startsWith('base64-')) {
                try {
                  const decoded = atob(value.substring(7))
                  JSON.parse(decoded)
                } catch {
                  securityViolations.push('Invalid base64 cookie')
                  return
                }
              }
              
              // Set cookie with enhanced security
              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
              })
            })
          }
        }
      }
    )
    
    // Get user with timeout
    const authPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    )
    
    const { data: { user }, error } = await Promise.race([
      authPromise,
      timeoutPromise
    ]) as any
    
    if (error || !user) {
      if (error?.message?.includes('timeout')) {
        securityViolations.push('Auth timeout - possible DoS attempt')
      }
      
      logSecurityEvent('auth_failure', request, {
        error: error?.message,
        violations: securityViolations,
      })
      
      return {
        user: null,
        response: NextResponse.redirect(new URL('/auth/login', request.url)),
        securityViolations
      }
    }
    
    // Additional user security checks
    if (!user.email_confirmed_at && process.env.NODE_ENV === 'production') {
      securityViolations.push('Unconfirmed email in production')
    }
    
    // Check for suspicious session patterns
    const sessionAge = Date.now() - new Date(user.created_at).getTime()
    if (sessionAge < 30000 && request.method !== 'GET') { // 30 seconds
      securityViolations.push('Very new account making write requests')
    }
    
    return {
      user,
      response: null,
      securityViolations
    }
    
  } catch (error) {
    logSecurityEvent('auth_failure', request, {
      error: error instanceof Error ? error.message : 'Unknown auth error',
      violations: securityViolations,
    })
    
    return {
      user: null,
      response: NextResponse.redirect(new URL('/auth/login', request.url)),
      securityViolations: [...securityViolations, 'Auth system error']
    }
  }
}

// =====================================================
// MAIN MIDDLEWARE FUNCTION
// =====================================================

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method
  const startTime = Date.now()
  
  // Generate nonce for CSP
  const nonce = generateSecureNonce()
  
  // Create base response
  let response = NextResponse.next()
  
  // =====================================================
  // 1. GLOBAL SECURITY HEADERS
  // =====================================================
  
  const securityHeaders = getEnhancedSecurityHeaders(nonce, process.env.NODE_ENV === 'development')
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add performance and security monitoring headers
  response.headers.set('X-Request-ID', `${Date.now()}-${Math.random().toString(36).substring(2)}`)
  response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)
  
  // =====================================================
  // 2. API ROUTE SECURITY
  // =====================================================
  
  if (pathname.startsWith('/api/')) {
    // Apply global rate limiting first
    // TEMPORARILY DISABLED FOR DEVELOPMENT
    /*
    const globalRateLimit = await applyRateLimit(request, undefined, 'global_ip')
    if (globalRateLimit) return globalRateLimit
    
    // Detect endpoint type for specific rate limiting
    const endpointType = detectEndpointType(pathname)
    const specificRateLimit = await applyRateLimit(request, endpointType)
    if (specificRateLimit) return specificRateLimit
    */
    
    // CSRF protection for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      // Skip CSRF for auth endpoints and CSRF endpoint itself (they use their own protection)
      if (!pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/csrf')) {
        // Temporarily disable CSRF in development to fix the circular dependency issue
        if (process.env.NODE_ENV === 'production') {
          const csrfError = await validateCSRF(request)
          if (csrfError) {
            logSecurityEvent('csrf_failure', request, {
              endpoint: pathname,
              method,
            })
            return csrfError
          }
        }
      }
    }
    
    // Enhanced API security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    // Check if API route requires authentication
    const isPublicApi = apiPublicRoutes.some(route => pathname.startsWith(route))
    const isSensitiveApi = sensitiveApiRoutes.some(route => pathname.startsWith(route))
    
    if (!isPublicApi) {
      // Verify authentication for protected API routes
      const { user, response: authResponse, securityViolations } = await performEnhancedAuth(request)
      
      if (authResponse) {
        logSecurityEvent('auth_failure', request, {
          requiredAuth: true,
          violations: securityViolations,
        })
        return authResponse
      }
      
      // Apply user-specific rate limiting
      // TEMPORARILY DISABLED FOR DEVELOPMENT
      /*
      if (user) {
        const userRateLimit = await applyRateLimit(request, user.id, 'api_general')
        if (userRateLimit) return userRateLimit
        
        // Extra strict rate limiting for sensitive endpoints
        if (isSensitiveApi) {
          const sensitiveRateLimit = await applyRateLimit(request, user.id, 'sensitive')
          if (sensitiveRateLimit) return sensitiveRateLimit
        }
      }
      */
      
      // Log security violations for monitoring
      if (securityViolations.length > 0) {
        logSecurityEvent('suspicious_request', request, {
          violations: securityViolations,
          userId: user?.id,
        })
      }
    }
    
    return response
  }
  
  // =====================================================
  // 3. PAGE ROUTE SECURITY
  // =====================================================
  
  // Skip authentication for public routes
  if (publicRoutes.includes(pathname)) {
    return response
  }
  
  // Check authentication for protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const { user, response: authResponse, securityViolations } = await performEnhancedAuth(request)
    
    if (authResponse) {
      return authResponse
    }
    
    // Apply user-specific rate limiting for authenticated users
    // TEMPORARILY DISABLED FOR DEVELOPMENT
    /*
    if (user) {
      const userRateLimit = await applyRateLimit(request, user.id, 'api_read')
      if (userRateLimit) return userRateLimit
    }
    */
    
    // Log security violations
    if (securityViolations.length > 0) {
      logSecurityEvent('suspicious_request', request, {
        violations: securityViolations,
        userId: user?.id,
        protectedRoute: true,
      })
    }
  }
  
  // =====================================================
  // 4. ADDITIONAL SECURITY CHECKS
  // =====================================================
  
  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /\.\./,           // Directory traversal
    /<script/i,       // XSS attempts
    /union.*select/i, // SQL injection
    /%00/,            // Null byte injection
    /\x00/,           // Null byte
  ]
  
  const fullUrl = request.url
  if (suspiciousPatterns.some(pattern => pattern.test(fullUrl))) {
    logSecurityEvent('suspicious_request', request, {
      reason: 'Suspicious URL pattern',
      url: fullUrl,
    })
    
    return NextResponse.json(
      { error: 'Request blocked' },
      { status: 400 }
    )
  }
  
  // Check user agent for bot patterns
  const userAgent = request.headers.get('user-agent') || ''
  const botPatterns = [
    /curl/i, /wget/i, /python/i, /scanner/i, /bot/i,
    /sqlmap/i, /nikto/i, /nmap/i, /masscan/i
  ]
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    logSecurityEvent('suspicious_request', request, {
      reason: 'Suspicious user agent',
      userAgent: userAgent.substring(0, 100),
    })
    
    // Block suspicious bots from API routes
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
  }
  
  // Add final processing time
  response.headers.set('X-Processing-Time', `${Date.now() - startTime}ms`)
  
  return response
}

// =====================================================
// CONFIGURATION
// =====================================================

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$).*)',
  ],
}