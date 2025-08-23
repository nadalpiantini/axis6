import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      console.error('Error fetching daily mantra:', mantraError)
      return NextResponse.json(
        { error: 'Failed to fetch daily mantra' },
        { status: 500 }
      )
    }

    return NextResponse.json({ mantra })
  } catch (error) {
    console.error('Unexpected error in mantras API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Mark mantra as completed
    const { data: result, error: completeError } = await supabase
      .rpc('axis6_complete_mantra', { p_user_id: user.id })

    if (completeError) {
      console.error('Error completing mantra:', completeError)
      return NextResponse.json(
        { error: 'Failed to complete mantra' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: result })
  } catch (error) {
    console.error('Unexpected error in mantras API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
