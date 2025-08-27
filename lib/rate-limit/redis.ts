import { Redis } from '@upstash/redis'

import { logger } from '@/lib/utils/logger'

// Rate limit configuration
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

// Default rate limit configs for different endpoints
export const RATE_LIMITS = {
  // Authentication endpoints
  auth: {
    login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
    register: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    forgotPassword: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  },
  // API endpoints
  api: {
    checkins: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
    general: { maxRequests: 1000, windowMs: 60 * 1000 }, // 1000 per minute
  },
  // Global fallback
  global: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
} as const

class RedisRateLimiter {
  private redis: Redis | null = null
  private fallbackStore = new Map<string, { count: number; resetTime: number }>()

  constructor() {
    // Initialize Redis only if environment variables are available
    if (process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN']) {
      try {
        this.redis = new Redis({
          url: process.env['UPSTASH_REDIS_REST_URL'],
          token: process.env['UPSTASH_REDIS_REST_TOKEN'],
        })
        logger.info('Redis rate limiter initialized')
      } catch (error) {
        logger.error('Failed to initialize Redis rate limiter', error as Error)
        // Fall back to in-memory storage
      }
    } else {
      logger.warn('Redis credentials not found, using in-memory rate limiting')
    }
  }

  /**
   * Check if request is allowed and update counter
   */
  async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const key = `${config.keyPrefix || 'ratelimit'}:${identifier}`
    const now = Date.now()
    const window = Math.floor(now / config.windowMs)
    const windowKey = `${key}:${window}`

    try {
      if (this.redis) {
        // Use Redis for distributed rate limiting
        return await this.redisRateLimit(windowKey, config, now)
      } else {
        // Fallback to in-memory rate limiting
        return this.memoryRateLimit(windowKey, config, now)
      }
    } catch (error) {
      logger.error(`Rate limit check failed for ${identifier}`, error as Error)
      
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      }
    }
  }

  private async redisRateLimit(
    key: string,
    config: RateLimitConfig,
    now: number
  ) {
    const pipe = this.redis!.pipeline()
    pipe.incr(key)
    pipe.expire(key, Math.ceil(config.windowMs / 1000))
    
    const results = await pipe.exec()
    const count = results[0] as number
    
    const resetTime = now + config.windowMs
    const remaining = Math.max(0, config.maxRequests - count)
    const allowed = count <= config.maxRequests

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000)
    }
  }

  private memoryRateLimit(
    key: string,
    config: RateLimitConfig,
    now: number
  ) {
    // Clean up expired entries
    this.cleanupMemoryStore(now)
    
    const existing = this.fallbackStore.get(key)
    const resetTime = now + config.windowMs
    
    if (!existing || now > existing.resetTime) {
      // New window
      this.fallbackStore.set(key, { count: 1, resetTime })
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime
      }
    }
    
    // Increment counter
    existing.count++
    const allowed = existing.count <= config.maxRequests
    
    return {
      allowed,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - existing.count),
      resetTime: existing.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((existing.resetTime - now) / 1000)
    }
  }

  private cleanupMemoryStore(now: number) {
    // Clean up expired entries every 100 calls
    if (Math.random() > 0.01) return
    
    for (const [key, entry] of this.fallbackStore.entries()) {
      if (now > entry.resetTime) {
        this.fallbackStore.delete(key)
      }
    }
  }

  /**
   * Get identifier from request (IP, user ID, etc.)
   */
  getIdentifier(
    request: Request,
    userId?: string,
    type: 'ip' | 'user' | 'combined' = 'ip'
  ): string {
    const ip = this.getIP(request)
    
    switch (type) {
      case 'user':
        return userId || ip
      case 'combined':
        return userId ? `${userId}:${ip}` : ip
      default:
        return ip
    }
  }

  private getIP(request: Request): string {
    // Try various headers for IP detection
    const headers = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'x-forwarded',
      'x-cluster-client-ip',
      'forwarded-for',
      'forwarded'
    ]
    
    for (const header of headers) {
      const value = request.headers.get(header)
      if (value) {
        // Handle comma-separated IPs (take the first one)
        const ip = value.split(',')[0].trim()
        if (this.isValidIP(ip)) {
          return ip
        }
      }
    }
    
    return '127.0.0.1' // fallback
  }

  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
    const ipv6Regex = /^[0-9a-fA-F:]+$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string, keyPrefix?: string): Promise<void> {
    const key = `${keyPrefix || 'ratelimit'}:${identifier}`
    
    if (this.redis) {
      await this.redis.del(key)
    } else {
      // Clear all keys that start with this identifier
      for (const storeKey of this.fallbackStore.keys()) {
        if (storeKey.startsWith(key)) {
          this.fallbackStore.delete(storeKey)
        }
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RedisRateLimiter()

/**
 * Middleware helper for rate limiting
 */
export async function applyRateLimit(
  _request: Request,
  identifier: string,
  config: RateLimitConfig
): Promise<Response | null> {
  const result = await rateLimiter.checkLimit(identifier, config)
  
  if (!result.allowed) {
    logger.warn(`Rate limit exceeded for ${identifier}: ${result.limit} requests`)
    
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        'Retry-After': result.retryAfter?.toString() || '60',
        'Content-Type': 'application/json'
      }
    })
  }
  
  // Add rate limit headers to allowed requests
  return new Response(null, {
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    }
  })
}

export default rateLimiter