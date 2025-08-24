import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/settings', '/stats']

// Public routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Add request tracking and security headers
  response.headers.set('X-Request-Id', crypto.randomUUID())
  
  // Let next.config.js handle CSP - remove conflicting headers here
  // Only set non-CSP security headers in middleware
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Allow frames from Supabase for auth (less restrictive than DENY)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  
  // Supabase-friendly referrer policy
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    // Only allow same-origin requests in production
    const origin = request.headers.get('origin')
    const isAllowedOrigin = process.env.NODE_ENV === 'development' 
      ? true 
      : origin === process.env.NEXT_PUBLIC_APP_URL

    if (isAllowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Max-Age', '86400')
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers })
    }
  }

  // Check authentication for protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    try {
      // Create a Supabase client configured for middleware
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              response.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove(name: string, options: any) {
              response.cookies.set({
                name,
                value: '',
                ...options,
              })
            },
          },
        }
      )
      
      // Check if we have a session
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Redirect to login page with return URL
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('returnTo', pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Add user ID to request headers for downstream use
      response.headers.set('X-User-Id', session.user.id)
    } catch (error) {
      // On error, redirect to login
      const redirectUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check if authenticated users are trying to access auth pages
  const isAuthPage = ['/auth/login', '/auth/register'].includes(pathname)
  
  if (isAuthPage) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: any) {
              response.cookies.set({
                name,
                value,
                ...options,
              })
            },
            remove(name: string, options: any) {
              response.cookies.set({
                name,
                value: '',
                ...options,
              })
            },
          },
        }
      )
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Redirect authenticated users away from auth pages
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch {
      // Continue to auth page on error
    }
  }

  return response
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}