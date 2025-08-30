import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'

// GET /api/analytics - Get user's analytics data
export async function GET(_request: NextRequest) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(_request.url)
    const period = searchParams.get('period') || '30' // days
    const categoryId = searchParams.get('categoryId')

    const daysBack = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    const startDateStr = startDate.toISOString().split('T')[0]

    // Get daily statistics
    const dailyQuery = supabase
      .from('axis6_daily_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .order('date', { ascending: true })

    const { data: dailyStats, error: dailyError } = await dailyQuery

    if (dailyError) {
      logger.error('Error fetching daily stats', dailyError)
      return NextResponse.json({ error: 'Failed to fetch daily statistics' }, { status: 500 })
    }

    // Get check-ins for the period
    let checkinsQuery = supabase
      .from('axis6_checkins')
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
      .gte('completed_at', startDateStr)
      .order('completed_at', { ascending: true })

    if (categoryId) {
      checkinsQuery = checkinsQuery.eq('category_id', categoryId)
    }

    const { data: checkins, error: checkinsError } = await checkinsQuery

    if (checkinsError) {
      logger.error('Error fetching check-ins', checkinsError)
      return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 })
    }

    // Get current streaks
    let streaksQuery = supabase
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

    if (categoryId) {
      streaksQuery = streaksQuery.eq('category_id', categoryId)
    }

    const { data: streaks, error: streaksError } = await streaksQuery

    if (streaksError) {
      logger.error('Error fetching streaks', streaksError)
      return NextResponse.json({ error: 'Failed to fetch streaks' }, { status: 500 })
    }

    // Calculate analytics
    const totalDays = daysBack
    const daysWithData = dailyStats.length
    const totalCheckins = checkins.length
    const averageCompletionRate = dailyStats.length > 0
      ? dailyStats.reduce((sum, day) => sum + day.completion_rate, 0) / dailyStats.length
      : 0

    // Category-specific analytics
    const categoryStats: Record<string, any> = {}
    checkins.forEach(checkin => {
      const categoryName = checkin.axis6_categories?.name?.en || checkin.axis6_categories?.slug || 'Unknown'
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = {
          count: 0,
          totalMood: 0,
          averageMood: 0,
          color: checkin.axis6_categories?.color || '#6366f1'
        }
      }
      categoryStats[categoryName].count++
      categoryStats[categoryName].totalMood += checkin.mood || 5
      categoryStats[categoryName].averageMood = categoryStats[categoryName].totalMood / categoryStats[categoryName].count
    })

    // Weekly patterns
    const weeklyData: Record<string, any> = {}
    checkins.forEach(checkin => {
      const date = new Date(checkin.completed_at)
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { count: 0, mood: 0, checkins: [] }
      }
      weeklyData[weekKey].count++
      weeklyData[weekKey].mood += checkin.mood || 5
      weeklyData[weekKey].checkins.push(checkin)
    })

    // Best and worst performance days
    const sortedDailyStats = [...dailyStats].sort((a, b) => b.completion_rate - a.completion_rate)
    const bestDays = sortedDailyStats.slice(0, 5)
    const worstDays = sortedDailyStats.slice(-5).reverse()

    // Mood trends
    const moodTrend = dailyStats.map(day => ({
      date: day.date,
      averageMood: day.total_mood / Math.max(day.categories_completed, 1)
    }))

    // Streak analysis
    const streakAnalysis = {
      currentStreaks: streaks.map(s => ({
        category: s.axis6_categories?.name?.en || s.axis6_categories?.slug,
        current: s.current_streak,
        longest: s.longest_streak,
        color: s.axis6_categories?.color
      })),
      totalCurrentStreak: streaks.reduce((sum, s) => sum + s.current_streak, 0),
      longestStreakEver: Math.max(...streaks.map(s => s.longest_streak), 0),
      activeStreaks: streaks.filter(s => s.current_streak > 0).length
    }

    const analytics = {
      overview: {
        period: `${daysBack} days`,
        totalCheckins,
        daysWithData,
        totalDays,
        averageCompletionRate: Math.round(averageCompletionRate * 100) / 100,
        dataCompleteness: Math.round((daysWithData / totalDays) * 100)
      },
      dailyStats,
      categoryStats,
      weeklyData,
      bestDays,
      worstDays,
      moodTrend,
      streakAnalysis,
      rawData: {
        checkins: checkins.slice(0, 100), // Limit for performance
        streaks
      }
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    logger.error('Analytics API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/analytics/export - Export user data
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await _request.json()
    const { format = 'json', includeAllData = false } = body

    // Get all user data
    const { data: checkins } = await supabase
      .from('axis6_checkins')
      .select(`
        *,
        axis6_categories (
          name,
          slug,
          color
        )
      `)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })

    const { data: streaks } = await supabase
      .from('axis6_streaks')
      .select(`
        *,
        axis6_categories (
          name,
          slug,
          color
        )
      `)
      .eq('user_id', user.id)

    const { data: profile } = await supabase
      .from('axis6_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      email: user.email,
      profile: includeAllData ? profile : null,
      checkins: checkins || [],
      streaks: streaks || [],
      summary: {
        totalCheckins: checkins?.length || 0,
        dateRange: checkins && checkins.length > 0 ? {
          earliest: checkins[checkins.length - 1]?.completed_at,
          latest: checkins[0]?.completed_at
        } : null,
        longestStreak: Math.max(...(streaks?.map(s => s.longest_streak) || [0]))
      }
    }

    if (format === 'csv') {
      // Convert to CSV format for checkins
      const csvHeaders = ['Date', 'Category', 'Mood', 'Notes']
      const csvRows = checkins?.map(c => [
        c.completed_at,
        c.axis6_categories?.name?.en || c.axis6_categories?.slug || 'Unknown',
        c.mood || '',
        c.notes || ''
      ]) || []

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="axis6-data.csv"'
        }
      })
    }

    return NextResponse.json({ data: exportData })

  } catch (error) {
    logger.error('Analytics export API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
