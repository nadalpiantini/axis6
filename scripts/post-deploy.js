#!/usr/bin/env node

/**
 * Post-Deployment Verification Script
 * Verifies deployment health and functionality
 */

const https = require('https')
const http = require('http')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function httpRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    
    const request = protocol.get(url, (response) => {
      let data = ''
      response.on('data', chunk => data += chunk)
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data,
          responseTime: Date.now() - startTime
        })
      })
    })
    
    const startTime = Date.now()
    
    request.on('error', reject)
    request.setTimeout(timeout, () => {
      request.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

async function checkEndpoint(url, expectedStatus = 200, description = '') {
  log(`\n🔍 Testing ${description || url}...`, colors.cyan)
  
  try {
    const response = await httpRequest(url)
    const success = response.statusCode === expectedStatus
    
    if (success) {
      log(`✅ ${url} → ${response.statusCode} (${response.responseTime}ms)`, colors.green)
    } else {
      log(`❌ ${url} → ${response.statusCode} (expected ${expectedStatus})`, colors.red)
    }
    
    return {
      url,
      success,
      statusCode: response.statusCode,
      responseTime: response.responseTime,
      headers: response.headers
    }
  } catch (error) {
    log(`❌ ${url} → ${error.message}`, colors.red)
    return {
      url,
      success: false,
      error: error.message
    }
  }
}

async function checkHealthEndpoints(baseUrl) {
  log('\n🏥 Health Checks', colors.bright)
  log('=' .repeat(50), colors.cyan)
  
  const endpoints = [
    { path: '/', description: 'Landing page' },
    { path: '/api/health', description: 'Health API' },
    { path: '/dashboard', description: 'Dashboard (redirects to login)', expectedStatus: 302 },
    { path: '/auth/login', description: 'Login page' },
    { path: '/auth/register', description: 'Register page' }
  ]
  
  const results = []
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(
      `${baseUrl}${endpoint.path}`,
      endpoint.expectedStatus || 200,
      endpoint.description
    )
    results.push(result)
  }
  
  return results
}

async function checkSecurityHeaders(baseUrl) {
  log('\n🛡️ Security Headers Check', colors.bright)
  log('=' .repeat(50), colors.cyan)
  
  try {
    const response = await httpRequest(baseUrl)
    const headers = response.headers
    
    const securityHeaders = [
      'content-security-policy',
      'x-content-type-options', 
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'strict-transport-security'
    ]
    
    let securityScore = 0
    
    securityHeaders.forEach(headerName => {
      if (headers[headerName]) {
        log(`✅ ${headerName}: Present`, colors.green)
        securityScore++
      } else {
        log(`❌ ${headerName}: Missing`, colors.red)
      }
    })
    
    const scorePercent = Math.round((securityScore / securityHeaders.length) * 100)
    log(`\n📊 Security Score: ${securityScore}/${securityHeaders.length} (${scorePercent}%)`, 
        scorePercent >= 80 ? colors.green : colors.yellow)
    
    return { score: securityScore, total: securityHeaders.length, percentage: scorePercent }
    
  } catch (error) {
    log(`❌ Security check failed: ${error.message}`, colors.red)
    return { score: 0, total: 6, percentage: 0, error: error.message }
  }
}

async function performanceBenchmark(baseUrl) {
  log('\n⚡ Performance Benchmark', colors.bright)
  log('=' .repeat(50), colors.cyan)
  
  const tests = [
    { path: '/', name: 'Landing Page' },
    { path: '/auth/login', name: 'Login Page' },
    { path: '/api/health', name: 'API Health' }
  ]
  
  const results = []
  
  for (const test of tests) {
    log(`\n🔍 Testing ${test.name}...`, colors.cyan)
    
    const times = []
    const runs = 3
    
    for (let i = 0; i < runs; i++) {
      try {
        const response = await httpRequest(`${baseUrl}${test.path}`)
        times.push(response.responseTime)
        log(`  Run ${i + 1}: ${response.responseTime}ms`, colors.blue)
      } catch (error) {
        log(`  Run ${i + 1}: Failed (${error.message})`, colors.red)
      }
    }
    
    if (times.length > 0) {
      const avg = Math.round(times.reduce((a, b) => a + b) / times.length)
      const min = Math.min(...times)
      const max = Math.max(...times)
      
      log(`📊 ${test.name}: avg=${avg}ms, min=${min}ms, max=${max}ms`, colors.green)
      
      // Performance evaluation
      let rating = 'EXCELLENT'
      let color = colors.green
      if (avg > 2000) {
        rating = 'SLOW'
        color = colors.red
      } else if (avg > 1000) {
        rating = 'MODERATE'
        color = colors.yellow
      } else if (avg > 500) {
        rating = 'GOOD'
        color = colors.blue
      }
      
      log(`🎯 Performance: ${rating}`, color)
      
      results.push({
        name: test.name,
        average: avg,
        min,
        max,
        rating
      })
    }
  }
  
  return results
}

function generateReport(healthResults, securityResults, performanceResults, deploymentInfo) {
  const report = {
    timestamp: new Date().toISOString(),
    deployment: deploymentInfo,
    health: {
      total: healthResults.length,
      passed: healthResults.filter(r => r.success).length,
      failed: healthResults.filter(r => !r.success).length,
      details: healthResults
    },
    security: securityResults,
    performance: {
      tests: performanceResults,
      averageResponseTime: performanceResults.length > 0 
        ? Math.round(performanceResults.reduce((sum, r) => sum + r.average, 0) / performanceResults.length)
        : 0
    },
    overallStatus: determineOverallStatus(healthResults, securityResults, performanceResults)
  }
  
  return report
}

function determineOverallStatus(healthResults, securityResults, performanceResults) {
  const healthPassed = healthResults.filter(r => r.success).length / healthResults.length
  const securityScore = securityResults.percentage / 100
  const avgResponseTime = performanceResults.length > 0
    ? performanceResults.reduce((sum, r) => sum + r.average, 0) / performanceResults.length
    : 0
  
  if (healthPassed >= 0.8 && securityScore >= 0.8 && avgResponseTime < 1000) {
    return 'EXCELLENT'
  } else if (healthPassed >= 0.7 && securityScore >= 0.6 && avgResponseTime < 2000) {
    return 'GOOD'
  } else if (healthPassed >= 0.5) {
    return 'DEGRADED'
  } else {
    return 'CRITICAL'
  }
}

async function main() {
  log('🔍 AXIS6 Post-Deployment Verification', colors.bright)
  log('=' .repeat(60), colors.cyan)
  
  const environments = [
    { name: 'Production', url: 'https://axis6.app' },
    { name: 'Development', url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6789' }
  ]
  
  for (const env of environments) {
    log(`\n🌍 Testing ${env.name} Environment: ${env.url}`, colors.bright)
    
    try {
      // Health checks
      const healthResults = await checkHealthEndpoints(env.url)
      
      // Security checks
      const securityResults = await checkSecurityHeaders(env.url)
      
      // Performance benchmarks
      const performanceResults = await performanceBenchmark(env.url)
      
      // Generate report
      const report = generateReport(healthResults, securityResults, performanceResults, {
        environment: env.name,
        url: env.url,
        timestamp: new Date().toISOString()
      })
      
      // Summary
      log(`\n📊 ${env.name} Summary`, colors.bright)
      log('=' .repeat(30), colors.cyan)
      log(`🏥 Health: ${report.health.passed}/${report.health.total} endpoints`, 
          report.health.passed === report.health.total ? colors.green : colors.yellow)
      log(`🛡️ Security: ${report.security.percentage}%`, 
          report.security.percentage >= 80 ? colors.green : colors.yellow)
      log(`⚡ Performance: ${report.performance.averageResponseTime}ms avg`, 
          report.performance.averageResponseTime < 1000 ? colors.green : colors.yellow)
      log(`🎯 Overall Status: ${report.overallStatus}`, 
          report.overallStatus === 'EXCELLENT' ? colors.green : 
          report.overallStatus === 'GOOD' ? colors.blue : colors.yellow)
      
    } catch (error) {
      log(`❌ ${env.name} verification failed: ${error.message}`, colors.red)
    }
  }
  
  log('\n✨ Post-deployment verification completed', colors.bright)
  log('\n📚 Next Steps:', colors.bright)
  log('• Monitor application metrics', colors.cyan)
  log('• Check error tracking dashboard', colors.cyan)
  log('• Verify user flows manually', colors.cyan)
  log('• Set up monitoring alerts', colors.cyan)
}

if (require.main === module) {
  main().catch(error => {
    log(`\n💥 Verification failed: ${error.message}`, colors.red)
    process.exit(1)
  })
}

module.exports = { checkEndpoint, checkHealthEndpoints, performanceBenchmark }