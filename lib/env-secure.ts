/**
 * SECURE ENVIRONMENT VARIABLE MANAGEMENT
 * Type-safe environment validation with security checks
 * Priority: CRITICAL - Prevents configuration vulnerabilities
 */
import { z } from 'zod'
import { logger } from '@/lib/logger'
// =====================================================
// SECURE VALIDATION SCHEMAS
// =====================================================
const urlSchema = z.string().url('Invalid URL format')
const uuidSchema = z.string().uuid('Invalid UUID format')
const jwtSchema = z.string().regex(
  /^[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]{2,}){2}$/,
  'Invalid JWT format'
)
const apiKeySchema = z.string().min(20, 'API key too short - potential security risk')
/**
 * Production environment variables with strict validation
 */
const productionEnvSchema = z.object({
  // Core Node environment
  NODE_ENV: z.literal('production'),
  // CRITICAL: Supabase credentials
  NEXT_PUBLIC_SUPABASE_URL: urlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: jwtSchema,
  SUPABASE_SERVICE_ROLE_KEY: jwtSchema.refine(
    (key) => key !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'Service role key cannot be the same as anon key'
  ),
  // Security tokens
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters'),
  // External service credentials
  VERCEL_TOKEN: z.string().min(20, 'Vercel token too short'),
  VERCEL_TEAM_ID: z.string().startsWith('team_', 'Invalid Vercel team ID format'),
  // Email service
  RESEND_API_KEY: z.string().startsWith('re_', 'Invalid Resend API key format'),
  RESEND_FROM_EMAIL: z.string().email('Invalid sender email'),
  // Cloud infrastructure
  CLOUDFLARE_API_TOKEN: z.string().min(30, 'Cloudflare token too short'),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(32, 'Invalid Cloudflare account ID'),
  // Redis (required for production rate limiting)
  UPSTASH_REDIS_REST_URL: urlSchema,
  UPSTASH_REDIS_REST_TOKEN: z.string().min(50, 'Redis token too short'),
  // Optional but recommended
  SENTRY_DSN: urlSchema.optional(),
  DEEPSEEK_API_KEY: z.string().startsWith('sk-', 'Invalid DeepSeek API key').optional(),
  // Application URLs
  NEXT_PUBLIC_APP_URL: urlSchema,
})
/**
 * Development environment variables with relaxed validation
 */
const developmentEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test']),
  // Required for basic functionality
  NEXT_PUBLIC_SUPABASE_URL: urlSchema,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: jwtSchema,
  SUPABASE_SERVICE_ROLE_KEY: jwtSchema,
  // Optional in development
  CSRF_SECRET: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_TEAM_ID: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
})
// =====================================================
// SECURITY VALIDATION FUNCTIONS
// =====================================================
/**
 * Check for hardcoded secrets in environment
 */
function validateSecurityPatterns(env: Record<string, string>): {
  violations: string[]
  warnings: string[]
} {
  const violations: string[] = []
  const warnings: string[] = []
  // Check for common security anti-patterns
  Object.entries(env).forEach(([key, value]) => {
    if (!value) return
    // Check for hardcoded test/demo values
    const testPatterns = [
      /test.*key/i,
      /demo.*key/i,
      /sample.*key/i,
      /your.*key/i,
      /example.*key/i,
      /placeholder/i,
    ]
    if (testPatterns.some(pattern => pattern.test(value))) {
      violations.push(`${key} appears to contain test/placeholder value`)
    }
    // Check for weak secrets
    if (key.includes('SECRET') || key.includes('TOKEN') || key.includes('KEY')) {
      if (value.length < 20) {
        warnings.push(`${key} is suspiciously short (${value.length} chars)`)
      }
      if (/^[a-zA-Z0-9]+$/.test(value) && value.length < 32) {
        warnings.push(`${key} may not have sufficient entropy`)
      }
    }
    // Check for exposed local paths
    if (value.includes('/Users/') || value.includes('/home/') || value.includes('C:\\')) {
      violations.push(`${key} contains local file system path`)
    }
  })
  return { violations, warnings }
}
/**
 * Validate environment configuration with security checks
 */
function validateEnvironment(): {
  env: Record<string, any>
  isProduction: boolean
  securityLevel: 'high' | 'medium' | 'low'
  issues: string[]
} {
  const isProduction = process.env.NODE_ENV === 'production'
  const schema = isProduction ? productionEnvSchema : developmentEnvSchema
  try {
    // Parse and validate environment
    const parsed = schema.parse(process.env)
    // Additional security validation
    const { violations, warnings } = validateSecurityPatterns(process.env as Record<string, string>)
    // Determine security level
    let securityLevel: 'high' | 'medium' | 'low' = 'high'
    if (violations.length > 0) {
      securityLevel = 'low'
    } else if (warnings.length > 2) {
      securityLevel = 'medium'
    }
    // Log security assessment
    if (violations.length > 0) {
      logger.error('Environment security violations detected', violations)
    }
    if (warnings.length > 0) {
      logger.warn('Environment security warnings', warnings)
    }
    logger.info('Environment validation complete', {
      isProduction,
      securityLevel,
      violationsCount: violations.length,
      warningsCount: warnings.length,
    })
    return {
      env: parsed,
      isProduction,
      securityLevel,
      issues: [...violations, ...warnings],
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      logger.error('Environment validation failed', {
        errors: errorMessages,
        isProduction,
      })
      if (isProduction) {
        throw new Error(`Critical environment validation failed: ${errorMessages.join(', ')}`)
      }
      return {
        env: process.env,
        isProduction,
        securityLevel: 'low',
        issues: errorMessages,
      }
    }
    throw error
  }
}
// =====================================================
// VALIDATED ENVIRONMENT EXPORT
// =====================================================
const envValidation = validateEnvironment()
/**
 * Type-safe and security-validated environment variables
 */
export const secureEnv = {
  // Environment info
  NODE_ENV: envValidation.env.NODE_ENV || 'development',
  isProduction: envValidation.isProduction,
  isDevelopment: !envValidation.isProduction,
  securityLevel: envValidation.securityLevel,
  // Supabase configuration
  supabase: {
    url: envValidation.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: envValidation.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: envValidation.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  // Security configuration
  security: {
    csrfSecret: envValidation.env.CSRF_SECRET || 'dev-csrf-secret-not-for-production',
    enableCSRF: !!envValidation.env.CSRF_SECRET,
    enableRateLimit: !!(envValidation.env.UPSTASH_REDIS_REST_URL && envValidation.env.UPSTASH_REDIS_REST_TOKEN),
  },
  // External services
  services: {
    vercel: {
      token: envValidation.env.VERCEL_TOKEN,
      teamId: envValidation.env.VERCEL_TEAM_ID,
    },
    resend: {
      apiKey: envValidation.env.RESEND_API_KEY,
      fromEmail: envValidation.env.RESEND_FROM_EMAIL,
    },
    cloudflare: {
      apiToken: envValidation.env.CLOUDFLARE_API_TOKEN,
      accountId: envValidation.env.CLOUDFLARE_ACCOUNT_ID,
    },
    redis: {
      url: envValidation.env.UPSTASH_REDIS_REST_URL,
      token: envValidation.env.UPSTASH_REDIS_REST_TOKEN,
    },
    ai: {
      deepseekKey: envValidation.env.DEEPSEEK_API_KEY,
    },
  },
  // Application URLs
  urls: {
    app: envValidation.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    api: `${envValidation.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api`,
  },
  // Security audit results
  audit: {
    issues: envValidation.issues,
    securityLevel: envValidation.securityLevel,
    validatedAt: new Date().toISOString(),
  },
} as const
/**
 * Runtime security check for critical production requirements
 */
export function performRuntimeSecurityCheck(): {
  passed: boolean
  critical: string[]
  warnings: string[]
} {
  const critical: string[] = []
  const warnings: string[] = []
  if (secureEnv.isProduction) {
    // Critical production requirements
    if (!secureEnv.security.csrfSecret || secureEnv.security.csrfSecret.includes('dev-')) {
      critical.push('CSRF secret not configured for production')
    }
    if (!secureEnv.security.enableRateLimit) {
      critical.push('Redis rate limiting not configured for production')
    }
    if (!secureEnv.services.resend.apiKey) {
      warnings.push('Email service not configured')
    }
    if (secureEnv.urls.app.includes('localhost')) {
      critical.push('Production app URL still pointing to localhost')
    }
    if (secureEnv.audit.securityLevel === 'low') {
      critical.push('Environment security level is low')
    }
  }
  return {
    passed: critical.length === 0,
    critical,
    warnings,
  }
}
/**
 * Helper to get environment variable with runtime validation
 */
export function getSecureEnvVar(key: keyof typeof secureEnv, required = false): any {
  const value = (secureEnv as any)[key]
  if (required && (!value || value === '')) {
    throw new Error(`Required environment variable missing: ${key}`)
  }
  return value
}
/**
 * Export specific configurations for different modules
 */
export const supabaseConfig = secureEnv.supabase
export const securityConfig = secureEnv.security
export const servicesConfig = secureEnv.services
export const urlsConfig = secureEnv.urls
// Perform runtime security check
const runtimeCheck = performRuntimeSecurityCheck()
if (!runtimeCheck.passed) {
  if (secureEnv.isProduction) {
    logger.error('CRITICAL: Production security requirements not met', runtimeCheck.critical)
    // In production, these are fatal errors
    throw new Error(`Production security check failed: ${runtimeCheck.critical.join(', ')}`)
  } else {
    logger.warn('Development security warnings', [...runtimeCheck.critical, ...runtimeCheck.warnings])
  }
}