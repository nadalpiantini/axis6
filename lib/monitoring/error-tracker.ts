/**
 * Centralized error tracking and monitoring utility
 * Provides structured error reporting for production environments
 */

import { logger } from '@/lib/logger'

export interface ErrorReport {
  type: 'javascript_error' | 'api_error' | 'csp_violation' | 'network_error' | 'auth_error'
  message: string
  stack?: string
  url?: string
  userAgent?: string
  userId?: string
  sessionId?: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, unknown>
}

export interface PerformanceReport {
  type: 'page_load' | 'api_response' | 'component_render'
  metric: string
  value: number
  url?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

class ErrorTracker {
  private isClient = typeof window !== 'undefined'
  private isProd = process.env.NODE_ENV === 'production'

  constructor() {
    if (this.isClient && this.isProd) {
      this.setupGlobalErrorHandlers()
    }
  }

  /**
   * Track a custom error
   */
  trackError(error: Partial<ErrorReport>): void {
    const report: ErrorReport = {
      type: 'javascript_error',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      ...error,
      message: error.message || 'Unknown error',
      url: this.isClient ? window.location.href : undefined,
      userAgent: this.isClient ? navigator.userAgent : undefined,
    }

    logger.error(report.message, error)

    if (this.isProd) {
      this.sendToMonitoring('error', report)
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(perf: Partial<PerformanceReport>): void {
    const report: PerformanceReport = {
      type: 'page_load',
      timestamp: new Date().toISOString(),
      ...perf,
      metric: perf.metric || 'unknown',
      value: perf.value || 0,
      url: this.isClient ? window.location.href : undefined,
    }

    logger.info(`Performance: ${report.metric} = ${report.value}ms`, report.metadata)

    if (this.isProd) {
      this.sendToMonitoring('performance', report)
    }
  }

  /**
   * Track API errors specifically
   */
  trackAPIError(endpoint: string, status: number, error: unknown, metadata?: Record<string, unknown>): void {
    this.trackError({
      type: 'api_error',
      message: `API Error: ${endpoint} returned ${status}`,
      severity: status >= 500 ? 'high' : 'medium',
      metadata: {
        endpoint,
        status,
        error: error instanceof Error ? error.message : error,
        ...metadata
      }
    })
  }

  /**
   * Track authentication errors
   */
  trackAuthError(action: string, error: unknown): void {
    this.trackError({
      type: 'auth_error',
      message: `Auth Error: ${action}`,
      severity: 'high',
      metadata: {
        action,
        error: error instanceof Error ? error.message : error
      }
    })
  }

  /**
   * Set up global error handlers for client-side
   */
  private setupGlobalErrorHandlers(): void {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript_error',
        message: event.error?.message || event.message,
        stack: event.error?.stack,
        severity: 'high',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      })
    })

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'javascript_error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        severity: 'high',
        metadata: {
          reason: event.reason
        }
      })
    })

    // Track navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        if ('performance' in window) {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation) {
            this.trackPerformance({
              type: 'page_load',
              metric: 'page_load_time',
              value: navigation.loadEventEnd - navigation.fetchStart
            })
          }
        }
      }, 0)
    })
  }

  /**
   * Send error reports to monitoring service
   */
  private async sendToMonitoring(type: 'error' | 'performance', data: ErrorReport | PerformanceReport): Promise<void> {
    try {
      // Store in localStorage as fallback
      this.storeLocalFallback(type, data)

      // Send to API endpoint
      const response = await fetch('/api/monitoring/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, data })
      })

      if (!response.ok) {
        throw new Error(`Monitoring API error: ${response.status}`)
      }
    } catch (error) {
      // Fail silently but log to console in development
      if (!this.isProd) {
        logger.warn('Failed to send monitoring data:', error)
      }
    }
  }

  /**
   * Store error reports in localStorage as fallback
   */
  private storeLocalFallback(type: 'error' | 'performance', data: ErrorReport | PerformanceReport): void {
    if (!this.isClient) return

    try {
      const key = `axis6_${type}_reports`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      existing.push(data)

      // Keep only the last 50 reports
      if (existing.length > 50) {
        existing.splice(0, existing.length - 50)
      }

      localStorage.setItem(key, JSON.stringify(existing))
    } catch {
      // Fail silently if localStorage is not available
    }
  }

  /**
   * Get stored error reports from localStorage
   */
  getStoredReports(type: 'error' | 'performance'): Array<ErrorReport | PerformanceReport> {
    if (!this.isClient) return []

    try {
      const key = `axis6_${type}_reports`
      return JSON.parse(localStorage.getItem(key) || '[]')
    } catch {
      return []
    }
  }

  /**
   * Clear stored reports
   */
  clearStoredReports(type?: 'error' | 'performance'): void {
    if (!this.isClient) return

    if (type) {
      localStorage.removeItem(`axis6_${type}_reports`)
    } else {
      localStorage.removeItem('axis6_error_reports')
      localStorage.removeItem('axis6_performance_reports')
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker()

// Re-export types
export type { ErrorReport as ClientErrorReport, PerformanceReport as ClientPerformanceReport }
