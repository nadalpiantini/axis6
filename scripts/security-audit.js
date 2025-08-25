#!/usr/bin/env node

/**
 * Security Audit Script for AXIS6
 * Comprehensive security analysis and vulnerability assessment
 */

const fs = require('fs').promises
const path = require('path')
const { spawn } = require('child_process')

class SecurityAuditor {
  constructor() {
    this.vulnerabilities = []
    this.warnings = []
    this.recommendations = []
    this.securityScore = 100
  }

  async runAudit() {
    console.log('🔒 AXIS6 Security Audit')
    console.log('=======================\n')

    const audits = [
      { name: 'Package Vulnerabilities', fn: () => this.checkPackageVulnerabilities() },
      { name: 'Environment Variables', fn: () => this.checkEnvironmentVariables() },
      { name: 'File Permissions', fn: () => this.checkFilePermissions() },
      { name: 'Security Headers', fn: () => this.checkSecurityHeaders() },
      { name: 'Authentication Config', fn: () => this.checkAuthenticationConfig() },
      { name: 'Database Security', fn: () => this.checkDatabaseSecurity() },
      { name: 'API Security', fn: () => this.checkAPISecurity() },
      { name: 'Content Security Policy', fn: () => this.checkCSP() },
      { name: 'Rate Limiting', fn: () => this.checkRateLimiting() },
      { name: 'Input Validation', fn: () => this.checkInputValidation() },
      { name: 'Error Handling', fn: () => this.checkErrorHandling() },
      { name: 'Secrets Management', fn: () => this.checkSecretsManagement() }
    ]

    for (const audit of audits) {
      try {
        console.log(`🔍 ${audit.name}...`)
        await audit.fn()
        console.log(`✅ ${audit.name} - OK\n`)
      } catch (error) {
        console.log(`❌ ${audit.name} - Issues found`)
        console.log(`   ${error.message}\n`)
        this.securityScore -= 10
      }
    }

    await this.generateReport()
    this.displayResults()
  }

  async checkPackageVulnerabilities() {
    return new Promise((resolve, reject) => {
      const audit = spawn('npm', ['audit', '--audit-level=moderate'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      })

      let stdout = ''
      let stderr = ''

      audit.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      audit.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      audit.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          const vulnerabilityCount = (stdout.match(/vulnerabilities/g) || []).length
          if (vulnerabilityCount > 0) {
            this.vulnerabilities.push({
              type: 'package_vulnerability',
              severity: 'high',
              description: `Found ${vulnerabilityCount} package vulnerabilities`,
              fix: 'Run npm audit fix to resolve vulnerabilities'
            })
          }
          reject(new Error(`Package vulnerabilities detected: ${stdout.split('\n')[0]}`))
        }
      })
    })
  }

  async checkEnvironmentVariables() {
    const envFiles = ['.env.local', '.env.production', '.env']
    let foundEnvFile = false

    for (const envFile of envFiles) {
      try {
        await fs.access(envFile)
        foundEnvFile = true
        
        const content = await fs.readFile(envFile, 'utf8')
        const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))
        
        for (const line of lines) {
          const [key, value] = line.split('=', 2)
          
          if (!value || value.trim() === '') {
            this.warnings.push({
              type: 'empty_env_var',
              description: `Empty environment variable: ${key}`,
              file: envFile
            })
          }

          // Check for hardcoded secrets
          if (value && (
            value.includes('sk_') || 
            value.includes('pk_') ||
            value.includes('password') ||
            value.includes('secret')
          )) {
            if (value.length < 32) {
              this.vulnerabilities.push({
                type: 'weak_secret',
                severity: 'medium',
                description: `Potentially weak secret in ${key}`,
                fix: 'Use strong, randomly generated secrets'
              })
            }
          }

          // Check for development values in production
          if (envFile.includes('production') && (
            value.includes('localhost') ||
            value.includes('127.0.0.1') ||
            value.includes('test') ||
            value.includes('dev')
          )) {
            this.vulnerabilities.push({
              type: 'dev_config_in_prod',
              severity: 'high',
              description: `Development configuration in production: ${key}`,
              fix: 'Replace with production values'
            })
          }
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }

    if (!foundEnvFile) {
      this.warnings.push({
        type: 'missing_env_file',
        description: 'No environment configuration files found'
      })
    }
  }

  async checkFilePermissions() {
    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'private.key',
      'cert.pem',
      'package-lock.json'
    ]

    for (const file of sensitiveFiles) {
      try {
        const stats = await fs.stat(file)
        const mode = stats.mode & parseInt('777', 8)
        
        // Check if file is readable by others
        if (mode & parseInt('044', 8)) {
          this.vulnerabilities.push({
            type: 'file_permissions',
            severity: 'medium',
            description: `File ${file} is readable by others`,
            fix: `chmod 600 ${file}`
          })
        }
      } catch (error) {
        // File doesn't exist, skip
      }
    }
  }

  async checkSecurityHeaders() {
    try {
      const nextConfigPath = 'next.config.js'
      const configContent = await fs.readFile(nextConfigPath, 'utf8')
      
      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Referrer-Policy',
        'Content-Security-Policy'
      ]

      for (const header of requiredHeaders) {
        if (!configContent.includes(header)) {
          this.vulnerabilities.push({
            type: 'missing_security_header',
            severity: 'medium',
            description: `Missing security header: ${header}`,
            fix: `Add ${header} to next.config.js headers`
          })
        }
      }

      // Check for unsafe CSP directives
      if (configContent.includes("'unsafe-inline'")) {
        this.vulnerabilities.push({
          type: 'unsafe_csp',
          severity: 'high',
          description: 'CSP allows unsafe-inline scripts',
          fix: 'Implement hash-based or nonce-based CSP'
        })
      }

    } catch (error) {
      this.warnings.push({
        type: 'config_check_failed',
        description: 'Could not analyze security headers configuration'
      })
    }
  }

  async checkAuthenticationConfig() {
    try {
      // Check middleware configuration
      const middlewarePath = 'middleware.ts'
      const middlewareContent = await fs.readFile(middlewarePath, 'utf8')
      
      // Check for rate limiting
      if (!middlewareContent.includes('ratelimit') && !middlewareContent.includes('RateLimit')) {
        this.vulnerabilities.push({
          type: 'no_rate_limiting',
          severity: 'high',
          description: 'No rate limiting detected in middleware',
          fix: 'Implement rate limiting for authentication endpoints'
        })
      }

      // Check for protected routes
      if (!middlewareContent.includes('protectedRoutes')) {
        this.warnings.push({
          type: 'route_protection',
          description: 'Route protection configuration not found'
        })
      }

      // Check auth API routes
      const authRoutesPath = 'app/api/auth'
      try {
        const authFiles = await fs.readdir(authRoutesPath, { recursive: true })
        
        for (const file of authFiles) {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            const filePath = path.join(authRoutesPath, file)
            const content = await fs.readFile(filePath, 'utf8')
            
            // Check for password hashing
            if (content.includes('password') && !content.includes('hash') && !content.includes('bcrypt')) {
              this.vulnerabilities.push({
                type: 'unhashed_password',
                severity: 'critical',
                description: `Potential unhashed password handling in ${file}`,
                fix: 'Implement proper password hashing'
              })
            }

            // Check for SQL injection protection
            if (content.includes('query') && !content.includes('prepared') && !content.includes('parameterized')) {
              this.warnings.push({
                type: 'sql_injection_risk',
                description: `Potential SQL injection risk in ${file}`,
                fix: 'Use parameterized queries'
              })
            }
          }
        }
      } catch (error) {
        // Auth routes directory doesn't exist or can't be read
      }

    } catch (error) {
      this.warnings.push({
        type: 'auth_config_check_failed',
        description: 'Could not analyze authentication configuration'
      })
    }
  }

  async checkDatabaseSecurity() {
    try {
      // Check Supabase configuration
      const supabasePath = 'lib/supabase'
      const supabaseFiles = await fs.readdir(supabasePath, { recursive: true })
      
      for (const file of supabaseFiles) {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          const filePath = path.join(supabasePath, file)
          const content = await fs.readFile(filePath, 'utf8')
          
          // Check for RLS usage
          if (content.includes('.from(') && !content.includes('rls')) {
            this.warnings.push({
              type: 'rls_not_enforced',
              description: `RLS not explicitly enforced in ${file}`,
              fix: 'Ensure Row Level Security is enabled on all tables'
            })
          }

          // Check for service role key usage
          if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
            this.vulnerabilities.push({
              type: 'service_key_exposure',
              severity: 'high',
              description: `Service role key used in ${file}`,
              fix: 'Only use service role key in secure server contexts'
            })
          }

          // Check for direct database queries
          if (content.includes('sql`') || content.includes('query(')) {
            this.warnings.push({
              type: 'direct_sql_query',
              description: `Direct SQL query found in ${file}`,
              fix: 'Use Supabase client methods instead of raw SQL'
            })
          }
        }
      }

    } catch (error) {
      this.warnings.push({
        type: 'database_security_check_failed',
        description: 'Could not analyze database security configuration'
      })
    }
  }

  async checkAPISecurity() {
    try {
      const apiPath = 'app/api'
      const apiFiles = await fs.readdir(apiPath, { recursive: true })
      
      for (const file of apiFiles) {
        if (file.endsWith('/route.ts') || file.endsWith('/route.js')) {
          const filePath = path.join(apiPath, file)
          const content = await fs.readFile(filePath, 'utf8')
          
          // Check for CORS configuration
          if (content.includes('cors') && content.includes('*')) {
            this.vulnerabilities.push({
              type: 'permissive_cors',
              severity: 'medium',
              description: `Permissive CORS configuration in ${file}`,
              fix: 'Restrict CORS to specific origins'
            })
          }

          // Check for input validation
          if (content.includes('request.json()') && !content.includes('validate')) {
            this.warnings.push({
              type: 'missing_input_validation',
              description: `No input validation detected in ${file}`,
              fix: 'Add input validation using Zod or similar'
            })
          }

          // Check for authentication checks
          if (!content.includes('auth') && !content.includes('getUser')) {
            this.warnings.push({
              type: 'no_auth_check',
              description: `No authentication check in ${file}`,
              fix: 'Add authentication verification for protected endpoints'
            })
          }

          // Check for error information leakage
          if (content.includes('error.message') || content.includes('error.stack')) {
            this.vulnerabilities.push({
              type: 'error_info_leakage',
              severity: 'low',
              description: `Potential error information leakage in ${file}`,
              fix: 'Sanitize error messages before sending to client'
            })
          }
        }
      }

    } catch (error) {
      this.warnings.push({
        type: 'api_security_check_failed',
        description: 'Could not analyze API security configuration'
      })
    }
  }

  async checkCSP() {
    try {
      const nextConfigPath = 'next.config.js'
      const configContent = await fs.readFile(nextConfigPath, 'utf8')
      
      if (!configContent.includes('Content-Security-Policy')) {
        this.vulnerabilities.push({
          type: 'no_csp',
          severity: 'high',
          description: 'No Content Security Policy configured',
          fix: 'Implement Content Security Policy'
        })
        return
      }

      // Check for unsafe directives
      const unsafeDirectives = [
        "'unsafe-inline'",
        "'unsafe-eval'",
        "data:",
        "*"
      ]

      for (const directive of unsafeDirectives) {
        if (configContent.includes(directive)) {
          const severity = directive.includes('unsafe') ? 'high' : 'medium'
          this.vulnerabilities.push({
            type: 'unsafe_csp_directive',
            severity,
            description: `CSP contains unsafe directive: ${directive}`,
            fix: 'Remove unsafe directives and use nonce or hash-based CSP'
          })
        }
      }

      // Check for missing directives
      const recommendedDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'img-src',
        'connect-src',
        'frame-ancestors'
      ]

      for (const directive of recommendedDirectives) {
        if (!configContent.includes(directive)) {
          this.warnings.push({
            type: 'missing_csp_directive',
            description: `CSP missing recommended directive: ${directive}`
          })
        }
      }

    } catch (error) {
      this.warnings.push({
        type: 'csp_check_failed',
        description: 'Could not analyze Content Security Policy'
      })
    }
  }

  async checkRateLimiting() {
    try {
      const rateLimitPath = 'lib'
      const files = await fs.readdir(rateLimitPath, { recursive: true })
      
      let rateLimitImplemented = false
      
      for (const file of files) {
        if (file.includes('rate') || file.includes('limit')) {
          const filePath = path.join(rateLimitPath, file)
          const content = await fs.readFile(filePath, 'utf8')
          
          if (content.includes('RateLimit') || content.includes('ratelimit')) {
            rateLimitImplemented = true
            
            // Check for proper configuration
            if (!content.includes('window') && !content.includes('slidingWindow')) {
              this.warnings.push({
                type: 'basic_rate_limiting',
                description: 'Rate limiting implementation may be basic',
                fix: 'Consider implementing sliding window rate limiting'
              })
            }
          }
        }
      }

      if (!rateLimitImplemented) {
        this.vulnerabilities.push({
          type: 'no_rate_limiting',
          severity: 'high',
          description: 'No rate limiting implementation found',
          fix: 'Implement rate limiting for API endpoints'
        })
      }

    } catch (error) {
      this.warnings.push({
        type: 'rate_limit_check_failed',
        description: 'Could not analyze rate limiting configuration'
      })
    }
  }

  async checkInputValidation() {
    try {
      const validationPath = 'lib/security/validation.ts'
      const content = await fs.readFile(validationPath, 'utf8')
      
      // Check for comprehensive validation patterns
      const securityPatterns = [
        'XSS_PATTERNS',
        'SQL_INJECTION_PATTERNS',
        'validateSecure',
        'sanitize'
      ]

      for (const pattern of securityPatterns) {
        if (!content.includes(pattern)) {
          this.warnings.push({
            type: 'missing_validation_pattern',
            description: `Missing validation pattern: ${pattern}`,
            fix: 'Implement comprehensive input validation'
          })
        }
      }

      // Check for advanced security features
      if (!content.includes('prototype pollution')) {
        this.warnings.push({
          type: 'missing_advanced_validation',
          description: 'Missing advanced security validations like prototype pollution protection'
        })
      }

    } catch (error) {
      this.vulnerabilities.push({
        type: 'no_input_validation',
        severity: 'high',
        description: 'No input validation system found',
        fix: 'Implement comprehensive input validation and sanitization'
      })
    }
  }

  async checkErrorHandling() {
    try {
      const errorBoundaryPath = 'lib/production/error-boundaries.tsx'
      const content = await fs.readFile(errorBoundaryPath, 'utf8')
      
      // Check for Sentry integration
      if (!content.includes('Sentry')) {
        this.warnings.push({
          type: 'no_error_reporting',
          description: 'No error reporting system detected',
          fix: 'Implement error reporting with Sentry or similar'
        })
      }

      // Check for information leakage prevention
      if (!content.includes('NODE_ENV') || !content.includes('production')) {
        this.vulnerabilities.push({
          type: 'error_info_leakage',
          severity: 'medium',
          description: 'Error boundaries may leak sensitive information',
          fix: 'Ensure error details are hidden in production'
        })
      }

    } catch (error) {
      this.vulnerabilities.push({
        type: 'no_error_boundaries',
        severity: 'medium',
        description: 'No error boundary system found',
        fix: 'Implement React error boundaries'
      })
    }
  }

  async checkSecretsManagement() {
    try {
      // Check for hardcoded secrets in source files
      const srcFiles = await this.getAllSourceFiles('.')
      
      const secretPatterns = [
        /sk_[a-zA-Z0-9]+/g,
        /pk_[a-zA-Z0-9]+/g,
        /password\s*=\s*["'][^"']+["']/gi,
        /secret\s*=\s*["'][^"']+["']/gi,
        /api[_-]?key\s*=\s*["'][^"']+["']/gi,
        /token\s*=\s*["'][^"']+["']/gi
      ]

      for (const file of srcFiles) {
        if (file.includes('node_modules') || file.includes('.git')) continue
        
        try {
          const content = await fs.readFile(file, 'utf8')
          
          for (const pattern of secretPatterns) {
            const matches = content.match(pattern)
            if (matches) {
              this.vulnerabilities.push({
                type: 'hardcoded_secret',
                severity: 'critical',
                description: `Potential hardcoded secret in ${file}`,
                fix: 'Move secrets to environment variables'
              })
              break
            }
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }

    } catch (error) {
      this.warnings.push({
        type: 'secrets_check_failed',
        description: 'Could not check for hardcoded secrets'
      })
    }
  }

  async getAllSourceFiles(dir) {
    const files = []
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
            files.push(...await this.getAllSourceFiles(fullPath))
          }
        } else if (entry.isFile()) {
          if (['.ts', '.tsx', '.js', '.jsx', '.env'].some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath)
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return files
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      securityScore: Math.max(0, this.securityScore),
      summary: {
        vulnerabilities: this.vulnerabilities.length,
        warnings: this.warnings.length,
        critical: this.vulnerabilities.filter(v => v.severity === 'critical').length,
        high: this.vulnerabilities.filter(v => v.severity === 'high').length,
        medium: this.vulnerabilities.filter(v => v.severity === 'medium').length,
        low: this.vulnerabilities.filter(v => v.severity === 'low').length
      },
      vulnerabilities: this.vulnerabilities,
      warnings: this.warnings,
      recommendations: this.recommendations
    }

    const reportPath = 'security-audit-report.json'
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    console.log(`📄 Security audit report saved to: ${reportPath}`)
  }

  displayResults() {
    console.log('\n🔒 SECURITY AUDIT RESULTS')
    console.log('=========================')
    
    const critical = this.vulnerabilities.filter(v => v.severity === 'critical').length
    const high = this.vulnerabilities.filter(v => v.severity === 'high').length
    const medium = this.vulnerabilities.filter(v => v.severity === 'medium').length
    const low = this.vulnerabilities.filter(v => v.severity === 'low').length

    console.log(`Security Score: ${Math.max(0, this.securityScore)}/100`)
    console.log(`Total Vulnerabilities: ${this.vulnerabilities.length}`)
    console.log(`  Critical: ${critical} 🔴`)
    console.log(`  High: ${high} 🟠`)
    console.log(`  Medium: ${medium} 🟡`)
    console.log(`  Low: ${low} 🟢`)
    console.log(`Warnings: ${this.warnings.length}`)
    console.log('')

    if (critical > 0) {
      console.log('🚨 CRITICAL VULNERABILITIES:')
      this.vulnerabilities
        .filter(v => v.severity === 'critical')
        .forEach(v => {
          console.log(`❌ ${v.description}`)
          console.log(`   Fix: ${v.fix}\n`)
        })
    }

    if (high > 0) {
      console.log('🔴 HIGH SEVERITY ISSUES:')
      this.vulnerabilities
        .filter(v => v.severity === 'high')
        .forEach(v => {
          console.log(`⚠️  ${v.description}`)
          console.log(`   Fix: ${v.fix}\n`)
        })
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  SECURITY WARNINGS:')
      this.warnings.slice(0, 5).forEach(w => {
        console.log(`• ${w.description}`)
      })
      
      if (this.warnings.length > 5) {
        console.log(`... and ${this.warnings.length - 5} more warnings`)
      }
      console.log('')
    }

    let status = '🟢 SECURE'
    if (critical > 0) {
      status = '🚨 CRITICAL ISSUES'
    } else if (high > 0) {
      status = '🔴 HIGH RISK'
    } else if (medium > 2) {
      status = '🟡 MODERATE RISK'
    }

    console.log(`Status: ${status}`)
    console.log('')

    if (critical > 0 || high > 0) {
      console.log('❌ Fix critical and high severity issues before production deployment')
      process.exit(1)
    } else if (medium > 2) {
      console.log('⚠️  Consider fixing medium severity issues')
      process.exit(0)
    } else {
      console.log('✅ Security audit passed - ready for production')
      process.exit(0)
    }
  }
}

// Run audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor()
  auditor.runAudit().catch(error => {
    console.error('Security audit failed:', error)
    process.exit(1)
  })
}

module.exports = SecurityAuditor