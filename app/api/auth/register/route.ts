import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Create Supabase client with server-side cookies
    const supabase = await createClient()

    // Sign up user using the standard method
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
      console.error('Auth signup failed:', authError.message)
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

    // Create user profile (the trigger might handle this, but we ensure it exists)
    const { error: profileError } = await supabase
      .from('axis6_profiles')
      .upsert([
        {
          id: authData.user.id,
          name: name,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santo_Domingo',
          onboarded: false,
        }
      ], {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile creation failed:', profileError.message)
      // Don't fail the registration if profile already exists or has issues
    }

    console.log('User registered successfully:', authData.user.id)

    return NextResponse.json({
      message: 'Registration successful! Please check your email to confirm your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
      }
    })

  } catch (error: any) {
    console.error('Registration endpoint error:', error.message || error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
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