/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/email/test/route'

// Mock Supabase
const mockSupabaseAuth = {
  getUser: jest.fn()
}

const mockSupabaseFrom = jest.fn().mockReturnThis()
const mockSupabaseSelect = jest.fn().mockReturnThis()
const mockSupabaseEq = jest.fn().mockReturnThis()
const mockSupabaseSingle = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: mockSupabaseAuth,
    from: mockSupabaseFrom,
  }))
}))

// Mock enhanced rate limiting
jest.mock('@/lib/middleware/enhanced-rate-limit', () => ({
  withEnhancedRateLimit: jest.fn().mockResolvedValue({
    response: null,
    headers: {
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '9'
    }
  })
}))

// Mock email service
jest.mock('@/lib/email/service', () => ({
  emailService: {
    sendTestEmail: jest.fn(),
    sendWelcome: jest.fn()
  },
  isEmailConfigured: jest.fn(() => true),
  getEmailConfig: jest.fn(() => ({
    configured: true,
    hasApiKey: true,
    fromEmail: 'test@axis6.app',
    environment: 'test'
  }))
}))

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}))

describe('/api/email/test Integration Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }
  
  let mockEmailService: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Get the mocked email service
    const emailModule = require('@/lib/email/service')
    mockEmailService = emailModule.emailService
    
    // Default: authenticated user
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    // Setup Supabase query chain
    mockSupabaseFrom.mockReturnValue({
      select: mockSupabaseSelect.mockReturnValue({
        eq: mockSupabaseEq.mockReturnValue({
          single: mockSupabaseSingle
        })
      })
    })
  })

  describe('GET /api/email/test', () => {
    it('should return email configuration for authenticated users', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/test')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        timestamp: expect.any(String),
        user: {
          id: 'user-123',
          email: 'test@example.com'
        },
        configuration: {
          configured: true,
          hasApiKey: true,
          fromEmail: 'test@axis6.app',
          environment: 'test'
        },
        availableTypes: ['welcome', 'password-reset', 'weekly-stats', 'test']
      })
    })

    it('should require authentication', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const request = new NextRequest('http://localhost:3000/api/email/test')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Authentication required')
    })

    it('should apply rate limiting', async () => {
      const { withEnhancedRateLimit } = require('@/lib/middleware/enhanced-rate-limit')
      
      const request = new NextRequest('http://localhost:3000/api/email/test')
      await GET(request)

      expect(withEnhancedRateLimit).toHaveBeenCalledWith(
        request,
        'sensitive'
      )
    })

    it('should handle rate limit blocking', async () => {
      const { withEnhancedRateLimit } = require('@/lib/middleware/enhanced-rate-limit')
      
      const mockRateLimitResponse = new Response('Rate limited', { status: 429 })
      withEnhancedRateLimit.mockResolvedValueOnce({
        response: mockRateLimitResponse,
        headers: {}
      })

      const request = new NextRequest('http://localhost:3000/api/email/test')
      const response = await GET(request)

      expect(response.status).toBe(429)
    })

    it('should include rate limit headers in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/test')
      const response = await GET(request)

      expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('9')
    })
  })

  describe('POST /api/email/test', () => {
    it('should send test email successfully', async () => {
      mockEmailService.sendTestEmail.mockResolvedValue({
        success: true,
        id: 'email-123'
      })

      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toMatchObject({
        success: true,
        emailId: 'email-123',
        type: 'test',
        recipient: 'test@***'
      })

      expect(mockEmailService.sendTestEmail).toHaveBeenCalledWith('test@example.com')
    })

    it('should send welcome email with user profile', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: { 
          full_name: 'Test User',
          first_name: 'Test' 
        }
      })

      mockEmailService.sendWelcome.mockResolvedValue({
        success: true,
        id: 'email-456'
      })

      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ type: 'welcome' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(mockEmailService.sendWelcome).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com'
      })
    })

    it('should use email prefix as name fallback', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null // No profile found
      })

      mockEmailService.sendWelcome.mockResolvedValue({
        success: true,
        id: 'email-789'
      })

      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ type: 'welcome' })
      })

      await POST(request)

      expect(mockEmailService.sendWelcome).toHaveBeenCalledWith({
        name: 'test', // Email prefix as fallback
        email: 'test@example.com'
      })
    })

    it('should allow custom recipient email', async () => {
      mockEmailService.sendTestEmail.mockResolvedValue({
        success: true,
        id: 'email-custom'
      })

      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'test',
          to: 'custom@example.com'
        })
      })

      const response = await POST(request)
      
      expect(mockEmailService.sendTestEmail).toHaveBeenCalledWith('custom@example.com')
      
      const data = await response.json()
      expect(data.recipient).toBe('custom@***')
    })

    it('should handle unsupported email types', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ type: 'unsupported-type' })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Unsupported email type')
    })

    it('should handle email service failures', async () => {
      mockEmailService.sendTestEmail.mockResolvedValue({
        success: false,
        error: 'SMTP connection failed'
      })

      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error).toBe('SMTP connection failed')
    })

    it('should require recipient email', async () => {
      // User without email
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: null } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('No recipient email specified')
    })

    it('should mask email addresses in response', async () => {
      mockEmailService.sendTestEmail.mockResolvedValue({
        success: true,
        id: 'email-mask-test'
      })

      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ 
          type: 'test',
          to: 'sensitive.email@private-domain.com'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.recipient).toBe('sensitive.email@***')
      expect(data.recipient).not.toContain('private-domain.com')
    })

    it('should log email sending attempts', async () => {
      const { logger } = require('@/lib/utils/logger')
      
      mockEmailService.sendTestEmail.mockResolvedValue({
        success: true,
        id: 'email-log-test'
      })

      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ type: 'test' })
      })

      await POST(request)

      expect(logger.info).toHaveBeenCalledWith(
        'Test email sent',
        expect.objectContaining({
          userId: 'user-123',
          type: 'test',
          success: true
        })
      )
    })
  })

  describe('error handling', () => {
    it('should handle malformed request bodies', async () => {
      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: 'invalid-json'
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should handle Supabase connection errors', async () => {
      mockSupabaseAuth.getUser.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/email/test')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })

    it('should handle profile query failures gracefully', async () => {
      mockSupabaseSingle.mockRejectedValue(new Error('Profile query failed'))
      
      mockEmailService.sendWelcome.mockResolvedValue({
        success: true,
        id: 'email-profile-error'
      })

      const request = new NextRequest('http://localhost:3000/api/email/test', {
        method: 'POST',
        body: JSON.stringify({ type: 'welcome' })
      })

      const response = await POST(request)

      expect(response.status).toBe(200) // Should still work with fallback name
      expect(mockEmailService.sendWelcome).toHaveBeenCalledWith({
        name: 'test', // Fallback to email prefix
        email: 'test@example.com'
      })
    })
  })
})