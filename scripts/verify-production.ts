#!/usr/bin/env tsx
/**
 * Production Readiness Verification Script for AXIS6
 * 
 * This script verifies that all production requirements are met
 * before deployment.
 */

import { config } from 'dotenv'
import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
config({ path: '.env.local' })

interface Check {
  name: string
  category: 'Security' | 'Performance' | 'Monitoring' | 'Configuration' | 'Database'
  required: boolean
  passed: boolean
  message: string
  fix?: string
}

const checks: Check[] = []

function addCheck(check: Omit<Check, 'passed'> & { passed?: boolean }) {
  checks.push({
    passed: false,
    ...check,
  })
}

// Environment Variables Checks
function checkEnvironmentVariables(): void {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const optionalProdVars = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'SENTRY_DSN',
    'CSRF_SECRET'
  ]

  for (const variable of requiredVars) {
    addCheck({
      name: `Environment Variable: ${variable}`,
      category: 'Configuration',
      required: true,
      passed: !!process.env[variable],
      message: process.env[variable] 
        ? 'Required environment variable is set'
        : 'Missing required environment variable',
      fix: `Add ${variable} to your .env.local file`
    })
  }

  for (const variable of optionalProdVars) {
    addCheck({
      name: `Production Variable: ${variable}`,
      category: 'Configuration',
      required: false,
      passed: !!process.env[variable],
      message: process.env[variable] 
        ? 'Production environment variable is set'
        : 'Optional production variable not set',
      fix: `Add ${variable} to your .env.local for production features`
    })
  }

  // Check if CSRF_SECRET is strong enough
  const csrfSecret = process.env.CSRF_SECRET
  if (csrfSecret) {
    addCheck({
      name: 'CSRF Secret Strength',
      category: 'Security',
      required: true,
      passed: csrfSecret.length >= 32,
      message: csrfSecret.length >= 32 
        ? 'CSRF secret is strong enough' 
        : 'CSRF secret should be at least 32 characters',
      fix: 'Generate a new CSRF secret: openssl rand -base64 32'
    })
  }
}

// Security Configuration Checks
function checkSecurityConfiguration(): void {
  // Check if security headers are configured
  const middlewarePath = join(process.cwd(), 'middleware.ts')
  if (existsSync(middlewarePath)) {
    const middleware = readFileSync(middlewarePath, 'utf-8')
    
    addCheck({
      name: 'Security Headers Middleware',
      category: 'Security',
      required: true,
      passed: middleware.includes('X-Frame-Options') && middleware.includes('Content-Security-Policy'),
      message: middleware.includes('X-Frame-Options') ? 'Security headers are configured' : 'Security headers not found in middleware',
      fix: 'Add security headers to middleware.ts'
    })

    addCheck({
      name: 'CSRF Protection',
      category: 'Security',
      required: true,
      passed: middleware.includes('csrf') || existsSync(join(process.cwd(), 'lib/security/csrf.ts')),
      message: 'CSRF protection is configured',
      fix: 'Implement CSRF protection'
    })
  }

  // Check if rate limiting is configured
  const rateLimitPath = join(process.cwd(), 'lib/security/rateLimitRedis.ts')
  addCheck({
    name: 'Rate Limiting Configuration',
    category: 'Security',
    required: true,
    passed: existsSync(rateLimitPath),
    message: existsSync(rateLimitPath) ? 'Rate limiting is configured' : 'Rate limiting not found',
    fix: 'Implement rate limiting with Redis'
  })
}

// Performance Checks
function checkPerformanceConfiguration(): void {
  // Check Next.js config
  const nextConfigPath = join(process.cwd(), 'next.config.js')
  if (existsSync(nextConfigPath)) {
    const nextConfig = readFileSync(nextConfigPath, 'utf-8')
    
    addCheck({
      name: 'Image Optimization',
      category: 'Performance',
      required: true,
      passed: nextConfig.includes('images') && nextConfig.includes('formats'),
      message: nextConfig.includes('images') ? 'Image optimization is configured' : 'Image optimization not configured',
      fix: 'Configure image optimization in next.config.js'
    })

    addCheck({
      name: 'Production Optimizations',
      category: 'Performance',
      required: true,
      passed: nextConfig.includes('compiler') || nextConfig.includes('swcMinify'),
      message: 'Production optimizations are enabled',
      fix: 'Enable SWC minification and compiler optimizations'
    })
  }

  // Check for database indexes
  const indexesPath = join(process.cwd(), 'supabase/migrations/003_performance_optimizations.sql')
  addCheck({
    name: 'Database Performance Indexes',
    category: 'Performance',
    required: true,
    passed: existsSync(indexesPath),
    message: existsSync(indexesPath) ? 'Performance indexes migration exists' : 'Performance indexes not found',
    fix: 'Create database performance indexes migration'
  })
}

// Monitoring Checks
function checkMonitoringConfiguration(): void {
  // Check Sentry configuration
  const sentryClientPath = join(process.cwd(), 'sentry.client.config.ts')
  const sentryServerPath = join(process.cwd(), 'sentry.server.config.ts')
  
  addCheck({
    name: 'Sentry Client Configuration',
    category: 'Monitoring',
    required: false,
    passed: existsSync(sentryClientPath),
    message: existsSync(sentryClientPath) ? 'Sentry client configuration exists' : 'Sentry client not configured',
    fix: 'Create sentry.client.config.ts'
  })

  addCheck({
    name: 'Sentry Server Configuration',
    category: 'Monitoring',
    required: false,
    passed: existsSync(sentryServerPath),
    message: existsSync(sentryServerPath) ? 'Sentry server configuration exists' : 'Sentry server not configured',
    fix: 'Create sentry.server.config.ts'
  })
}

// Build and Dependencies Checks
function checkBuildConfiguration(): void {
  try {
    // Check if project builds successfully
    execSync('npm run build', { stdio: 'pipe' })
    
    addCheck({
      name: 'Production Build',
      category: 'Configuration',
      required: true,
      passed: true,
      message: 'Project builds successfully',
    })
  } catch (error) {
    addCheck({
      name: 'Production Build',
      category: 'Configuration',
      required: true,
      passed: false,
      message: 'Build failed - check build errors',
      fix: 'Fix build errors before deployment'
    })
  }

  // Check package.json for required scripts
  const packageJsonPath = join(process.cwd(), 'package.json')
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const requiredScripts = ['build', 'start', 'lint']
    
    for (const script of requiredScripts) {
      addCheck({
        name: `NPM Script: ${script}`,
        category: 'Configuration',
        required: true,
        passed: !!packageJson.scripts?.[script],
        message: packageJson.scripts?.[script] ? `${script} script is configured` : `Missing ${script} script`,
        fix: `Add "${script}" script to package.json`
      })
    }
  }
}

// Database Checks
function checkDatabaseConfiguration(): void {
  // Check if migrations exist
  const migrationsDir = join(process.cwd(), 'supabase/migrations')
  if (existsSync(migrationsDir)) {
    const files = require('fs').readdirSync(migrationsDir)
    const migrationFiles = files.filter((f: string) => f.endsWith('.sql'))
    
    addCheck({
      name: 'Database Migrations',
      category: 'Database',
      required: true,
      passed: migrationFiles.length > 0,
      message: `Found ${migrationFiles.length} migration files`,
      fix: 'Create initial database migrations'
    })
  }
}

async function runVerification(): Promise<void> {
  console.log('🔍 AXIS6 Production Readiness Verification\n')

  // Run all checks
  console.log('⏳ Checking environment variables...')
  checkEnvironmentVariables()
  
  console.log('⏳ Checking security configuration...')
  checkSecurityConfiguration()
  
  console.log('⏳ Checking performance configuration...')
  checkPerformanceConfiguration()
  
  console.log('⏳ Checking monitoring configuration...')
  checkMonitoringConfiguration()
  
  console.log('⏳ Checking build configuration...')
  checkBuildConfiguration()
  
  console.log('⏳ Checking database configuration...')
  checkDatabaseConfiguration()

  // Group checks by category
  const categories = [...new Set(checks.map(c => c.category))]
  
  console.log('\n📋 Verification Results:\n')
  
  for (const category of categories) {
    console.log(`🔧 ${category}:`)
    
    const categoryChecks = checks.filter(c => c.category === category)
    const passed = categoryChecks.filter(c => c.passed).length
    const required = categoryChecks.filter(c => c.required).length
    
    for (const check of categoryChecks) {
      const status = check.passed ? '✅' : (check.required ? '❌' : '⚠️')
      const requiredText = check.required ? '' : ' (optional)'
      console.log(`   ${status} ${check.name}${requiredText}`)
      console.log(`      ${check.message}`)
      if (!check.passed && check.fix) {
        console.log(`      💡 Fix: ${check.fix}`)
      }
    }
    
    console.log(`   📊 ${passed}/${categoryChecks.length} checks passed (${required} required)\n`)
  }

  // Overall summary
  const totalPassed = checks.filter(c => c.passed).length
  const totalRequired = checks.filter(c => c.required).length
  const requiredPassed = checks.filter(c => c.required && c.passed).length
  
  console.log('🎯 Overall Summary:')
  console.log(`   Total: ${totalPassed}/${checks.length} checks passed`)
  console.log(`   Required: ${requiredPassed}/${totalRequired} required checks passed`)
  
  if (requiredPassed === totalRequired) {
    console.log('\n🎉 All required checks passed! Your application is ready for production.')
    
    if (totalPassed < checks.length) {
      console.log('💡 Consider addressing optional checks for enhanced production readiness.')
    }
    
    process.exit(0)
  } else {
    const failedRequired = totalRequired - requiredPassed
    console.log(`\n❌ ${failedRequired} required checks failed. Please address these issues before deployment.`)
    process.exit(1)
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  runVerification().catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
}

export { runVerification }