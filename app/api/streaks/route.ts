import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

// GET /api/streaks - Get user's streaks
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(_request.url)
    const categoryId = searchParams.get('categoryId')
    
    let query = supabase
      .from('axis6_streaks')
      .select(`
        *,
        axis6_categories (
          id,
          name,
          slug,
          color,
          icon
        )
      `)
      .eq('user_id', user.id)
      .order('current_streak', { ascending: false })

    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: streaks, error } = await query
    
    if (error) {
      logger.error('Error fetching streaks', error)
      return NextResponse.json({ error: 'Failed to fetch streaks' }, { status: 500 })
    }

    // Calculate overall streak statistics
    const stats = {
      totalCurrentStreak: streaks.reduce((sum, streak) => sum + streak.current_streak, 0),
      averageCurrentStreak: streaks.length > 0 ? streaks.reduce((sum, streak) => sum + streak.current_streak, 0) / streaks.length : 0,
      longestStreakEver: Math.max(...streaks.map(s => s.longest_streak), 0),
      activeCategoriesCount: streaks.filter(s => s.current_streak > 0).length,
      totalCategoriesCount: streaks.length
    }

    return NextResponse.json({ streaks, stats })

  } catch (error) {
    logger.error('Streaks API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/streaks - Recalculate streaks for user
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await _request.json()
    const { categoryId } = body

    if (categoryId) {
      // Recalculate specific category streak
      const { data, error } = await supabase.rpc('axis6_calculate_streak_optimized', {
        p_user_id: user.id,
        p_category_id: categoryId
      })

      if (error) {
        logger.error('Error recalculating streak', error)
        return NextResponse.json({ error: 'Failed to recalculate streak' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Streak recalculated successfully', data })
    } else {
      // Recalculate all streaks for user
      const { data: categories } = await supabase
        .from('axis6_categories')
        .select('id')
        .eq('is_active', true)

      if (categories) {
        for (const category of categories) {
          await supabase.rpc('axis6_calculate_streak_optimized', {
            p_user_id: user.id,
            p_category_id: category.id
          })
        }
      }

      return NextResponse.json({ message: 'All streaks recalculated successfully' })
    }

  } catch (error) {
    logger.error('Streaks POST API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}