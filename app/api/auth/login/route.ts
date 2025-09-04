import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
export async function POST(_request: NextRequest) {
  try {
    const { email, password } = await _request.json()
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
      logger.error('Auth signin failed', authError)
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
      logger.error('Profile fetch failed during login', profileError)
    }
    logger.info('User logged in successfully', { userId: authData.user.id })
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
    logger.error('Login endpoint error', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
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
