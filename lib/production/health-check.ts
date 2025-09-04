/**
 * Production Health Check System
 * Comprehensive health monitoring for all critical services
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
export interface HealthCheckResult {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  details?: string
  timestamp: string
}
export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: HealthCheckResult[]
  uptime: number
  version: string
}
class HealthCheckManager {
  private startTime = Date.now()
  /**
   * Database connectivity and performance check
   */
  async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      // Test basic connectivity with a simple query
      const { data, error } = await supabase
        .from('axis6_categories')
        .select('id')
        .limit(1)
      const responseTime = Date.now() - start
      if (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          responseTime,
          details: error.message,
          timestamp: new Date().toISOString()
        }
      }
      // Performance thresholds
      const status = responseTime > 1000 ? 'degraded' : 'healthy'
      return {
        service: 'database',
        status,
        responseTime,
        details: `Query returned ${data?.length || 0} records`,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  }
  /**
   * Redis cache connectivity check
   */
  async checkRedis(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      // Check if Redis is configured
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return {
          service: 'redis',
          status: 'degraded',
          responseTime: 0,
          details: 'Redis not configured (optional service)',
          timestamp: new Date().toISOString()
        }
      }
      // Check if using placeholder values
      if (process.env.UPSTASH_REDIS_REST_URL.includes('your-redis-url') ||
          process.env.UPSTASH_REDIS_REST_TOKEN.includes('your-redis-token')) {
        return {
          service: 'redis',
          status: 'degraded',
          responseTime: 0,
          details: 'Redis configured with placeholder values',
          timestamp: new Date().toISOString()
        }
      }
      const { Redis } = await import('@upstash/redis')
      const redis = Redis.fromEnv()
      // Test set/get operation
      const testKey = `health:${Date.now()}`
      await redis.set(testKey, 'ok', { ex: 10 })
      const result = await redis.get(testKey)
      await redis.del(testKey)
      const responseTime = Date.now() - start
      if (result !== 'ok') {
        return {
          service: 'redis',
          status: 'unhealthy',
          responseTime,
          details: 'Set/get operation failed',
          timestamp: new Date().toISOString()
        }
      }
      const status = responseTime > 500 ? 'degraded' : 'healthy'
      return {
        service: 'redis',
        status,
        responseTime,
        details: 'Set/get operation successful',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'redis',
        status: 'degraded',
        responseTime: Date.now() - start,
        details: error instanceof Error ? error.message : 'Redis unavailable (optional service)',
        timestamp: new Date().toISOString()
      }
    }
  }
  /**
   * Email service connectivity check
   */
  async checkEmailService(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      if (!process.env.RESEND_API_KEY) {
        return {
          service: 'email',
          status: 'degraded',
          responseTime: 0,
          details: 'Resend API key not configured',
          timestamp: new Date().toISOString()
        }
      }
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      // Check API key validity without sending email
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      })
      const responseTime = Date.now() - start
      if (!response.ok) {
        return {
          service: 'email',
          status: 'unhealthy',
          responseTime,
          details: `API returned ${response.status}`,
          timestamp: new Date().toISOString()
        }
      }
      const status = responseTime > 2000 ? 'degraded' : 'healthy'
      return {
        service: 'email',
        status,
        responseTime,
        details: 'API connectivity verified',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'email',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: error instanceof Error ? error.message : 'Email service unavailable',
        timestamp: new Date().toISOString()
      }
    }
  }
  /**
   * External dependencies check
   */
  async checkExternalServices(): Promise<HealthCheckResult> {
    const start = Date.now()
    try {
      // Check critical external services
      const checks = await Promise.allSettled([
        fetch('https://api.vercel.com/v1/user', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        }),
        fetch('https://api.github.com', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000)
        })
      ])
      const responseTime = Date.now() - start
      const failedChecks = checks.filter(check => check.status === 'rejected').length
      let status: 'healthy' | 'degraded' | 'unhealthy'
      if (failedChecks === 0) status = 'healthy'
      else if (failedChecks < checks.length) status = 'degraded'
      else status = 'unhealthy'
      return {
        service: 'external',
        status,
        responseTime,
        details: `${checks.length - failedChecks}/${checks.length} services responding`,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'external',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: error instanceof Error ? error.message : 'External services check failed',
        timestamp: new Date().toISOString()
      }
    }
  }
  /**
   * Memory usage check
   */
  checkMemoryUsage(): HealthCheckResult {
    const start = Date.now()
    try {
      const memoryUsage = process.memoryUsage()
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
      const memoryUtilization = (heapUsedMB / heapTotalMB) * 100
      let status: 'healthy' | 'degraded' | 'unhealthy'
      // More lenient thresholds for development and production environments
      if (memoryUtilization < 90) status = 'healthy'
      else if (memoryUtilization < 98) status = 'degraded'
      else status = 'unhealthy'
      return {
        service: 'memory',
        status,
        responseTime: Date.now() - start,
        details: `${heapUsedMB}MB/${heapTotalMB}MB (${memoryUtilization.toFixed(1)}%)`,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        service: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - start,
        details: error instanceof Error ? error.message : 'Memory check failed',
        timestamp: new Date().toISOString()
      }
    }
  }
  /**
   * Run comprehensive health check
   */
  async runHealthCheck(): Promise<SystemHealth> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkEmailService(),
      this.checkExternalServices(),
      Promise.resolve(this.checkMemoryUsage())
    ])
    const results: HealthCheckResult[] = checks.map(check => {
      if (check.status === 'fulfilled') {
        return check.value
      }
      return {
        service: 'unknown',
        status: 'unhealthy',
        responseTime: 0,
        details: 'Health check failed',
        timestamp: new Date().toISOString()
      }
    })
    // Determine overall health
    const unhealthy = results.filter(r => r.status === 'unhealthy').length
    const degraded = results.filter(r => r.status === 'degraded').length
    let overall: 'healthy' | 'degraded' | 'unhealthy'
    if (unhealthy > 0) overall = 'unhealthy'
    else if (degraded > 0) overall = 'degraded'
    else overall = 'healthy'
    return {
      overall,
      checks: results,
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '2.0.0'
    }
  }
}
export const healthCheck = new HealthCheckManager()
/**
 * Quick health check for API endpoints
 */
export async function quickHealthCheck(): Promise<{ status: string; uptime: number }> {
  const health = await healthCheck.runHealthCheck()
  return {
    status: health.overall,
    uptime: health.uptime
  }
}
