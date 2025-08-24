import { QueryClient } from '@tanstack/react-query'
import type { CheckIn } from './hooks/useCheckins'

interface CacheUpdateOptions {
  userId: string
  categoryId: number
  completed: boolean
}

/**
 * Optimistically update the checkins cache
 */
export function updateCheckinsCache(
  queryClient: QueryClient,
  { userId, categoryId, completed }: CacheUpdateOptions
) {
  const today = new Date().toISOString().split('T')[0]
  
  // Update today's checkins
  queryClient.setQueryData<CheckIn[]>(
    ['checkins', 'today', userId],
    (old = []) => {
      if (completed) {
        // Add new checkin
        const newCheckin: CheckIn = {
          id: `temp-${Date.now()}`, // Temporary ID
          user_id: userId,
          category_id: categoryId,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
        return [...old.filter(c => c.category_id !== categoryId), newCheckin]
      } else {
        // Remove checkin
        return old.filter(c => c.category_id !== categoryId)
      }
    }
  )
}

/**
 * Optimistically update the streaks cache
 */
export function updateStreaksCache(
  queryClient: QueryClient,
  { userId, categoryId, completed }: CacheUpdateOptions
) {
  queryClient.setQueryData(
    ['streaks', userId],
    (old: any) => {
      if (!old) return old
      
      return old.map((streak: any) => {
        if (streak.category_id === categoryId) {
          if (completed) {
            // Increment streak
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const lastCheckin = new Date(streak.last_checkin_date)
            
            const isConsecutive = 
              lastCheckin.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]
            
            const newStreak = isConsecutive ? streak.current_streak + 1 : 1
            
            return {
              ...streak,
              current_streak: newStreak,
              longest_streak: Math.max(newStreak, streak.longest_streak),
              last_checkin_date: new Date().toISOString().split('T')[0]
            }
          } else {
            // Break streak
            return {
              ...streak,
              current_streak: 0
            }
          }
        }
        return streak
      })
    }
  )
}

/**
 * Invalidate all dashboard-related queries
 */
export function invalidateDashboardQueries(queryClient: QueryClient, userId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['checkins', 'today', userId] }),
    queryClient.invalidateQueries({ queryKey: ['streaks', userId] }),
    queryClient.invalidateQueries({ queryKey: ['daily-stats', userId] }),
    queryClient.invalidateQueries({ queryKey: ['weekly-stats', userId] })
  ])
}

/**
 * Prefetch dashboard data for better UX
 */
export async function prefetchDashboardData(
  queryClient: QueryClient,
  userId: string,
  fetchFn: () => Promise<any>
) {
  return queryClient.prefetchQuery({
    queryKey: ['dashboard', userId],
    queryFn: fetchFn,
    staleTime: 30 * 1000 // 30 seconds
  })
}

/**
 * Smart cache invalidation based on mutation type
 */
export function smartInvalidate(
  queryClient: QueryClient,
  userId: string,
  mutationType: 'checkin' | 'streak' | 'profile' | 'all'
) {
  const invalidations: Promise<void>[] = []
  
  switch (mutationType) {
    case 'checkin':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: ['checkins', 'today', userId] }),
        queryClient.invalidateQueries({ queryKey: ['daily-stats', userId] })
      )
      break
    case 'streak':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: ['streaks', userId] })
      )
      break
    case 'profile':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: ['user', userId] })
      )
      break
    case 'all':
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: ['checkins'] }),
        queryClient.invalidateQueries({ queryKey: ['streaks'] }),
        queryClient.invalidateQueries({ queryKey: ['daily-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['weekly-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['user'] })
      )
      break
  }
  
  return Promise.all(invalidations)
}

/**
 * Set up background refetching for real-time feel
 */
export function setupBackgroundRefetch(queryClient: QueryClient, userId: string) {
  // Refetch dashboard data every 30 seconds
  const interval = setInterval(() => {
    queryClient.invalidateQueries({ 
      queryKey: ['checkins', 'today', userId],
      refetchType: 'active'
    })
  }, 30000)
  
  return () => clearInterval(interval)
}