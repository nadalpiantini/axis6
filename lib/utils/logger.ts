// Logger utility for consistent logging across the application
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'security'

interface LogMetadata {
  userId?: string
  action?: string
  metadata?: Record<string, any>
  timestamp?: string
  error?: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString()
    const meta = metadata ? JSON.stringify(metadata) : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${meta}`
  }

  debug(message: string, metadata?: LogMetadata) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, metadata))
    }
  }

  info(message: string, metadata?: LogMetadata) {
    console.info(this.formatMessage('info', message, metadata))
  }

  warn(message: string, metadata?: LogMetadata) {
    console.warn(this.formatMessage('warn', message, metadata))
  }

  error(message: string, error?: any, metadata?: LogMetadata) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: this.isDevelopment ? error.stack : undefined
    } : error

    console.error(this.formatMessage('error', message, {
      ...metadata,
      error: errorDetails
    }))

    // In production, you would send this to an error tracking service
    if (this.isProduction && typeof window !== 'undefined') {
      // Send to error tracking service like Sentry
      // Example: Sentry.captureException(error)
    }
  }

  security(message: string, metadata?: LogMetadata) {
    // Security events should always be logged
    const securityLog = this.formatMessage('security', message, {
      ...metadata,
      timestamp: new Date().toISOString()
    })

    console.log(securityLog)

    // In production, send security events to monitoring service
    if (this.isProduction) {
      // Send to security monitoring service
      // Example: sendToSecurityMonitoring(securityLog)
    }
  }

  // Helper method for API responses
  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration?: number,
    metadata?: Record<string, any>
  ) {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    const message = `${method} ${path} ${statusCode} ${duration ? `${duration}ms` : ''}`
    
    if (level === 'error') {
      this.error(message, undefined, metadata)
    } else if (level === 'warn') {
      this.warn(message, metadata)
    } else {
      this.info(message, metadata)
    }
  }
}

// Export singleton instance
export const logger = new Logger()
