import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportError } from '@/lib/monitoring/error-tracking'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      logger.error('Auth signup failed', { error: authError, email })
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('axis6_profiles')
      .insert([
        {
          id: authData.user.id,
          name: name,
          timezone: 'America/Santo_Domingo',
          onboarded: false,
        }
      ])

    if (profileError) {
      logger.error('Profile creation failed', { error: profileError, userId: authData.user.id })
      // Don't fail the request if profile creation fails, auth user was created
    }

    logger.info('User registered successfully', { 
      userId: authData.user.id, 
      email: authData.user.email 
    })

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
      }
    })

  } catch (error: any) {
    logger.error('Registration endpoint error', { error })
    reportError(error, 'high', {
      component: 'AuthAPI',
      action: 'register',
      url: '/api/auth/register'
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}