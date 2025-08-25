import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { withEnhancedRateLimit } from '@/lib/middleware/enhanced-rate-limit'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/settings', '/stats', '/profile', '/analytics', '/achievements']

// Public routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']

// Rate limiting configuration for different route patterns
const rateLimitRoutes = {
  '/api/auth/': 'auth',
  '/api/auth/register': 'register',
  '/api/auth/forgot-password': 'passwordReset',
  '/api/': 'api',
} as const

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Determine rate limit type based on route
    let limiterType: 'auth' | 'register' | 'passwordReset' | 'api' = 'api'
    
    for (const [route, type] of Object.entries(rateLimitRoutes)) {
      if (pathname.startsWith(route)) {
        limiterType = type as any
        break
      }
    }
    
    // Apply rate limiting
    const { response: rateLimitResponse, headers: rateLimitHeaders } = await withEnhancedRateLimit(
      request,
      limiterType
    )
    
    if (rateLimitResponse) {
      return rateLimitResponse // Request was rate limited
    }
    
    // Continue with rate limit headers
    const response = NextResponse.next()
    
    // Add rate limit headers
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  }
  
  const response = NextResponse.next()

  // Add basic security headers for non-API routes
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Skip auth check for public routes
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/auth')) {
    return response
  }

  // Check authentication for protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    try {
      const supabase = createServerClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
            }
          }
        }
      )

      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
    } catch (error) {
      console.error('Middleware auth error:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}