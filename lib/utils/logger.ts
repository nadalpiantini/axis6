/**
 * Production-safe logging utility
 * Automatically strips console statements in production builds
 */

const isDevelopment = process.env['NODE_ENV'] === 'development'
const isTest = process.env['NODE_ENV'] === 'test'

interface LoggerOptions {
  context?: string
  data?: any
}

class Logger {
  private context?: string

  constructor(context?: string) {
    this.context = context
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString()
    const prefix = this.context ? `[${this.context}]` : ''
    return `${timestamp} [${level}]${prefix} ${message}`
  }

  log(message: string, data?: any): void {
    if (isDevelopment || isTest) {
      console.log(this.formatMessage('LOG', message), data || '')
    }
  }

  info(message: string, data?: any): void {
    if (isDevelopment || isTest) {
      console.info(this.formatMessage('INFO', message), data || '')
    }
  }

  warn(message: string, data?: any): void {
    if (isDevelopment || isTest) {
      console.warn(this.formatMessage('WARN', message), data || '')
    }
  }

  error(message: string, error?: any): void {
    // Errors should always be logged in production for monitoring
    // But we'll send them to error tracking service instead of console
    if (isDevelopment || isTest) {
      console.error(this.formatMessage('ERROR', message), error || '')
    } else if (typeof window !== 'undefined' && (window as any).Sentry) {
      // In production, send to Sentry
      (window as any).Sentry.captureException(error || new Error(message))
    }
  }

  debug(message: string, data?: any): void {
    if (isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message), data || '')
    }
  }

  trace(message: string, data?: any): void {
    if (isDevelopment) {
      console.trace(this.formatMessage('TRACE', message), data || '')
    }
  }

  group(label: string): void {
    if (isDevelopment || isTest) {
      console.group(label)
    }
  }

  groupEnd(): void {
    if (isDevelopment || isTest) {
      console.groupEnd()
    }
  }

  time(label: string): void {
    if (isDevelopment || isTest) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (isDevelopment || isTest) {
      console.timeEnd(label)
    }
  }

  table(data: any): void {
    if (isDevelopment || isTest) {
      console.table(data)
    }
  }
}

// Export singleton instances for different contexts
export const logger = new Logger()
export const authLogger = new Logger('Auth')
export const dbLogger = new Logger('Database')
export const apiLogger = new Logger('API')
export const uiLogger = new Logger('UI')

// Export the Logger class for custom instances
export { Logger }

// Development-only assertion
export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    if (isDevelopment) {
      throw new Error(`Assertion failed: ${message}`)
    }
    // In production, log to error tracking but don't throw
    logger.error(`Assertion failed: ${message}`)
  }
}

// Development-only deprecation warning
export function deprecated(message: string): void {
  if (isDevelopment) {
    console.warn(`⚠️ DEPRECATED: ${message}`)
  }
}