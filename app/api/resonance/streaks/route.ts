import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const leaderboardQuerySchema = z.object({
  streakType: z.enum(['daily', 'morning', 'axis']).default('daily'),
  limit: z.number().int().min(1).max(50).default(20)
})

// GET /api/resonance/streaks - Get user's streaks
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's streaks
    const { data: streaks, error: streaksError } = await supabase
      .from('axis6_resonance_streaks')
      .select('*')
      .eq('user_id', user.id)
      .order('streak_type', { ascending: true })
      .order('axis_slug', { ascending: true })

    if (streaksError) {
      console.error('Error fetching streaks:', streaksError)
      return NextResponse.json({ 
        error: 'Failed to fetch streaks',
        details: streaksError.message 
      }, { status: 500 })
    }

    // Transform data for frontend
    const transformedStreaks = {
      daily: null as any,
      morning: null as any,
      axisBased: [] as any[]
    }

    streaks?.forEach(streak => {
      const streakData = {
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        lastWinDate: streak.last_win_date,
        totalWins: streak.total_micro_wins,
        updatedAt: streak.updated_at
      }

      if (streak.streak_type === 'daily' && !streak.axis_slug) {
        transformedStreaks.daily = streakData
      } else if (streak.streak_type === 'morning' && !streak.axis_slug) {
        transformedStreaks.morning = streakData
      } else if (streak.streak_type === 'axis' && streak.axis_slug) {
        transformedStreaks.axisBased.push({
          ...streakData,
          axis: streak.axis_slug
        })
      }
    })

    return NextResponse.json({
      success: true,
      streaks: transformedStreaks
    })

  } catch (error) {
    console.error('Streaks fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to fetch streaks'
    }, { status: 500 })
  }
}

// GET /api/resonance/streaks/leaderboard - Get resonance leaderboard
export async function getLeaderboard(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      streakType: searchParams.get('streakType') || 'daily',
      limit: parseInt(searchParams.get('limit') || '20')
    }
    
    const validatedQuery = leaderboardQuerySchema.parse(queryParams)

    // Call RPC function to get leaderboard
    const { data: leaderboardData, error: leaderboardError } = await supabase.rpc(
      'get_resonance_leaderboard',
      {
        p_streak_type: validatedQuery.streakType,
        p_limit: validatedQuery.limit
      }
    )

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError)
      return NextResponse.json({ 
        error: 'Failed to fetch leaderboard',
        details: leaderboardError.message 
      }, { status: 500 })
    }

    // Get authenticated user to mark their position
    const { data: { user } } = await supabase.auth.getUser()

    // Transform data for frontend
    const transformedLeaderboard = leaderboardData?.map((entry: any) => ({
      userId: entry.user_id,
      name: entry.profile_name,
      currentStreak: entry.current_streak,
      longestStreak: entry.longest_streak,
      totalWins: entry.total_wins,
      rank: entry.rank,
      isCurrentUser: user?.id === entry.user_id
    })) || []

    return NextResponse.json({
      success: true,
      leaderboard: transformedLeaderboard,
      streakType: validatedQuery.streakType
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }

    console.error('Leaderboard fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to fetch leaderboard'
    }, { status: 500 })
  }
}