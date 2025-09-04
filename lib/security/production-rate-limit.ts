/**
 * Production-Ready Rate Limiting System
 * Multi-tier rate limiting with Redis backend
 * Priority: HIGH - Prevents DoS and abuse
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
// Initialize Redis connection with error handling
let redis: Redis | null = null
let rateLimiters: Record<string, Ratelimit> = {}
function initializeRedis(): Redis | null {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      logger.warn('Redis credentials not configured - rate limiting disabled')
      return null
    }
    return Redis.fromEnv()
  } catch (error) {
    logger.error('Failed to initialize Redis for rate limiting', error)
    return null
  }
}
function getRateLimiter(key: string, config: { requests: number; window: string }): Ratelimit | null {
  if (!redis) {
    redis = initializeRedis()
    if (!redis) return null
  }
  if (!rateLimiters[key]) {
    rateLimiters[key] = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: `axis6_rl_${key}`,
    })
  }
  return rateLimiters[key]
}
// =====================================================
// RATE LIMITING CONFIGURATIONS
// =====================================================
const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - strict limits
  auth_login: { requests: 5, window: '10 m' },
  auth_register: { requests: 3, window: '60 m' },
  auth_forgot_password: { requests: 2, window: '60 m' },
  auth_reset_password: { requests: 3, window: '60 m' },
  // API endpoints - moderate limits
  api_general: { requests: 100, window: '10 m' },
  api_write: { requests: 50, window: '10 m' },
  api_read: { requests: 200, window: '10 m' },
  // Specific endpoint limits
  checkins: { requests: 30, window: '10 m' },
  chat_messages: { requests: 60, window: '10 m' },
  analytics: { requests: 20, window: '10 m' },
  export_data: { requests: 5, window: '60 m' },
  // Global IP limits
  global_ip: { requests: 300, window: '10 m' },
  global_user: { requests: 500, window: '10 m' },
} as const
// =====================================================
// RATE LIMITING FUNCTIONS
// =====================================================
/**
 * Apply rate limiting based on endpoint and user
 */
export async function applyRateLimit(
  request: NextRequest,
  userId?: string,
  endpointType: keyof typeof RATE_LIMIT_CONFIGS = 'api_general'
): Promise<NextResponse | null> {
  try {
    const rateLimiter = getRateLimiter(endpointType, RATE_LIMIT_CONFIGS[endpointType])
    if (!rateLimiter) {
      // Rate limiting not available - allow request but log
      logger.warn('Rate limiting not available', {
        endpoint: endpointType,
        path: request.nextUrl.pathname
      })
      return null
    }
    // Create identifier based on user or IP
    const identifier = userId || 
      request.ip || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'
    // Apply rate limit
    const { success, limit, reset, remaining, pending } = await rateLimiter.limit(identifier)
    if (!success) {
      logger.warn('Rate limit exceeded', {
        identifier: userId ? `user:${userId}` : `ip:${identifier}`,
        endpoint: endpointType,
        path: request.nextUrl.pathname,
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      })
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }
    // Rate limit passed - continue with request
    return null
  } catch (error) {
    logger.error('Rate limiting error', error)
    // In case of rate limiting error, allow request but log
    return null
  }
}
/**
 * Global IP rate limiting for all requests
 */
export async function applyGlobalRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.ip || 
    request.headers.get('x-forwarded-for') || 
    request.headers.get('x-real-ip') || 
    'unknown'
  return applyRateLimit(request, undefined, 'global_ip')
}
/**
 * User-specific rate limiting
 */
export async function applyUserRateLimit(
  request: NextRequest, 
  userId: string
): Promise<NextResponse | null> {
  return applyRateLimit(request, userId, 'global_user')
}
/**
 * Endpoint-specific rate limiting
 */
export async function applyEndpointRateLimit(
  request: NextRequest,
  endpointType: keyof typeof RATE_LIMIT_CONFIGS,
  userId?: string
): Promise<NextResponse | null> {
  return applyRateLimit(request, userId, endpointType)
}
/**
 * Detect endpoint type from request path
 */
export function detectEndpointType(pathname: string): keyof typeof RATE_LIMIT_CONFIGS {
  if (pathname.includes('/auth/login')) return 'auth_login'
  if (pathname.includes('/auth/register')) return 'auth_register'
  if (pathname.includes('/auth/forgot-password')) return 'auth_forgot_password'
  if (pathname.includes('/auth/reset-password')) return 'auth_reset_password'
  if (pathname.includes('/checkins')) return 'checkins'
  if (pathname.includes('/chat')) return 'chat_messages'
  if (pathname.includes('/analytics')) return 'analytics'
  if (pathname.includes('/export')) return 'export_data'
  // Default based on method
  if (pathname.startsWith('/api/')) {
    return 'api_general'
  }
  return 'api_general'
}
/**
 * Enhanced middleware wrapper with comprehensive rate limiting
 */
export function withEnhancedRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // 1. Apply global IP rate limiting first
      const globalLimitResult = await applyGlobalRateLimit(request)
      if (globalLimitResult) return globalLimitResult
      // 2. Detect endpoint type for specific limiting
      const endpointType = detectEndpointType(request.nextUrl.pathname)
      // 3. Get user ID if available for user-specific limiting
      let userId: string | undefined
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
      } catch {
        // User not authenticated - will rely on IP limiting
      }
      // 4. Apply endpoint-specific rate limiting
      const endpointLimitResult = await applyEndpointRateLimit(request, endpointType, userId)
      if (endpointLimitResult) return endpointLimitResult
      // 5. Apply user-specific rate limiting if authenticated
      if (userId) {
        const userLimitResult = await applyUserRateLimit(request, userId)
        if (userLimitResult) return userLimitResult
      }
      // 6. All rate limits passed - call handler
      return await handler(request)
    } catch (error) {
      logger.error('Enhanced rate limit middleware error', error)
      // In case of error, allow request but log
      return await handler(request)
    }
  }
}
/**
 * Get rate limit statistics for monitoring
 */
export async function getRateLimitStats(): Promise<Record<string, any>> {
  try {
    if (!redis) {
      redis = initializeRedis()
      if (!redis) return {}
    }
    const stats: Record<string, any> = {}
    // Get statistics for each rate limiter
    for (const [key, limiter] of Object.entries(rateLimiters)) {
      try {
        // This would require implementing statistics collection
        // For now, return basic info
        stats[key] = {
          config: RATE_LIMIT_CONFIGS[key as keyof typeof RATE_LIMIT_CONFIGS],
          active: true,
        }
      } catch (error) {
        stats[key] = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
    return stats
  } catch (error) {
    logger.error('Failed to get rate limit stats', error)
    return {}
  }
}
/**
 * Clear rate limits for a specific identifier (admin function)
 */
export async function clearRateLimit(identifier: string, endpointType?: string): Promise<boolean> {
  try {
    if (!redis) {
      redis = initializeRedis()
      if (!redis) return false
    }
    if (endpointType) {
      // Clear specific endpoint rate limit
      const key = `axis6_rl_${endpointType}:${identifier}`
      await redis.del(key)
    } else {
      // Clear all rate limits for identifier
      const keys = await redis.keys(`axis6_rl_*:${identifier}`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
    logger.info('Rate limits cleared', { identifier, endpointType })
    return true
  } catch (error) {
    logger.error('Failed to clear rate limits', error)
    return false
  }
}