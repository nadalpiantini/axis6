#!/usr/bin/env node

/**
 * Security Headers Verification Script
 * Verifies that all security headers are properly configured
 */

const https = require('https')
const http = require('http')

const requiredHeaders = [
  'content-security-policy',
  'x-content-type-options',
  'x-frame-options', 
  'x-xss-protection',
  'referrer-policy',
  'permissions-policy',
  'strict-transport-security'
]

function checkHeaders(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    
    const request = protocol.get(url, (response) => {
      const headers = {}
      
      // Normalize header names to lowercase
      Object.keys(response.headers).forEach(key => {
        headers[key.toLowerCase()] = response.headers[key]
      })
      
      resolve({
        statusCode: response.statusCode,
        headers
      })
    })
    
    request.on('error', reject)
    request.setTimeout(10000, () => {
      request.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

async function verifySecurityHeaders(url) {
  console.log(`🔍 Verifying security headers for: ${url}\n`)
  
  try {
    const { statusCode, headers } = await checkHeaders(url)
    console.log(`📊 Response Status: ${statusCode}`)
    console.log('=' .repeat(60))
    
    let allPresent = true
    
    requiredHeaders.forEach(headerName => {
      const value = headers[headerName]
      
      if (value) {
        console.log(`✅ ${headerName}: ${value.substring(0, 80)}${value.length > 80 ? '...' : ''}`)
      } else {
        console.log(`❌ ${headerName}: MISSING`)
        allPresent = false
      }
    })
    
    console.log('=' .repeat(60))
    
    // Additional security analysis
    const csp = headers['content-security-policy']
    if (csp) {
      console.log('\n🛡️  CSP Analysis:')
      console.log(`• Contains 'unsafe-inline': ${csp.includes("'unsafe-inline'") ? '⚠️  Yes (required for dev)' : '✅ No'}`)
      console.log(`• Contains 'unsafe-eval': ${csp.includes("'unsafe-eval'") ? '⚠️  Yes (required for dev)' : '✅ No'}`)
      console.log(`• Allows Supabase domains: ${csp.includes('supabase.co') ? '✅ Yes' : '❌ No'}`)
      console.log(`• Allows Vercel domains: ${csp.includes('vercel') ? '✅ Yes' : '❌ No'}`)
    }
    
    console.log(`\n🎯 Security Score: ${allPresent ? '✅ EXCELLENT' : '⚠️  NEEDS ATTENTION'}`)
    
    return allPresent
    
  } catch (error) {
    console.error('❌ Error checking headers:', error.message)
    return false
  }
}

// Check both development and production if available
async function main() {
  const devUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6789'
  const prodUrl = 'https://axis6.app'
  
  console.log('🔐 AXIS6 Security Headers Verification')
  console.log('=' .repeat(60))
  
  // Check development
  console.log('\n📍 Development Environment:')
  const devResult = await verifySecurityHeaders(devUrl)
  
  // Check production if different
  if (prodUrl !== devUrl) {
    console.log('\n📍 Production Environment:')
    try {
      const prodResult = await verifySecurityHeaders(prodUrl)
      console.log(`\n📋 Summary:`)
      console.log(`• Development: ${devResult ? '✅ Pass' : '❌ Fail'}`)
      console.log(`• Production: ${prodResult ? '✅ Pass' : '❌ Fail'}`)
    } catch (error) {
      console.log(`\n⚠️  Production check failed: ${error.message}`)
      console.log(`📋 Summary:`)
      console.log(`• Development: ${devResult ? '✅ Pass' : '❌ Fail'}`)
      console.log(`• Production: ⚠️  Unavailable`)
    }
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { verifySecurityHeaders }