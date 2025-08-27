
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger';

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      logger.error('Auth error in time-blocks GET:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get time blocks for the specified date
    const { data, error } = await supabase
      .rpc('get_my_day_data', {
        p_user_id: user.id,
        p_date: date || new Date().toISOString().split('T')[0]
      })
    
    if (error) {
      logger.error('Error fetching time blocks:', error)
      // Check if it's a missing function error
      if (error.code === '42883' || error.message?.includes('function')) {
        // Fallback to direct table query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('axis6_time_blocks')
          .select(`
            *,
            category:axis6_categories(name, color, icon)
          `)
          .eq('user_id', user.id)
          .eq('date', date || new Date().toISOString().split('T')[0])
          .order('start_time', { ascending: true })
        
        if (fallbackError) {
          logger.error('Fallback query error:', fallbackError)
          return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        }
        
        // Transform data to match expected format
        const transformedData = (fallbackData || []).map(item => ({
          time_block_id: item.id,
          category_id: item.category_id,
          category_name: item.category?.name?.en || '',
          category_color: item.category?.color || '',
          category_icon: item.category?.icon || '',
          activity_id: item.activity_id,
          activity_name: item.activity_name,
          start_time: item.start_time,
          end_time: item.end_time,
          duration_minutes: item.duration_minutes,
          status: item.status,
          notes: item.notes,
          actual_duration: 0
        }))
        
        return NextResponse.json(transformedData || [])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    logger.error('Time blocks GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      logger.error('Auth error in time-blocks POST:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Create new time block
    const { data, error } = await supabase
      .from('axis6_time_blocks')
      .insert({
        user_id: user.id,
        date: body.date,
        category_id: body.category_id,
        activity_id: body.activity_id,
        activity_name: body.activity_name,
        start_time: body.start_time,
        end_time: body.end_time,
        notes: body.notes,
        status: body.status || 'planned'
      })
      .select()
      .single()
    
    if (error) {
      logger.error('Error creating time block:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    logger.error('Time blocks POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Update time block
    const { data, error } = await supabase
      .from('axis6_time_blocks')
      .update({
        category_id: body.category_id,
        activity_id: body.activity_id,
        activity_name: body.activity_name,
        start_time: body.start_time,
        end_time: body.end_time,
        notes: body.notes,
        status: body.status
      })
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (error) {
      logger.error('Error updating time block:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    logger.error('Time blocks PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    // Delete time block
    const { error } = await supabase
      .from('axis6_time_blocks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    
    if (error) {
      logger.error('Error deleting time block:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Time blocks DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}