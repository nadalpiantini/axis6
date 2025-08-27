import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { createClient } from '@/lib/supabase/client'

// Types for dashboard data
export interface DashboardData {
  user: {
    id: string
    email: string
    created_at: string
  }
  categories: Array<{
    id: number
    name: any // JSONB field
    slug: string
    icon: string
    color: string
    position: number
    description: any
  }>
  todayCheckins: Array<{
    id: string
    user_id: string
    category_id: number
    completed_at: string
    created_at: string
  }>
  streaks: Array<{
    id: string
    user_id: string
    category_id: number
    current_streak: number
    longest_streak: number
    last_checkin: string | null
  }>
  stats: {
    totalCheckins: number
    currentOverallStreak: number
    longestOverallStreak: number
    todayProgress: number
    weeklyAverage: number | null
  }
}

interface BatchCheckInUpdate {
  categoryId: number
  completed: boolean
}

interface BatchCheckInResult {
  results: Array<{
    categoryId: number
    success: boolean
    action: 'added' | 'removed'
  }>
  timestamp: string
}

/**
 * Optimized hook to fetch all dashboard data in a single query
 */
export function useDashboardDataOptimized(userId: string | undefined) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['dashboard-optimized', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')
      
      const { data, error } = await supabase
        .rpc('get_dashboard_data_optimized', { p_user_id: userId })
      
      if (error) throw error
      return data as DashboardData
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  })
}

/**
 * Optimized mutation for batch check-in operations
 */
export function useBatchCheckInMutation(userId: string | undefined) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  
  return useMutation({
    mutationFn: async (updates: BatchCheckInUpdate[]) => {
      if (!userId) throw new Error('User ID required')
      
      const { data, error } = await supabase
        .rpc('batch_toggle_checkins', {
          p_user_id: userId,
          p_updates: updates
        })
      
      if (error) throw error
      return data as BatchCheckInResult
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['dashboard-optimized', userId] })
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<DashboardData>(['dashboard-optimized', userId])
      
      // Optimistically update the cache
      if (previousData) {
        queryClient.setQueryData<DashboardData>(['dashboard-optimized', userId], (old) => {
          if (!old) return old
          
          const newData = { ...old }
          
          // Update todayCheckins based on updates
          updates.forEach(({ categoryId, completed }) => {
            if (completed) {
              // Add checkin if not exists
              const exists = newData.todayCheckins.some(c => c.category_id === categoryId)
              if (!exists) {
                newData.todayCheckins.push({
                  id: `optimistic-${categoryId}`,
                  user_id: userId!,
                  category_id: categoryId,
                  completed_at: new Date().toISOString(),
                  created_at: new Date().toISOString()
                })
              }
            } else {
              // Remove checkin
              newData.todayCheckins = newData.todayCheckins.filter(
                c => c.category_id !== categoryId
              )
            }
          })
          
          // Update stats
          newData.stats.todayProgress = (newData.todayCheckins.length / 6) * 100
          
          return newData
        })
      }
      
      return { previousData }
    },
    onError: (err, updates, context) => {
      // Rollback the optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(['dashboard-optimized', userId], context.previousData)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['dashboard-optimized', userId] })
    }
  })
}

/**
 * Hook to enable real-time updates for dashboard data
 */
export function useRealtimeDashboardOptimized(userId: string | undefined) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (!userId) return
    
    const supabase = createClient()
    
    // Subscribe to checkins changes
    const subscription = supabase
      .channel(`dashboard-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'axis6_checkins',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Invalidate and refetch dashboard data
          queryClient.invalidateQueries({ queryKey: ['dashboard-optimized', userId] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'axis6_streaks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Invalidate and refetch dashboard data
          queryClient.invalidateQueries({ queryKey: ['dashboard-optimized', userId] })
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [userId, queryClient])
}

/**
 * Prefetch dashboard data for faster initial load
 */
export async function prefetchDashboardData(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  return queryClient.prefetchQuery({
    queryKey: ['dashboard-optimized', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_dashboard_data_optimized', { p_user_id: userId })
      
      if (error) throw error
      return data as DashboardData
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to get individual pieces of dashboard data with proper typing
 */
export function useDashboardSlice<K extends keyof DashboardData>(
  userId: string | undefined,
  slice: K
): DashboardData[K] | undefined {
  const { data } = useDashboardDataOptimized(userId)
  return data?.[slice]
}