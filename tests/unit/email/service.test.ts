/**
 * @jest-environment node
 */

import { emailService, isEmailConfigured, getEmailConfig } from '@/lib/email/service'

// Mock Resend
const mockResendSend = jest.fn()
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockResendSend
    }
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

describe('Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    delete process.env['RESEND_API_KEY']
    delete process.env['RESEND_FROM_EMAIL']
  })

  describe('configuration validation', () => {
    it('should detect when email is not configured', () => {
      expect(isEmailConfigured()).toBe(false)
      
      const config = getEmailConfig()
      expect(config.configured).toBe(false)
      expect(config.apiKey).toBe(false)
    })

    it('should detect when email is properly configured', () => {
      process.env['RESEND_API_KEY'] = 'test-api-key'
      process.env['RESEND_FROM_EMAIL'] = 'test@axis6.app'

      expect(isEmailConfigured()).toBe(true)
      
      const config = getEmailConfig()
      expect(config.configured).toBe(true)
      expect(config.apiKey).toBe(true)
      expect(config.fromEmail).toBe('test@axis6.app')
    })

    it('should use default from email when not configured', () => {
      const config = getEmailConfig()
      expect(config.fromEmail).toBe('noreply@axis6.app')
    })
  })

  describe('development mode behavior', () => {
    beforeEach(() => {
      // Ensure no API key is set for dev mode tests
      delete process.env['RESEND_API_KEY']
    })

    it('should handle welcome email in development mode', async () => {
      const { logger } = require('@/lib/utils/logger')
      
      const result = await emailService.sendWelcome({
        name: 'Test User',
        email: 'test@example.com'
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode')
      expect(logger.info).toHaveBeenCalledWith(
        'Email service in development mode',
        expect.objectContaining({
          type: 'welcome',
          to: 'test@example.com'
        })
      )
    })

    it('should handle password reset in development mode', async () => {
      const result = await emailService.sendPasswordReset({
        name: 'Test User',
        email: 'test@example.com',
        resetUrl: 'https://test.com/reset'
      })

      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode')
    })

    it('should handle test email in development mode', async () => {
      const result = await emailService.sendTestEmail('test@example.com')

      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode')
    })

    it('should handle weekly stats in development mode', async () => {
      const statsData = {
        name: 'Test User',
        email: 'test@example.com',
        weeklyStats: {
          totalCheckins: 15,
          completionRate: 75,
          currentStreaks: [
            { category: 'Physical', streak: 5, color: '#A6C26F' },
            { category: 'Mental', streak: 3, color: '#365D63' }
          ],
          bestCategory: 'Physical',
          weeklyProgress: 85
        }
      }

      const result = await emailService.sendWeeklyStats(statsData)
      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode')
    })

    it('should handle notification email in development mode', async () => {
      const notificationData = {
        name: 'Test User',
        email: 'test@example.com',
        type: 'streak-milestone' as const,
        title: '🔥 10 días consecutivos',
        message: '¡Increíble! Has mantenido tu racha durante 10 días.',
        actionText: 'Ver mi progreso',
        actionUrl: 'https://axis6.app/dashboard',
        data: {
          streak: 10,
          category: 'Physical'
        }
      }

      const result = await emailService.sendNotification(notificationData)
      expect(result.success).toBe(true)
      expect(result.id).toBe('dev-mode')
    })
  })

  describe('email configuration details', () => {
    it('should provide basic configuration properties', () => {
      const config = getEmailConfig()
      expect(config).toHaveProperty('configured')
      expect(config).toHaveProperty('apiKey')
      expect(config).toHaveProperty('fromEmail')
    })

    it('should indicate API key availability', () => {
      const config = getEmailConfig()
      expect(typeof config.apiKey).toBe('boolean')
    })
  })
})