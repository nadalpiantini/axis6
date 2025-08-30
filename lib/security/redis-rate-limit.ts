import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Redis client with Upstash (for production)
// For local development, you can use Redis memory adapter
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null

// Rate limit configurations for different endpoints
const rateLimiters = {
  // Auth endpoints - stricter limits
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    analytics: true,
    prefix: 'auth'
  }) : null,

  // API endpoints - moderate limits
  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
    analytics: true,
    prefix: 'api'
  }) : null,

  // Chat endpoints - higher limits
  chat: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: 'chat'
  }) : null,

  // Search endpoints - lower limits
  search: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'search'
  }) : null,

  // Upload endpoints - strict limits
  upload: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 m'), // 5 uploads per 10 minutes
    analytics: true,
    prefix: 'upload'
  }) : null
}

// Fallback in-memory rate limiter for development
class InMemoryRateLimiter {
  private requests = new Map<string, number[]>()
  private readonly limit: number
  private readonly window: number

  constructor(limit: number, windowMs: number) {
    this.limit = limit
    this.window = windowMs
  }

  async limit(identifier: string) {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []

    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.window)

    if (validRequests.length >= this.limit) {
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: new Date(Math.min(...validRequests) + this.window)
      }
    }

    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - validRequests.length,
      reset: new Date(now + this.window)
    }
  }
}

// Development rate limiters
const devRateLimiters = {
  auth: new InMemoryRateLimiter(5, 60000), // 5 per minute
  api: new InMemoryRateLimiter(30, 60000), // 30 per minute
  chat: new InMemoryRateLimiter(100, 60000), // 100 per minute
  search: new InMemoryRateLimiter(10, 60000), // 10 per minute
  upload: new InMemoryRateLimiter(5, 600000) // 5 per 10 minutes
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  type: keyof typeof rateLimiters = 'api'
) {
  // Get identifier (IP address or user ID)
  const identifier = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'anonymous'

  // Use Redis rate limiter in production, in-memory in development
  const limiter = redis ? rateLimiters[type] : devRateLimiters[type]

  if (!limiter) {
    // If no limiter configured, allow the request
    return { success: true }
  }

  const result = await limiter.limit(identifier)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit?.toString() || '0',
          'X-RateLimit-Remaining': result.remaining?.toString() || '0',
          'X-RateLimit-Reset': result.reset?.toISOString() || new Date().toISOString(),
          'Retry-After': Math.floor((result.reset?.getTime() || 0 - Date.now()) / 1000).toString()
        }
      }
    )
  }

  return {
    success: true,
    headers: {
      'X-RateLimit-Limit': result.limit?.toString() || '0',
      'X-RateLimit-Remaining': result.remaining?.toString() || '0',
      'X-RateLimit-Reset': result.reset?.toISOString() || new Date().toISOString()
    }
  }
}

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32
  private static readonly TOKEN_HEADER = 'x-csrf-token'
  private static readonly TOKEN_COOKIE = 'csrf-token'

  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  static validateToken(request: NextRequest): boolean {
    // Skip validation for GET requests
    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return true
    }

    const headerToken = request.headers.get(this.TOKEN_HEADER)
    const cookieToken = request.cookies.get(this.TOKEN_COOKIE)?.value

    if (!headerToken || !cookieToken) {
      return false
    }

    return headerToken === cookieToken
  }

  static setTokenCookie(response: NextResponse, token: string): void {
    response.cookies.set(this.TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400 // 24 hours
    })
  }
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Content Security Policy (comprehensive)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live",
    "frame-src 'self' https://vercel.live",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  return response
}

/**
 * Combined security middleware
 */
export async function withSecurity(
  request: NextRequest,
  options?: {
    rateLimit?: keyof typeof rateLimiters
    csrf?: boolean
    headers?: boolean
  }
): Promise<NextResponse | null> {
  // Apply rate limiting
  if (options?.rateLimit) {
    const rateLimitResult = await withRateLimit(request, options.rateLimit)
    if (!rateLimitResult.success) {
      return rateLimitResult as NextResponse
    }
  }

  // Validate CSRF token
  if (options?.csrf && !CSRFProtection.validateToken(request)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  return null // Continue with request
}
