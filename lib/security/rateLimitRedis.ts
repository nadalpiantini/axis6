/**
 * Redis-based Rate Limiting for Production
 *
 * This module provides distributed rate limiting using Redis/Upstash
 * for better scalability and persistence across server instances.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'
// Initialize Redis client
// For local development, you can use a local Redis instance
// For production, use Upstash Redis or similar
const redis = process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN']
  ? new Redis({
      url: process.env['UPSTASH_REDIS_REST_URL'],
      token: process.env['UPSTASH_REDIS_REST_TOKEN'],
    })
  : null
// Fallback to in-memory store if Redis is not configured
const memoryStore = new Map<string, { count: number; resetTime: number }>()
/**
 * Rate limiter configurations for different endpoints
 */
export const rateLimiters = {
  // Authentication endpoints - very strict
  login: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
        analytics: true,
        prefix: 'ratelimit:login',
      })
    : null,
  register: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 registrations per hour
        analytics: true,
        prefix: 'ratelimit:register',
      })
    : null,
  passwordReset: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, '1 h'), // 3 password resets per hour
        analytics: true,
        prefix: 'ratelimit:password-reset',
      })
    : null,
  // API endpoints - more lenient
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
        analytics: true,
        prefix: 'ratelimit:api',
      })
    : null,
  // Sensitive operations
  sensitive: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(10, '1 h'), // 10 sensitive ops per hour
        analytics: true,
        prefix: 'ratelimit:sensitive',
      })
    : null,
  // Write operations (POST, PUT, DELETE)
  write: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.tokenBucket(50, '1 m', 10), // 50 per minute with burst of 10
        analytics: true,
        prefix: 'ratelimit:write',
      })
    : null,
  // Read operations (GET)
  read: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(300, '1 m'), // 300 reads per minute
        analytics: true,
        prefix: 'ratelimit:read',
      })
    : null,
}
/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Priority: User ID > IP Address > Session ID
  if (userId) {
    return `user:${userId}`
  }
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare
  const ip = cfConnectingIp || forwardedFor?.split(',')[0] || realIp || 'unknown'
  // Get session ID from cookie if available
  const sessionId = request.cookies.get('session-id')?.value
  if (sessionId) {
    return `session:${sessionId}:${ip}`
  }
  return `ip:${ip}`
}
/**
 * Fallback rate limiting using in-memory store
 */
function checkMemoryRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { success: boolean; remaining: number; reset: Date } {
  const now = Date.now()
  const resetTime = now + windowMs
  // Clean expired entries
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetTime < now) {
      memoryStore.delete(key)
    }
  }
  const entry = memoryStore.get(identifier)
  if (!entry || entry.resetTime < now) {
    // New window
    memoryStore.set(identifier, { count: 1, resetTime })
    return {
      success: true,
      remaining: maxRequests - 1,
      reset: new Date(resetTime)
    }
  }
  if (entry.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      reset: new Date(entry.resetTime)
    }
  }
  entry.count++
  return {
    success: true,
    remaining: maxRequests - entry.count,
    reset: new Date(entry.resetTime)
  }
}
/**
 * Rate limiting middleware
 */
export async function withRateLimitRedis(
  request: NextRequest,
  limiterKey: keyof typeof rateLimiters = 'api',
  userId?: string
): Promise<NextResponse | null> {
  const identifier = getClientIdentifier(request, userId)
  const limiter = rateLimiters[limiterKey]
  let result: { success: boolean; remaining: number; reset: Date; limit?: number }
  if (limiter) {
    // Use Redis-based rate limiter
    const { success, limit, remaining, reset } = await limiter.limit(identifier)
    result = { success, remaining, reset: new Date(reset), limit }
  } else {
    // Fallback to memory-based rate limiting
    const config = {
      login: { max: 5, window: 15 * 60 * 1000 },
      register: { max: 3, window: 60 * 60 * 1000 },
      passwordReset: { max: 3, window: 60 * 60 * 1000 },
      api: { max: 100, window: 60 * 1000 },
      sensitive: { max: 10, window: 60 * 60 * 1000 },
      write: { max: 50, window: 60 * 1000 },
      read: { max: 300, window: 60 * 1000 },
    }[limiterKey] || { max: 100, window: 60 * 1000 }
    result = checkMemoryRateLimit(identifier, config.max, config.window)
    result.limit = config.max
  }
  // Add rate limit headers to all responses
  const headers = {
    'X-RateLimit-Limit': result.limit?.toString() || '100',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
  }
  if (!result.success) {
    const retryAfter = Math.ceil((result.reset.getTime() - Date.now()) / 1000)
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: getRateLimitMessage(limiterKey),
        retryAfter,
      },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': retryAfter.toString(),
        },
      }
    )
  }
  // Request is allowed - return null to continue
  // The calling function should add these headers to the successful response
  return null
}
/**
 * Get user-friendly rate limit message
 */
function getRateLimitMessage(limiterKey: string): string {
  const messages = {
    login: 'Too many login attempts. Please try again later.',
    register: 'Too many registration attempts. Please try again later.',
    passwordReset: 'Too many password reset requests. Please try again later.',
    api: 'Too many requests. Please slow down.',
    sensitive: 'Sensitive operation rate limit exceeded. Please try again later.',
    write: 'Too many write operations. Please slow down.',
    read: 'Too many read operations. Please slow down.',
  }
  return messages[limiterKey as keyof typeof messages] || 'Rate limit exceeded. Please try again later.'
}
/**
 * Reset rate limit for a specific identifier
 * Useful after successful authentication
 */
export async function resetRateLimit(
  identifier: string,
  limiterKey: keyof typeof rateLimiters = 'login'
): Promise<void> {
  if (redis) {
    const key = `ratelimit:${limiterKey}:${identifier}`
    await redis.del(key)
  } else {
    memoryStore.delete(identifier)
  }
}
/**
 * Get current rate limit status
 */
export async function getRateLimitStatus(
  request: NextRequest,
  limiterKey: keyof typeof rateLimiters = 'api',
  userId?: string
): Promise<{ used: number; remaining: number; total: number }> {
  const identifier = getClientIdentifier(request, userId)
  if (redis) {
    // This would need implementation based on the Upstash rate limit internals
    // For now, return a default response
    return { used: 0, remaining: 100, total: 100 }
  }
  const entry = memoryStore.get(identifier)
  const config = {
    login: 5,
    register: 3,
    passwordReset: 3,
    api: 100,
    sensitive: 10,
    write: 50,
    read: 300,
  }[limiterKey] || 100
  if (!entry || entry.resetTime < Date.now()) {
    return { used: 0, remaining: config, total: config }
  }
  return {
    used: entry.count,
    remaining: Math.max(0, config - entry.count),
    total: config,
  }
}
