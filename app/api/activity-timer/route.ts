import { logger } from '@/lib/utils/logger';

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const action = body.action // 'start' or 'stop'
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (action === 'start') {
      // Start timer
      const { data, error } = await supabase
        .rpc('start_activity_timer', {
          p_user_id: user.id,
          p_activity_id: body.activity_id,
          p_category_id: body.category_id,
          p_activity_name: body.activity_name,
          p_time_block_id: body.time_block_id
        })
      
      if (error) {
        logger.error('Error starting timer:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ log_id: data })
      
    } else if (action === 'stop') {
      // Stop timer
      const { data, error } = await supabase
        .rpc('stop_activity_timer', {
          p_user_id: user.id,
          p_log_id: body.log_id
        })
      
      if (error) {
        logger.error('Error stopping timer:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ duration_minutes: data })
      
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
  } catch (error) {
    logger.error('Activity timer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get active timers
    const { data, error } = await supabase
      .from('axis6_activity_logs')
      .select('*')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
    
    if (error) {
      logger.error('Error fetching active timer:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ activeTimer: data?.[0] || null })
  } catch (error) {
    logger.error('Activity timer GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}