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
      logger.error('Auth error in my-day stats:', authError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get time distribution for the day
    const { data, error } = await supabase
      .rpc('calculate_daily_time_distribution', {
        p_user_id: user.id,
        p_date: date || new Date().toISOString().split('T')[0]
      })

    if (error) {
      logger.error('Error fetching time distribution:', error)
      // Check if it's a missing function error
      if (error.code === '42883' || error.message?.includes('function')) {
        // Fallback to manual calculation
        const { data: categories } = await supabase
          .from('axis6_categories')
          .select('id, name, color')
          .order('position')

        const { data: timeBlocks } = await supabase
          .from('axis6_time_blocks')
          .select('category_id, duration_minutes')
          .eq('user_id', user.id)
          .eq('date', date || new Date().toISOString().split('T')[0])

        const { data: activityLogs } = await supabase
          .from('axis6_activity_logs')
          .select('category_id, duration_minutes')
          .eq('user_id', user.id)
          .gte('started_at', `${date || new Date().toISOString().split('T')[0]}T00:00:00`)
          .lt('started_at', `${date || new Date().toISOString().split('T')[0]}T23:59:59`)

        // Calculate distribution
        const distribution = (categories || []).map(category => {
          const planned = (timeBlocks || [])
            .filter(tb => tb.category_id === category.id)
            .reduce((sum, tb) => sum + (tb.duration_minutes || 0), 0)

          const actual = (activityLogs || [])
            .filter(al => al.category_id === category.id)
            .reduce((sum, al) => sum + (al.duration_minutes || 0), 0)

          const total = planned + actual
          const percentage = total > 0 ? (actual / planned) * 100 : 0

          return {
            category_id: category.id,
            category_name: category.name?.en || '',
            category_color: category.color || '',
            planned_minutes: planned,
            actual_minutes: actual,
            percentage: Math.min(100, Math.round(percentage * 100) / 100)
          }
        })

        return NextResponse.json(distribution)
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    logger.error('My day stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
