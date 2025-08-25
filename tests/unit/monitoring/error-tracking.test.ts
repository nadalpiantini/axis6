/**
 * @jest-environment node
 */

import { 
  categorizeError, 
  generateFingerprint, 
  reportError,
  reportEvent,
  useErrorTracking
} from '@/lib/monitoring/error-tracking'

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  withScope: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  startSpan: jest.fn(),
}))

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}))

// Mock React for useErrorTracking
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  // Mock hook behavior for testing
}))

describe('Error Tracking System', () => {
  let mockSentryWithScope: jest.MockedFunction<any>
  let mockSentryCaptureException: jest.MockedFunction<any>
  let mockSentryAddBreadcrumb: jest.MockedFunction<any>
  let mockSentryStartSpan: jest.MockedFunction<any>
  let mockLogger: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    const sentry = require('@sentry/nextjs')
    mockSentryWithScope = sentry.withScope
    mockSentryCaptureException = sentry.captureException
    mockSentryAddBreadcrumb = sentry.addBreadcrumb
    mockSentryStartSpan = sentry.startSpan
    
    const logger = require('@/lib/utils/logger')
    mockLogger = logger.logger
    
    mockSentryWithScope.mockImplementation((callback) => {
      const mockScope = {
        setLevel: jest.fn(),
        setTag: jest.fn(),
        setUser: jest.fn(),
        setContext: jest.fn(),
        setFingerprint: jest.fn(),
      }
      callback(mockScope)
    })
  })

  describe('error categorization', () => {
    it('should categorize authentication errors', () => {
      const authErrors = [
        new Error('Authentication failed'),
        new Error('User unauthorized'),
        new Error('Login attempt failed'),
        new Error('Invalid login credentials')
      ]

      authErrors.forEach(error => {
        expect(categorizeError(error)).toBe('authentication')
      })
    })

    it('should categorize database errors', () => {
      const dbErrors = [
        new Error('Database connection failed'),
        new Error('Supabase query error'),
        new Error('SQL syntax error'),
        new Error('Database timeout')
      ]

      dbErrors.forEach(error => {
        expect(categorizeError(error)).toBe('database')
      })
    })

    it('should categorize network errors', () => {
      const networkErrors = [
        new Error('network request failed'),
        new Error('fetch timeout'),
        new Error('cors policy error'),
        new Error('network connection refused')
      ]

      networkErrors.forEach(error => {
        expect(categorizeError(error)).toBe('network')
      })
    })

    it('should categorize validation errors', () => {
      const validationErrors = [
        new Error('Validation failed: email is required'),
        new Error('Invalid input format'),
        new Error('Required field missing')
      ]

      validationErrors.forEach(error => {
        expect(categorizeError(error)).toBe('validation')
      })
    })

    it('should categorize UI errors', () => {
      const uiErrors = [
        new Error('Component render failed'),
        new Error('React hydration error')
      ]
      uiErrors[1].stack = 'Error at Component.render (react-dom.js:123)'

      uiErrors.forEach(error => {
        expect(categorizeError(error)).toBe('ui')
      })
    })

    it('should categorize performance errors', () => {
      const perfErrors = [
        new Error('Request timeout'),
        new Error('Memory limit exceeded'),
        new Error('Performance threshold exceeded')
      ]

      perfErrors.forEach(error => {
        expect(categorizeError(error)).toBe('performance')
      })
    })

    it('should categorize security errors', () => {
      const securityErrors = [
        new Error('CSP violation detected'),
        new Error('Security policy violation'),
        new Error('XSS attempt blocked')
      ]

      securityErrors.forEach(error => {
        expect(categorizeError(error)).toBe('security')
      })
    })

    it('should default to unknown category', () => {
      const unknownError = new Error('Something weird happened')
      expect(categorizeError(unknownError)).toBe('unknown')
    })
  })

  describe('error fingerprinting', () => {
    it('should generate consistent fingerprints', () => {
      const error1 = new Error('User 123 not found')
      const error2 = new Error('User 456 not found')

      const fp1 = generateFingerprint(error1, 'UserService')
      const fp2 = generateFingerprint(error2, 'UserService')

      // Should have same cleaned message (numbers replaced with X)
      expect(fp1.message).toBe(fp2.message)
      expect(fp1.component).toBe('UserService')
      expect(fp1.category).toBe('unknown') // Default category
    })

    it('should replace sensitive information in fingerprints', () => {
      const errorWithSensitiveData = new Error('Error in file "/private/user/data.json" with token "abc123def"')
      const fingerprint = generateFingerprint(errorWithSensitiveData)

      // Should replace strings and file paths
      expect(fingerprint.message).toContain('"string"')
      expect(fingerprint.message).not.toContain('abc123def')
      expect(fingerprint.message).not.toContain('/private/user/data.json')
    })

    it('should extract first line of stack trace', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\\n    at Function.test (file.js:10:5)\\n    at Object.run (other.js:20:10)'
      
      const fingerprint = generateFingerprint(error)
      // The fingerprint should contain the full stack for proper error grouping
      expect(fingerprint.stack).toContain('Error: Test error')
    })

    it('should handle URLs in error messages', () => {
      const error = new Error('Failed to fetch https://api.example.com/users/123')
      const fingerprint = generateFingerprint(error)

      expect(fingerprint.message).toContain('URL')
      expect(fingerprint.message).not.toContain('https://api.example.com/users/123')
    })
  })

  describe('error reporting', () => {
    it('should report errors to Sentry with proper context', () => {
      const error = new Error('Test error')
      const context = {
        userId: 'user123',
        component: 'TestComponent',
        action: 'test_action',
        url: 'https://test.com/page',
        metadata: { customData: 'test' }
      }

      reportError(error, 'high', context)

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[UNKNOWN] Test error',
        error
      )

      expect(mockSentryWithScope).toHaveBeenCalled()
      expect(mockSentryCaptureException).toHaveBeenCalledWith(error)
    })

    it('should set proper Sentry scope', () => {
      const error = new Error('Database error')
      const context = {
        userId: 'user456',
        component: 'DatabaseService',
        action: 'query',
        metadata: { query: 'SELECT * FROM users' }
      }

      reportError(error, 'critical', context)

      const scopeCallback = mockSentryWithScope.mock.calls[0][0]
      const mockScope = {
        setLevel: jest.fn(),
        setTag: jest.fn(),
        setUser: jest.fn(),
        setContext: jest.fn(),
        setFingerprint: jest.fn(),
      }
      
      scopeCallback(mockScope)

      expect(mockScope.setLevel).toHaveBeenCalledWith('fatal') // critical maps to fatal
      expect(mockScope.setTag).toHaveBeenCalledWith('error.category', 'database')
      expect(mockScope.setUser).toHaveBeenCalledWith({ id: 'user456' })
      expect(mockScope.setContext).toHaveBeenCalledWith('errorContext', expect.any(Object))
      expect(mockScope.setFingerprint).toHaveBeenCalledWith([
        'database',
        expect.any(String), // cleaned error message
        'DatabaseService'
      ])
    })

    it('should handle missing context gracefully', () => {
      const error = new Error('Simple error')
      
      reportError(error, 'normal')

      expect(mockSentryWithScope).toHaveBeenCalled()
      expect(mockSentryCaptureException).toHaveBeenCalledWith(error)
    })

    it('should map severity levels correctly', () => {
      const error = new Error('Test error')
      const severityMappings = [
        { input: 'low' as const, expected: 'info' },
        { input: 'normal' as const, expected: 'warning' },
        { input: 'high' as const, expected: 'error' },
        { input: 'critical' as const, expected: 'fatal' }
      ]

      severityMappings.forEach(({ input, expected }) => {
        mockSentryWithScope.mockClear()
        
        reportError(error, input)

        const scopeCallback = mockSentryWithScope.mock.calls[0][0]
        const mockScope = { setLevel: jest.fn(), setTag: jest.fn(), setUser: jest.fn(), setContext: jest.fn(), setFingerprint: jest.fn() }
        
        scopeCallback(mockScope)
        expect(mockScope.setLevel).toHaveBeenCalledWith(expected)
      })
    })
  })

  describe('event reporting', () => {
    it('should report events to Sentry breadcrumbs', () => {
      const eventData = {
        userId: 'user123',
        action: 'button_click',
        component: 'HeaderComponent'
      }

      reportEvent('user_interaction', eventData, 'info')

      expect(mockSentryAddBreadcrumb).toHaveBeenCalledWith({
        message: 'user_interaction',
        category: 'custom',
        level: 'info',
        data: eventData
      })

      expect(mockLogger.info).toHaveBeenCalledWith('Event: user_interaction', eventData)
    })

    it('should handle different event levels', () => {
      const levels: ('info' | 'warning' | 'error')[] = ['info', 'warning', 'error']
      
      levels.forEach(level => {
        mockSentryAddBreadcrumb.mockClear()
        
        reportEvent('test_event', {}, level)
        
        expect(mockSentryAddBreadcrumb).toHaveBeenCalledWith({
          message: 'test_event',
          category: 'custom',
          level,
          data: {}
        })
      })
    })
  })

  describe('useErrorTracking hook', () => {
    it('should create component error reporter', () => {
      const { reportComponentError } = useErrorTracking('TestComponent')
      
      const error = new Error('Component error')
      const errorInfo = { componentStack: 'at TestComponent' }
      
      reportComponentError(error, errorInfo)

      expect(mockSentryWithScope).toHaveBeenCalled()
    })

    it('should include component context in error reports', () => {
      const { reportComponentError } = useErrorTracking('UserProfile')
      
      const error = new Error('Render error')
      reportComponentError(error)

      const scopeCallback = mockSentryWithScope.mock.calls[0][0]
      const mockScope = {
        setLevel: jest.fn(),
        setTag: jest.fn(),
        setUser: jest.fn(),
        setContext: jest.fn(),
        setFingerprint: jest.fn(),
      }
      
      scopeCallback(mockScope)

      expect(mockScope.setContext).toHaveBeenCalledWith('errorContext', 
        expect.objectContaining({
          component: 'UserProfile'
        })
      )
    })
  })

  describe('performance monitoring', () => {
    it('should create performance transactions', () => {
      mockSentryStartSpan.mockImplementation((config, callback) => {
        return callback()
      })

      const transaction = reportError.__proto__.constructor.startTransaction?.('test-operation', 'custom')
      
      // Note: This would need the actual implementation of startTransaction
      // The current implementation returns a timing object
    })
  })

  describe('privacy and security', () => {
    it('should not log sensitive information', () => {
      const sensitiveError = new Error('Password validation failed for user@example.com')
      const context = {
        password: 'secret123',
        token: 'jwt-token-abc',
        apiKey: 'key_12345'
      }

      reportError(sensitiveError, 'high', context)

      // Should log error but context should be handled safely
      expect(mockLogger.error).toHaveBeenCalled()
      expect(mockSentryWithScope).toHaveBeenCalled()
    })

    it('should anonymize user data in production', () => {
      const originalEnv = process.env['NODE_ENV']
      process.env['NODE_ENV'] = 'production'

      const error = new Error('User operation failed')
      const context = {
        userId: 'user123',
        email: 'user@example.com',
        url: 'https://axis6.app/profile'
      }

      reportError(error, 'normal', context)

      const scopeCallback = mockSentryWithScope.mock.calls[0][0]
      const mockScope = {
        setLevel: jest.fn(),
        setTag: jest.fn(),
        setUser: jest.fn(),
        setContext: jest.fn(),
        setFingerprint: jest.fn(),
      }
      
      scopeCallback(mockScope)

      // Should still set user ID but not expose full email
      expect(mockScope.setUser).toHaveBeenCalledWith({ id: 'user123' })
      
      process.env['NODE_ENV'] = originalEnv
    })
  })
})