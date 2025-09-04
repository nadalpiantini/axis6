/**
 * Rate Limiting Implementation for Next.js
 *
 * This module provides rate limiting functionality to prevent abuse
 * and protect against brute force attacks.
 */
import { NextRequest } from 'next/server'
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
}
interface RateLimitStore {
  count: number
  resetTime: number
}
// In-memory store for rate limit data
// In production, consider using Redis or similar
const rateLimitStore = new Map<string, RateLimitStore>()
// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)
/**
 * Get client identifier from request
 * Uses IP address and optionally user ID for more accurate limiting
 */
function getClientId(request: NextRequest, userId?: string): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown'
  // Combine IP with user ID if available for more granular limiting
  return userId ? `${ip}:${userId}` : ip
}
/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Authentication endpoints
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Demasiados intentos de inicio de sesión. Por favor, intenta de nuevo en 15 minutos.'
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Demasiadas cuentas creadas. Por favor, intenta de nuevo en 1 hora.'
  },
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Demasiadas solicitudes de restablecimiento de contraseña. Por favor, intenta de nuevo en 1 hora.'
  },
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Demasiadas solicitudes. Por favor, reduce la frecuencia de tus solicitudes.'
  },
  // Strict rate limit for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Operación sensible limitada. Por favor, intenta de nuevo más tarde.'
  }
}
/**
 * Check if request should be rate limited
 * Returns true if request is within limits, false if it should be blocked
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(request, userId)
  const now = Date.now()
  // Get or create rate limit entry for this client
  let limitData = rateLimitStore.get(clientId)
  if (!limitData || limitData.resetTime < now) {
    // Create new window
    limitData = {
      count: 1,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(clientId, limitData)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: limitData.resetTime
    }
  }
  // Check if limit exceeded
  if (limitData.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: limitData.resetTime
    }
  }
  // Increment counter
  limitData.count++
  rateLimitStore.set(clientId, limitData)
  return {
    allowed: true,
    remaining: config.maxRequests - limitData.count,
    resetTime: limitData.resetTime
  }
}
/**
 * Rate limiting middleware for API routes
 */
export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.api
): Promise<Response | null> {
  const { allowed, remaining, resetTime } = checkRateLimit(request, config)
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: config.message || 'Too many requests',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString()
        }
      }
    )
  }
  // Add rate limit headers to response
  return null // Continue with request
}
/**
 * Reset rate limit for a specific client
 * Useful after successful authentication or other events
 */
export function resetRateLimit(request: NextRequest, userId?: string): void {
  const clientId = getClientId(request, userId)
  rateLimitStore.delete(clientId)
}
/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string
): { count: number; remaining: number; resetTime: number } {
  const clientId = getClientId(request, userId)
  const limitData = rateLimitStore.get(clientId)
  const now = Date.now()
  if (!limitData || limitData.resetTime < now) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs
    }
  }
  return {
    count: limitData.count,
    remaining: Math.max(0, config.maxRequests - limitData.count),
    resetTime: limitData.resetTime
  }
}
