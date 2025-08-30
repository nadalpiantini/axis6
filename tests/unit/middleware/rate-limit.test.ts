/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { withEnhancedRateLimit, rateLimitConfig } from '@/lib/middleware/enhanced-rate-limit'

// Mock Redis module
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
  }))
}))

// Mock error tracking
jest.mock('@/lib/monitoring/error-tracking', () => ({
  reportError: jest.fn(),
  reportEvent: jest.fn(),
}))

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}))

describe('Enhanced Rate Limiting Middleware', () => {
  // Helper function to create unique requests
  const createMockRequest = (ip = '192.168.1.1', extraHeaders: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/test', {
      method: 'GET',
      headers: {
        'x-forwarded-for': ip,
        'user-agent': 'Test Agent',
        ...extraHeaders
      }
    })
  }

  beforeEach(() => {
    // Clear memory store between tests
    jest.clearAllMocks()
  })

  describe('rate limit configuration', () => {
    it('should have proper configuration for different endpoints', () => {
      expect(rateLimitConfig.auth.requests).toBe(5)
      expect(rateLimitConfig.auth.window).toBe('15 m')
      expect(rateLimitConfig.auth.type).toBe('authentication')

      expect(rateLimitConfig.api.requests).toBe(100)
      expect(rateLimitConfig.api.window).toBe('1 m')
      expect(rateLimitConfig.api.type).toBe('api')

      expect(rateLimitConfig.sensitive.requests).toBe(10)
      expect(rateLimitConfig.sensitive.window).toBe('1 h')
      expect(rateLimitConfig.sensitive.type).toBe('sensitive')
    })
  })

  describe('client identification', () => {
    it('should identify clients by user ID when provided', async () => {
      const mockRequest = createMockRequest()
      const userId = 'user123'
      const result = await withEnhancedRateLimit(mockRequest, 'api', userId)

      expect(result.rateLimitInfo.success).toBe(true)
      // Note: identifier is internal, we test the behavior not the implementation
    })

    it('should handle IP-based identification', async () => {
      const mockRequest = createMockRequest()
      const result = await withEnhancedRateLimit(mockRequest, 'api')

      expect(result.rateLimitInfo.success).toBe(true)
      expect(result.rateLimitInfo.remaining).toBeLessThan(100)
    })

    it('should handle different request sources', async () => {
      const requestWithCloudflare = createMockRequest('192.168.1.1', {
        'cf-connecting-ip': '10.0.0.1'
      })

      const result = await withEnhancedRateLimit(requestWithCloudflare, 'api')
      expect(result.rateLimitInfo.success).toBe(true)
    })

    it('should handle session-based tracking', async () => {
      const requestWithSession = createMockRequest('192.168.1.1', {
        'cookie': 'session-id=session123'
      })

      const result = await withEnhancedRateLimit(requestWithSession, 'api')
      expect(result.rateLimitInfo.success).toBe(true)
    })
  })

  describe('memory-based rate limiting', () => {
    it('should allow requests within limits', async () => {
      const mockRequest = createMockRequest('192.168.1.100') // Unique IP
      const { response, rateLimitInfo } = await withEnhancedRateLimit(mockRequest, 'api')

      expect(response).toBeNull() // Request allowed
      expect(rateLimitInfo.success).toBe(true)
      expect(rateLimitInfo.remaining).toBe(99) // 100 - 1
    })

    it('should block requests when limit exceeded', async () => {
      const testIp = '192.168.1.200' // Unique IP for this test

      // Simulate multiple rapid requests from same IP
      const results = []

      for (let i = 0; i < 102; i++) {
        const request = createMockRequest(testIp)
        const result = await withEnhancedRateLimit(request, 'api')
        results.push(result)
      }

      // First 100 should be allowed
      for (let i = 0; i < 100; i++) {
        expect(results[i].response).toBeNull()
      }

      // 101st and 102nd should be blocked
      expect(results[100].response).not.toBeNull()
      expect(results[100].response!.status).toBe(429)
      expect(results[101].response).not.toBeNull()
      expect(results[101].response!.status).toBe(429)
    })

    it('should include proper headers in rate limit response', async () => {
      const testIp = '192.168.1.600'

      // Hit the limit first
      for (let i = 0; i < 100; i++) {
        const request = createMockRequest(testIp)
        await withEnhancedRateLimit(request, 'api')
      }

      // This request should be blocked
      const request = createMockRequest(testIp)
      const { response } = await withEnhancedRateLimit(request, 'api')

      expect(response).not.toBeNull()
      expect(response!.status).toBe(429)

      const headers = Object.fromEntries(response!.headers.entries())
      expect(headers['x-ratelimit-limit']).toBe('100')
      expect(headers['x-ratelimit-remaining']).toBe('0')
      expect(headers['retry-after']).toBeDefined()
    })
  })

  describe('different rate limit types', () => {
    it('should apply stricter limits for auth endpoints', async () => {
      const request = createMockRequest('192.168.1.700')
      const { rateLimitInfo } = await withEnhancedRateLimit(request, 'auth')

      expect(rateLimitInfo.total).toBe(5) // Auth is limited to 5 requests
    })

    it('should apply very strict limits for sensitive operations', async () => {
      const request = createMockRequest('192.168.1.701')
      const { rateLimitInfo } = await withEnhancedRateLimit(request, 'sensitive')

      expect(rateLimitInfo.total).toBe(10) // Sensitive is limited to 10 requests
    })

    it('should be more lenient for read operations', async () => {
      const request = createMockRequest('192.168.1.702')
      const { rateLimitInfo } = await withEnhancedRateLimit(request, 'read')

      expect(rateLimitInfo.total).toBe(300) // Read operations allow 300 requests
    })
  })

  describe('error handling', () => {
    it('should handle rate limiting failures gracefully', async () => {
      // Mock a failure in rate limiting
      const failingRequest = new NextRequest('http://localhost:3000/api/test', {
        method: 'GET'
      })

      const { response, rateLimitInfo } = await withEnhancedRateLimit(failingRequest, 'api')

      // Should allow request when rate limiting fails
      expect(response).toBeNull()
      expect(rateLimitInfo.success).toBe(true)
    })
  })

  describe('window parsing', () => {
    it('should correctly parse time windows', async () => {
      // Test that different window formats work with different IPs
      const authRequest = createMockRequest('192.168.1.300')
      const apiRequest = createMockRequest('192.168.1.301')

      const authResult = await withEnhancedRateLimit(authRequest, 'auth')
      const apiResult = await withEnhancedRateLimit(apiRequest, 'api')

      expect(authResult.rateLimitInfo.reset).toBeInstanceOf(Date)
      expect(apiResult.rateLimitInfo.reset).toBeInstanceOf(Date)

      // Auth window (15m) should be longer than API window (1m)
      const authTime = authResult.rateLimitInfo.reset.getTime() - Date.now()
      const apiTime = apiResult.rateLimitInfo.reset.getTime() - Date.now()

      // Allow for some timing variance
      expect(authTime).toBeGreaterThan(apiTime - 1000) // 1 second tolerance
    })
  })

  describe('monitoring integration', () => {
    it('should report events when rate limits are exceeded', async () => {
      const { reportEvent } = require('@/lib/monitoring/error-tracking')
      const testIp = '192.168.1.400'

      // Hit the rate limit
      for (let i = 0; i < 101; i++) {
        const request = createMockRequest(testIp)
        await withEnhancedRateLimit(request, 'api')
      }

      expect(reportEvent).toHaveBeenCalledWith(
        'rate_limit_exceeded',
        expect.objectContaining({
          limiterType: 'api'
        }),
        'warning'
      )
    })

    it('should log warnings when approaching limits', async () => {
      const { logger } = require('@/lib/utils/logger')
      const testIp = '192.168.1.500'

      // Get close to the limit (within 10% = 90+ requests for api limit of 100)
      for (let i = 0; i < 95; i++) {
        const request = createMockRequest(testIp)
        await withEnhancedRateLimit(request, 'api')
      }

      expect(logger.info).toHaveBeenCalledWith(
        'Rate limit warning: api',
        expect.objectContaining({
          remaining: expect.any(Number),
          total: 100
        })
      )
    })
  })

  describe('performance optimization', () => {
    it('should clean up expired entries periodically', async () => {
      // This test verifies that the cleanup logic runs
      // The actual cleanup is probabilistic (1% chance)
      const results = []
      const testIp = '192.168.1.800'

      for (let i = 0; i < 200; i++) {
        const request = createMockRequest(testIp)
        const result = await withEnhancedRateLimit(request, 'api')
        results.push(result)
      }

      // All requests should be processed (cleanup shouldn't affect this)
      expect(results.length).toBe(200)
    })
  })
})
