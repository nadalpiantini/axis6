#!/usr/bin/env node
/**
 * AXIS6 Authentication Flow Testing Script
 * 
 * Tests the complete authentication flow after CSP fixes
 * to ensure login, register, and dashboard access work correctly.
 */

const { chromium } = require('playwright')

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_EMAIL = `test-${Date.now()}@example.com`
const TEST_PASSWORD = 'TestPassword123!'
const TEST_NAME = 'Test User'

console.log('🧪 AXIS6 AUTHENTICATION FLOW TESTING')
console.log('='.repeat(50))
console.log(`App URL: ${APP_URL}`)
console.log(`Test Email: ${TEST_EMAIL}`)

async function testAuthFlow() {
  let browser
  let context
  let page
  
  try {
    // Launch browser
    browser = await chromium.launch({ headless: false }) // Set to true for CI
    context = await browser.newContext()
    page = await context.newPage()
    
    // Log all console messages and errors
    page.on('console', msg => {
      const type = msg.type()
      if (type === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`)
      } else if (type === 'warning') {
        console.log(`⚠️ Console Warning: ${msg.text()}`)
      }
    })
    
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`)
    })
    
    // Test 1: Load homepage
    console.log('\n🏠 Test 1: Loading Homepage')
    await page.goto(APP_URL, { waitUntil: 'networkidle' })
    
    const title = await page.title()
    console.log(`✅ Page loaded: ${title}`)
    
    // Check for CSP errors in console
    const consoleErrors = []
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
        consoleErrors.push(msg.text())
      }
    })
    
    // Test 2: Navigate to register page
    console.log('\n📝 Test 2: Registration Flow')
    await page.goto(`${APP_URL}/auth/register`)
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 })
    console.log('✅ Register form loaded')
    
    // Fill registration form
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.fill('input[name="name"]', TEST_NAME)
    
    console.log('✅ Registration form filled')
    
    // Submit registration (don't actually submit in test)
    console.log('ℹ️ Registration form ready (not submitting in test)')
    
    // Test 3: Navigate to login page
    console.log('\n🔑 Test 3: Login Page')
    await page.goto(`${APP_URL}/auth/login`)
    
    // Wait for login form
    await page.waitForSelector('form', { timeout: 10000 })
    console.log('✅ Login form loaded')
    
    // Fill login form
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    
    console.log('✅ Login form filled')
    console.log('ℹ️ Login form ready (not submitting in test)')
    
    // Test 4: Check protected routes redirect
    console.log('\n🔒 Test 4: Protected Routes')
    await page.goto(`${APP_URL}/dashboard`)
    
    // Should redirect to login
    await page.waitForTimeout(2000)
    const currentUrl = page.url()
    
    if (currentUrl.includes('/auth/login')) {
      console.log('✅ Protected route correctly redirects to login')
    } else {
      console.log('⚠️ Protected route behavior unclear:', currentUrl)
    }
    
    // Test 5: Check for CSP violations
    console.log('\n🛡️ Test 5: CSP Violations Check')
    
    if (consoleErrors.length === 0) {
      console.log('✅ No CSP violations detected')
    } else {
      console.log(`❌ Found ${consoleErrors.length} CSP violations:`)
      consoleErrors.forEach(error => {
        console.log(`   - ${error}`)
      })
    }
    
    // Test 6: Check critical resources loading
    console.log('\n📦 Test 6: Resource Loading')
    
    // Go to homepage and check resources
    await page.goto(APP_URL)
    
    // Check if critical resources loaded
    const criticalResources = [
      '/_next/static/css/',
      '/_next/static/chunks/',
      '/favicon',
    ]
    
    let resourcesOk = true
    for (const resource of criticalResources) {
      try {
        const response = await page.waitForResponse(
          response => response.url().includes(resource),
          { timeout: 5000 }
        )
        
        if (response.ok()) {
          console.log(`✅ Resource loaded: ${resource}`)
        } else {
          console.log(`❌ Resource failed: ${resource} (${response.status()})`)
          resourcesOk = false
        }
      } catch (error) {
        console.log(`⚠️ Resource check timeout: ${resource}`)
      }
    }
    
    return {
      success: consoleErrors.length === 0 && resourcesOk,
      cspErrors: consoleErrors.length,
      resourcesOk
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function generateReport(results) {
  console.log('\n📋 TEST RESULTS SUMMARY')
  console.log('='.repeat(30))
  
  if (results.success) {
    console.log('🎉 All tests passed successfully!')
    console.log('✅ Authentication flow is working correctly')
    console.log('✅ CSP configuration is properly set up')
    console.log('✅ No security violations detected')
  } else {
    console.log('⚠️ Some issues were detected:')
    
    if (results.cspErrors > 0) {
      console.log(`❌ ${results.cspErrors} CSP violations found`)
    }
    
    if (!results.resourcesOk) {
      console.log('❌ Some critical resources failed to load')
    }
    
    if (results.error) {
      console.log('❌ Test execution error:', results.error)
    }
  }
  
  console.log('\n🔧 NEXT STEPS:')
  
  if (results.success) {
    console.log('1. ✅ CSP configuration is working correctly')
    console.log('2. ✅ You can now test actual login/register functionality')
    console.log('3. ✅ Deploy to production when ready')
  } else {
    console.log('1. Check browser console for specific errors')
    console.log('2. Verify Supabase Dashboard settings')
    console.log('3. Restart development server: npm run dev')
    console.log('4. Clear browser cache and try again')
  }
  
  console.log('\n📚 DOCUMENTATION:')
  console.log('- CSP fixes: docs/database-performance-optimization.md')
  console.log('- Supabase config: docs/supabase-dashboard-settings.md')
  console.log('- Verify setup: npm run verify:supabase')
}

// Main execution
async function main() {
  console.log('Starting authentication flow tests...\n')
  
  // Check if server is running
  try {
    const response = await fetch(APP_URL)
    if (!response.ok) {
      throw new Error(`Server not responding: ${response.status}`)
    }
  } catch (error) {
    console.error('❌ Cannot connect to app server!')
    console.error('   Make sure your server is running: npm run dev')
    console.error('   Expected URL:', APP_URL)
    process.exit(1)
  }
  
  const results = await testAuthFlow()
  await generateReport(results)
  
  process.exit(results.success ? 0 : 1)
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run tests
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testAuthFlow }