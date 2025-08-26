#!/usr/bin/env node

/**
 * Pre-Deployment Pipeline Script
 * Runs comprehensive checks before deployment
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function execCommand(command, description, required = true) {
  try {
    log(`\n🔄 ${description}...`, colors.cyan)
    const startTime = Date.now()
    
    const result = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'pipe',
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    })
    
    const duration = Date.now() - startTime
    log(`✅ ${description} completed (${duration}ms)`, colors.green)
    
    return { success: true, output: result, duration }
  } catch (error) {
    const duration = Date.now() - Date.now()
    log(`❌ ${description} failed (${duration}ms)`, colors.red)
    
    if (error.stdout) {
      log(`📋 Output: ${error.stdout.substring(0, 500)}...`, colors.yellow)
    }
    if (error.stderr) {
      log(`🚨 Error: ${error.stderr.substring(0, 500)}...`, colors.red)
    }
    
    if (required) {
      log(`\n💥 Critical failure: ${description}`, colors.red)
      process.exit(1)
    }
    
    return { success: false, error: error.message, duration }
  }
}

function checkEnvironmentVariables() {
  log('\n🌍 Checking Environment Variables', colors.bright)
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const optionalVars = [
    'VERCEL_TOKEN',
    'RESEND_API_KEY',
    'SENTRY_DSN'
  ]
  
  let allRequired = true
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: Set`, colors.green)
    } else {
      log(`❌ ${varName}: Missing (REQUIRED)`, colors.red)
      allRequired = false
    }
  })
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: Set`, colors.green)
    } else {
      log(`⚠️ ${varName}: Not set (optional)`, colors.yellow)
    }
  })
  
  if (!allRequired) {
    log('\n💥 Critical environment variables missing!', colors.red)
    process.exit(1)
  }
  
  return true
}

function generateDeploymentReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: require('../package.json').version,
    git: {
      branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      commit: execSync('git rev-parse HEAD').toString().trim(),
      shortCommit: execSync('git rev-parse --short HEAD').toString().trim()
    },
    checks: results,
    status: results.every(r => r.success) ? 'READY' : 'FAILED',
    totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
  }
  
  // Save report
  const reportPath = path.join('.next', 'deployment-report.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  return report
}

async function main() {
  log('🚀 AXIS6 Pre-Deployment Pipeline', colors.bright)
  log('=' .repeat(60), colors.cyan)
  log(`📅 Started: ${new Date().toLocaleString()}`, colors.blue)
  log(`📂 Directory: ${process.cwd()}`, colors.blue)
  log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`, colors.blue)
  
  const results = []
  
  // Step 1: Environment Variables
  try {
    checkEnvironmentVariables()
    results.push({ step: 'Environment Variables', success: true, duration: 0 })
  } catch (error) {
    results.push({ step: 'Environment Variables', success: false, duration: 0, error: error.message })
  }
  
  // Step 2: TypeScript Type Check
  const typeCheck = execCommand('npm run type-check', 'TypeScript Type Check', true)
  results.push({ step: 'TypeScript Type Check', ...typeCheck })
  
  // Step 3: ESLint (strict mode)
  const linting = execCommand('npm run lint:strict', 'ESLint Code Quality Check', false)
  results.push({ step: 'ESLint Code Quality', ...linting })
  
  if (!linting.success) {
    log('⚠️ ESLint issues found but continuing deployment...', colors.yellow)
  }
  
  // Step 4: Unit Tests
  const testing = execCommand('npm run test:ci', 'Unit Tests', false)
  results.push({ step: 'Unit Tests', ...testing })
  
  if (!testing.success) {
    log('⚠️ Some tests failed but continuing deployment...', colors.yellow)
  }
  
  // Step 5: Build Production Bundle
  const building = execCommand('npm run build', 'Production Build', true)
  results.push({ step: 'Production Build', ...building })
  
  // Step 6: Security Headers Check
  const security = execCommand('node scripts/verify-security-headers.js', 'Security Headers Verification', false)
  results.push({ step: 'Security Verification', ...security })
  
  // Step 7: Bundle Analysis (optional)
  log('\n🔄 Generating Bundle Analysis (optional)...', colors.cyan)
  try {
    execSync('npm run analyze:report', { stdio: 'pipe' })
    results.push({ step: 'Bundle Analysis', success: true, duration: 0 })
  } catch (error) {
    log('⚠️ Bundle analysis skipped (reports not generated)', colors.yellow)
    results.push({ step: 'Bundle Analysis', success: false, duration: 0, error: 'Reports not found' })
  }
  
  // Generate deployment report
  const report = generateDeploymentReport(results)
  
  // Final summary
  log('\\n📊 Pre-Deployment Summary', colors.bright)
  log('=' .repeat(60), colors.cyan)
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌'
    const duration = result.duration ? `(${result.duration}ms)` : ''
    log(`${status} ${result.step} ${duration}`, result.success ? colors.green : colors.red)
  })
  
  log(`\\n⏱️ Total Duration: ${report.totalDuration}ms`, colors.blue)
  log(`🌿 Git Branch: ${report.git.branch}`, colors.blue)
  log(`📝 Git Commit: ${report.git.shortCommit}`, colors.blue)
  log(`📄 Report Saved: .next/deployment-report.json`, colors.blue)
  
  if (report.status === 'READY') {
    log('\\n🎉 DEPLOYMENT READY!', colors.green)
    log('All critical checks passed. Ready for production deployment.', colors.green)
    
    log('\\n🚀 Next Steps:', colors.bright)
    log('• git push origin main (triggers Vercel deployment)', colors.cyan)
    log('• Monitor deployment at https://vercel.com/dashboard', colors.cyan)
    log('• Verify production health: npm run production:health', colors.cyan)
    
  } else {
    log('\\n🛑 DEPLOYMENT NOT READY', colors.red)
    log('Critical checks failed. Fix issues before deployment.', colors.red)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`\\n💥 Pipeline failed: ${error.message}`, colors.red)
    process.exit(1)
  })
}

module.exports = { execCommand, checkEnvironmentVariables }