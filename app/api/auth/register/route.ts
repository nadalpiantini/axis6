import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

import { sendEmail } from '@/lib/email/service-simple'
import { logger } from '@/lib/logger'

export async function POST(_request: NextRequest) {
  try {
    const { email, password, name } = await _request.json()

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

    // Create Supabase client directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      logger.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
    
    const supabase = await createClient()

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://axis6.app'}/auth/callback`
      }
    })

    if (authError) {
      logger.error('Auth signup failed', authError)
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
      .upsert([
        {
          id: authData.user.id,
          name: name,
          full_name: name,
          timezone: 'America/Santo_Domingo',
          onboarded: false,
        }
      ], {
        onConflict: 'id'
      })

    if (profileError) {
      logger.error('Profile creation error', profileError)
      // Don't fail registration if profile exists
    }

    // Send welcome email (non-blocking)
    try {
      await sendEmail({
        to: email,
        type: 'welcome',
        data: {
          name: name,
          email: email
        }
      })
      logger.info('Welcome email sent', { email })
    } catch (emailError) {
      // Log error but don't fail registration
      logger.error('Failed to send welcome email', emailError)
    }

    return NextResponse.json({
      message: 'Registration successful! Please check your email to confirm your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
      }
    })

  } catch (error: any) {
    logger.error('Registration error', error)
    return NextResponse.json(
      { error: `Registration failed: ${error.message}` },
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