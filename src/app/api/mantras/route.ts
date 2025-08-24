import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeMantraSchema, validateRequest } from '@/lib/validation/schemas'
import { withRateLimit, rateLimitConfigs } from '@/lib/security/rateLimit'
import { logger } from '@/lib/utils/logger'

// Configure edge runtime for Cloudflare Pages compatibility
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get daily mantra for user
    const { data: mantra, error: mantraError } = await supabase
      .rpc('axis6_get_daily_mantra', { p_user_id: user.id })
      .single()

    if (mantraError) {
      logger.error('Error fetching daily mantra', mantraError)
      return NextResponse.json(
        { error: 'Failed to fetch daily mantra' },
        { status: 500 }
      )
    }

    return NextResponse.json({ mantra })
  } catch (error) {
    logger.error('Unexpected error in mantras API', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, rateLimitConfigs.api)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    // Validate request body with Zod (optional for mantras)
    const body = await request.text()
    if (body) {
      const validation = await validateRequest(
        new Request(request.url, {
          method: 'POST',
          body: body,
          headers: request.headers
        }),
        completeMantraSchema
      )
      if (validation.error) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mark mantra as completed
    const { data: result, error: completeError } = await supabase
      .rpc('axis6_complete_mantra', { p_user_id: user.id })

    if (completeError) {
      logger.error('Error completing mantra', completeError)
      return NextResponse.json(
        { error: 'Failed to complete mantra' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: result })
  } catch (error) {
    logger.error('Unexpected error in mantras API', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
