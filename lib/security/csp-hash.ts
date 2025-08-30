/**
 * Advanced Content Security Policy with hash-based inline script/style support
 * Provides enterprise-grade security while maintaining Next.js compatibility
 */

import crypto from 'crypto'

import { handleError } from '@/lib/error/standardErrorHandler'
// Track generated hashes for CSP header
const scriptHashes = new Set<string>()
const styleHashes = new Set<string>()

/**
 * Generate SHA-256 hash for inline content
 */
export function generateHash(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('base64')
}

/**
 * Add script hash to CSP allowlist
 */
export function addScriptHash(content: string): string {
  const hash = generateHash(content)
  scriptHashes.add(`'sha256-${hash}'`)
  return hash
}

/**
 * Add style hash to CSP allowlist
 */
export function addStyleHash(content: string): string {
  const hash = generateHash(content)
  styleHashes.add(`'sha256-${hash}'`)
  return hash
}

/**
 * Clear all hashes (useful for development)
 */
export function clearHashes(): void {
  scriptHashes.clear()
  styleHashes.clear()
}

/**
 * Get all script hashes for CSP
 */
export function getScriptHashes(): string[] {
  return Array.from(scriptHashes)
}

/**
 * Get all style hashes for CSP
 */
export function getStyleHashes(): string[] {
  return Array.from(styleHashes)
}

/**
 * Pre-calculated hashes for known Next.js inline scripts
 * These are generated at build time for static inline content
 */
export const KNOWN_SCRIPT_HASHES = [
  // Next.js runtime configuration
  "'sha256-3lOkjJNnFFx5Yg8j3o8ePsEPrmhZC+MK4o3FfM0ixVw='",
  // Vercel analytics
  "'sha256-RFWPLDbv2BY+rCkDzsE+0fr8ylGr2R2faWMhq4lfEQc='",
] as const

export const KNOWN_STYLE_HASHES = [
  // Next.js inline styles
  "'sha256-4Su6mBWzEIjLjn8lzXm7CUV4A5mRpq5jUZ+jZZ8K9z0='",
  // Tailwind runtime styles
  "'sha256-BiLFinpqYMtWHmXfkcDvV8wjvcZ/y6JJdNvGOyUL6NQ='",
] as const

/**
 * Production CSP configuration with hash-based inline support
 */
export function getProductionCSP(): string {
  const scriptSources = [
    "'self'",
    ...KNOWN_SCRIPT_HASHES,
    ...getScriptHashes(),
    // External domains
    "https://*.supabase.co",
    "https://*.vercel-scripts.com",
    "https://vercel.live",
    "https://vitals.vercel-insights.com",
  ]

  const styleSources = [
    "'self'",
    ...KNOWN_STYLE_HASHES,
    ...getStyleHashes(),
    // External domains
    "https://fonts.googleapis.com",
  ]

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    `style-src ${styleSources.join(' ')}`,
    "img-src 'self' data: blob: https://*.supabase.co https://nvpnhqhjttgwfwvkgmpk.supabase.co",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com",
    "frame-src 'self' https://*.supabase.co",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.supabase.co",
    "upgrade-insecure-requests",
  ].join('; ')
}

/**
 * Development CSP configuration (more permissive for Next.js dev features)
 */
export function getDevelopmentCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co https://*.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://localhost:* http://localhost:*",
    "frame-src 'self' https://*.supabase.co",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.supabase.co",
  ].join('; ')
}

/**
 * Get CSP header value based on environment
 */
export function getCSPHeader(): string {
  const isDevelopment = process.env['NODE_ENV'] === 'development'
  return isDevelopment ? getDevelopmentCSP() : getProductionCSP()
}

/**
 * Middleware helper for CSP headers
 */
export function addCSPHeaders(headers: Headers): void {
  const cspHeader = getCSPHeader()

  headers.set('Content-Security-Policy', cspHeader)
  headers.set('X-Content-Security-Policy', cspHeader) // IE compatibility
  headers.set('X-WebKit-CSP', cspHeader) // Webkit compatibility
}

/**
 * Report CSP violations (for monitoring)
 */
export interface CSPViolation {
  'document-uri': string
  referrer?: string
  'blocked-uri'?: string
  'violated-directive': string
  'original-policy': string
  'effective-directive': string
  'script-sample'?: string
  'source-file'?: string
  'line-number'?: number
  'column-number'?: number
}

export function handleCSPViolation(violation: CSPViolation): void {
  // In development, log to console
  if (process.env['NODE_ENV'] === 'development') {
    handleError(error, {
      operation: 'security_operation', component: 'csp-hash',

      userMessage: 'Security operation failed.'

    })
  }

  // In production, send to monitoring service
  if (process.env['NODE_ENV'] === 'production') {
    // Could send to Sentry, DataDog, etc.
    handleError(error, {
      operation: 'security_operation', component: 'csp-hash',

      userMessage: 'Security operation failed.'

    })
  }
}
