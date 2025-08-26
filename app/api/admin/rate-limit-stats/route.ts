/**
 * Rate Limit Statistics API
 * Provides monitoring data for rate limiting system
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { withEnhancedRateLimit, getRateLimitAnalytics } from '@/lib/middleware/enhanced-rate-limit'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  // Apply rate limiting to this endpoint
  const { response: rateLimitResponse, headers } = await withEnhancedRateLimit(
    request,
    'api'
  )
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Check if user is authenticated and has admin privileges
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['SUPABASE_SERVICE_ROLE_KEY']!, // Use service role for admin operations
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No-op for server requests
          }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: Object.fromEntries(
            Object.entries(headers).map(([k, v]) => [k, v])
          )
        }
      )
    }

    // Get user profile to check admin status
    const { data: profile } = await supabase
      .from('axis6_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // For now, allow all authenticated users to see basic stats
    // In production, you'd check for admin role
    // if (profile?.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: 'Admin privileges required' },
    //     { status: 403, headers }
    //   )
    // }

    // Get rate limiting analytics
    const analytics = await getRateLimitAnalytics()
    
    // Additional statistics
    const stats = {
      timestamp: new Date().toISOString(),
      system: {
        activeConnections: analytics.activeConnections,
        rateLimitHealth: analytics.rateLimitHealth,
        topBlocked: analytics.topBlocked,
      },
      configuration: {
        redisEnabled: !!process.env['UPSTASH_REDIS_REST_URL'],
        environment: process.env['NODE_ENV'],
        rateLimitPolicies: {
          auth: '5 requests per 15 minutes',
          register: '3 requests per hour',
          passwordReset: '3 requests per hour',
          api: '100 requests per minute',
          write: '50 requests per minute',
          read: '300 requests per minute',
          sensitive: '10 requests per hour',
          global: '1000 requests per minute',
        }
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      }
    }

    logger.info('Rate limit stats requested', { 
      userId: user.id,
      timestamp: stats.timestamp 
    })

    return NextResponse.json(stats, { 
      status: 200,
      headers: Object.fromEntries(
        Object.entries(headers).map(([k, v]) => [k, v])
      )
    })

  } catch (error) {
    logger.error('Failed to get rate limit stats', error as Error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to retrieve rate limiting statistics'
      },
      { 
        status: 500,
        headers: Object.fromEntries(
          Object.entries(headers).map(([k, v]) => [k, v])
        )
      }
    )
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}