import { createClient } from '@/lib/supabase/client'

export type ErrorLevel = 'info' | 'warn' | 'error' | 'critical'
export type ErrorCategory = 'auth' | 'database' | 'api' | 'email' | 'ui' | 'network' | 'validation' | 'performance'

export interface ErrorContext {
  userId?: string
  userAgent?: string
  url?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

export interface ErrorLog {
  id: string
  level: ErrorLevel
  category: ErrorCategory
  message: string
  error?: Error
  context?: ErrorContext
  timestamp: Date
  resolved?: boolean
}

class ErrorHandler {
  private logs: ErrorLog[] = []
  private maxLogs = 100 // Keep last 100 errors in memory

  // Log error with context
  log(
    level: ErrorLevel,
    category: ErrorCategory,
    message: string,
    error?: Error | unknown,
    context?: ErrorContext
  ) {
    const errorLog: ErrorLog = {
      id: crypto.randomUUID(),
      level,
      category,
      message,
      error: error instanceof Error ? error : undefined,
      context: {
        ...context,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : context?.url
      },
      timestamp: new Date()
    }

    // Add to memory logs
    this.logs.unshift(errorLog)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Console logging with appropriate level
    this.consoleLog(errorLog)

    // Send to external services in production
    if (process.env['NODE_ENV'] === 'production') {
      this.sendToExternalServices(errorLog)
    }

    // Store in database for critical errors
    if (level === 'critical') {
      this.storeInDatabase(errorLog)
    }

    return errorLog.id
  }

  private consoleLog(errorLog: ErrorLog) {
    const prefix = `[${errorLog.level.toUpperCase()}][${errorLog.category}]`
    const contextStr = errorLog.context ? ` | Context: ${JSON.stringify(errorLog.context, null, 2)}` : ''
    const errorStr = errorLog.error ? ` | Error: ${errorLog.error.stack || errorLog.error.message}` : ''
    
    const fullMessage = `${prefix} ${errorLog.message}${contextStr}${errorStr}`

    switch (errorLog.level) {
      case 'info':
        console.info(fullMessage)
        break
      case 'warn':
        console.warn(fullMessage)
        break
      case 'error':
        console.error(fullMessage)
        break
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', fullMessage)
        break
    }
  }

  private async sendToExternalServices(errorLog: ErrorLog) {
    try {
      // Send to Sentry if configured
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const Sentry = (window as any).Sentry
        Sentry.captureException(errorLog.error || new Error(errorLog.message), {
          level: errorLog.level,
          tags: {
            category: errorLog.category,
            component: errorLog.context?.component || 'unknown'
          },
          extra: errorLog.context
        })
      }

      // Send to custom analytics endpoint
      if (errorLog.level === 'critical' || errorLog.level === 'error') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorLog)
        }).catch(err => {
          console.warn('Failed to send error to analytics endpoint:', err)
        })
      }
    } catch (error) {
      console.warn('Failed to send error to external services:', error)
    }
  }

  private async storeInDatabase(errorLog: ErrorLog) {
    try {
      const supabase = createClient()
      
      // Check if we have a session to get user info
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('axis6_error_logs')
        .insert({
          level: errorLog.level,
          category: errorLog.category,
          message: errorLog.message,
          error_details: errorLog.error ? {
            name: errorLog.error.name,
            message: errorLog.error.message,
            stack: errorLog.error.stack
          } : null,
          context: errorLog.context,
          user_id: user?.id || null,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.warn('Failed to store error in database:', error)
      }
    } catch (dbError) {
      console.warn('Failed to connect to database for error logging:', dbError)
    }
  }

  // Convenience methods for different error levels
  info(category: ErrorCategory, message: string, context?: ErrorContext) {
    return this.log('info', category, message, undefined, context)
  }

  warn(category: ErrorCategory, message: string, error?: Error | unknown, context?: ErrorContext) {
    return this.log('warn', category, message, error, context)
  }

  error(category: ErrorCategory, message: string, error?: Error | unknown, context?: ErrorContext) {
    return this.log('error', category, message, error, context)
  }

  critical(category: ErrorCategory, message: string, error?: Error | unknown, context?: ErrorContext) {
    return this.log('critical', category, message, error, context)
  }

  // Authentication specific errors
  authError(message: string, error?: Error | unknown, context?: ErrorContext) {
    return this.error('auth', message, error, { ...context, action: 'authentication' })
  }

  // Database specific errors
  dbError(message: string, error?: Error | unknown, context?: ErrorContext) {
    return this.error('database', message, error, { ...context, action: 'database_operation' })
  }

  // API specific errors
  apiError(message: string, error?: Error | unknown, context?: ErrorContext) {
    return this.error('api', message, error, { ...context, action: 'api_call' })
  }

  // Email specific errors
  emailError(message: string, error?: Error | unknown, context?: ErrorContext) {
    return this.warn('email', message, error, { ...context, action: 'email_send' })
  }

  // UI specific errors
  uiError(message: string, error?: Error | unknown, context?: ErrorContext) {
    return this.warn('ui', message, error, { ...context, action: 'ui_interaction' })
  }

  // Performance monitoring
  performanceWarn(message: string, metrics?: Record<string, number>, context?: ErrorContext) {
    return this.warn('performance', message, undefined, { 
      ...context, 
      action: 'performance_check',
      metadata: { metrics, ...context?.metadata }
    })
  }

  // Get recent logs
  getRecentLogs(level?: ErrorLevel, category?: ErrorCategory): ErrorLog[] {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    return filteredLogs.slice(0, 20) // Return last 20 matching logs
  }

  // Get error stats
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<ErrorLevel, number>,
      byCategory: {} as Record<ErrorCategory, number>,
      recent: this.logs.slice(0, 5)
    }

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
    })

    return stats
  }

  // Clear logs (for testing/development)
  clearLogs() {
    this.logs = []
  }

  // Create error boundary compatible error handler
  handleReactError(error: Error, errorInfo: { componentStack: string }, component?: string) {
    return this.critical('ui', 'React component error boundary triggered', error, {
      component,
      action: 'component_render',
      metadata: { componentStack: errorInfo.componentStack }
    })
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler()

// Global error event listeners (client-side only)
if (typeof window !== 'undefined') {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.critical('network', 'Unhandled promise rejection', event.reason, {
      action: 'promise_rejection',
      metadata: { promise: event.promise }
    })
  })

  // Global JavaScript errors
  window.addEventListener('error', (event) => {
    errorHandler.error('ui', 'Global JavaScript error', event.error, {
      action: 'javascript_error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    })
  })
}

// Export types and utilities
export { ErrorHandler }
export default errorHandler