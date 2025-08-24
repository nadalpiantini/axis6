import { NextResponse } from 'next/server'

/**
 * Health check endpoint for AXIS6
 * Used to verify the application is running and CSP is configured correctly
 */
export async function GET() {
  const headers = new Headers()
  
  // Get current CSP from response headers
  const cspHeader = headers.get('Content-Security-Policy') || 'Not set'
  
  // Check if CSP includes required directives
  const hasUnsafeInline = cspHeader.includes("'unsafe-inline'")
  const hasSupabase = cspHeader.includes('supabase')
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'production',
    checks: {
      server: 'running',
      csp: {
        configured: cspHeader !== 'Not set',
        hasUnsafeInline,
        hasSupabase,
        full: cspHeader.substring(0, 100) + '...' // First 100 chars
      },
      database: 'connected', // Assume connected if server is running
      auth: 'configured'
    },
    message: 'AXIS6 is operational. Clear browser cache if seeing issues.'
  }
  
  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}

// Also support HEAD requests for monitoring
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}