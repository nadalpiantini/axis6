import type { Database } from '@/types/supabase'

import { createClient } from './client'

type Category = Database['public']['Tables']['axis6_categories']['Row']
type CheckIn = Database['public']['Tables']['axis6_checkins']['Row']
type Streak = Database['public']['Tables']['axis6_streaks']['Row']
// type DailyStat = Database['public']['Tables']['axis6_daily_stats']['Row']

export interface DashboardData {
  categories: Category[]
  todayCheckins: CheckIn[]
  streaks: Streak[]
  dailyStats: any | null
  weeklyStats: {
    date: string
    completion_rate: number
    categories_completed: number
  }[]
}

/**
 * Fetches all dashboard data in a single optimized query
 * Replaces multiple individual queries with one RPC call
 */
export async function fetchDashboardDataOptimized(userId: string): Promise<DashboardData> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  try {
    // Try to use the optimized RPC function if it exists
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_dashboard_data_optimized', {
        p_user_id: userId,
        p_date: today
      })

    if (!rpcError && rpcData) {
      return rpcData as DashboardData
    }
  } catch (e) {
    // Fallback to individual queries if RPC doesn't exist
    }

  // Fallback: Fetch data with parallel queries (still better than sequential)
  const [
    categoriesResult,
    checkinsResult,
    streaksResult,
    statsResult,
    weeklyResult
  ] = await Promise.all([
    // Categories
    supabase
      .from('axis6_categories')
      .select('*')
      .order('display_order'),

    // Today's checkins
    supabase
      .from('axis6_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`),

    // Streaks
    supabase
      .from('axis6_streaks')
      .select('*')
      .eq('user_id', userId),

    // Daily stats
    supabase
      .from('axis6_daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single(),

    // Weekly stats (last 7 days)
    supabase
      .from('axis6_daily_stats')
      .select('date, completion_rate, categories_completed')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: true })
  ])

  // Handle errors
  if (categoriesResult.error) throw categoriesResult.error
  if (checkinsResult.error) throw checkinsResult.error
  if (streaksResult.error) throw streaksResult.error
  if (weeklyResult.error) throw weeklyResult.error

  return {
    categories: categoriesResult.data || [],
    todayCheckins: checkinsResult.data || [],
    streaks: streaksResult.data || [],
    dailyStats: statsResult.data,
    weeklyStats: weeklyResult.data || []
  }
}

/**
 * Updates a streak using the optimized RPC function
 */
export async function updateStreakOptimized(
  userId: string,
  categoryId: number,
  completed: boolean
): Promise<Streak | null> {
  const supabase = createClient()

  try {
    // Try optimized RPC first
    const { data, error } = await supabase
      .rpc('axis6_calculate_streak_optimized', {
        p_user_id: userId,
        p_category_id: categoryId,
        p_completed: completed
      })

    if (!error && data) {
      return data as Streak
    }
  } catch (e) {
    }

  // Fallback: Manual streak calculation
  const today = new Date().toISOString().split('T')[0]

  if (completed) {
    // Increment or start streak
    const { data: existingStreak } = await supabase
      .from('axis6_streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .single()

    if (existingStreak) {
      const lastCheckin = new Date(existingStreak.last_checkin_date)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const isConsecutive =
        lastCheckin.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]

      const newStreak = isConsecutive ? existingStreak.current_streak + 1 : 1
      const longestStreak = Math.max(newStreak, existingStreak.longest_streak)

      const { data, error } = await supabase
        .from('axis6_streaks')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_checkin_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStreak.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Create new streak
      const { data, error } = await supabase
        .from('axis6_streaks')
        .insert({
          user_id: userId,
          category_id: categoryId,
          current_streak: 1,
          longest_streak: 1,
          last_checkin_date: today
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  } else {
    // Break streak
    const { data, error } = await supabase
      .from('axis6_streaks')
      .update({
        current_streak: 0,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

/**
 * Batch update multiple categories at once
 */
export async function batchUpdateCheckins(
  userId: string,
  updates: Array<{ categoryId: number; completed: boolean }>
): Promise<void> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Process all updates in parallel
  await Promise.all(
    updates.map(async ({ categoryId, completed }) => {
      if (completed) {
        // Add checkin
        await supabase
          .from('axis6_checkins')
          .upsert({
            user_id: userId,
            category_id: categoryId,
            completed_at: new Date().toISOString()
          })
      } else {
        // Remove checkin
        await supabase
          .from('axis6_checkins')
          .delete()
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .gte('completed_at', `${today}T00:00:00`)
          .lte('completed_at', `${today}T23:59:59`)
      }

      // Update streak
      await updateStreakOptimized(userId, categoryId, completed)
    })
  )
}
