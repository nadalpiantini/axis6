/**
 * Centralized logger utility to replace console statements
 * Provides structured logging with environment-aware levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isClient = typeof window !== 'undefined'
  
  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error'
    }
    return true
  }
  
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (context) {
      return `${prefix} ${message} ${JSON.stringify(context)}`
    }
    return `${prefix} ${message}`
  }
  
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context))
    }
  }
  
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context))
    }
  }
  
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }
  
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        ...(error instanceof Error ? {
          errorMessage: error.message,
          errorStack: error.stack,
          errorName: error.name
        } : {
          error: error
        })
      }
      console.error(this.formatMessage('error', message, errorContext))
    }
    
    // In production, send errors to monitoring service
    if (!this.isDevelopment && this.isClient) {
      this.sendToMonitoring(message, error, context)
    }
  }
  
  private sendToMonitoring(message: string, error?: unknown, context?: LogContext): void {
    // TODO: Integrate with error monitoring service (e.g., Sentry)
    // For now, just track in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('axis6_errors') || '[]')
      errors.push({
        timestamp: new Date().toISOString(),
        message,
        error: error instanceof Error ? error.message : error,
        context,
        url: window.location.href,
        userAgent: navigator.userAgent
      })
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50)
      }
      localStorage.setItem('axis6_errors', JSON.stringify(errors))
    } catch {
      // Fail silently if localStorage is not available
    }
  }
  
  // Performance logging
  time(label: string): void {
    if (this.shouldLog('debug')) {
      console.time(label)
    }
  }
  
  timeEnd(label: string): void {
    if (this.shouldLog('debug')) {
      console.timeEnd(label)
    }
  }
  
  // Group logging for better organization
  group(label: string): void {
    if (this.shouldLog('debug')) {
      console.group(label)
    }
  }
  
  groupEnd(): void {
    if (this.shouldLog('debug')) {
      console.groupEnd()
    }
  }
  
  // Clear console in development
  clear(): void {
    if (this.isDevelopment && this.isClient) {
      console.clear()
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for use in other files
export type { LogContext }