/**
 * Environment Variable Validation
 * 
 * This module validates all environment variables at build/runtime
 * to ensure the application has all required configuration.
 */

import { z } from 'zod'

import { logger } from '@/lib/logger'

/**
 * Server-side environment variables schema
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  
  // Redis/Upstash (optional but recommended for production)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Security
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters').optional(),
  
  // App configuration
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Email (optional, for future email features)
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().transform(Number).pipe(z.number()).optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  
  // Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),
  
  // Monitoring (optional but recommended for production)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Database URL (for direct database connections if needed)
  DATABASE_URL: z.string().url().optional(),
  
  // Feature flags
  ENABLE_REDIS_RATE_LIMIT: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .default('false'),
  ENFORCE_CSRF: z
    .string()
    .transform((val) => val === 'true')
    .optional()
    .default('false'),
})

/**
 * Client-side environment variables schema
 * These are exposed to the browser, so be careful what you include
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),
})

/**
 * Validate server environment variables
 */
function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env)
  
  if (!parsed.success) {
    logger.error('Invalid environment variables', parsed.error.flatten().fieldErrors)
    
    // In production, throw to prevent the app from starting with invalid config
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('Invalid environment variables')
    }
    
    // In development, warn but continue
    logger.warn('Running with invalid environment variables. Some features may not work.')
  }
  
  return parsed.data
}

/**
 * Validate client environment variables
 */
function validateClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env['NEXT_PUBLIC_SUPABASE_URL'],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    NEXT_PUBLIC_APP_URL: process.env['NEXT_PUBLIC_APP_URL'],
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env['NEXT_PUBLIC_GA_MEASUREMENT_ID'],
    NEXT_PUBLIC_VERCEL_ANALYTICS_ID: process.env['NEXT_PUBLIC_VERCEL_ANALYTICS_ID'],
  })
  
  if (!parsed.success) {
    logger.error('Invalid client environment variables', parsed.error.flatten().fieldErrors)
    
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error('Invalid client environment variables')
    }
  }
  
  return parsed.data
}

// Validate environment variables at module load time
const serverEnv = typeof window === 'undefined' ? validateServerEnv() : undefined
const clientEnv = validateClientEnv()

/**
 * Type-safe environment variables
 * Use these throughout your application instead of process.env
 */
export const env = {
  // Server-only variables (not available in the browser)
  ...(serverEnv || {}),
  
  // Client variables (available everywhere)
  ...clientEnv,
  
  // Computed values
  isDevelopment: process.env['NODE_ENV'] === 'development',
  isProduction: process.env['NODE_ENV'] === 'production',
  isTest: process.env['NODE_ENV'] === 'test',
  
  // Feature flags with defaults
  features: {
    redisRateLimit: serverEnv?.ENABLE_REDIS_RATE_LIMIT ?? false,
    enforceCSRF: serverEnv?.ENFORCE_CSRF ?? false,
  },
  
  // URLs with defaults
  urls: {
    app: clientEnv?.NEXT_PUBLIC_APP_URL || 'http://localhost:6789',
    supabase: clientEnv?.NEXT_PUBLIC_SUPABASE_URL || '',
  },
} as const

// Type exports
export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>
export type Env = typeof env

/**
 * Helper to get required environment variable
 * Throws if not found
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Helper to get optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue
}