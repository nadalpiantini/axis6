import { NextRequest, NextResponse } from 'next/server'

import { reportError } from '@/lib/monitoring/error-tracking'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Sign out user
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      logger.error('Auth signout failed', { error: signOutError })
      return NextResponse.json(
        { error: signOutError.message },
        { status: 400 }
      )
    }

    logger.info('User logged out successfully')

    return NextResponse.json({
      message: 'Logout successful'
    })

  } catch (error: any) {
    logger.error('Logout endpoint error', { error })
    reportError(error, 'high', {
      component: 'AuthAPI',
      action: 'logout',
      url: '/api/auth/logout'
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
