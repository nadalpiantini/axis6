/**
 * CSRF Token Management API
 * Provides secure CSRF tokens for client applications
 * Priority: HIGH - Prevents cross-site request forgery
 */
import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFCookie } from '@/lib/security/csrf'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// GET /api/csrf - Get CSRF token for authenticated users
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate new CSRF token
    const token = generateCSRFToken()
    // Create response with token
    const response = NextResponse.json({
      token,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      user_id: user.id,
    })
    // Set secure cookie
    setCSRFCookie(response, token)
    logger.info('CSRF token generated', {
      userId: user.id,
      ip: request.ip || request.headers.get('x-forwarded-for'),
    })
    return response
  } catch (error) {
    logger.error('CSRF token generation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

// POST /api/csrf/validate - Validate CSRF token (for testing)
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }
    
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // The validateCSRF middleware already validated the token
    // If we reach here, the token is valid
    logger.info('CSRF token validated', {
      userId: user.id,
      ip: request.ip || request.headers.get('x-forwarded-for'),
    })
    return NextResponse.json({
      valid: true,
      user_id: user.id,
    })
  } catch (error) {
    logger.error('CSRF validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 400 }
    )
  }
}

// DELETE /api/csrf - Invalidate CSRF token
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Create response that clears the CSRF cookie
    const response = NextResponse.json({
      message: 'CSRF token invalidated',
      user_id: user.id,
    })
    // Clear CSRF cookie
    response.cookies.set({
      name: '__Host-csrf',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // Immediate expiration
    })
    logger.info('CSRF token invalidated', {
      userId: user.id,
      ip: request.ip || request.headers.get('x-forwarded-for'),
    })
    return response
  } catch (error) {
    logger.error('CSRF token invalidation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Failed to invalidate CSRF token' },
      { status: 500 }
    )
  }
}