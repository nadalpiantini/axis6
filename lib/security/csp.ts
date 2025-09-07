// Web Crypto API compatible functions for Edge Runtime
/**
 * Generate a cryptographically secure nonce for CSP (Edge Runtime compatible)
 */
export function generateNonce(): string {
  const array = new Uint8Array(12)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/[+/]/g, '')
    .substring(0, 16)
}
/**
 * Generate SHA256 hash for inline scripts/styles (Edge Runtime compatible)
 */
export async function generateHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  return btoa(String.fromCharCode.apply(null, hashArray))
}
/**
 * Build CSP header value with proper directives
 */
export function buildCSP(nonce?: string, isDevelopment = false): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Vercel analytics
      "'unsafe-eval'", // Required for Next.js in development
      "https://vercel.live",
      "https://vitals.vercel-insights.com",
      // Supabase
      "https://nvpnhqhjttgwfwvkgmpk.supabase.co",
      "https://*.supabase.co",
      // Sentry
      "https://*.sentry.io",
      "https://*.ingest.sentry.io",
      // Add nonce if provided
      ...(nonce ? [`'nonce-${nonce}'`] : []),
      // Development only
      ...(isDevelopment ? [
        "'unsafe-inline'", // Allow inline scripts in dev
        "webpack:",
        "blob:",
      ] : [])
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and styled-components
      "https://fonts.googleapis.com",
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "https:",
      // Vercel
      "https://vercel.com",
      "https://assets.vercel.com",
      // Supabase
      "https://nvpnhqhjttgwfwvkgmpk.supabase.co",
      "https://*.supabase.co",
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "data:",
    ],
    'connect-src': [
      "'self'",
      // API routes
      `${process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'}/api/`,
      // Supabase
      "https://nvpnhqhjttgwfwvkgmpk.supabase.co",
      "https://*.supabase.co",
      "wss://*.supabase.co", // WebSocket for realtime
      // Vercel analytics
      "https://vitals.vercel-insights.com",
      // Sentry
      "https://*.sentry.io",
      "https://*.ingest.sentry.io",
      // Development
      ...(isDevelopment ? [
        "ws://localhost:*",
        "http://localhost:*",
      ] : [])
    ],
    'frame-src': [
      "'self'",
      // Supabase auth
      "https://nvpnhqhjttgwfwvkgmpk.supabase.co",
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
    'upgrade-insecure-requests': isDevelopment ? [] : [''],
  }
  // Convert to CSP string
  return Object.entries(directives)
    .filter(([, values]) => values.length > 0)
    .map(([directive, values]) =>
      values.length === 1 && values[0] === ''
        ? directive
        : `${directive} ${values.join(' ')}`
    )
    .join('; ')
}
/**
 * Middleware helper to set CSP headers
 */
export function setCSPHeaders(response: Response, nonce?: string, isDevelopment = false): Response {
  const csp = buildCSP(nonce, isDevelopment)
  // Set CSP header
  response.headers.set('Content-Security-Policy', csp)
  // Set additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // HSTS in production only
  if (!isDevelopment) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  return response
}
/**
 * Get allowed inline script hashes for common patterns
 */
export async function getInlineScriptHashes(): Promise<string[]> {
  const commonScripts = [
    // Supabase auth helper
    'window.supabaseAuthStateSync = true;',
    // Vercel analytics
    'window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};',
  ]
  return Promise.all(commonScripts.map(generateHash))
}
/**
 * CSP violation reporting endpoint helper
 */
export interface CSPViolationReport {
  'document-uri': string
  'violated-directive': string
  'blocked-uri': string
  'line-number': number
  'source-file': string
  'status-code': number
}
export function logCSPViolation(report: CSPViolationReport): void {
  const { logger } = require('@/lib/logger')
  logger.warn('CSP Violation detected', {
    directive: report['violated-directive'],
    blockedUri: report['blocked-uri'],
    documentUri: report['document-uri'],
    sourceFile: report['source-file'],
    lineNumber: report['line-number'],
  })
  // In production, send to monitoring service
  if (process.env['NODE_ENV'] === 'production') {
    // Send to error tracking service
    try {
      fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'csp_violation',
          error: report,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        // Fail silently if reporting fails
      })
    } catch {
      // Fail silently
    }
  }
}
