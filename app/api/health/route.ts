
/**
 * Production Health Check API Endpoint
 * Comprehensive system health monitoring
 */

import { NextRequest, NextResponse } from 'next/server'

import { circuitBreaker } from '@/lib/production/circuit-breaker'
import { healthCheck, type SystemHealth } from '@/lib/production/health-check'
import { performanceOptimizer } from '@/lib/production/performance-optimizer'
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Get HTTP status code based on health status
 */
function getHealthStatus(status: 'healthy' | 'degraded' | 'unhealthy'): number {
  switch (status) {
    case 'healthy':
      return 200
    case 'degraded':
      return 200 // Still operational but with warnings
    case 'unhealthy':
      return 503
    default:
      return 503
  }
}

interface HealthResponse extends SystemHealth {
  circuitBreakerStatus: Record<string, any>
  performanceMetrics: Record<string, any>
  systemInfo: {
    nodeVersion: string
    platform: string
    uptime: number
    memory: NodeJS.MemoryUsage
    cpuUsage: NodeJS.CpuUsage
  }
  timestamp: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const start = Date.now()
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    const service = searchParams.get('service')
    
    // Quick health check for specific service
    if (service) {
      return await handleServiceCheck(service)
    }
    
    // Quick health check for load balancers
    if (!detailed) {
      const quickHealth = await healthCheck.runHealthCheck()
      return NextResponse.json(
        {
          status: quickHealth.overall,
          uptime: quickHealth.uptime,
          version: quickHealth.version,
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - start
        },
        {
          status: quickHealth.overall === 'healthy' ? 200 : 503,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Health-Check': 'quick'
          }
        }
      )
    }
    
    // Comprehensive health check
    const [
      systemHealth,
      circuitBreakerStatus,
      performanceMetrics
    ] = await Promise.allSettled([
      healthCheck.runHealthCheck(),
      Promise.resolve(circuitBreaker.getStatus()),
      Promise.resolve(performanceOptimizer.getPerformanceMetrics())
    ])
    
    // System information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    }
    
    const health = systemHealth.status === 'fulfilled' 
      ? systemHealth.value 
      : {
          overall: 'unhealthy' as const,
          checks: [],
          uptime: 0,
          version: '2.0.0'
        }
    
    const response: HealthResponse = {
      ...health,
      circuitBreakerStatus: circuitBreakerStatus.status === 'fulfilled' 
        ? circuitBreakerStatus.value 
        : {},
      performanceMetrics: performanceMetrics.status === 'fulfilled' 
        ? performanceMetrics.value 
        : {},
      systemInfo,
      timestamp: new Date().toISOString()
    }
    
    // Determine HTTP status based on overall health
    const httpStatus = getHealthStatus(response.overall)
    
    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'detailed',
        'X-Response-Time': `${Date.now() - start}ms`
      }
    })
    
  } catch (error) {
    logger.error('Health check error:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': 'error'
        }
      }
    )
  }
}

/**
 * Handle service-specific health checks
 */
async function handleServiceCheck(service: string): Promise<NextResponse> {
  const start = Date.now()
  
  try {
    let result
    
    switch (service.toLowerCase()) {
      case 'database':
        result = await healthCheck['checkDatabase']()
        break
      case 'redis':
        result = await healthCheck['checkRedis']()
        break
      case 'email':
        result = await healthCheck['checkEmailService']()
        break
      case 'external':
        result = await healthCheck['checkExternalServices']()
        break
      case 'memory':
        result = healthCheck['checkMemoryUsage']()
        break
      default:
        return NextResponse.json(
          { error: `Unknown service: ${service}` },
          { status: 400 }
        )
    }
    
    return NextResponse.json(
      {
        ...result,
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString()
      },
      {
        status: result.status === 'healthy' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check': `service-${service}`
        }
      }
    )
    
  } catch (error) {
    return NextResponse.json(
      {
        service,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    )
  }
}

/**
 * Handle POST requests for manual health check triggers
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { action, service } = body
    
    switch (action) {
      case 'reset_circuit_breaker':
        if (service) {
          circuitBreaker.reset(service)
          return NextResponse.json({ 
            message: `Circuit breaker reset for ${service}` 
          })
        }
        return NextResponse.json(
          { error: 'Service name required for reset' },
          { status: 400 }
        )
        
      case 'force_circuit_open':
        if (service) {
          const duration = body.duration || 300000 // 5 minutes default
          circuitBreaker.forceOpen(service, duration)
          return NextResponse.json({ 
            message: `Circuit breaker forced open for ${service}` 
          })
        }
        return NextResponse.json(
          { error: 'Service name required to force open' },
          { status: 400 }
        )
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Invalid request body' 
      },
      { status: 400 }
    )
  }
}

// Also support HEAD requests for monitoring
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}