'use client'

import { motion } from 'framer-motion'
import { Calendar, TrendingUp, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { memo, useMemo, useCallback, useEffect, lazy, Suspense, useTransition } from 'react'

// Lazy load heavy components for better bundle splitting and faster initial load
const DailyMantraCard = lazy(() =>
  import('@/components/mantras/DailyMantraCard')
    .then(mod => ({ default: mod.DailyMantraCard }))
    .catch(() => ({ default: () => <div className="glass rounded-xl p-4 animate-pulse h-32" /> }))
)

// Optimized imports
import { EnhancedErrorBoundary } from '@/components/error/EnhancedErrorBoundary'
import { AxisIcon } from '@/components/icons'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { LogoFull } from '@/components/ui/Logo'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeCheckins'
import { useDashboardDataOptimized, useBatchCheckInMutation } from '@/lib/react-query/hooks/useDashboardDataOptimized'
import { useUser } from '@/lib/react-query/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useUIStore, usePreferencesStore } from '@/lib/stores/useAppStore'

// Types for optimization
interface OptimizedAxis {
  id: string | number
  name: string
  color: string
  icon: string
  completed: boolean
}

// Memoized HexagonChart wrapper with strict equality comparison
const HexagonVisualizationOptimized = memo(function HexagonVisualizationOptimized({
  axes,
  onToggleAxis,
  isToggling
}: {
  axes: OptimizedAxis[]
  onToggleAxis: (id: string | number) => void
  isToggling: boolean
}) {
  const { showResonance } = usePreferencesStore()

  // Memoize hexagon data computation with deep comparison
  const hexagonData = useMemo(() => {
    const baseData = {
      physical: 0,
      mental: 0,
      emotional: 0,
      social: 0,
      spiritual: 0,
      material: 0
    }

    // Convert axes to hexagon format efficiently
    for (const axis of axes) {
      const key = axis.name.toLowerCase() as keyof typeof baseData
      if (key in baseData) {
        baseData[key] = axis.completed ? 100 : 0
      }
    }

    return baseData
  }, [axes])

  // Lazy load HexagonChart to avoid blocking initial render
  const HexagonChart = useMemo(() =>
    lazy(() => import('@/components/axis/HexagonChartWithResonance')),
    []
  )

  return (
    <div className="flex justify-center mb-4 sm:mb-8 overflow-hidden" data-testid="hexagon-chart">
      <div className="w-full max-w-[95vw] sm:max-w-none flex justify-center">
        <EnhancedErrorBoundary
          level="component"
          context={{ component: 'HexagonChart', axes: axes.length }}
          fallback={(error, retry) => (
            <div className="w-80 h-80 flex items-center justify-center bg-gray-800/50 rounded-xl">
              <div className="text-center">
                <p className="text-gray-400 mb-2">Chart failed to load</p>
                <button onClick={retry} className="px-3 py-1 bg-purple-600 rounded text-sm">
                  Retry
                </button>
              </div>
            </div>
          )}
        >
          <Suspense fallback={
            <div className="w-80 h-80 bg-gradient-to-br from-gray-200/20 to-gray-300/20 rounded-2xl animate-pulse" />
          }>
            <HexagonChart
              data={hexagonData}
              size={350}
              animate={true}
              showResonance={showResonance}
              onToggleAxis={onToggleAxis}
              isToggling={isToggling}
              axes={axes}
            />
          </Suspense>
        </EnhancedErrorBoundary>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for strict optimization
  return (
    prevProps.isToggling === nextProps.isToggling &&
    prevProps.axes.length === nextProps.axes.length &&
    prevProps.axes.every((axis, index) => {
      const nextAxis = nextProps.axes[index]
      return axis.id === nextAxis?.id &&
             axis.completed === nextAxis?.completed &&
             axis.name === nextAxis?.name
    })
  )
})

// Optimized category card with performance-first design
const OptimizedCategoryCard = memo(function OptimizedCategoryCard({
  axis,
  onToggle,
  isToggling
}: {
  axis: OptimizedAxis
  onToggle: () => void
  isToggling: boolean
}) {
  const showAnimations = usePreferencesStore(state => state.showAnimations)

  // Memoize button classes to prevent recalculation
  const buttonClasses = useMemo(() => {
    const baseClasses = "p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all min-h-[48px] sm:min-h-[56px] hover:scale-[1.02] active:scale-[0.98] border"
    const completedClasses = "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30"
    const incompleteClasses = "bg-white/5 hover:bg-white/10 border-white/10"

    return `${baseClasses} ${axis.completed ? completedClasses : incompleteClasses}`
  }, [axis.completed])

  return (
    <button
      onClick={onToggle}
      disabled={isToggling}
      className={buttonClasses}
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
}, (prevProps, nextProps) => {
  // Optimize re-rendering with precise comparison
  return (
    prevProps.axis.id === nextProps.axis.id &&
    prevProps.axis.completed === nextProps.axis.completed &&
    prevProps.isToggling === nextProps.isToggling
  )
})

// Stats component with memoized calculations
const OptimizedStatsSection = memo(function OptimizedStatsSection({
  currentStreak,
  longestStreak,
  completedCount
}: {
  currentStreak: number
  longestStreak: number
  completedCount: number
}) {
  return (
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
  )
})

// Main Dashboard Component with Maximum Optimization
export default function OptimizedDashboardPage() {
  const router = useRouter()
  const { addNotification } = useUIStore()
  const { toasts, showToast, removeToast } = useToast()
  const [isPending, startTransition] = useTransition()

  // React Query client for manual cache management
  const queryClient = useQueryClient()

  // Get current user for authentication check
  const { data: authUser, isLoading: authLoading } = useUser()

  // Fetch all dashboard data with single optimized query
  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch
  } = useDashboardDataOptimized(authUser?.id)

  // Batch mutation for multiple check-ins (performance optimization)
  const batchCheckInMutation = useBatchCheckInMutation(authUser?.id)

  // Extract data from unified response with memoization
  const { user, categories, checkins, streaks, stats } = useMemo(() => ({
    user: dashboardData?.user || authUser,
    categories: dashboardData?.categories || [],
    checkins: dashboardData?.todayCheckins || [],
    streaks: dashboardData?.streaks || [],
    stats: dashboardData?.stats || {}
  }), [dashboardData, authUser])

  // Loading and error states
  const isLoading = authLoading || dashboardLoading || isPending
  const error = dashboardError

  // Enable realtime updates with connection monitoring
  const realtimeStatus = useRealtimeDashboard(user?.id)

  // Memoize axes calculation with performance optimization
  const axes = useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return []
    }

    // Limit to exactly 6 categories for hexagon design
    const limitedCategories = categories.slice(0, 6)

    // Create completed set for O(1) lookups
    const completedSet = new Set(
      Array.isArray(checkins)
        ? checkins.map(c => Number(c.category_id)).filter(id => !isNaN(id))
        : []
    )

    return limitedCategories.map(cat => {
      // Optimized JSONB name parsing
      let displayName = 'Unknown'

      try {
        if (typeof cat.name === 'object' && cat.name?.en) {
          displayName = cat.name.en
        } else if (typeof cat.name === 'string') {
          const parsed = JSON.parse(cat.name)
          displayName = parsed.en || parsed.es || cat.slug || 'Unknown'
        } else {
          displayName = cat.slug || 'Unknown'
        }
      } catch {
        displayName = cat.slug || 'Unknown'
      }

      return {
        id: cat.id,
        name: displayName,
        color: cat.color,
        icon: cat.icon,
        completed: completedSet.has(cat.id)
      }
    })
  }, [categories, checkins])

  // Memoize streak calculations for performance
  const { currentStreak, longestStreak } = useMemo(() => {
    const current = stats?.currentOverallStreak ||
      (Array.isArray(streaks) ? Math.max(...streaks.map(s => s.current_streak || 0), 0) : 0)
    const longest = stats?.longestOverallStreak ||
      (Array.isArray(streaks) ? Math.max(...streaks.map(s => s.longest_streak || 0), 0) : 0)

    return { currentStreak: current, longestStreak: longest }
  }, [streaks, stats])

  // Optimized toggle handler with batch support and transitions
  const handleToggleAxis = useCallback((axisId: string | number) => {
    if (batchCheckInMutation.isPending) return

    const axis = axes.find(a => a.id === axisId)
    if (!axis) return

    // Use transition for non-urgent updates
    startTransition(() => {
      batchCheckInMutation.mutate(
        [{ categoryId: axisId, completed: !axis.completed }],
        {
          onSuccess: () => {
            const message = axis.completed
              ? `${axis.name} unchecked`
              : `${axis.name} completed! 🎉`

            showToast(message, 'success', 2500)
            addNotification({ type: 'success', message })

            // Immediate cache invalidation for instant feedback
            queryClient.invalidateQueries({ queryKey: ['dashboard-optimized', user?.id] })
          },
          onError: (error) => {
            const errorMessage = 'Failed to update. Please try again.'
            showToast(errorMessage, 'error', 4000)
            addNotification({ type: 'error', message: errorMessage })

            // Force refetch on error for consistency
            refetch()
          }
        }
      )
    })
  }, [axes, batchCheckInMutation, user?.id, showToast, addNotification, queryClient, refetch])

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

  // Loading state with optimization
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

  // Error state with enhanced error boundary
  if (error) {
    return (
      <EnhancedErrorBoundary
        level="page"
        context={{ page: 'dashboard', userId: user?.id }}
        fallback={(error, retry) => (
          <div className="min-h-screen text-white flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-2">Failed to load dashboard</p>
              <button
                onClick={retry}
                className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      >
        <div>Dashboard error occurred</div>
      </EnhancedErrorBoundary>
    )
  }

  // Authentication check
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

  const completedCount = axes.filter(a => a.completed).length

  return (
    <EnhancedErrorBoundary
      level="page"
      context={{ page: 'dashboard', userId: user.id }}
    >
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
            <LogoFull size="lg" className="h-12 sm:h-14 lg:h-16" priority={true} />
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

          {/* Main Grid with Optimized Layout */}
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

                <HexagonVisualizationOptimized
                  axes={axes}
                  onToggleAxis={handleToggleAxis}
                  isToggling={batchCheckInMutation.isPending}
                />

                {/* Axes List with Performance Optimization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6" data-testid="category-cards">
                  {axes.map((axis) => (
                    <OptimizedCategoryCard
                      key={axis.id}
                      axis={axis}
                      onToggle={() => handleToggleAxis(axis.id)}
                      isToggling={batchCheckInMutation.isPending}
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

              {/* Daily Mantra with Error Boundary */}
              <EnhancedErrorBoundary
                level="component"
                context={{ component: 'DailyMantra' }}
                fallback={() => (
                  <div className="glass rounded-xl p-4 text-center text-gray-400">
                    <p>Daily mantra unavailable</p>
                  </div>
                )}
              >
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
              </EnhancedErrorBoundary>

              {/* Optimized Stats */}
              <OptimizedStatsSection
                currentStreak={currentStreak}
                longestStreak={longestStreak}
                completedCount={completedCount}
              />

              {/* Actions with Memoized Links */}
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
    </EnhancedErrorBoundary>
  )
}
