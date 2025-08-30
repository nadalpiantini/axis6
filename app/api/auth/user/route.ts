import { NextRequest, NextResponse } from 'next/server'

import { reportError } from '@/lib/monitoring/error-tracking'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      logger.error('Auth getUser failed', { error: userError })
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('axis6_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logger.error(`Profile fetch failed for user ${user.id}: ${profileError}`)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profileData?.name || null,
        timezone: profileData?.timezone || 'America/Santo_Domingo',
        onboarded: profileData?.onboarded || false,
        created_at: profileData?.created_at,
        updated_at: profileData?.updated_at,
      }
    })

  } catch (error: any) {
    logger.error('User endpoint error', { error })
    reportError(error, 'high', {
      component: 'AuthAPI',
      action: 'getUser',
      url: '/api/auth/user'
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
