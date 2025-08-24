// Production-ready logging utility - replaces console.log statements
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security'

interface LogContext {
  userId?: string
  sessionId?: string
  requestId?: string
  component?: string
  action?: string
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
  }
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private shouldLog = (level: LogLevel): boolean => {
    if (this.isDevelopment) return true
    // Only log warnings and errors in production
    return level === 'warn' || level === 'error' || level === 'security'
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      ...(typeof window !== 'undefined' && { 
        url: window.location?.href,
        userAgent: navigator?.userAgent?.substring(0, 100) // Truncate for logs
      })
    }
    
    return logEntry
  }

  private sendToMonitoring(level: LogLevel, message: string, context?: LogContext) {
    // In production, send to monitoring service
    if (this.isProduction && typeof window !== 'undefined') {
      // Send to Sentry if available
      if (typeof window.__SENTRY__ !== 'undefined') {
        try {
          window.__SENTRY__.captureMessage(message, {
            level: level as any,
            extra: context
          })
        } catch (e) {
          // Fail silently if Sentry isn't available
        }
      }
      
      // Send critical errors to API endpoint for monitoring
      if (level === 'error' || level === 'security') {
        fetch('/api/monitoring/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level, message, context, timestamp: new Date().toISOString() })
        }).catch(() => {
          // Fail silently - don't break app if logging fails
        })
      }
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return
    const logEntry = this.formatLog('debug', message, context)
    console.debug('[DEBUG]', logEntry)
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return
    const logEntry = this.formatLog('info', message, context)
    console.info('[INFO]', logEntry)
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return
    const logEntry = this.formatLog('warn', message, context)
    console.warn('[WARN]', logEntry)
    this.sendToMonitoring('warn', message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    const logEntry = this.formatLog('error', message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      } : undefined
    })
    console.error('[ERROR]', logEntry)
    this.sendToMonitoring('error', message, { ...context, error })
  }

  security(message: string, context?: LogContext) {
    // Security events always logged
    const logEntry = this.formatLog('security', message, context)
    console.warn('[SECURITY]', logEntry)
    this.sendToMonitoring('security', message, context)
  }

  // Convenience methods for common use cases
  auth(message: string, context?: Omit<LogContext, 'component'>) {
    this.info(message, { ...context, component: 'auth' })
  }

  api(message: string, context?: Omit<LogContext, 'component'>) {
    this.info(message, { ...context, component: 'api' })
  }

  database(message: string, context?: Omit<LogContext, 'component'>) {
    this.info(message, { ...context, component: 'database' })
  }

  query(message: string, context?: Omit<LogContext, 'component'>) {
    this.debug(message, { ...context, component: 'react-query' })
  }

  mutation(message: string, context?: Omit<LogContext, 'component'>) {
    this.debug(message, { ...context, component: 'mutation' })
  }

  // Performance logging
  performance(label: string, duration: number, context?: LogContext) {
    this.info(`Performance: ${label}`, {
      ...context,
      component: 'performance',
      duration
    })
  }

  // API response logging
  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration?: number,
    context?: LogContext
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    const message = `${method} ${path} ${statusCode}${duration ? ` (${duration}ms)` : ''}`
    
    const logContext = {
      ...context,
      component: 'api',
      method,
      path,
      statusCode,
      duration
    }
    
    if (level === 'error') {
      this.error(message, undefined, logContext)
    } else if (level === 'warn') {
      this.warn(message, logContext)
    } else {
      this.info(message, logContext)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience exports
export const log = logger
export default logger

// Legacy console.log replacement for gradual migration
export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

// Type declarations for Sentry global
declare global {
  interface Window {
    __SENTRY__?: {
      captureMessage: (message: string, options?: any) => void
      captureException: (error: any) => void
    }
  }
}
