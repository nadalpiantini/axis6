/**
 * Advanced Error Tracking and Monitoring System
 * Provides comprehensive error handling with Sentry integration
 */

import * as Sentry from '@sentry/nextjs'
import React from 'react'

import { logger } from '@/lib/utils/logger'

// Error severity levels
export type ErrorSeverity = 'low' | 'normal' | 'high' | 'critical'

// Error categories for better organization
export type ErrorCategory = 
  | 'authentication'
  | 'database'
  | 'network'
  | 'validation'
  | 'ui'
  | 'performance'
  | 'security'
  | 'unknown'

// Enhanced error context
export interface ErrorContext {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  url?: string
  userAgent?: string
  timestamp?: string
  metadata?: Record<string, any>
}

// Error fingerprint for grouping similar errors
export interface ErrorFingerprint {
  message: string
  component?: string
  stack?: string
  category: ErrorCategory
}

/**
 * Initialize Sentry with enhanced configuration
 */
export function initializeErrorTracking(): void {
  if (process.env['NODE_ENV'] === 'production' && process.env['NEXT_PUBLIC_SENTRY_DSN']) {
    // Sentry is already initialized in sentry.client.config.ts
    // This function serves as a placeholder for additional initialization if needed
    logger.info('Enhanced error tracking initialized')
  }
}

/**
 * Categorize errors for better organization
 */
export function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase()
  const stack = error.stack?.toLowerCase() || ''
  
  // Authentication errors
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('login')) {
    return 'authentication'
  }
  
  // Database errors
  if (message.includes('database') || message.includes('supabase') || message.includes('sql')) {
    return 'database'
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
    return 'network'
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return 'validation'
  }
  
  // UI errors
  if (message.includes('render') || message.includes('component') || stack.includes('react')) {
    return 'ui'
  }
  
  // Performance errors
  if (message.includes('timeout') || message.includes('memory') || message.includes('performance')) {
    return 'performance'
  }
  
  // Security errors
  if (message.includes('csp') || message.includes('security') || message.includes('xss')) {
    return 'security'
  }
  
  return 'unknown'
}

/**
 * Generate fingerprint for error grouping
 */
export function generateFingerprint(error: Error, component?: string): ErrorFingerprint {
  // Clean up error message for consistent grouping
  const cleanMessage = error.message
    .replace(/\d+/g, 'X') // Replace numbers with X
    .replace(/['"][^'"]*['"]/g, '"string"') // Replace strings
    .replace(/https?:\/\/[^\s]+/g, 'URL') // Replace URLs
  
  return {
    message: cleanMessage,
    component,
    stack: error.stack?.split('\n')[0], // First line of stack trace
    category: categorizeError(error),
  }
}

/**
 * Enhanced error reporting with context
 */
export function reportError(
  error: Error,
  severity: ErrorSeverity = 'normal',
  context?: ErrorContext
): void {
  const errorCategory = categorizeError(error)
  const fingerprint = generateFingerprint(error, context?.component)
  
  // Log locally first
  logger.error(`[${errorCategory.toUpperCase()}] ${error.message}`, error)
  
  // Report to Sentry with enhanced context
  Sentry.withScope((scope) => {
    // Map our severity to Sentry severity levels
    const sentryLevel = {
      'low': 'info',
      'normal': 'warning',
      'high': 'error',
      'critical': 'fatal',
    }[severity] as 'info' | 'warning' | 'error' | 'fatal'
    
    // Set severity
    scope.setLevel(sentryLevel)
    
    // Set error category as tag
    scope.setTag('error.category', errorCategory)
    scope.setTag('error.fingerprint', `${fingerprint.category}:${fingerprint.message}`)
    
    // Add user context if available
    if (context?.userId) {
      scope.setUser({ id: context.userId })
    }
    
    // Add additional context
    if (context) {
      scope.setContext('errorContext', {
        component: context.component,
        action: context.action,
        url: context.url,
        userAgent: context.userAgent,
        timestamp: context.timestamp || new Date().toISOString(),
        metadata: context.metadata,
      })
    }
    
    // Add fingerprint for grouping
    scope.setFingerprint([
      fingerprint.category,
      fingerprint.message,
      fingerprint.component || 'unknown',
    ])
    
    // Capture the exception
    Sentry.captureException(error)
  })
}

/**
 * Report performance issues
 */
export function reportPerformanceIssue(
  metric: string,
  value: number,
  context?: ErrorContext
): void {
  Sentry.addBreadcrumb({
    message: `Performance: ${metric}`,
    category: 'performance',
    level: 'warning',
    data: {
      metric,
      value,
      context,
    },
  })
  
  logger.warn(`Performance issue: ${metric} = ${value}`, context)
}

/**
 * Report custom events for monitoring
 */
export function reportEvent(
  event: string,
  data?: Record<string, any>,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  Sentry.addBreadcrumb({
    message: event,
    category: 'custom',
    level,
    data,
  })
  
  logger.info(`Event: ${event}`, data)
}

/**
 * Start a new transaction for performance monitoring
 */
export function startTransaction(name: string, op: string = 'custom') {
  // Use the span API which is available in current Sentry version
  return Sentry.startSpan({
    name,
    op,
  }, () => {
    // Return a simple object that can be used for basic timing
    const start = Date.now()
    return {
      finish: () => {
        const duration = Date.now() - start
        logger.info(`Transaction ${name} completed in ${duration}ms`)
      }
    }
  })
}

/**
 * React Hook for error boundary context
 */
export function useErrorTracking(component: string) {
  const reportComponentError = (error: Error, errorInfo?: any) => {
    reportError(error, 'high', {
      component,
      metadata: errorInfo,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
    })
  }
  
  return { reportComponentError }
}

/**
 * Get current error tracking status
 */
export function getErrorTrackingStatus(): {
  enabled: boolean
  dsn?: string
  environment: string
} {
  return {
    enabled: !!process.env['NEXT_PUBLIC_SENTRY_DSN'],
    dsn: process.env['NEXT_PUBLIC_SENTRY_DSN'],
    environment: process.env['NODE_ENV'] || 'development',
  }
}