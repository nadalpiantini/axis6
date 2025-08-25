#!/usr/bin/env node

/**
 * Production Health Check Script
 * Comprehensive system health validation for production deployment
 */

const https = require('https')
const http = require('http')
const { performance } = require('perf_hooks')

class ProductionHealthChecker {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axis6.app'
    this.results = []
    this.errors = []
    this.warnings = []
  }

  async runAll() {
    console.log('🏥 AXIS6 Production Health Check')
    console.log('================================\n')

    const checks = [
      { name: 'Website Accessibility', fn: () => this.checkWebsiteAccessibility() },
      { name: 'API Health Check', fn: () => this.checkAPIHealth() },
      { name: 'Database Connectivity', fn: () => this.checkDatabaseHealth() },
      { name: 'SSL Certificate', fn: () => this.checkSSLCertificate() },
      { name: 'Performance Metrics', fn: () => this.checkPerformanceMetrics() },
      { name: 'Security Headers', fn: () => this.checkSecurityHeaders() },
      { name: 'CDN & Caching', fn: () => this.checkCDNAndCaching() },
      { name: 'Circuit Breakers', fn: () => this.checkCircuitBreakers() },
      { name: 'Monitoring Systems', fn: () => this.checkMonitoringSystems() },
      { name: 'Error Rates', fn: () => this.checkErrorRates() }
    ]

    console.log('Running health checks...\n')

    for (const check of checks) {
      const startTime = performance.now()
      
      try {
        console.log(`⏳ ${check.name}...`)
        await check.fn()
        
        const duration = Math.round(performance.now() - startTime)
        this.results.push({
          name: check.name,
          status: 'PASS',
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        })
        
        console.log(`✅ ${check.name} - PASS (${duration}ms)`)
        
      } catch (error) {
        const duration = Math.round(performance.now() - startTime)
        
        this.errors.push({
          check: check.name,
          error: error.message,
          duration: `${duration}ms`
        })
        
        console.log(`❌ ${check.name} - FAIL (${duration}ms)`)
        console.log(`   Error: ${error.message}`)
      }
      
      console.log('')
    }

    await this.generateReport()
    this.displaySummary()
  }

  async checkWebsiteAccessibility() {
    const response = await this.makeRequest('/')
    
    if (response.statusCode !== 200) {
      throw new Error(`Website returned status ${response.statusCode}`)
    }

    if (!response.body.includes('AXIS6')) {
      throw new Error('Website content appears corrupted')
    }

    // Check critical pages
    const criticalPages = ['/dashboard', '/auth/login', '/auth/register']
    
    for (const page of criticalPages) {
      try {
        const pageResponse = await this.makeRequest(page)
        if (pageResponse.statusCode >= 400) {
          this.warnings.push(`Page ${page} returned ${pageResponse.statusCode}`)
        }
      } catch (error) {
        this.warnings.push(`Failed to check page ${page}: ${error.message}`)
      }
    }
  }

  async checkAPIHealth() {
    try {
      const response = await this.makeRequest('/api/health?detailed=true')
      
      if (response.statusCode !== 200) {
        throw new Error(`API health endpoint returned ${response.statusCode}`)
      }

      const healthData = JSON.parse(response.body)
      
      if (healthData.overall !== 'healthy') {
        if (healthData.overall === 'degraded') {
          this.warnings.push(`System health is degraded: ${JSON.stringify(healthData.checks)}`)
        } else {
          throw new Error(`System health is ${healthData.overall}`)
        }
      }

      // Check response time
      if (healthData.systemInfo && healthData.systemInfo.uptime < 60) {
        this.warnings.push('System recently restarted (uptime < 1 minute)')
      }

    } catch (error) {
      throw new Error(`API health check failed: ${error.message}`)
    }
  }

  async checkDatabaseHealth() {
    try {
      const response = await this.makeRequest('/api/health?service=database')
      
      if (response.statusCode !== 200) {
        throw new Error(`Database health check returned ${response.statusCode}`)
      }

      const dbHealth = JSON.parse(response.body)
      
      if (dbHealth.status !== 'healthy') {
        throw new Error(`Database status: ${dbHealth.status}`)
      }

      if (dbHealth.responseTime > 1000) {
        this.warnings.push(`Database response time is high: ${dbHealth.responseTime}ms`)
      }

    } catch (error) {
      throw new Error(`Database health check failed: ${error.message}`)
    }
  }

  async checkSSLCertificate() {
    if (!this.baseUrl.startsWith('https://')) {
      this.warnings.push('Not using HTTPS in production')
      return
    }

    return new Promise((resolve, reject) => {
      const hostname = new URL(this.baseUrl).hostname
      const options = {
        hostname,
        port: 443,
        method: 'HEAD',
        path: '/'
      }

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate()
        
        if (!cert || !cert.valid_to) {
          return reject(new Error('No SSL certificate found'))
        }

        const expiryDate = new Date(cert.valid_to)
        const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiry < 0) {
          return reject(new Error('SSL certificate has expired'))
        }

        if (daysUntilExpiry < 30) {
          this.warnings.push(`SSL certificate expires in ${daysUntilExpiry} days`)
        }

        resolve()
      })

      req.on('error', (error) => {
        reject(new Error(`SSL check failed: ${error.message}`))
      })

      req.setTimeout(10000, () => {
        req.destroy()
        reject(new Error('SSL check timed out'))
      })

      req.end()
    })
  }

  async checkPerformanceMetrics() {
    const startTime = performance.now()
    const response = await this.makeRequest('/')
    const loadTime = performance.now() - startTime

    if (loadTime > 3000) {
      throw new Error(`Page load time too slow: ${Math.round(loadTime)}ms`)
    }

    if (loadTime > 1000) {
      this.warnings.push(`Page load time is elevated: ${Math.round(loadTime)}ms`)
    }

    // Check if response is gzipped
    if (!response.headers['content-encoding']) {
      this.warnings.push('Response not compressed (no content-encoding header)')
    }

    // Check Content-Type
    const contentType = response.headers['content-type']
    if (!contentType || !contentType.includes('text/html')) {
      this.warnings.push(`Unexpected content-type: ${contentType}`)
    }
  }

  async checkSecurityHeaders() {
    const response = await this.makeRequest('/')
    const headers = response.headers
    
    const requiredHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '1; mode=block',
      'strict-transport-security': 'max-age=',
      'referrer-policy': true,
      'content-security-policy': true
    }

    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const headerValue = headers[header.toLowerCase()]
      
      if (!headerValue) {
        this.warnings.push(`Missing security header: ${header}`)
      } else if (expectedValue !== true && !headerValue.includes(expectedValue)) {
        this.warnings.push(`Invalid ${header}: ${headerValue}`)
      }
    }
  }

  async checkCDNAndCaching() {
    const response = await this.makeRequest('/favicon.ico')
    
    // Check cache headers
    const cacheControl = response.headers['cache-control']
    if (!cacheControl) {
      this.warnings.push('No cache-control header on static assets')
    } else if (!cacheControl.includes('max-age')) {
      this.warnings.push('Cache-control missing max-age')
    }

    // Check CDN headers (Vercel/Cloudflare)
    const server = response.headers['server']
    const via = response.headers['via']
    const cfRay = response.headers['cf-ray']
    
    if (!server && !via && !cfRay) {
      this.warnings.push('No CDN headers detected')
    }
  }

  async checkCircuitBreakers() {
    try {
      const response = await this.makeRequest('/api/health?detailed=true')
      const healthData = JSON.parse(response.body)
      
      if (healthData.circuitBreakerStatus) {
        const openCircuits = Object.entries(healthData.circuitBreakerStatus)
          .filter(([service, status]) => status.state === 'OPEN')
        
        if (openCircuits.length > 0) {
          throw new Error(`Circuit breakers open: ${openCircuits.map(([s]) => s).join(', ')}`)
        }

        const degradedCircuits = Object.entries(healthData.circuitBreakerStatus)
          .filter(([service, status]) => status.state === 'HALF_OPEN')
        
        if (degradedCircuits.length > 0) {
          this.warnings.push(`Circuit breakers in half-open state: ${degradedCircuits.map(([s]) => s).join(', ')}`)
        }
      }
    } catch (error) {
      this.warnings.push(`Circuit breaker check failed: ${error.message}`)
    }
  }

  async checkMonitoringSystems() {
    try {
      // Check if monitoring endpoint is accessible
      const response = await this.makeRequest('/api/monitoring?timeRange=1h')
      
      if (response.statusCode === 403) {
        this.warnings.push('Monitoring endpoint requires admin access (expected)')
        return
      }
      
      if (response.statusCode !== 200 && response.statusCode !== 401) {
        throw new Error(`Monitoring endpoint returned ${response.statusCode}`)
      }

    } catch (error) {
      this.warnings.push(`Monitoring system check failed: ${error.message}`)
    }
  }

  async checkErrorRates() {
    try {
      const response = await this.makeRequest('/api/analytics?type=performance')
      
      if (response.statusCode === 401) {
        this.warnings.push('Analytics endpoint requires authentication (expected)')
        return
      }
      
      if (response.statusCode !== 200) {
        throw new Error(`Analytics endpoint returned ${response.statusCode}`)
      }

      const analyticsData = JSON.parse(response.body)
      
      if (analyticsData.errorRate > 5) {
        throw new Error(`Error rate too high: ${analyticsData.errorRate}%`)
      }

      if (analyticsData.errorRate > 1) {
        this.warnings.push(`Elevated error rate: ${analyticsData.errorRate}%`)
      }

    } catch (error) {
      this.warnings.push(`Error rate check failed: ${error.message}`)
    }
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl)
      const isHttps = url.protocol === 'https:'
      const requestModule = isHttps ? https : http
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'AXIS6-Health-Checker/1.0',
          ...options.headers
        }
      }

      const req = requestModule.request(requestOptions, (res) => {
        let body = ''
        
        res.on('data', (chunk) => {
          body += chunk
        })
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body
          })
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.setTimeout(15000, () => {
        req.destroy()
        reject(new Error(`Request to ${path} timed out`))
      })

      if (options.body) {
        req.write(options.body)
      }
      
      req.end()
    })
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        totalChecks: this.results.length + this.errors.length,
        passed: this.results.length,
        failed: this.errors.length,
        warnings: this.warnings.length
      },
      results: this.results,
      errors: this.errors,
      warnings: this.warnings,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform
      }
    }

    // Write report to file
    const fs = require('fs').promises
    const reportPath = 'health-check-report.json'
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
      console.log(`📄 Health check report saved to: ${reportPath}`)
    } catch (error) {
      console.warn(`Failed to save report: ${error.message}`)
    }
  }

  displaySummary() {
    console.log('\n🏥 HEALTH CHECK SUMMARY')
    console.log('======================')
    
    const total = this.results.length + this.errors.length
    const passed = this.results.length
    const failed = this.errors.length
    const warnings = this.warnings.length

    console.log(`Total Checks: ${total}`)
    console.log(`Passed: ${passed} ✅`)
    console.log(`Failed: ${failed} ❌`)
    console.log(`Warnings: ${warnings} ⚠️`)
    console.log('')

    if (failed > 0) {
      console.log('CRITICAL ISSUES:')
      this.errors.forEach(error => {
        console.log(`❌ ${error.check}: ${error.error}`)
      })
      console.log('')
    }

    if (warnings > 0) {
      console.log('WARNINGS:')
      this.warnings.forEach(warning => {
        console.log(`⚠️  ${warning}`)
      })
      console.log('')
    }

    const healthScore = Math.round(((passed / total) * 100))
    let status = 'HEALTHY'
    let emoji = '💚'

    if (failed > 0) {
      status = 'CRITICAL'
      emoji = '🔴'
    } else if (warnings > 2) {
      status = 'DEGRADED'
      emoji = '🟡'
    }

    console.log(`${emoji} SYSTEM STATUS: ${status} (${healthScore}% healthy)`)
    console.log(`Target URL: ${this.baseUrl}`)
    console.log('')

    if (failed > 0) {
      console.log('❌ Production deployment NOT recommended')
      process.exit(1)
    } else if (warnings > 2) {
      console.log('⚠️  Production deployment possible but issues should be addressed')
      process.exit(0)
    } else {
      console.log('✅ Production deployment ready')
      process.exit(0)
    }
  }
}

// Run health check if called directly
if (require.main === module) {
  const checker = new ProductionHealthChecker()
  checker.runAll().catch(error => {
    console.error('Health check failed:', error)
    process.exit(1)
  })
}

module.exports = ProductionHealthChecker