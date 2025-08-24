import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, RATE_LIMITS } from '@/lib/rate-limit/redis'
import { logger } from '@/lib/utils/logger'

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'security'
  message: string
  context?: Record<string, any>
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = rateLimiter.getIdentifier(request, undefined, 'ip')
    const rateLimit = await rateLimiter.checkLimit(identifier, {
      maxRequests: 100, // 100 log entries per minute
      windowMs: 60 * 1000,
      keyPrefix: 'monitoring-logs'
    })

    if (!rateLimit.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'Retry-After': rateLimit.retryAfter?.toString() || '60'
        }
      })
    }

    // Parse the log entry
    const logEntry: LogEntry = await request.json()

    // Validate log entry
    if (!logEntry.level || !logEntry.message) {
      return NextResponse.json(
        { error: 'Invalid log entry: level and message are required' },
        { status: 400 }
      )
    }

    // Log to server-side logger
    switch (logEntry.level) {
      case 'debug':
        logger.debug(`[CLIENT] ${logEntry.message}`, logEntry.context)
        break
      case 'info':
        logger.info(`[CLIENT] ${logEntry.message}`, logEntry.context)
        break
      case 'warn':
        logger.warn(`[CLIENT] ${logEntry.message}`, logEntry.context)
        break
      case 'error':
        logger.error(`[CLIENT] ${logEntry.message}`, undefined, logEntry.context)
        break
      case 'security':
        logger.security(`[CLIENT] ${logEntry.message}`, logEntry.context)
        break
    }

    // In production, you might want to:
    // 1. Send to external logging service (DataDog, LogRocket, etc.)
    // 2. Store in database for analysis
    // 3. Trigger alerts for critical errors

    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('Failed to process monitoring log', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}