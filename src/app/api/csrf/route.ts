import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFCookie } from '@/lib/security/csrf'

/**
 * GET /api/csrf
 * Returns a CSRF token for the client to use in subsequent requests
 */
export async function GET(request: NextRequest) {
  try {
    // Generate a new CSRF token
    const token = generateCSRFToken()
    
    // Create response
    const response = NextResponse.json({
      token,
      message: 'CSRF token generated successfully'
    })
    
    // Set the token hash in a secure cookie
    setCSRFCookie(response, token)
    
    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}