/**
 * Optimized React Query cache configuration
 * Implements smart caching strategies for different query types
 */

import { QueryClient } from '@tanstack/react-query'

import { createEnhancedQueryClient, createQueryErrorHandler } from '@/lib/monitoring/query-error-handler'
import { logger } from '@/lib/utils/logger'

// Cache time configurations (in milliseconds)
export const CACHE_TIMES = {
  // Static data (rarely changes)
  CATEGORIES: 1000 * 60 * 60 * 24, // 24 hours
  USER_PROFILE: 1000 * 60 * 60, // 1 hour

  // Semi-dynamic data (changes occasionally)
  STREAKS: 1000 * 60 * 5, // 5 minutes
  WEEKLY_STATS: 1000 * 60 * 15, // 15 minutes
  MONTHLY_STATS: 1000 * 60 * 30, // 30 minutes

  // Dynamic data (changes frequently)
  CHECKINS_TODAY: 1000 * 30, // 30 seconds
  DASHBOARD: 1000 * 60, // 1 minute

  // Real-time data (always fresh)
  ACTIVE_SESSION: 0, // No cache
  NOTIFICATIONS: 1000 * 10, // 10 seconds
} as const

// Stale time configurations
export const STALE_TIMES = {
  CATEGORIES: 1000 * 60 * 60, // 1 hour
  USER_PROFILE: 1000 * 60 * 10, // 10 minutes
  STREAKS: 1000 * 60 * 2, // 2 minutes
  WEEKLY_STATS: 1000 * 60 * 5, // 5 minutes
  MONTHLY_STATS: 1000 * 60 * 10, // 10 minutes
  CHECKINS_TODAY: 1000 * 15, // 15 seconds
  DASHBOARD: 1000 * 30, // 30 seconds
  ACTIVE_SESSION: 0, // Always stale
  NOTIFICATIONS: 1000 * 5, // 5 seconds
} as const

// Query key factory for consistent cache keys
export const queryKeys = {
  all: ['axis6'] as const,

  // User queries
  user: () => [...queryKeys.all, 'user'] as const,
  userById: (id: string) => [...queryKeys.user(), id] as const,
  userProfile: (id: string) => [...queryKeys.userById(id), 'profile'] as const,

  // Categories
  categories: () => [...queryKeys.all, 'categories'] as const,
  category: (id: string) => [...queryKeys.categories(), id] as const,

  // Checkins
  checkins: () => [...queryKeys.all, 'checkins'] as const,
  checkinsToday: (userId: string) => [...queryKeys.checkins(), 'today', userId] as const,
  checkinsByDate: (userId: string, date: string) => [...queryKeys.checkins(), userId, date] as const,

  // Streaks
  streaks: () => [...queryKeys.all, 'streaks'] as const,
  userStreaks: (userId: string) => [...queryKeys.streaks(), userId] as const,

  // Stats
  stats: () => [...queryKeys.all, 'stats'] as const,
  weeklyStats: (userId: string) => [...queryKeys.stats(), 'weekly', userId] as const,
  monthlyStats: (userId: string) => [...queryKeys.stats(), 'monthly', userId] as const,

  // Dashboard
  dashboard: () => [...queryKeys.all, 'dashboard'] as const,
  dashboardData: (userId: string) => [...queryKeys.dashboard(), userId] as const,

  // AI/Psychology
  temperament: () => [...queryKeys.all, 'temperament'] as const,
  temperamentProfile: (userId: string) => [...queryKeys.temperament(), userId] as const,

  // Activities
  activities: () => [...queryKeys.all, 'activities'] as const,
  userActivities: (userId: string) => [...queryKeys.activities(), userId] as const,
}

// Mutation key factory
export const mutationKeys = {
  // Checkins
  toggleCheckin: () => ['toggleCheckin'] as const,
  bulkCheckin: () => ['bulkCheckin'] as const,

  // Profile
  updateProfile: () => ['updateProfile'] as const,
  updateSettings: () => ['updateSettings'] as const,

  // AI
  analyzeTemperament: () => ['analyzeTemperament'] as const,
  generateRecommendations: () => ['generateRecommendations'] as const,
}

// Smart invalidation patterns
export const invalidationPatterns = {
  // When a checkin is toggled, invalidate related queries
  afterCheckinToggle: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.checkinsToday(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.userStreaks(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardData(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.weeklyStats(userId) })
  },

  // When profile is updated
  afterProfileUpdate: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboardData(userId) })
  },

  // When temperament is analyzed
  afterTemperamentAnalysis: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.temperamentProfile(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.userActivities(userId) })
  },
}

// Optimistic update helpers
export const optimisticUpdates = {
  // Toggle checkin optimistically
  toggleCheckin: (
    queryClient: QueryClient,
    userId: string,
    categoryId: string,
    checked: boolean
  ) => {
    // Update today's checkins optimistically
    queryClient.setQueryData(
      queryKeys.checkinsToday(userId),
      (old: any) => {
        if (!old) return old

        if (checked) {
          // Add new checkin
          return [...old, { category_id: categoryId, completed_at: new Date().toISOString() }]
        } else {
          // Remove checkin
          return old.filter((c: any) => c.category_id !== categoryId)
        }
      }
    )

    // Update streaks optimistically
    queryClient.setQueryData(
      queryKeys.userStreaks(userId),
      (old: any) => {
        if (!old) return old

        const streak = old.find((s: any) => s.category_id === categoryId)
        if (!streak) return old

        if (checked) {
          // Increment streak
          return old.map((s: any) =>
            s.category_id === categoryId
              ? { ...s, current_streak: s.current_streak + 1, last_checkin: new Date().toISOString() }
              : s
          )
        } else {
          // Reset streak if unchecking today's checkin
          const today = new Date().toDateString()
          const lastCheckin = new Date(streak.last_checkin).toDateString()

          if (today === lastCheckin) {
            return old.map((s: any) =>
              s.category_id === categoryId
                ? { ...s, current_streak: Math.max(0, s.current_streak - 1) }
                : s
            )
          }
        }

        return old
      }
    )
  },
}

// Prefetch strategies
export const prefetchStrategies = {
  // Prefetch dashboard data on app load
  prefetchDashboard: async (queryClient: QueryClient, userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.categories(),
        staleTime: STALE_TIMES.CATEGORIES,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.checkinsToday(userId),
        staleTime: STALE_TIMES.CHECKINS_TODAY,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.userStreaks(userId),
        staleTime: STALE_TIMES.STREAKS,
      }),
    ])
  },

  // Prefetch stats when navigating to stats page
  prefetchStats: async (queryClient: QueryClient, userId: string) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.weeklyStats(userId),
        staleTime: STALE_TIMES.WEEKLY_STATS,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.monthlyStats(userId),
        staleTime: STALE_TIMES.MONTHLY_STATS,
      }),
    ])
  },
}

// Create optimized query client with enhanced error tracking
export function createOptimizedQueryClient(): QueryClient {
  // Use the enhanced query client with error tracking
  const client = createEnhancedQueryClient()

  // Override with our specific cache configuration
  client.setDefaultOptions({
    queries: {
      // Smart stale time based on query type
      staleTime: 1000 * 60, // Default: 1 minute

      // Smart garbage collection time
      gcTime: 1000 * 60 * 10, // Default: 10 minutes

      // Enhanced refetch strategies
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
    },

    mutations: {
      // Enhanced mutation settings with error tracking
      retry: 1,
      retryDelay: 1000,
    },
  })

  return client
}

// Export singleton instance
export const queryClient = createOptimizedQueryClient()
