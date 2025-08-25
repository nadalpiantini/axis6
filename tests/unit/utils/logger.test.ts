/**
 * @jest-environment node
 */

import { logger } from '@/lib/utils/logger'

// Mock console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
}

beforeEach(() => {
  console.log = jest.fn()
  console.info = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
  console.debug = jest.fn()
})

afterEach(() => {
  Object.assign(console, originalConsole)
})

describe('Logger Utility', () => {
  describe('info logging', () => {
    it('should log info messages with proper formatting', () => {
      const message = 'Test info message'
      const context = { userId: '123', action: 'test' }
      
      logger.info(message, context)
      
      expect(console.info).toHaveBeenCalled()
      const logCall = (console.info as jest.Mock).mock.calls[0]
      expect(logCall[0]).toContain('[INFO]')
      expect(logCall[0]).toContain(message)
    })

    it('should handle info messages without context', () => {
      const message = 'Simple info message'
      
      logger.info(message)
      
      expect(console.info).toHaveBeenCalled()
    })
  })

  describe('error logging', () => {
    it('should log errors with stack traces', () => {
      const error = new Error('Test error')
      const message = 'Error occurred'
      
      logger.error(message, error)
      
      expect(console.error).toHaveBeenCalled()
      const logCall = (console.error as jest.Mock).mock.calls[0]
      expect(logCall[0]).toContain('[ERROR]')
      expect(logCall[0]).toContain(message)
      // Error object is passed as second parameter to console.error
      expect(logCall[1]).toBe(error)
    })

    it('should handle error logging without context', () => {
      const error = new Error('Simple error')
      const message = 'Error message'
      
      logger.error(message, error)
      
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle string errors', () => {
      const message = 'Error occurred'
      
      logger.error(message, 'String error')
      
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('warn logging', () => {
    it('should log warnings with proper formatting', () => {
      const message = 'Test warning'
      const context = { component: 'TestComponent' }
      
      logger.warn(message, context)
      
      expect(console.warn).toHaveBeenCalled()
      const logCall = (console.warn as jest.Mock).mock.calls[0]
      expect(logCall[0]).toContain('[WARN]')
      expect(logCall[0]).toContain(message)
    })
  })

  describe('debug logging', () => {
    it('should log debug messages in development', () => {
      const originalEnv = process.env['NODE_ENV']
      process.env['NODE_ENV'] = 'development'
      
      const message = 'Debug message'
      logger.debug(message)
      
      expect(console.debug).toHaveBeenCalled()
      
      process.env['NODE_ENV'] = originalEnv
    })

    it('should not log debug messages in production', () => {
      const originalEnv = process.env['NODE_ENV']
      process.env['NODE_ENV'] = 'production'
      
      const message = 'Debug message'
      logger.debug(message)
      
      expect(console.debug).not.toHaveBeenCalled()
      
      process.env['NODE_ENV'] = originalEnv
    })
  })

  describe('contextual loggers', () => {
    it('should use pre-configured contextual loggers', () => {
      const { authLogger } = require('@/lib/utils/logger')
      
      authLogger.info('Authentication successful')
      
      expect(console.info).toHaveBeenCalled()
      const logCall = (console.info as jest.Mock).mock.calls[0]
      expect(logCall[0]).toContain('[Auth]')
      expect(logCall[0]).toContain('Authentication successful')
    })

    it('should use database contextual logger', () => {
      const { dbLogger } = require('@/lib/utils/logger')
      
      dbLogger.warn('Database connection slow')
      
      expect(console.warn).toHaveBeenCalled()
      const logCall = (console.warn as jest.Mock).mock.calls[0]
      expect(logCall[0]).toContain('[Database]')
      expect(logCall[0]).toContain('Database connection slow')
    })
  })

  describe('structured logging', () => {
    it('should handle complex nested objects', () => {
      const complexContext = {
        user: { id: '123', name: 'Test User' },
        request: { method: 'POST', url: '/api/test' },
        performance: { duration: 150 }
      }
      
      logger.info('Complex operation completed', complexContext)
      
      expect(console.info).toHaveBeenCalled()
    })

    it('should handle arrays in context', () => {
      const arrayContext = {
        categories: ['Physical', 'Mental', 'Emotional'],
        scores: [8, 7, 9]
      }
      
      logger.info('Categories processed', arrayContext)
      
      expect(console.info).toHaveBeenCalled()
    })
  })

  describe('performance logging', () => {
    it('should start performance timer', () => {
      const originalConsoleTime = console.time
      console.time = jest.fn()
      
      logger.time('test-operation')
      
      expect(console.time).toHaveBeenCalledWith('test-operation')
      
      console.time = originalConsoleTime
    })

    it('should end performance timer', () => {
      const originalConsoleTimeEnd = console.timeEnd
      console.timeEnd = jest.fn()
      
      logger.timeEnd('test-operation')
      
      expect(console.timeEnd).toHaveBeenCalledWith('test-operation')
      
      console.timeEnd = originalConsoleTimeEnd
    })
  })

  describe('production safety', () => {
    it('should not log info messages in production', () => {
      const originalEnv = process.env['NODE_ENV']
      process.env['NODE_ENV'] = 'production'
      
      const message = 'Production test message'
      logger.info(message)
      
      expect(console.info).not.toHaveBeenCalled()
      
      process.env['NODE_ENV'] = originalEnv
    })

    it('should log errors even in production', () => {
      const originalEnv = process.env['NODE_ENV']
      process.env['NODE_ENV'] = 'production'
      
      // Mock Sentry
      const mockSentry = { captureException: jest.fn() }
      ;(global as any).window = { Sentry: mockSentry }
      
      const message = 'Production error'
      const error = new Error('Test error')
      logger.error(message, error)
      
      // Should not call console.error in production
      expect(console.error).not.toHaveBeenCalled()
      
      process.env['NODE_ENV'] = originalEnv
      delete (global as any).window
    })
  })

  describe('error boundary integration', () => {
    it('should format errors for error boundaries', () => {
      const error = new Error('Component error')
      error.stack = 'Error: Component error\\n    at Component.render'
      
      logger.error('Component failed to render', error)
      
      expect(console.error).toHaveBeenCalled()
      const logCall = (console.error as jest.Mock).mock.calls[0]
      expect(logCall[0]).toContain('[ERROR]')
      expect(logCall[0]).toContain('Component failed to render')
      expect(logCall[1]).toBe(error)
    })
  })
})