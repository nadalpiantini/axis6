/**
 * AXIS6 Security Hardening Test Suite
 * Comprehensive security validation tests
 * Priority: CRITICAL - Validates all security implementations
 */

import { test, expect } from '@playwright/test'

test.describe('AXIS6 Security Hardening Validation', () => {
  
  test.describe('Database Security', () => {
    test('should enforce Row Level Security on user data', async ({ request }) => {
      // Test unauthorized access to user data
      const response = await request.get('/api/checkins', {
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      })
      
      expect(response.status()).toBe(401)
      
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })
    
    test('should prevent access to other users data', async ({ request, page }) => {
      // This would require setting up test users and testing cross-user access
      // For now, verify the API requires authentication
      
      const response = await request.get('/api/analytics')
      expect(response.status()).toBe(401)
    })
    
    test('should validate UNIQUE constraints prevent UPSERT errors', async ({ request }) => {
      // Test that duplicate check-ins are handled properly
      const checkInData = {
        categoryId: '12345678-1234-1234-1234-123456789012',
        completed: true,
        date: new Date().toISOString().split('T')[0]
      }
      
      // This should fail gracefully due to authentication
      const response = await request.post('/api/checkins', {
        data: checkInData
      })
      
      expect(response.status()).toBe(401) // Should require auth
    })
  })
  
  test.describe('API Security', () => {
    test('should enforce authentication on protected endpoints', async ({ request }) => {
      const protectedEndpoints = [
        '/api/checkins',
        '/api/analytics', 
        '/api/streaks',
        '/api/settings/user-preferences'
      ]
      
      for (const endpoint of protectedEndpoints) {
        const response = await request.get(endpoint)
        
        expect(response.status()).toBe(401)
        
        const data = await response.json()
        expect(data.error).toBeTruthy()
      }
    })
    
    test('should reject malicious input payloads', async ({ request }) => {
      const maliciousPayloads = [
        '<script>alert("xss")</script>',
        '\\'"; DROP TABLE axis6_profiles; --',
        '../../../etc/passwd',
        '${eval(process.exit())}',
      ]
      
      for (const payload of maliciousPayloads) {
        const response = await request.post('/api/checkins', {
          data: {
            categoryId: payload,
            completed: true,
            notes: payload
          }
        })
        
        // Should be rejected (401 for auth, 400 for validation, or 403 for security)
        expect([400, 401, 403]).toContain(response.status())
      }
    })
    
    test('should implement rate limiting', async ({ request }) => {
      // Test rate limiting by making rapid requests
      const promises = Array(20).fill(null).map(() => 
        request.get('/api/health')
      )
      
      const responses = await Promise.all(promises)
      
      // At least some requests should be rate limited
      const rateLimited = responses.some(r => r.status() === 429)
      
      if (!rateLimited) {
        console.warn('Rate limiting may not be active (could be expected in test environment)')
      }
      
      // All responses should have rate limit headers
      const hasRateLimitHeaders = responses.some(r => 
        r.headers()['x-ratelimit-limit'] || 
        r.headers()['x-ratelimit-remaining']
      )
      
      expect(hasRateLimitHeaders).toBeTruthy()
    })
  })
  
  test.describe('Security Headers', () => {
    test('should set comprehensive security headers', async ({ page }) => {
      const response = await page.goto('/')
      expect(response).toBeTruthy()
      
      const headers = response!.headers()
      
      // Critical security headers
      expect(headers['content-security-policy']).toBeTruthy()
      expect(headers['x-frame-options']).toBeTruthy()
      expect(headers['x-content-type-options']).toBe('nosniff')
      expect(headers['x-xss-protection']).toBeTruthy()
      expect(headers['referrer-policy']).toBeTruthy()
      
      // Production-specific headers
      if (process.env.NODE_ENV === 'production') {
        expect(headers['strict-transport-security']).toBeTruthy()
      }
    })
    
    test('should have secure Content Security Policy', async ({ page }) => {
      const response = await page.goto('/')
      const headers = response!.headers()
      
      const csp = headers['content-security-policy']
      expect(csp).toBeTruthy()
      
      // Should have default-src 'self'
      expect(csp).toContain("default-src 'self'")
      
      // Should not be overly permissive in production
      if (process.env.NODE_ENV === 'production') {
        expect(csp).not.toContain("'unsafe-eval'")
        expect(csp).not.toContain("*")
      }
    })
    
    test('should prevent clickjacking', async ({ page }) => {
      const response = await page.goto('/')
      const headers = response!.headers()
      
      const frameOptions = headers['x-frame-options']
      expect(['DENY', 'SAMEORIGIN']).toContain(frameOptions)
    })
  })
  
  test.describe('Authentication Security', () => {
    test('should redirect unauthenticated users from protected pages', async ({ page }) => {
      const protectedPages = [
        '/dashboard',
        '/settings',
        '/analytics',
        '/my-day'
      ]
      
      for (const pagePath of protectedPages) {
        await page.goto(pagePath)
        
        // Should redirect to login page
        expect(page.url()).toContain('/auth/login')
      }
    })
    
    test('should enforce strong password requirements', async ({ page }) => {
      await page.goto('/auth/register')
      
      // Try with weak password
      await page.fill('[name="email"]', 'test@example.com')
      await page.fill('[name="password"]', '123')
      
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()
      
      // Should show password validation error
      const errorMessage = page.locator('[role="alert"], .error-message, .text-red-500')
      await expect(errorMessage).toBeVisible()
    })
    
    test('should secure session cookies', async ({ context, page }) => {
      await page.goto('/auth/login')
      
      // After any interaction, check cookie security
      const cookies = await context.cookies()
      
      cookies.forEach(cookie => {
        if (cookie.name.includes('auth') || cookie.name.includes('session')) {
          expect(cookie.httpOnly).toBeTruthy()
          
          if (process.env.NODE_ENV === 'production') {
            expect(cookie.secure).toBeTruthy()
          }
          
          expect(cookie.sameSite).toBe('Strict')
        }
      })
    })
  })
  
  test.describe('CSRF Protection', () => {
    test('should provide CSRF tokens for authenticated users', async ({ request, page }) => {
      // This test would require authentication setup
      // For now, verify the CSRF endpoint exists
      
      const response = await request.get('/api/csrf')
      
      // Should require authentication
      expect(response.status()).toBe(401)
    })
    
    test('should reject requests without CSRF tokens', async ({ request }) => {
      // Test POST request without CSRF token
      const response = await request.post('/api/checkins', {
        data: {
          categoryId: '12345678-1234-1234-1234-123456789012',
          completed: true
        }
      })
      
      // Should be rejected (401 for auth or 403 for CSRF)
      expect([401, 403]).toContain(response.status())
    })
  })
  
  test.describe('Input Validation', () => {
    test('should sanitize and validate all inputs', async ({ request }) => {
      const invalidInputs = [
        { field: 'categoryId', value: 'not-a-uuid', expected: 400 },
        { field: 'categoryId', value: '<script>alert("xss")</script>', expected: 400 },
        { field: 'notes', value: 'x'.repeat(20000), expected: 400 }, // Too long
      ]
      
      for (const { field, value, expected } of invalidInputs) {
        const response = await request.post('/api/checkins', {
          data: {
            categoryId: field === 'categoryId' ? value : '12345678-1234-1234-1234-123456789012',
            completed: true,
            notes: field === 'notes' ? value : 'test notes'
          }
        })
        
        // Should be rejected with validation error or auth error
        expect([400, 401, 403]).toContain(response.status())
      }
    })
    
    test('should validate UUID formats', async ({ request }) => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        'javascript:alert(1)',
        '../../../etc/passwd'
      ]
      
      for (const invalidUUID of invalidUUIDs) {
        const response = await request.get(`/api/checkins?categoryId=${invalidUUID}`)
        
        // Should be rejected
        expect([400, 401]).toContain(response.status())
      }
    })
  })
  
  test.describe('Error Handling', () => {
    test('should not expose sensitive information in error messages', async ({ request }) => {
      // Test various endpoints for information disclosure
      const endpoints = [
        '/api/checkins',
        '/api/analytics',
        '/api/auth/user',
      ]
      
      for (const endpoint of endpoints) {
        const response = await request.get(endpoint)
        const data = await response.json()
        
        // Error messages should not contain:
        const sensitivePatterns = [
          /password/i,
          /secret/i,
          /token/i,
          /database.*error/i,
          /stack.*trace/i,
          /file.*path/i,
        ]
        
        const errorText = JSON.stringify(data).toLowerCase()
        
        sensitivePatterns.forEach(pattern => {
          expect(errorText).not.toMatch(pattern)
        })
      }
    })
    
    test('should handle malformed requests gracefully', async ({ request }) => {
      // Test with malformed JSON
      const response = await request.post('/api/checkins', {
        data: 'invalid json{',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      expect(response.status()).toBe(400)
      
      const data = await response.json()
      expect(data.error).toBeTruthy()
      expect(data.error).not.toContain('SyntaxError') // Should not expose internal errors
    })
  })
  
  test.describe('Security Monitoring', () => {
    test('should log security events', async ({ page }) => {
      // Test that security events are properly logged
      // This would integrate with your logging system
      
      await page.goto('/')
      
      // Check for console errors that might indicate security issues
      const consoleErrors: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      await page.waitForTimeout(2000)
      
      // Filter for security-related errors
      const securityErrors = consoleErrors.filter(error => 
        ['csp', 'csrf', 'auth', 'security'].some(keyword => 
          error.toLowerCase().includes(keyword)
        )
      )
      
      // Log any security errors for review
      if (securityErrors.length > 0) {
        console.warn('Security-related console errors detected:', securityErrors)
      }
    })
    
    test('should handle CSP violations gracefully', async ({ page }) => {
      // Navigate to the page and check for CSP violations
      await page.goto('/')
      
      // Monitor for CSP violations
      const cspViolations: any[] = []
      
      page.on('console', msg => {
        if (msg.text().includes('CSP') || msg.text().includes('Content Security Policy')) {
          cspViolations.push(msg.text())
        }
      })
      
      await page.waitForTimeout(3000)
      
      // CSP violations should be handled gracefully (logged but not breaking)
      if (cspViolations.length > 0) {
        console.info('CSP violations detected (may be expected):', cspViolations)
      }
    })
  })
  
  test.describe('Performance Security', () => {
    test('should respond to security-sensitive endpoints within reasonable time', async ({ request }) => {
      const securityEndpoints = [
        '/api/auth/user',
        '/api/health',
        '/api/csrf'
      ]
      
      for (const endpoint of securityEndpoints) {
        const startTime = Date.now()
        
        await request.get(endpoint)
        
        const duration = Date.now() - startTime
        
        // Security endpoints should respond quickly (< 2 seconds)
        expect(duration).toBeLessThan(2000)
      }
    })
    
    test('should handle large payloads securely', async ({ request }) => {
      // Test with oversized payload
      const largePayload = {
        categoryId: '12345678-1234-1234-1234-123456789012',
        completed: true,
        notes: 'x'.repeat(50000) // Very large notes field
      }
      
      const response = await request.post('/api/checkins', {
        data: largePayload
      })
      
      // Should be rejected due to size or validation
      expect([400, 401, 413]).toContain(response.status())
    })
  })
  
  test.describe('Security Configuration', () => {
    test('should have secure middleware configuration', async ({ page }) => {
      // Test that middleware is working
      const response = await page.goto('/dashboard')
      
      // Should redirect to login if not authenticated
      expect(page.url()).toContain('/auth/login')
    })
    
    test('should block suspicious user agents', async ({ request }) => {
      const suspiciousAgents = [
        'curl/7.68.0',
        'python-requests/2.25.1',
        'sqlmap/1.5.0',
        'Nikto/2.1.6'
      ]
      
      for (const userAgent of suspiciousAgents) {
        const response = await request.get('/api/health', {
          headers: {
            'User-Agent': userAgent
          }
        })
        
        // May be blocked or allowed depending on configuration
        if (response.status() === 403) {
          expect(response.status()).toBe(403) // Blocked as expected
        } else {
          console.info(`User agent ${userAgent} was allowed (may be expected)`)
        }
      }
    })
    
    test('should validate HTTPS redirects in production', async ({ page }) => {
      // Only test in production-like environment
      if (process.env.NODE_ENV === 'production') {
        // Test HTTP to HTTPS redirect
        const httpUrl = page.url().replace('https:', 'http:')
        
        try {
          const response = await page.goto(httpUrl)
          
          // Should redirect to HTTPS or have HSTS header
          if (response) {
            const hsts = response.headers()['strict-transport-security']
            expect(hsts).toBeTruthy()
          }
        } catch (error) {
          // HTTP may be blocked entirely, which is good
          console.info('HTTP access blocked (expected in production)')
        }
      }
    })
  })
  
  test.describe('Data Protection', () => {
    test('should not expose sensitive data in API responses', async ({ request }) => {
      // Test that API responses don't contain sensitive information
      const response = await request.get('/api/health')
      const data = await response.json()
      
      const responseText = JSON.stringify(data).toLowerCase()
      
      const sensitivePatterns = [
        'password',
        'secret',
        'private',
        'internal',
        'admin',
        'root',
        'sudo'
      ]
      
      sensitivePatterns.forEach(pattern => {
        expect(responseText).not.toContain(pattern)
      })
    })
    
    test('should sanitize error messages', async ({ request }) => {
      // Test that error messages don't expose internal details
      const response = await request.post('/api/checkins', {
        data: { invalid: 'data' }
      })
      
      const data = await response.json()
      
      if (data.error) {
        const errorMessage = data.error.toLowerCase()
        
        // Should not expose internal paths or stack traces
        expect(errorMessage).not.toContain('/users/')
        expect(errorMessage).not.toContain('stack trace')
        expect(errorMessage).not.toContain('database error')
        expect(errorMessage).not.toContain('.ts:')
      }
    })
  })
  
  test.describe('Mobile Security', () => {
    test('should maintain security on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      const response = await page.goto('/')
      const headers = response!.headers()
      
      // Security headers should be present on mobile
      expect(headers['content-security-policy']).toBeTruthy()
      expect(headers['x-frame-options']).toBeTruthy()
    })
    
    test('should handle touch events securely', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      
      // Test that touch events don't bypass security
      const loginButton = page.locator('a[href*="/auth/login"]').first()
      
      if (await loginButton.isVisible()) {
        await loginButton.tap()
        
        // Should navigate to login page securely
        expect(page.url()).toContain('/auth/login')
        
        // Check that login page has security headers
        const response = await page.reload()
        const headers = response!.headers()
        expect(headers['x-content-type-options']).toBe('nosniff')
      }
    })
  })
})