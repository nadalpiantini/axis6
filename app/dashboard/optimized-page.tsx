'use client'

import { memo, useMemo, useCallback, useEffect, lazy, Suspense, useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Flame, Settings, LogOut, TrendingUp, Trophy, User, Calendar, Loader2 } from 'lucide-react'

// Lazy load heavy components for better bundle splitting
const DailyMantraCard = lazy(() => import('@/components/mantras/DailyMantraCard').then(mod => ({ default: mod.DailyMantraCard })))

// React Query hooks
import { 
  useUser, 
  useCategories, 
  useTodayCheckins, 
  useToggleCheckIn, 
  useStreaks 
} from '@/lib/react-query/hooks'

// Realtime hooks
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeCheckins'

// Zustand stores
import { 
  useUIStore, 
  usePreferencesStore
} from '@/lib/stores/useAppStore'

// Components
import { AxisIcon } from '@/components/icons'
import { LogoFull } from '@/components/ui/Logo'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { QueryErrorBoundary } from '@/components/error/QueryErrorBoundary'
import { ClickableSVG } from '@/components/ui/ClickableSVG'

// Performance monitoring
import { performanceUtils } from '@/lib/production/performance-optimizer'

// Memoized header component with proper comparison
const DashboardHeader = memo(({ 
  currentStreak, 
  onLogout 
}: { 
  currentStreak: number
  onLogout: () => void 
}) => {
  return (
    <header className="glass border-b border-white/10" role="banner">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm" data-testid="streak-counter">
          <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
          <span className="text-gray-300 font-medium">
            <span className="hidden sm:inline">Streak: </span>
            <span>{currentStreak}<span className="hidden sm:inline"> days</span></span>
          </span>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2" data-testid="user-menu">
          <Link 
            href="/profile" 
            className="p-1.5 sm:p-2 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] flex items-center justify-center hover:bg-white/10 rounded-lg transition"
            aria-label="Go to profile"
            prefetch={true}
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </Link>
          <Link 
            href="/settings" 
            className="p-1.5 sm:p-2 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] flex items-center justify-center hover:bg-white/10 rounded-lg transition"
            aria-label="Go to settings"
            prefetch={true}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </Link>
          <button 
            onClick={onLogout} 
            className="p-1.5 sm:p-2 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] flex items-center justify-center hover:bg-white/10 rounded-lg transition"
            aria-label="Sign out"
            type="button"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for better memo optimization
  return prevProps.currentStreak === nextProps.currentStreak
})

DashboardHeader.displayName = 'DashboardHeader'

// Optimized hexagon path calculation
const createHexagonPath = (size: number, centerX: number, centerY: number): string => {
  const points = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    const x = centerX + size * Math.cos(angle)
    const y = centerY + size * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}

// Memoized hexagon visualization with deep comparison
const HexagonVisualization = memo(({ 
  axes, 
  onToggleAxis,
  isToggling 
}: {
  axes: Array<{
    id: number
    name: string
    color: string
    icon: string
    completed: boolean
  }>
  onToggleAxis: (id: number) => void
  isToggling: boolean
}) => {
  const showAnimations = usePreferencesStore(state => state.showAnimations)
  
  // Memoize the hexagon path
  const hexagonPath = useMemo(
    () => createHexagonPath(160, 200, 200),
    []
  )

  const completionPercentage = useMemo(
    () => (axes.filter(a => a.completed).length / axes.length) * 100,
    [axes]
  )

  return (
    <div className="flex justify-center mb-4 sm:mb-8" data-testid="hexagon-chart">
      <svg 
        className="w-full h-auto max-w-[280px] sm:max-w-[350px] md:max-w-[400px]" 
        viewBox="0 0 400 400" 
        role="img" 
        aria-label={`Hexagonal progress: ${axes.filter(a => a.completed).length} of 6 axes completed`}
      >
        {/* Background hexagon */}
        <polygon
          points={hexagonPath}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        
        {/* Progress hexagon with optimized animation */}
        <AnimatePresence mode="wait">
          {completionPercentage > 0 && (
            <motion.polygon
              key="progress-hexagon"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: completionPercentage / 100, 
                opacity: 0.3 
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: showAnimations ? 0.3 : 0,
                ease: "easeInOut" 
              }}
              points={hexagonPath}
              fill="url(#gradient)"
              stroke="url(#gradient)"
              strokeWidth="2"
            />
          )}
        </AnimatePresence>
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B8AE6" />
            <stop offset="100%" stopColor="#FF8B7D" />
          </linearGradient>
        </defs>
        
        {/* Axis points with optimized rendering */}
        {axes.map((axis, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 2
          const x = 200 + 160 * Math.cos(angle)
          const y = 200 + 160 * Math.sin(angle)
          
          return (
            <ClickableSVG
              key={axis.id}
              onClick={() => onToggleAxis(axis.id)}
              disabled={isToggling}
              aria-label={`Toggle ${axis.name}: Currently ${axis.completed ? 'completed' : 'not completed'}`}
              data-testid={`category-${axis.name.toLowerCase()}`}
              role="button"
              aria-pressed={axis.completed}
            >
              <circle
                cx={x}
                cy={y}
                r="30"
                fill={axis.completed ? axis.color : 'rgba(255,255,255,0.1)'}
                fillOpacity={axis.completed ? 0.8 : 1}
                className="transition-all"
              />
              <foreignObject 
                x={x - 14} 
                y={y - 14} 
                width="28" 
                height="28"
                style={{ pointerEvents: 'none' }}
              >
                <AxisIcon 
                  axis={axis.icon}
                  size={28}
                  color={axis.completed ? 'white' : '#9ca3af'}
                  custom
                  animated={showAnimations && axis.completed}
                />
              </foreignObject>
            </ClickableSVG>
          )
        })}
      </svg>
    </div>
  )
}, (prevProps, nextProps) => {
  // Deep comparison for axes array
  if (prevProps.axes.length !== nextProps.axes.length) return false
  if (prevProps.isToggling !== nextProps.isToggling) return false
  
  return prevProps.axes.every((axis, index) => {
    const nextAxis = nextProps.axes[index]
    return axis.id === nextAxis.id && axis.completed === nextAxis.completed
  })
})

HexagonVisualization.displayName = 'HexagonVisualization'

// Memoized category card with loading state
const MemoizedCategoryCard = memo(({ 
  axis, 
  onToggle,
  isToggling,
  isPending 
}: {
  axis: {
    id: number
    name: string
    color: string
    icon: string
    completed: boolean
  }
  onToggle: () => void
  isToggling: boolean
  isPending?: boolean
}) => {
  const showAnimations = usePreferencesStore(state => state.showAnimations)
  const [isClicking, setIsClicking] = useState(false)
  
  const handleClick = useCallback(() => {
    setIsClicking(true)
    onToggle()
    setTimeout(() => setIsClicking(false), 300)
  }, [onToggle])
  
  return (
    <button
      onClick={handleClick}
      disabled={isToggling || isPending}
      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all min-h-[48px] sm:min-h-[56px] hover:scale-[1.02] active:scale-[0.98] relative ${
        axis.completed 
          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' 
          : 'bg-white/5 hover:bg-white/10 border-white/10'
      } border`}
      aria-pressed={axis.completed}
      aria-busy={isPending}
      data-testid={`category-card-${axis.name.toLowerCase()}`}
      data-checked={axis.completed}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Loading spinner overlay */}
        {(isPending || isClicking) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
        )}
        
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
  return (
    prevProps.axis.id === nextProps.axis.id &&
    prevProps.axis.completed === nextProps.axis.completed &&
    prevProps.isToggling === nextProps.isToggling &&
    prevProps.isPending === nextProps.isPending
  )
})

MemoizedCategoryCard.displayName = 'MemoizedCategoryCard'

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
  </div>
)

// Main Dashboard Component with performance optimizations
export default function OptimizedDashboardPage() {
  const router = useRouter()
  const { addNotification } = useUIStore()
  const [isPending, startTransition] = useTransition()
  const [pendingCategoryId, setPendingCategoryId] = useState<number | null>(null)
  
  // Fetch all data in parallel with React Query
  const { data: user, isLoading: userLoading, error: userError } = useUser()
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const { data: checkins = [], error: checkinsError } = useTodayCheckins(user?.id)
  const { data: streaks = [], error: streaksError } = useStreaks(user?.id)
  const toggleCheckIn = useToggleCheckIn(user?.id)
  
  // Enable realtime updates for this user
  useRealtimeDashboard(user?.id)

  // Calculate derived state with deep memoization
  const completedCategoryIds = useMemo(
    () => new Set(checkins.map(c => Number(c.category_id))),
    [checkins]
  )
  
  const axes = useMemo(
    () => {
      // Performance measurement
      const start = performance.now()
      
      if (!Array.isArray(categories) || categories.length === 0) {
        console.warn('⚠️ AXIS6: Categories not loaded or empty array')
        return []
      }
      
      const limitedCategories = categories.slice(0, 6)
      
      if (categories.length > 6) {
        console.warn(`⚠️ AXIS6: Found ${categories.length} categories, limiting to 6 for hexagon layout`)
      }
      
      const result = limitedCategories.map(cat => {
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
        } catch (error) {
          displayName = cat.slug || 'Unknown'
          console.warn(`⚠️ AXIS6: Failed to parse name for category ${cat.id}:`, error)
        }
        
        return {
          id: cat.id,
          name: displayName,
          color: cat.color,
          icon: cat.icon,
          completed: completedCategoryIds.has(cat.id)
        }
      })
      
      const end = performance.now()
      if (end - start > 10) {
        console.warn(`Axes calculation took ${end - start}ms`)
      }
      
      return result
    },
    [categories, completedCategoryIds]
  )

  const currentStreak = useMemo(
    () => Array.isArray(streaks) && streaks.length > 0 
      ? Math.max(...streaks.map(s => s.current_streak || 0), 0) 
      : 0,
    [streaks]
  )

  const longestStreak = useMemo(
    () => Array.isArray(streaks) && streaks.length > 0 
      ? Math.max(...streaks.map(s => s.longest_streak || 0), 0) 
      : 0,
    [streaks]
  )

  // Optimized handlers with useCallback and transition
  const handleToggleAxis = useCallback((axisId: number) => {
    if (toggleCheckIn.isPending) return
    
    setPendingCategoryId(axisId)
    const axis = axes.find(a => a.id === axisId)
    
    if (axis) {
      startTransition(() => {
        toggleCheckIn.mutate(
          {
            categoryId: axisId,
            completed: !axis.completed
          },
          {
            onSuccess: () => {
              addNotification({
                type: 'success',
                message: axis.completed 
                  ? `${axis.name} unchecked` 
                  : `${axis.name} completed!`
              })
              setPendingCategoryId(null)
            },
            onError: () => {
              addNotification({
                type: 'error',
                message: 'Error updating. Please try again.'
              })
              setPendingCategoryId(null)
            }
          }
        )
      })
    }
  }, [axes, toggleCheckIn, addNotification])

  const handleLogout = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

  // Handle authentication redirect
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, userLoading, router])

  // Prefetch critical routes
  useEffect(() => {
    if (user) {
      router.prefetch('/analytics')
      router.prefetch('/achievements')
      router.prefetch('/my-day')
    }
  }, [user, router])

  // Show loading state
  if (userLoading || categoriesLoading) {
    return (
      <div className="min-h-screen text-white">
        <DashboardHeader currentStreak={0} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <SkeletonDashboard />
        </div>
      </div>
    )
  }

  // Show error state if critical data failed to load
  if (userError || categoriesError) {
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
      <div className="min-h-screen text-white">
        <DashboardHeader currentStreak={currentStreak} onLogout={handleLogout} />

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Logo Section */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <LogoFull size="lg" className="h-16" priority />
          </div>
          
          {/* Welcome Section */}
          <main className="mb-4 sm:mb-8" role="main">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 text-center">
              Hello, {user.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-400 text-center">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </main>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" role="region" aria-label="Main dashboard panel">
            {/* Hexagon Section */}
            <div className="lg:col-span-2">
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg md:text-xl font-semibold">Your Progress Today</h2>
                  <span className="text-xs sm:text-sm text-gray-400" aria-live="polite">
                    {completedCount}/6 completed
                  </span>
                </div>

                <HexagonVisualization 
                  axes={axes}
                  onToggleAxis={handleToggleAxis}
                  isToggling={toggleCheckIn.isPending || isPending}
                />

                {/* Axes List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4" data-testid="category-cards">
                  {axes.map((axis) => (
                    <MemoizedCategoryCard
                      key={axis.id}
                      axis={axis}
                      onToggle={() => handleToggleAxis(axis.id)}
                      isToggling={toggleCheckIn.isPending}
                      isPending={pendingCategoryId === axis.id}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="space-y-4 sm:space-y-6">
              {/* Daily Mantra with better loading state */}
              <Suspense fallback={<LoadingSpinner />}>
                <DailyMantraCard />
              </Suspense>
              
              {/* Quick Stats */}
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Statistics</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-400">Current streak</span>
                    <span className="text-lg sm:text-xl font-bold text-orange-400" aria-live="polite">
                      {currentStreak} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-400">Best streak</span>
                    <span className="text-lg sm:text-xl font-bold text-purple-400">
                      {longestStreak} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-400">Completed today</span>
                    <span className="text-lg sm:text-xl font-bold" aria-live="polite">
                      {completedCount}/6
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions with prefetch */}
              <nav className="space-y-2 sm:space-y-3" aria-label="Dashboard actions">
                <Link 
                  href="/my-day"
                  className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center justify-between hover:bg-white/5 transition text-sm sm:text-base"
                  aria-label="Plan and track your daily activities"
                  prefetch={true}
                >
                  <span>Plan My Day</span>
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" aria-hidden="true" />
                </Link>
                <Link 
                  href="/analytics"
                  className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center justify-between hover:bg-white/5 transition text-sm sm:text-base"
                  aria-label="View complete progress analysis"
                  prefetch={true}
                >
                  <span>View Complete Analysis</span>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" aria-hidden="true" />
                </Link>
                <Link 
                  href="/achievements"
                  className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center justify-between hover:bg-white/5 transition text-sm sm:text-base"
                  aria-label="View your achievements and recognitions"
                  prefetch={true}
                >
                  <span>Achievements</span>
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" aria-hidden="true" />
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </QueryErrorBoundary>
  )
}