import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportError } from '@/lib/monitoring/error-tracking'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Sign in user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      logger.error('Auth signin failed', { error: authError, email })
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('axis6_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      logger.error('Profile fetch failed during login', { 
        error: profileError, 
        userId: authData.user.id 
      })
    }

    logger.info('User logged in successfully', { 
      userId: authData.user.id, 
      email: authData.user.email 
    })

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: profileData?.name || null,
        timezone: profileData?.timezone || 'America/Santo_Domingo',
        onboarded: profileData?.onboarded || false,
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
      }
    })

  } catch (error: any) {
    logger.error('Login endpoint error', { error })
    reportError(error, 'high', {
      component: 'AuthAPI',
      action: 'login',
      url: '/api/auth/login'
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