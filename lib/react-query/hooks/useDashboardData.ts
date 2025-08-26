/**
 * Optimized Dashboard Data Hook
 * 
 * This hook fetches all dashboard data in a single, optimized query
 * to avoid N+1 query problems and improve performance.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Types
interface DashboardData {
  user: {
    id: string
    email: string
    name: string | null
    avatar_url: string | null
  }
  categories: Array<{
    id: string
    key: string
    name: string
    color: string
    icon: string
    description: string
  }>
  todayCheckins: Array<{
    id: string
    category_id: string
    completed_at: string
  }>
  streaks: Array<{
    category_id: string
    current_streak: number
    longest_streak: number
    last_checkin_date: string
  }>
  weeklyStats: {
    totalCheckins: number
    completionRate: number
    perfectDays: number
    checkinsByCategory: Record<string, number>
  }
  recentActivity: Array<{
    date: string
    completedCategories: string[]
    completionRate: number
  }>
}

/**
 * Fetch all dashboard data in a single optimized query
 */
async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  // Execute all queries in parallel
  const [
    profileResult,
    categoriesResult,
    todayCheckinsResult,
    streaksResult,
    weeklyCheckinsResult,
    recentActivityResult
  ] = await Promise.all([
    // 1. User profile
    supabase
      .from('axis6_profiles')
      .select('id, email, name, avatar_url')
      .eq('id', userId)
      .single(),
    
    // 2. Categories (cached, rarely changes)
    supabase
      .from('axis6_categories')
      .select('id, key, name, color, icon, description')
      .eq('is_active', true)
      .order('order_index'),
    
    // 3. Today's check-ins
    supabase
      .from('axis6_checkins')
      .select('id, category_id, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`),
    
    // 4. Current streaks
    supabase
      .from('axis6_streaks')
      .select('category_id, current_streak, longest_streak, last_checkin_date')
      .eq('user_id', userId)
      .eq('is_active', true),
    
    // 5. Weekly check-ins for stats
    supabase
      .from('axis6_checkins')
      .select('category_id, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', `${weekAgo}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`),
    
    // 6. Recent activity (last 7 days)
    supabase
      .from('axis6_daily_stats')
      .select('date, completed_categories, completion_rate')
      .eq('user_id', userId)
      .gte('date', weekAgo)
      .lte('date', today)
      .order('date', { ascending: false })
  ])
  
  // Handle errors
  if (profileResult.error) throw profileResult.error
  if (categoriesResult.error) throw categoriesResult.error
  if (todayCheckinsResult.error) throw todayCheckinsResult.error
  if (streaksResult.error) throw streaksResult.error
  if (weeklyCheckinsResult.error) throw weeklyCheckinsResult.error
  if (recentActivityResult.error) throw recentActivityResult.error
  
  // Calculate weekly stats
  const weeklyCheckins = weeklyCheckinsResult.data || []
  const totalCategories = categoriesResult.data?.length || 6
  const daysInWeek = 7
  const maxPossibleCheckins = totalCategories * daysInWeek
  
  const checkinsByCategory = weeklyCheckins.reduce((acc, checkin) => {
    acc[checkin.category_id] = (acc[checkin.category_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Count perfect days (all categories completed)
  const checkinsByDay = weeklyCheckins.reduce((acc, checkin) => {
    const date = checkin.completed_at.split('T')[0]
    if (!acc[date]) acc[date] = new Set()
    acc[date].add(checkin.category_id)
    return acc
  }, {} as Record<string, Set<string>>)
  
  const perfectDays = Object.values(checkinsByDay).filter(
    categories => categories.size === totalCategories
  ).length
  
  return {
    user: {
      id: userId,
      email: profileResult.data?.email || '',
      name: profileResult.data?.name || null,
      avatar_url: profileResult.data?.avatar_url || null,
    },
    categories: categoriesResult.data || [],
    todayCheckins: todayCheckinsResult.data || [],
    streaks: streaksResult.data || [],
    weeklyStats: {
      totalCheckins: weeklyCheckins.length,
      completionRate: maxPossibleCheckins > 0 
        ? Math.round((weeklyCheckins.length / maxPossibleCheckins) * 100) 
        : 0,
      perfectDays,
      checkinsByCategory,
    },
    recentActivity: recentActivityResult.data?.map(stat => ({
      date: stat.date,
      completedCategories: stat.completed_categories || [],
      completionRate: stat.completion_rate || 0,
    })) || [],
  }
}

/**
 * Hook to fetch all dashboard data efficiently
 */
export function useDashboardData(userId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => fetchDashboardData(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (formerly cacheTime)
    refetchInterval: 60 * 1000, // Refetch every minute for freshness
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })
}

/**
 * Hook to prefetch dashboard data (for faster navigation)
 */
export function usePrefetchDashboard(userId: string | undefined) {
  const queryClient = useQueryClient()
  
  return () => {
    if (userId) {
      queryClient.prefetchQuery({
        queryKey: ['dashboard', userId],
        queryFn: () => fetchDashboardData(userId),
        staleTime: 30 * 1000,
      })
    }
  }
}

/**
 * Hook to invalidate dashboard data after mutations
 */
export function useInvalidateDashboard(userId: string | undefined) {
  const queryClient = useQueryClient()
  
  return () => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] })
    }
  }
}