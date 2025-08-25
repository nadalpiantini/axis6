import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

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
 * Generates a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Creates a CSRF token hash using HMAC
 */
function createTokenHash(token: string): string {
  return crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex')
}

/**
 * Validates a CSRF token
 */
function validateToken(token: string, hash: string): boolean {
  const expectedHash = createTokenHash(token)
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash),
    Buffer.from(hash)
  )
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
    if (!validateToken(token, tokenHash)) {
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
export function setCSRFCookie(response: NextResponse, token: string): void {
  const tokenHash = createTokenHash(token)
  
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