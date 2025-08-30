'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Settings, LogOut, TrendingUp, Trophy, User, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useMemo, useCallback, useEffect, lazy, Suspense } from 'react'

// Lazy load heavy components for better bundle splitting
const DailyMantraCard = lazy(() => import('@/components/mantras/DailyMantraCard').then(mod => ({ default: mod.DailyMantraCard })))

// React Query hooks
import HexagonChartWithResonance from '@/components/axis/HexagonChartWithResonance'
import { HexagonErrorBoundary } from '@/components/error/HexagonErrorBoundary'
import { QueryErrorBoundary } from '@/components/error/QueryErrorBoundary'
import { RealtimeErrorBoundary } from '@/components/error/RealtimeErrorBoundary'
import { AxisIcon } from '@/components/icons'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { ClickableSVG } from '@/components/ui/ClickableSVG'
import { LogoFull } from '@/components/ui/Logo'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeCheckins'
import { useDashboardDataOptimized } from '@/lib/react-query/hooks/useDashboardDataOptimized'
import { useToggleCheckIn, useUser } from '@/lib/react-query/hooks'
import { useQueryClient } from '@tanstack/react-query'

// Realtime hooks

// Zustand stores
import {
  useUIStore,
  usePreferencesStore
} from '@/lib/stores/useAppStore'

// Components
import { useToast, ToastContainer } from '@/components/ui/Toast'

// New Hexagon component wrapper with resonance features
const HexagonVisualizationWithResonance = memo(({
  axes,
  onToggleAxis,
  isToggling
}: {
  axes: Array<{
    id: string | number
    name: string
    color: string
    icon: string
    completed: boolean
  }>
  onToggleAxis: (id: string | number) => void
  isToggling: boolean
}) => {
  const { showResonance } = usePreferencesStore()

  // Convert axes data to format expected by HexagonChartWithResonance
  const hexagonData = useMemo(() => {
    const defaultData = {
      physical: 0,
      mental: 0,
      emotional: 0,
      social: 0,
      spiritual: 0,
      material: 0
    }

    axes.forEach(axis => {
      const key = axis.name.toLowerCase()
      if (key in defaultData) {
        defaultData[key as keyof typeof defaultData] = axis.completed ? 100 : 0
      }
    })

    return defaultData
  }, [axes])

  return (
    <div className="flex justify-center mb-4 sm:mb-8 overflow-hidden" data-testid="hexagon-chart">
      <div className="w-full max-w-[95vw] sm:max-w-none flex justify-center">
        <HexagonErrorBoundary>
          <HexagonChartWithResonance
            data={hexagonData}
            size={350}
            animate={true}
            showResonance={showResonance}
            onToggleAxis={onToggleAxis}
            isToggling={isToggling}
            axes={axes}
          />
        </HexagonErrorBoundary>
      </div>
    </div>
  )
})

HexagonVisualizationWithResonance.displayName = 'HexagonVisualizationWithResonance'

// Memoized category card
const MemoizedCategoryCard = memo(({
  axis,
  onToggle,
  isToggling
}: {
  axis: {
    id: string | number
    name: string
    color: string
    icon: string
    completed: boolean
  }
  onToggle: () => void
  isToggling: boolean
}) => {
  const showAnimations = usePreferencesStore(state => state.showAnimations)

  return (
    <button
      onClick={onToggle}
      disabled={isToggling}
      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all min-h-[48px] sm:min-h-[56px] hover:scale-[1.02] active:scale-[0.98] ${
        axis.completed
          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30'
          : 'bg-white/5 hover:bg-white/10 border-white/10'
      } border`}
      aria-pressed={axis.completed}
      data-testid={`category-card-${axis.name.toLowerCase()}`}
      data-checked={axis.completed}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 rounded-lg ${axis.completed ? 'bg-white/10' : 'bg-white/5'}`}>
          <AxisIcon
            axis={axis.icon}
            size={18}
            color={axis.color}
            custom
            animated={showAnimations && axis.completed}
          />
        </div>
        <span className={`text-sm sm:text-base font-medium ${axis.completed ? 'text-white' : 'text-gray-300'}`}>
          {axis.name}
        </span>
      </div>
    </button>
  )
})

MemoizedCategoryCard.displayName = 'MemoizedCategoryCard'

// Main Dashboard Component
export default function DashboardPageV2() {
  const router = useRouter()
  const { addNotification } = useUIStore()
  const { toasts, showToast, removeToast } = useToast()

  // React Query client for manual invalidation
  const queryClient = useQueryClient()

  // Get current user for authentication check
  const { data: authUser, isLoading: authLoading } = useUser()

  // Fetch all dashboard data with optimized single query
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError, refetch } = useDashboardDataOptimized(authUser?.id)
  const toggleCheckIn = useToggleCheckIn(authUser?.id)

  // Extract data from unified response to maintain compatibility
  const user = dashboardData?.user || authUser
  const categories = dashboardData?.categories || []
  const checkins = dashboardData?.todayCheckins || []
  const streaks = dashboardData?.streaks || []
  const stats = dashboardData?.stats

  // Loading and error states
  const isLoading = authLoading || dashboardLoading
  const error = dashboardError

  // Enable realtime updates for this user (with connection monitoring)
  const realtimeStatus = useRealtimeDashboard(user?.id)

  // Calculate derived state with memoization - Fixed to avoid circular dependency
  const axes = useMemo(
    () => {
      // 🛡️ NULL CHECK: Ensure categories is an array
      if (!Array.isArray(categories) || categories.length === 0) {
        return []
      }

      // 🛡️ SAFEGUARD: Limit to exactly 6 categories (AXIS6 hexagon design)
      const limitedCategories = categories.slice(0, 6)

      // Create completed category IDs set inline to avoid circular dependency
      const completedCategoryIds = new Set(
        Array.isArray(checkins)
          ? checkins.map(c => Number(c.category_id)).filter(id => !isNaN(id))
          : []
      )

      return limitedCategories.map(cat => {
        // 🛡️ IMPROVED JSONB NAME PARSING with multiple fallbacks
        let displayName = 'Unknown'

        try {
          // Try object access first
          if (typeof cat.name === 'object' && cat.name?.en) {
            displayName = cat.name.en
          }
          // Try string parsing as fallback
          else if (typeof cat.name === 'string') {
            const parsed = JSON.parse(cat.name)
            displayName = parsed.en || parsed.es || cat.slug || 'Unknown'
          }
          // Final fallback to slug
          else {
            displayName = cat.slug || 'Unknown'
          }
        } catch (error) {
          // If all parsing fails, use slug
          displayName = cat.slug || 'Unknown'
        }

        return {
          id: cat.id,
          name: displayName,
          color: cat.color,
          icon: cat.icon,
          completed: completedCategoryIds.has(cat.id)
        }
      })
    },
    [categories, checkins] // Direct dependency on checkins instead of completedCategoryIds
  )

  const currentStreak = useMemo(
    () => {
      if (stats?.currentOverallStreak) return stats.currentOverallStreak
      if (!Array.isArray(streaks) || streaks.length === 0) return 0

      const validStreaks = streaks
        .map(s => s.current_streak || 0)
        .filter(streak => typeof streak === 'number' && !isNaN(streak))

      return validStreaks.length > 0 ? Math.max(...validStreaks) : 0
    },
    [streaks, stats?.currentOverallStreak]
  )

  const longestStreak = useMemo(
    () => {
      if (stats?.longestOverallStreak) return stats.longestOverallStreak
      if (!Array.isArray(streaks) || streaks.length === 0) return 0

      const validStreaks = streaks
        .map(s => s.longest_streak || 0)
        .filter(streak => typeof streak === 'number' && !isNaN(streak))

      return validStreaks.length > 0 ? Math.max(...validStreaks) : 0
    },
    [streaks, stats?.longestOverallStreak]
  )

  // Handler with useCallback for optimization and immediate UI updates
  const handleToggleAxis = useCallback((axisId: string | number) => {
    if (toggleCheckIn.isPending) return // Prevent multiple clicks

    const axis = axes.find(a => a.id === axisId)
    if (axis) {
      toggleCheckIn.mutate(
        {
          categoryId: axisId,
          completed: !axis.completed
        },
        {
          onSuccess: (data) => {
            const message = axis.completed
              ? `${axis.name} unchecked`
              : `${axis.name} completed! 🎉`

            // Show toast notification
            showToast(message, 'success', 2500)

            // Also add to notification store for persistence
            addNotification({
              type: 'success',
              message: message
            })

            // Force immediate refetch of dashboard data
            queryClient.invalidateQueries({ queryKey: ['dashboard-optimized', user?.id] })
          },
          onError: (error) => {
            const errorMessage = 'Failed to update. Please try again.'

            // Show error toast
            showToast(errorMessage, 'error', 4000)

            // Also add to notification store
            addNotification({
              type: 'error',
              message: errorMessage
            })
          }
        }
      )
    }
  }, [axes, toggleCheckIn, addNotification, queryClient, user?.id, showToast])

  const handleLogout = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

  // Handle authentication redirect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen text-white">
        <StandardHeader
          user={user}
          onLogout={handleLogout}
          currentStreak={0}
          variant="dashboard"
        />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <SkeletonDashboard />
        </div>
      </div>
    )
  }

  // Show error state if critical data failed to load
  if (error) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show loading state for authentication check
  if (!user) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying access...</p>
        </div>
      </div>
    )
  }

  const completedCount = Array.isArray(axes) ? axes.filter(a => a.completed).length : 0

  return (
    <QueryErrorBoundary>
      <RealtimeErrorBoundary maxRetries={3}>
        <div
          className="min-h-screen text-white"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)'
          }}
        >
          <StandardHeader
            user={user}
            onLogout={handleLogout}
            currentStreak={currentStreak}
            completionPercentage={completedCount === 6 ? 100 : Math.round((completedCount / 6) * 100)}
            variant="dashboard"
          />

          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-8">
            {/* Logo Section */}
            <div className="flex justify-center mb-3 sm:mb-4 lg:mb-6">
              <LogoFull size="lg" className="h-12 sm:h-14 lg:h-16" priority={false} />
            </div>

            {/* Welcome Section */}
            <main className="mb-3 sm:mb-6 lg:mb-8 px-1 sm:px-2" role="main">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 text-center leading-tight">
                Hello, {user.email?.split('@')[0]}! 👋
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-400 text-center px-2">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </main>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 xl:gap-8" role="region" aria-label="Main dashboard panel">
              {/* Hexagon Section */}
              <div className="lg:col-span-2">
                <div className="glass rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 overflow-hidden">
                  <div className="flex justify-between items-center mb-3 sm:mb-4 lg:mb-6">
                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold">Your Progress Today</h3>
                    <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap ml-2">
                      {completedCount}/6 completed
                    </span>
                  </div>

                  <HexagonVisualizationWithResonance
                    key={`hexagon-${axes.map(a => `${a.id}-${a.completed}`).join('-')}`}
                    axes={axes}
                    onToggleAxis={handleToggleAxis}
                    isToggling={toggleCheckIn.isPending}
                  />

                  {/* Axes List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6" data-testid="category-cards">
                    {axes.map((axis) => (
                      <MemoizedCategoryCard
                        key={`${axis.id}-${axis.completed}`}
                        axis={axis}
                        onToggle={() => handleToggleAxis(axis.id)}
                        isToggling={toggleCheckIn.isPending}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                {/* Realtime Status (Development Only) */}
                {process.env.NODE_ENV === 'development' && realtimeStatus && (
                  <div className="glass rounded-lg p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Realtime</span>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            realtimeStatus.isAnyConnected ? 'bg-green-400' : 'bg-yellow-400'
                          }`}
                        />
                        <span className={`text-xs ${
                          realtimeStatus.isAnyConnected ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {realtimeStatus.isAnyConnected ? 'Connected' : 'Polling'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Daily Mantra */}
                <Suspense fallback={
                  <div className="glass rounded-xl p-4 sm:p-6 animate-pulse">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 bg-white/20 rounded"></div>
                      <div className="h-4 bg-white/20 rounded w-24"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-white/20 rounded w-full"></div>
                      <div className="h-3 bg-white/20 rounded w-3/4"></div>
                    </div>
                  </div>
                }>
                  <DailyMantraCard />
                </Suspense>

                {/* Quick Stats */}
                <div className="glass rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 sm:mb-4">Statistics</h3>
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs sm:text-sm lg:text-base text-gray-400">Current streak</span>
                      <span className="text-sm sm:text-base lg:text-xl font-bold text-orange-400 tabular-nums">
                        {currentStreak} days
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs sm:text-sm lg:text-base text-gray-400">Best streak</span>
                      <span className="text-sm sm:text-base lg:text-xl font-bold text-purple-400 tabular-nums">
                        {longestStreak} days
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs sm:text-sm lg:text-base text-gray-400">Completed today</span>
                      <span className="text-sm sm:text-base lg:text-xl font-bold tabular-nums">{completedCount}/6</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 sm:space-y-3">
                  <Link
                    href="/my-day"
                    className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center justify-between hover:bg-white/5 active:scale-[0.98] transition-all text-xs sm:text-sm lg:text-base touch-manipulation"
                    aria-label="Plan and track your daily activities"
                  >
                    <span className="font-medium">Plan My Day</span>
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/analytics"
                    className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center justify-between hover:bg-white/5 active:scale-[0.98] transition-all text-xs sm:text-sm lg:text-base touch-manipulation"
                    aria-label="View complete progress analysis"
                  >
                    <span className="font-medium">View Complete Analysis</span>
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/achievements"
                    className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center justify-between hover:bg-white/5 active:scale-[0.98] transition-all text-xs sm:text-sm lg:text-base touch-manipulation"
                    aria-label="View your achievements and recognitions"
                  >
                    <span className="font-medium">Achievements</span>
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notifications */}
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
      </RealtimeErrorBoundary>
    </QueryErrorBoundary>
  )
}
