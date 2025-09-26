import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    // Get user with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      logger.error('Auth error in quick-add-block POST:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!user) {
      logger.error('No user found in quick-add-block POST')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    if (!body.axisId || !body.minutes) {
      return NextResponse.json({ 
        error: 'Missing required fields: axisId, minutes' 
      }, { status: 400 })
    }

    logger.info(`Adding quick block for user ${user.id}: axis ${body.axisId}, ${body.minutes} minutes`)

    // Call the RPC function
    const { data, error } = await supabase
      .rpc('axis6_quick_add_block', {
        p_axis_id: body.axisId,
        p_minutes: body.minutes,
        p_note: body.note || null
      })

    if (error) {
      logger.error('Error adding quick block via RPC:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    logger.info(`Quick block added successfully`)
    return NextResponse.json(data)
  } catch (error) {
    logger.error('Quick add block POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
