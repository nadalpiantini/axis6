import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    // Get user with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      logger.error('Auth error in day-summary GET:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!user) {
      logger.error('No user found in day-summary GET')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targetDate = date || new Date().toISOString().split('T')[0]
    logger.info(`Fetching day summary for user ${user.id} on date ${targetDate}`)

    // Call the RPC function
    const { data, error } = await supabase
      .rpc('axis6_get_day_summary', {
        d: targetDate
      })

    if (error) {
      logger.error('Error fetching day summary via RPC:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.info(`Returning day summary data for ${targetDate}`)
    return NextResponse.json(data || {
      minutesByAxis: {},
      blocks: [],
      reflection: null,
      totalMinutes: 0,
      axesActive: 0
    })
  } catch (error) {
    logger.error('Day summary GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
