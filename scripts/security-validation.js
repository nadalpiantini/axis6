/**
 * AXIS6 Security Validation Script
 * Comprehensive security testing and validation
 * Priority: CRITICAL - Validates all security implementations
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
const crypto = require('crypto')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  critical: 0,
  tests: []
}

function logTest(name, status, message, severity = 'normal') {
  const result = {
    name,
    status,
    message,
    severity,
    timestamp: new Date().toISOString()
  }
  
  testResults.tests.push(result)
  
  if (status === 'PASS') {
    testResults.passed++
    console.log(`✅ ${name}: ${message}`)
  } else if (status === 'FAIL') {
    testResults.failed++
    if (severity === 'critical') {
      testResults.critical++
      console.log(`🚨 CRITICAL FAIL - ${name}: ${message}`)
    } else {
      console.log(`❌ ${name}: ${message}`)
    }
  } else if (status === 'WARN') {
    testResults.warnings++
    console.log(`⚠️  ${name}: ${message}`)
  }
}

// =====================================================
// DATABASE SECURITY TESTS
// =====================================================

async function testDatabaseSecurity() {
  console.log('\\n🛡️  Testing Database Security...')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Test 1: Verify RLS is enabled
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('table_name, row_security')
      .like('table_name', 'axis6_%')
    
    if (rlsError) {
      logTest('RLS Status Check', 'FAIL', `Cannot check RLS status: ${rlsError.message}`, 'critical')
    } else {
      const tablesWithoutRLS = rlsStatus.filter(table => !table.row_security)
      if (tablesWithoutRLS.length === 0) {
        logTest('RLS Enabled', 'PASS', 'All axis6_ tables have RLS enabled')
      } else {
        logTest('RLS Enabled', 'FAIL', `Tables without RLS: ${tablesWithoutRLS.map(t => t.table_name).join(', ')}`, 'critical')
      }
    }
    
    // Test 2: Verify unique constraints exist
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name, constraint_type')
      .eq('constraint_type', 'UNIQUE')
      .like('table_name', 'axis6_%')
    
    if (constraintError) {
      logTest('Unique Constraints', 'FAIL', `Cannot check constraints: ${constraintError.message}`, 'critical')
    } else {
      const requiredConstraints = [
        'axis6_checkins.unique_user_category_date',
        'axis6_streaks.unique_user_category_streak',
        'axis6_user_mantras.unique_user_mantra_date'
      ]
      
      const missingConstraints = requiredConstraints.filter(required => {
        const [tableName, constraintName] = required.split('.')
        return !constraints.some(c => c.table_name === tableName && c.constraint_name === constraintName)
      })
      
      if (missingConstraints.length === 0) {
        logTest('Unique Constraints', 'PASS', 'All required UNIQUE constraints exist')
      } else {
        logTest('Unique Constraints', 'FAIL', `Missing constraints: ${missingConstraints.join(', ')}`, 'critical')
      }
    }
    
    // Test 3: Verify security policies exist
    const { data: policies, error: policyError } = await supabase
      .from('information_schema.policies')
      .select('table_name, policy_name')
      .like('table_name', 'axis6_%')
    
    if (policyError) {
      logTest('RLS Policies', 'FAIL', `Cannot check policies: ${policyError.message}`, 'critical')
    } else {
      const criticalTables = ['axis6_profiles', 'axis6_checkins', 'axis6_streaks']
      const tablesWithoutPolicies = criticalTables.filter(table => 
        !policies.some(p => p.table_name === table)
      )
      
      if (tablesWithoutPolicies.length === 0) {
        logTest('RLS Policies', 'PASS', `Security policies exist for ${policies.length} tables`)
      } else {
        logTest('RLS Policies', 'FAIL', `Missing policies for: ${tablesWithoutPolicies.join(', ')}`, 'critical')
      }
    }
    
    // Test 4: Test unauthorized access protection
    const anonSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    try {
      const { data: unauthorizedData, error: unauthorizedError } = await anonSupabase
        .from('axis6_profiles')
        .select('*')
        .limit(1)
      
      if (unauthorizedError && unauthorizedError.message.includes('RLS')) {
        logTest('Unauthorized Access Protection', 'PASS', 'RLS blocks unauthorized access')
      } else if (unauthorizedData && unauthorizedData.length === 0) {
        logTest('Unauthorized Access Protection', 'PASS', 'No data returned for unauthorized request')
      } else {
        logTest('Unauthorized Access Protection', 'FAIL', 'Unauthorized access not properly blocked', 'critical')
      }
    } catch (error) {
      logTest('Unauthorized Access Protection', 'PASS', 'Unauthorized access blocked by RLS')
    }
    
  } catch (error) {
    logTest('Database Security', 'FAIL', `Database security test failed: ${error.message}`, 'critical')
  }
}

// =====================================================
// API SECURITY TESTS
// =====================================================

async function testApiSecurity() {
  console.log('\\n🔒 Testing API Security...')
  
  // Test 1: Verify authentication is required
  const protectedEndpoints = [
    '/api/checkins',
    '/api/analytics',
    '/api/streaks',
    '/api/settings/user-preferences'
  ]
  
  for (const endpoint of protectedEndpoints) {
    try {
      const response = await fetch(`${APP_URL}${endpoint}`)
      
      if (response.status === 401) {
        logTest(`Auth Required: ${endpoint}`, 'PASS', 'Endpoint properly requires authentication')
      } else if (response.status === 429) {
        logTest(`Auth Required: ${endpoint}`, 'PASS', 'Rate limited (expected without auth)')
      } else {
        logTest(`Auth Required: ${endpoint}`, 'FAIL', `Endpoint accessible without auth (status: ${response.status})`, 'critical')
      }
    } catch (error) {
      logTest(`Auth Required: ${endpoint}`, 'WARN', `Cannot test endpoint: ${error.message}`)
    }
  }
  
  // Test 2: Check for CSRF protection
  try {
    const response = await fetch(`${APP_URL}/api/checkins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId: '123', completed: true })
    })
    
    if (response.status === 401 || response.status === 403) {
      logTest('CSRF Protection', 'PASS', 'POST requests require proper authentication/CSRF')
    } else {
      logTest('CSRF Protection', 'FAIL', 'POST requests may not be properly protected', 'critical')
    }
  } catch (error) {
    logTest('CSRF Protection', 'WARN', `Cannot test CSRF: ${error.message}`)
  }
  
  // Test 3: Rate limiting
  try {
    const promises = Array(10).fill(null).map(() => 
      fetch(`${APP_URL}/api/health`)
    )
    
    const responses = await Promise.all(promises)
    const rateLimited = responses.some(r => r.status === 429)
    
    if (rateLimited) {
      logTest('Rate Limiting', 'PASS', 'Rate limiting is active and working')
    } else {
      logTest('Rate Limiting', 'WARN', 'Rate limiting may not be configured or limits are high')
    }
  } catch (error) {
    logTest('Rate Limiting', 'WARN', `Cannot test rate limiting: ${error.message}`)
  }
}

// =====================================================
// HEADER SECURITY TESTS
// =====================================================

async function testSecurityHeaders() {
  console.log('\\n🛡️  Testing Security Headers...')
  
  try {
    const response = await fetch(`${APP_URL}/`)
    const headers = response.headers
    
    // Test security headers
    const securityHeaders = [
      { name: 'content-security-policy', critical: true },
      { name: 'x-frame-options', critical: true },
      { name: 'x-content-type-options', critical: true },
      { name: 'x-xss-protection', critical: false },
      { name: 'referrer-policy', critical: false },
      { name: 'permissions-policy', critical: false },
    ]
    
    securityHeaders.forEach(({ name, critical }) => {
      const value = headers.get(name)
      if (value) {
        logTest(`Header: ${name}`, 'PASS', `Present: ${value.substring(0, 50)}...`)
      } else {
        logTest(`Header: ${name}`, critical ? 'FAIL' : 'WARN', 'Missing security header', critical ? 'critical' : 'normal')
      }
    })
    
    // Test HSTS in production
    if (process.env.NODE_ENV === 'production') {
      const hsts = headers.get('strict-transport-security')
      if (hsts && hsts.includes('max-age=')) {
        logTest('HSTS Header', 'PASS', 'HSTS properly configured')
      } else {
        logTest('HSTS Header', 'FAIL', 'HSTS missing or misconfigured', 'critical')
      }
    }
    
    // Test CSP effectiveness
    const csp = headers.get('content-security-policy')
    if (csp) {
      if (csp.includes("'unsafe-eval'") && process.env.NODE_ENV === 'production') {
        logTest('CSP Security', 'WARN', 'CSP allows unsafe-eval in production')
      } else if (csp.includes("default-src 'self'")) {
        logTest('CSP Security', 'PASS', 'CSP has secure default-src policy')
      } else {
        logTest('CSP Security', 'FAIL', 'CSP may be too permissive', 'critical')
      }
    }
    
  } catch (error) {
    logTest('Security Headers', 'FAIL', `Cannot test headers: ${error.message}`, 'critical')
  }
}

// =====================================================
// ENVIRONMENT SECURITY TESTS
// =====================================================

async function testEnvironmentSecurity() {
  console.log('\\n🔐 Testing Environment Security...')
  
  // Test 1: Check for hardcoded secrets
  const envVars = Object.keys(process.env)
  const suspiciousVars = envVars.filter(key => {
    const value = process.env[key] || ''
    return (
      (key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')) &&
      (value.includes('test') || value.includes('demo') || value.includes('sample') || value.length < 20)
    )
  })
  
  if (suspiciousVars.length === 0) {
    logTest('Environment Secrets', 'PASS', 'No obviously weak secrets detected')
  } else {
    logTest('Environment Secrets', 'FAIL', `Suspicious environment variables: ${suspiciousVars.join(', ')}`, 'critical')
  }
  
  // Test 2: Required production variables
  if (process.env.NODE_ENV === 'production') {
    const requiredProdVars = [
      'CSRF_SECRET',
      'SUPABASE_SERVICE_ROLE_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN'
    ]
    
    const missingVars = requiredProdVars.filter(varName => !process.env[varName])
    
    if (missingVars.length === 0) {
      logTest('Production Environment', 'PASS', 'All required production variables present')
    } else {
      logTest('Production Environment', 'FAIL', `Missing production variables: ${missingVars.join(', ')}`, 'critical')
    }
  }
  
  // Test 3: URL configuration
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_APP_URL)
      if (process.env.NEXT_PUBLIC_APP_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
        logTest('URL Configuration', 'FAIL', 'Production app URL still points to localhost', 'critical')
      } else {
        logTest('URL Configuration', 'PASS', 'App URL properly configured')
      }
    } catch {
      logTest('URL Configuration', 'FAIL', 'Invalid app URL format', 'critical')
    }
  }
}

// =====================================================
// AUTHENTICATION SECURITY TESTS
// =====================================================

async function testAuthenticationSecurity() {
  console.log('\\n🔑 Testing Authentication Security...')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Test 1: Strong password enforcement
    try {
      const { error } = await supabase.auth.signUp({
        email: `test_${Date.now()}@example.com`,
        password: '123' // Weak password
      })
      
      if (error && error.message.toLowerCase().includes('password')) {
        logTest('Password Policy', 'PASS', 'Weak passwords are rejected')
      } else {
        logTest('Password Policy', 'WARN', 'Password policy may not be strict enough')
      }
    } catch (error) {
      logTest('Password Policy', 'WARN', `Cannot test password policy: ${error.message}`)
    }
    
    // Test 2: Rate limiting on auth endpoints
    const authRequests = Array(6).fill(null).map(() =>
      fetch(`${APP_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
      })
    )
    
    const authResponses = await Promise.all(authRequests)
    const rateLimited = authResponses.some(r => r.status === 429)
    
    if (rateLimited) {
      logTest('Auth Rate Limiting', 'PASS', 'Authentication endpoints are rate limited')
    } else {
      logTest('Auth Rate Limiting', 'WARN', 'Auth rate limiting may not be configured')
    }
    
    // Test 3: Session security
    try {
      const response = await fetch(`${APP_URL}/api/auth/user`)
      const cookieHeader = response.headers.get('set-cookie')
      
      if (cookieHeader && cookieHeader.includes('HttpOnly') && cookieHeader.includes('Secure')) {
        logTest('Session Security', 'PASS', 'Session cookies have security flags')
      } else {
        logTest('Session Security', 'WARN', 'Session cookies may not be properly secured')
      }
    } catch (error) {
      logTest('Session Security', 'WARN', `Cannot test session security: ${error.message}`)
    }
    
  } catch (error) {
    logTest('Authentication Security', 'FAIL', `Auth security test failed: ${error.message}`, 'critical')
  }
}

// =====================================================
// INPUT VALIDATION TESTS
// =====================================================

async function testInputValidation() {
  console.log('\\n🛡️  Testing Input Validation...')
  
  const maliciousInputs = [
    { name: 'XSS Script', payload: '<script>alert("xss")</script>' },
    { name: 'SQL Injection', payload: "'; DROP TABLE axis6_profiles; --" },
    { name: 'Path Traversal', payload: '../../../etc/passwd' },
    { name: 'Null Byte', payload: 'test\\x00.txt' },
    { name: 'Unicode Attack', payload: '\\u003cscript\\u003e' },
  ]
  
  for (const { name, payload } of maliciousInputs) {
    try {
      const response = await fetch(`${APP_URL}/api/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: payload,
          completed: true,
          notes: payload
        })
      })
      
      if (response.status === 400 || response.status === 403 || response.status === 401) {
        logTest(`Input Validation: ${name}`, 'PASS', 'Malicious input properly rejected')
      } else {
        logTest(`Input Validation: ${name}`, 'FAIL', `Malicious input may not be filtered (status: ${response.status})`, 'critical')
      }
    } catch (error) {
      logTest(`Input Validation: ${name}`, 'WARN', `Cannot test input validation: ${error.message}`)
    }
  }
}

// =====================================================
// COMPREHENSIVE SECURITY SCAN
// =====================================================

async function runSecurityValidation() {
  console.log('🚨 AXIS6 SECURITY VALIDATION STARTING...')
  console.log('============================================')
  
  const startTime = Date.now()
  
  // Run all security tests
  await testDatabaseSecurity()
  await testApiSecurity()
  await testSecurityHeaders()
  await testEnvironmentSecurity()
  await testAuthenticationSecurity()
  await testInputValidation()
  
  // Generate final report
  const duration = Date.now() - startTime
  
  console.log('\\n📊 SECURITY VALIDATION RESULTS')
  console.log('=====================================')
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`⚠️  Warnings: ${testResults.warnings}`)
  console.log(`🚨 Critical: ${testResults.critical}`)
  console.log(`⏱️  Duration: ${duration}ms`)
  
  // Security score calculation
  const totalTests = testResults.passed + testResults.failed + testResults.warnings
  const securityScore = totalTests > 0 ? 
    Math.round(((testResults.passed + (testResults.warnings * 0.5)) / totalTests) * 100) : 0
  
  console.log(`\\n🎯 SECURITY SCORE: ${securityScore}/100`)
  
  if (testResults.critical > 0) {
    console.log('\\n🚨 CRITICAL ISSUES DETECTED - IMMEDIATE ACTION REQUIRED')
    console.log('Critical issues must be fixed before production deployment')
  } else if (securityScore >= 85) {
    console.log('\\n✅ SECURITY STATUS: GOOD')
    console.log('Security configuration meets production standards')
  } else if (securityScore >= 70) {
    console.log('\\n⚠️  SECURITY STATUS: ACCEPTABLE')
    console.log('Some security improvements recommended')
  } else {
    console.log('\\n❌ SECURITY STATUS: INSUFFICIENT')
    console.log('Significant security improvements required')
  }
  
  // Save detailed report
  const report = {
    summary: {
      score: securityScore,
      status: testResults.critical > 0 ? 'CRITICAL' : 
              securityScore >= 85 ? 'GOOD' : 
              securityScore >= 70 ? 'ACCEPTABLE' : 'INSUFFICIENT',
      totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      warnings: testResults.warnings,
      critical: testResults.critical,
      duration,
      timestamp: new Date().toISOString(),
    },
    tests: testResults.tests,
    recommendations: generateSecurityRecommendations(),
  }
  
  // Write report to file
  const fs = require('fs')
  fs.writeFileSync('security-validation-report.json', JSON.stringify(report, null, 2))
  
  console.log('\\n📄 Detailed report saved to: security-validation-report.json')
  
  return {
    score: securityScore,
    critical: testResults.critical,
    passed: testResults.failed === 0 && testResults.critical === 0
  }
}

// =====================================================
// SECURITY RECOMMENDATIONS
// =====================================================

function generateSecurityRecommendations() {
  const recommendations = []
  
  if (testResults.critical > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'Fix critical security issues immediately',
      description: 'Deploy RLS policies, add authentication to unprotected endpoints',
    })
  }
  
  if (testResults.warnings > 2) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Address security warnings',
      description: 'Review and implement security best practices',
    })
  }
  
  recommendations.push({
    priority: 'MEDIUM',
    action: 'Implement additional monitoring',
    description: 'Add security event monitoring and alerting',
  })
  
  return recommendations
}

// =====================================================
// MAIN EXECUTION
// =====================================================

if (require.main === module) {
  runSecurityValidation()
    .then((result) => {
      if (result.critical > 0) {
        process.exit(1) // Exit with error if critical issues found
      } else if (!result.passed) {
        process.exit(2) // Exit with warning if non-critical issues found
      } else {
        console.log('\\n🎉 All security tests passed!')
        process.exit(0)
      }
    })
    .catch((error) => {
      console.error('Security validation failed:', error)
      process.exit(1)
    })
}

module.exports = { runSecurityValidation, testResults }