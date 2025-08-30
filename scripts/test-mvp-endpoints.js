#!/usr/bin/env node

/**
 * AXIS6 MVP API Endpoints Testing Script
 * Comprehensive validation of all API routes and functionality
 */

const fs = require('fs')
const path = require('path')

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_EMAIL = 'test@axis6.app'
const TEST_PASSWORD = 'TestPassword123!'

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(`🧪 ${title}`, 'bold')
  console.log('='.repeat(60))
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow'
  log(`${icon} ${name}`, color)
  if (details) log(`   ${details}`, 'blue')
}

class MVPTester {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
    this.authToken = null
    this.userId = null
  }

  async fetch(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`
    const defaultHeaders = {
      'Content-Type': 'application/json'
    }

    if (this.authToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.authToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    })

    const data = await response.json().catch(() => null)
    return { response, data }
  }

  recordTest(name, passed, details = '') {
    this.testResults.total++
    if (passed) {
      this.testResults.passed++
      logTest(name, 'pass', details)
    } else {
      this.testResults.failed++
      logTest(name, 'fail', details)
    }
  }

  recordWarning(name, details = '') {
    this.testResults.warnings++
    logTest(name, 'warn', details)
  }

  // Test 1: Basic API Health Checks
  async testHealthChecks() {
    logSection('API Health Checks')

    try {
      // Test if server is running
      const { response } = await fetch(BASE_URL)
      this.recordTest('Server is running', response.ok, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('Server is running', false, `Error: ${error.message}`)
      return false
    }

    // Test API routes exist
    const routes = [
      '/api/categories',
      '/api/checkins',
      '/api/streaks',
      '/api/analytics',
      '/api/email/config'
    ]

    for (const route of routes) {
      try {
        const { response } = await this.fetch(route)
        // 401 is expected for protected routes, 405 for unsupported methods
        const validStatuses = [200, 401, 405]
        const isValid = validStatuses.includes(response.status)
        this.recordTest(
          `Route ${route} exists`, 
          isValid, 
          `Status: ${response.status}`
        )
      } catch (error) {
        this.recordTest(`Route ${route} exists`, false, `Error: ${error.message}`)
      }
    }

    return true
  }

  // Test 2: Authentication Flow
  async testAuthentication() {
    logSection('Authentication System')

    // Test login page accessibility
    try {
      const { response } = await fetch(`${BASE_URL}/auth/login`)
      this.recordTest('Login page accessible', response.ok, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('Login page accessible', false, `Error: ${error.message}`)
    }

    // Test register page accessibility
    try {
      const { response } = await fetch(`${BASE_URL}/auth/register`)
      this.recordTest('Register page accessible', response.ok, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('Register page accessible', false, `Error: ${error.message}`)
    }

    // Test forgot password page
    try {
      const { response } = await fetch(`${BASE_URL}/auth/forgot`)
      this.recordTest('Forgot password page accessible', response.ok, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('Forgot password page accessible', false, `Error: ${error.message}`)
    }

    // Test protected route without auth
    try {
      const { response } = await this.fetch('/api/checkins')
      const isProtected = response.status === 401
      this.recordTest('Protected routes require auth', isProtected, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('Protected routes require auth', false, `Error: ${error.message}`)
    }

    return true
  }

  // Test 3: Categories API
  async testCategoriesAPI() {
    logSection('Categories API')

    try {
      const { response, data } = await this.fetch('/api/categories')
      
      if (response.status === 401) {
        this.recordWarning('Categories API requires authentication', 'Testing without auth')
        return
      }

      const hasCategories = response.ok && data?.categories && Array.isArray(data.categories)
      this.recordTest('Categories fetch successful', hasCategories, 
        hasCategories ? `Found ${data.categories.length} categories` : 'No categories found')

      if (hasCategories && data.categories.length >= 6) {
        const requiredCategories = ['Physical', 'Mental', 'Emotional', 'Social', 'Spiritual', 'Material']
        const categoryNames = data.categories.map(c => c.name?.en || c.slug)
        const hasAllRequired = requiredCategories.every(req => 
          categoryNames.some(name => name.toLowerCase().includes(req.toLowerCase()))
        )
        this.recordTest('All 6 core categories present', hasAllRequired, 
          `Categories: ${categoryNames.slice(0, 6).join(', ')}`)
      }
    } catch (error) {
      this.recordTest('Categories API functional', false, `Error: ${error.message}`)
    }
  }

  // Test 4: Check-ins API (requires auth - simulated)
  async testCheckinsAPI() {
    logSection('Check-ins API')

    // Test GET endpoint
    try {
      const { response, data } = await this.fetch('/api/checkins')
      const requiresAuth = response.status === 401
      this.recordTest('Check-ins API requires authentication', requiresAuth, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('Check-ins API accessible', false, `Error: ${error.message}`)
    }

    // Test POST endpoint structure
    try {
      const { response } = await this.fetch('/api/checkins', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: 'test-id',
          completed: true,
          mood: 7
        })
      })
      const requiresAuth = response.status === 401
      this.recordTest('Check-ins POST requires authentication', requiresAuth, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('Check-ins POST endpoint functional', false, `Error: ${error.message}`)
    }
  }

  // Test 5: Analytics API
  async testAnalyticsAPI() {
    logSection('Analytics API')

    try {
      const { response, data } = await this.fetch('/api/analytics')
      const requiresAuth = response.status === 401
      this.recordTest('Analytics API requires authentication', requiresAuth, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('Analytics API accessible', false, `Error: ${error.message}`)
    }

    // Test export functionality
    try {
      const { response } = await this.fetch('/api/analytics', {
        method: 'POST',
        body: JSON.stringify({
          format: 'json',
          includeAllData: false
        })
      })
      const requiresAuth = response.status === 401
      this.recordTest('Analytics export requires authentication', requiresAuth, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('Analytics export functional', false, `Error: ${error.message}`)
    }
  }

  // Test 6: Email Integration
  async testEmailIntegration() {
    logSection('Email Integration')

    // Test email configuration endpoint
    try {
      const { response, data } = await this.fetch('/api/email/config')
      const isConfigured = response.ok && data
      this.recordTest('Email configuration endpoint accessible', isConfigured, 
        isConfigured ? `From: ${data.fromEmail}` : 'Configuration not accessible')

      if (isConfigured) {
        this.recordTest('Email service configured', data.configured, 
          data.configured ? 'Resend API key present' : 'Missing API key (dev mode)')
      }
    } catch (error) {
      this.recordTest('Email configuration check', false, `Error: ${error.message}`)
    }

    // Test email sending (test email)
    try {
      const { response, data } = await this.fetch('/api/email', {
        method: 'POST',
        body: JSON.stringify({
          type: 'test',
          data: { to: 'test@example.com' },
          skipAuth: true
        })
      })

      const emailSent = response.ok && data?.success
      this.recordTest('Test email functionality', emailSent, 
        emailSent ? `Email ID: ${data.id}` : 'Email sending failed')
    } catch (error) {
      this.recordTest('Email sending functionality', false, `Error: ${error.message}`)
    }
  }

  // Test 7: Core Pages Accessibility
  async testCorePages() {
    logSection('Core Pages Accessibility')

    const pages = [
      { path: '/', name: 'Landing page' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/analytics', name: 'Analytics page' },
      { path: '/achievements', name: 'Achievements page' },
      { path: '/profile', name: 'Profile page' },
      { path: '/auth/reset-password', name: 'Password reset page' }
    ]

    for (const page of pages) {
      try {
        const { response } = await fetch(`${BASE_URL}${page.path}`)
        // 200 for public pages, 401/302 for protected pages is OK
        const isAccessible = [200, 302, 401].includes(response.status)
        this.recordTest(`${page.name} accessible`, isAccessible, `Status: ${response.status}`)
      } catch (error) {
        this.recordTest(`${page.name} accessible`, false, `Error: ${error.message}`)
      }
    }
  }

  // Test 8: Database Schema Validation
  async testDatabaseSchema() {
    logSection('Database Schema Validation')

    // This would require database access, so we'll simulate based on API responses
    try {
      const { response, data } = await this.fetch('/api/categories')
      
      if (response.ok && data?.categories) {
        const category = data.categories[0]
        const hasRequiredFields = category && 
          category.id && 
          category.name && 
          category.slug &&
          category.color
        
        this.recordTest('Category schema valid', hasRequiredFields, 
          hasRequiredFields ? 'All required fields present' : 'Missing required fields')
      }
    } catch (error) {
      this.recordTest('Database schema accessible', false, `Error: ${error.message}`)
    }
  }

  // Test 9: Performance Checks
  async testPerformance() {
    logSection('Performance Checks')

    const performanceTests = [
      { endpoint: '/', name: 'Landing page load time' },
      { endpoint: '/api/categories', name: 'Categories API response time' }
    ]

    for (const test of performanceTests) {
      try {
        const startTime = Date.now()
        const response = await fetch(`${BASE_URL}${test.endpoint}`)
        const endTime = Date.now()
        const duration = endTime - startTime

        const isFast = duration < 2000 // Under 2 seconds
        this.recordTest(test.name, isFast, `${duration}ms`)
        
        if (duration > 3000) {
          this.recordWarning(`${test.name} is slow`, `${duration}ms - consider optimization`)
        }
      } catch (error) {
        this.recordTest(test.name, false, `Error: ${error.message}`)
      }
    }
  }

  // Test 10: Error Handling
  async testErrorHandling() {
    logSection('Error Handling')

    // Test 404 handling
    try {
      const { response } = await fetch(`${BASE_URL}/nonexistent-page`)
      const handles404 = response.status === 404
      this.recordTest('404 errors handled', handles404, `Status: ${response.status}`)
    } catch (error) {
      this.recordTest('404 error handling', false, `Error: ${error.message}`)
    }

    // Test API error handling
    try {
      const { response, data } = await this.fetch('/api/checkins', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' })
      })
      
      const hasErrorStructure = data && (data.error || data.success === false)
      this.recordTest('API error responses structured', hasErrorStructure, 
        hasErrorStructure ? 'Error object present' : 'No error structure')
    } catch (error) {
      this.recordTest('API error handling', false, `Error: ${error.message}`)
    }
  }

  // Generate comprehensive report
  generateReport() {
    logSection('Test Results Summary')
    
    const { total, passed, failed, warnings } = this.testResults
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
    
    log(`📊 Total Tests: ${total}`, 'bold')
    log(`✅ Passed: ${passed}`, 'green')
    log(`❌ Failed: ${failed}`, 'red')
    log(`⚠️  Warnings: ${warnings}`, 'yellow')
    log(`📈 Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red')
    
    console.log('\n' + '='.repeat(60))
    
    if (passRate >= 90) {
      log('🎉 EXCELLENT! MVP is ready for production', 'green')
    } else if (passRate >= 80) {
      log('✅ GOOD! MVP is mostly ready with minor issues', 'yellow')
    } else if (passRate >= 60) {
      log('⚠️  FAIR! MVP needs some fixes before production', 'yellow')
    } else {
      log('❌ POOR! MVP needs significant work', 'red')
    }

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: this.testResults,
      passRate,
      status: passRate >= 80 ? 'READY' : 'NEEDS_WORK',
      recommendations: this.generateRecommendations()
    }

    const reportPath = path.join(__dirname, '../claudedocs/mvp-test-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
    log(`📄 Detailed report saved to: ${reportPath}`, 'blue')
  }

  generateRecommendations() {
    const { failed, warnings, passed, total } = this.testResults
    const recommendations = []

    if (failed > 0) {
      recommendations.push('Fix failing tests before production deployment')
    }

    if (warnings > 3) {
      recommendations.push('Address performance and configuration warnings')
    }

    if (passed / total < 0.8) {
      recommendations.push('Increase test coverage and fix critical issues')
    }

    if (recommendations.length === 0) {
      recommendations.push('MVP is ready for production deployment!')
    }

    return recommendations
  }

  // Main test runner
  async runAllTests() {
    log('🚀 Starting AXIS6 MVP Comprehensive Testing', 'bold')
    log(`Testing against: ${BASE_URL}`, 'blue')
    
    const testSuites = [
      this.testHealthChecks,
      this.testAuthentication,
      this.testCategoriesAPI,
      this.testCheckinsAPI,
      this.testAnalyticsAPI,
      this.testEmailIntegration,
      this.testCorePages,
      this.testDatabaseSchema,
      this.testPerformance,
      this.testErrorHandling
    ]

    for (const testSuite of testSuites) {
      try {
        await testSuite.call(this)
      } catch (error) {
        log(`Test suite failed: ${error.message}`, 'red')
        this.testResults.failed++
      }
      
      // Brief pause between test suites
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    this.generateReport()
  }
}

// CLI execution
if (require.main === module) {
  const tester = new MVPTester()
  tester.runAllTests().catch(error => {
    console.error('Testing failed:', error)
    process.exit(1)
  })
}

module.exports = MVPTester