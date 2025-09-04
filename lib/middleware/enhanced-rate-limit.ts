/**
 * Enhanced Rate Limiting Middleware with Monitoring
 * Integrates with error tracking and provides comprehensive protection
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { reportError, reportEvent } from '@/lib/monitoring/error-tracking'
import { logger } from '@/lib/utils/logger'
// Initialize Redis with proper error handling
let redis: Redis | null = null
try {
  if (process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN']) {
    redis = new Redis({
      url: process.env['UPSTASH_REDIS_REST_URL'],
      token: process.env['UPSTASH_REDIS_REST_TOKEN'],
    })
    logger.info('Redis rate limiting initialized')
  } else {
    logger.warn('Redis credentials not found, using memory fallback for rate limiting')
  }
} catch (error) {
  logger.error('Failed to initialize Redis for rate limiting', error as Error)
  reportError(error as Error, 'high', {
    component: 'RateLimitMiddleware',
    action: 'redis_initialization',
    metadata: { environment: process.env['NODE_ENV'] }
  })
}
// Memory fallback store
const memoryStore = new Map<string, { count: number; resetTime: number; blocked: number }>()
// Rate limit configurations with adaptive thresholds
export const rateLimitConfig = {
  // Authentication - very strict to prevent brute force
  auth: {
    requests: 5,
    window: '15 m',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    type: 'authentication' as const,
  },
  // Registration - prevent abuse
  register: {
    requests: 3,
    window: '1 h',
    message: 'Registration limit exceeded. Please try again later.',
    type: 'registration' as const,
  },
  // Password reset - prevent enumeration attacks
  passwordReset: {
    requests: 3,
    window: '1 h',
    message: 'Password reset limit exceeded. Please try again later.',
    type: 'password_reset' as const,
  },
  // API endpoints - balanced protection
  api: {
    requests: 100,
    window: '1 m',
    message: 'API rate limit exceeded. Please slow down your requests.',
    type: 'api' as const,
  },
  // Write operations - protect against data manipulation
  write: {
    requests: 50,
    window: '1 m',
    message: 'Write operation limit exceeded. Please slow down.',
    type: 'write' as const,
  },
  // Read operations - generous but still protected
  read: {
    requests: 300,
    window: '1 m',
    message: 'Read operation limit exceeded. Please slow down.',
    type: 'read' as const,
  },
  // Sensitive operations - very strict
  sensitive: {
    requests: 10,
    window: '1 h',
    message: 'Sensitive operation limit exceeded. Please try again later.',
    type: 'sensitive' as const,
  },
  // Global fallback
  global: {
    requests: 1000,
    window: '1 m',
    message: 'Global rate limit exceeded. Please try again later.',
    type: 'global' as const,
  },
} as const
// Create rate limiters with enhanced configuration
function createRateLimiter(config: typeof rateLimitConfig[keyof typeof rateLimitConfig]) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    analytics: true,
    prefix: `rl:${config.type}`,
    ephemeralCache: new Map(), // Add in-memory cache for better performance
  })
}
export const rateLimiters = {
  auth: createRateLimiter(rateLimitConfig.auth),
  register: createRateLimiter(rateLimitConfig.register),
  passwordReset: createRateLimiter(rateLimitConfig.passwordReset),
  api: createRateLimiter(rateLimitConfig.api),
  write: createRateLimiter(rateLimitConfig.write),
  read: createRateLimiter(rateLimitConfig.read),
  sensitive: createRateLimiter(rateLimitConfig.sensitive),
  global: createRateLimiter(rateLimitConfig.global),
}
/**
 * Enhanced client identification with multiple fallbacks
 */
function getEnhancedClientId(request: NextRequest, userId?: string): string {
  // Priority hierarchy for identification
  if (userId) return `user:${userId}`
  // Try multiple IP sources (Vercel, Cloudflare, etc.)
  const sources = [
    request.headers.get('x-vercel-forwarded-for'),
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    request.headers.get('x-real-ip'),
  ]
  const ip = sources.find(source => source && source !== 'unknown') || 'anonymous'
  // Get additional identifiers
  const userAgent = request.headers.get('user-agent')
  const sessionId = request.cookies.get('session-id')?.value
  // Create composite identifier
  let identifier = `ip:${ip}`
  if (sessionId) {
    identifier += `:session:${sessionId}`
  }
  // Add user agent hash for additional uniqueness (but keep it anonymous)
  if (userAgent) {
    const uaHash = btoa(userAgent).substring(0, 8)
    identifier += `:ua:${uaHash}`
  }
  return identifier
}
/**
 * Memory-based rate limiting with decay
 */
function checkMemoryRateLimit(
  identifier: string,
  config: typeof rateLimitConfig[keyof typeof rateLimitConfig]
): { success: boolean; remaining: number; reset: Date; total: number } {
  const now = Date.now()
  const windowMs = parseWindow(config.window)
  const resetTime = now + windowMs
  // Clean expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetTime < now) {
        memoryStore.delete(key)
      }
    }
  }
  const entry = memoryStore.get(identifier)
  if (!entry || entry.resetTime < now) {
    // New window
    memoryStore.set(identifier, { count: 1, resetTime, blocked: 0 })
    return {
      success: true,
      remaining: config.requests - 1,
      reset: new Date(resetTime),
      total: config.requests,
    }
  }
  if (entry.count >= config.requests) {
    entry.blocked++
    return {
      success: false,
      remaining: 0,
      reset: new Date(entry.resetTime),
      total: config.requests,
    }
  }
  entry.count++
  return {
    success: true,
    remaining: config.requests - entry.count,
    reset: new Date(entry.resetTime),
    total: config.requests,
  }
}
/**
 * Parse window string to milliseconds
 */
function parseWindow(window: string): number {
  const match = window.match(/(\\d+)\\s*([smh])/i)
  if (!match) return 60000 // Default 1 minute
  const value = parseInt(match[1])
  const unit = match[2].toLowerCase()
  switch (unit) {
    case 's': return value * 1000
    case 'm': return value * 60 * 1000
    case 'h': return value * 60 * 60 * 1000
    default: return 60000
  }
}
/**
 * Enhanced rate limiting middleware with monitoring
 */
export async function withEnhancedRateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters = 'api',
  userId?: string
): Promise<{
  response: NextResponse | null
  headers: Record<string, string>
  rateLimitInfo: {
    success: boolean
    remaining: number
    total: number
    reset: Date
    identifier: string
  }
}> {
  const identifier = getEnhancedClientId(request, userId)
  const config = rateLimitConfig[limiterType]
  const limiter = rateLimiters[limiterType]
  let result: {
    success: boolean
    remaining: number
    reset: Date
    total: number
    limit?: number
  }
  try {
    if (limiter && redis) {
      // Use Redis-based rate limiter
      const { success, limit, remaining, reset } = await limiter.limit(identifier)
      result = {
        success,
        remaining,
        reset: new Date(reset),
        total: limit || config.requests,
        limit,
      }
    } else {
      // Fallback to memory-based rate limiting
      result = checkMemoryRateLimit(identifier, config)
    }
  } catch (error) {
    // If rate limiting fails, log but don't block the request
    logger.error(`Rate limiting error for ${limiterType}`, error as Error)
    reportError(error as Error, 'normal', {
      component: 'EnhancedRateLimit',
      action: 'rate_limit_check',
      metadata: { limiterType, identifier, hasRedis: !!redis }
    })
    // Allow request but log the incident
    result = {
      success: true,
      remaining: config.requests,
      reset: new Date(Date.now() + parseWindow(config.window)),
      total: config.requests,
    }
  }
  // Prepare headers
  const headers = {
    'X-RateLimit-Limit': result.total.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
    'X-RateLimit-Policy': `${config.requests}; w=${config.window}`,
  }
  // Log rate limiting events
  if (!result.success) {
    const retryAfter = Math.ceil((result.reset.getTime() - Date.now()) / 1000)
    // Report rate limit violation
    reportEvent(
      'rate_limit_exceeded',
      {
        limiterType,
        identifier: `${identifier.split(':')[0]  }:***`, // Anonymize
        remaining: result.remaining,
        total: result.total,
        retryAfter,
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent')?.substring(0, 50),
      },
      'warning'
    )
    logger.warn(`Rate limit exceeded: ${limiterType}`, {
      identifier: `${identifier.split(':')[0]  }:***`,
      remaining: result.remaining,
      total: result.total,
      retryAfter,
    })
    const response = NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: config.message,
        retryAfter,
        code: `RATE_LIMIT_${config.type.toUpperCase()}`,
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Policy-Violated': config.type,
        },
      }
    )
    return {
      response,
      headers,
      rateLimitInfo: {
        success: result.success,
        remaining: result.remaining,
        total: result.total,
        reset: result.reset,
        identifier,
      },
    }
  }
  // Request allowed - log if we're getting close to the limit
  if (result.remaining <= Math.floor(result.total * 0.1)) {
    logger.info(`Rate limit warning: ${limiterType}`, {
      identifier: `${identifier.split(':')[0]  }:***`,
      remaining: result.remaining,
      total: result.total,
      percentage: (result.remaining / result.total) * 100,
    })
  }
  return {
    response: null, // Allow request to continue
    headers,
    rateLimitInfo: {
      success: result.success,
      remaining: result.remaining,
      total: result.total,
      reset: result.reset,
      identifier,
    },
  }
}
/**
 * Middleware wrapper for easy integration
 */
export function createRateLimitMiddleware(
  limiterType: keyof typeof rateLimiters = 'api'
) {
  return async function(request: NextRequest, userId?: string) {
    const { response, headers } = await withEnhancedRateLimit(request, limiterType, userId)
    if (response) {
      return response // Rate limited
    }
    return { headers } // Continue with these headers
  }
}
/**
 * Reset rate limit for successful authentication
 */
export async function resetRateLimit(
  identifier: string,
  limiterType: keyof typeof rateLimiters = 'auth'
): Promise<void> {
  try {
    if (redis) {
      const key = `rl:${rateLimitConfig[limiterType].type}:${identifier}`
      await redis.del(key)
      logger.info(`Rate limit reset for ${limiterType}: ${identifier.split(':')[0]}:***`)
    } else {
      memoryStore.delete(identifier)
    }
  } catch (error) {
    logger.error(`Failed to reset rate limit for ${limiterType}`, error as Error)
  }
}
/**
 * Get rate limit analytics
 */
export async function getRateLimitAnalytics(): Promise<{
  activeConnections: number
  topBlocked: string[]
  rateLimitHealth: 'healthy' | 'degraded' | 'failed'
}> {
  try {
    if (redis) {
      // Get analytics from Redis
      const keys = await redis.keys('rl:*')
      return {
        activeConnections: keys.length,
        topBlocked: [], // Would need more complex analytics
        rateLimitHealth: 'healthy',
      }
    } else {
      return {
        activeConnections: memoryStore.size,
        topBlocked: [],
        rateLimitHealth: memoryStore.size > 1000 ? 'degraded' : 'healthy',
      }
    }
  } catch (error) {
    logger.error('Failed to get rate limit analytics', error as Error)
    return {
      activeConnections: 0,
      topBlocked: [],
      rateLimitHealth: 'failed',
    }
  }
}
