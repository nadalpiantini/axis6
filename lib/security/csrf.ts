import { NextRequest, NextResponse } from 'next/server'
const CSRF_SECRET = process.env['CSRF_SECRET'] || (() => {
  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('CSRF_SECRET environment variable is required in production')
  }
  return 'dev-csrf-secret-not-for-production'
})()
const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = '__Host-csrf'
const CSRF_HEADER_NAME = 'x-csrf-token'
/**
 * Generates a CSRF token using Web Crypto API (Edge Runtime compatible)
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}
/**
 * Creates a CSRF token hash using Web Crypto API HMAC (Edge Runtime compatible)
 */
async function createTokenHash(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(CSRF_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(token)
  )
  
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('')
}
/**
 * Validates a CSRF token using Web Crypto API (Edge Runtime compatible)
 */
async function validateToken(token: string, hash: string): Promise<boolean> {
  const expectedHash = await createTokenHash(token)
  
  // Web Crypto API compatible timing-safe comparison
  if (expectedHash.length !== hash.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < expectedHash.length; i++) {
    result |= expectedHash.charCodeAt(i) ^ hash.charCodeAt(i)
  }
  
  return result === 0
}
/**
 * Gets CSRF token from request
 */
function getTokenFromRequest(request: NextRequest): string | null {
  // Check header first (for AJAX requests)
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) return headerToken
  // Check body for form submissions
  if (request.method === 'POST') {
    // This would need to be parsed from the body
    // For now, we'll rely on header-based tokens
  }
  return null
}
/**
 * CSRF protection middleware for API routes
 */
export async function validateCSRF(request: NextRequest): Promise<NextResponse | null> {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null
  }
  // CSRF protection is always enforced for security
  // Development bypass removed to prevent CSRF attacks in all environments
  // Get token from request
  const token = getTokenFromRequest(request)
  if (!token) {
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { status: 403 }
    )
  }
  // Get token hash from cookie
  const cookieHeader = request.headers.get('cookie')
  const cookies = cookieHeader ? parseCookies(cookieHeader) : {}
  const tokenHash = cookies[CSRF_COOKIE_NAME]
  if (!tokenHash) {
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 403 }
    )
  }
  // Validate token
  try {
    if (!(await validateToken(token, tokenHash))) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'CSRF validation error' },
      { status: 403 }
    )
  }
  // Token is valid
  return null
}
/**
 * Sets CSRF token in response cookies
 */
export async function setCSRFCookie(response: NextResponse, token: string): Promise<void> {
  const tokenHash = await createTokenHash(token)
  // Use __Host- prefix for additional security
  // This requires: Secure, Path=/, no Domain attribute
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: tokenHash,
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })
}
/**
 * Helper to parse cookies from header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = value
    }
  })
  return cookies
}
/**
 * Middleware wrapper for API routes with CSRF protection
 */
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Validate CSRF token
    const csrfError = await validateCSRF(request)
    if (csrfError) {
      return csrfError
    }
    // Call the actual handler
    return handler(request)
  }
}
/**
 * Hook to get CSRF token on client side
 * This would be used in a client component
 */
export function useCSRFToken(): { token: string | null; refreshToken: () => Promise<void> } {
  // This is a placeholder for client-side implementation
  // In a real implementation, this would:
  // 1. Fetch token from an endpoint
  // 2. Store it in state
  // 3. Provide it for API calls
  return {
    token: null,
    refreshToken: async () => {
      // Fetch new token from /api/csrf endpoint
    }
  }
}
