'use client'

import { memo, useMemo, useCallback, lazy, Suspense } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Flame, Settings, LogOut, TrendingUp, Trophy, User } from 'lucide-react'

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
  usePreferencesStore, 
  useCheckInStore 
} from '@/lib/stores/useAppStore'

// Components
import { AxisIcon } from '@/components/icons'
import { LogoFull } from '@/components/ui/Logo'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { QueryErrorBoundary } from '@/components/error/QueryErrorBoundary'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

// Lazy loaded components for better performance
const HexagonChart = lazy(() => import('@/components/axis/HexagonChart'))
const CategoryCard = lazy(() => import('@/components/axis/CategoryCard'))
const DailyMantra = lazy(() => import('@/components/axis/DailyMantra'))

// Memoized header component
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
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </Link>
          <Link 
            href="/settings" 
            className="p-1.5 sm:p-2 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] flex items-center justify-center hover:bg-white/10 rounded-lg transition"
            aria-label="Go to settings"
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
})

DashboardHeader.displayName = 'DashboardHeader'

// Memoized hexagon visualization
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
  
  const createHexagonPath = useCallback((size: number, centerX: number, centerY: number) => {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const x = centerX + size * Math.cos(angle)
      const y = centerY + size * Math.sin(angle)
      points.push(`${x},${y}`)
    }
    return points.join(' ')
  }, [])

  const completionPercentage = useMemo(
    () => (axes.filter(a => a.completed).length / axes.length) * 100,
    [axes]
  )

  return (
    <div className="flex justify-center mb-4 sm:mb-8" data-testid="hexagon-chart">
      <svg className="w-full h-auto max-w-[280px] sm:max-w-[350px] md:max-w-[400px]" viewBox="0 0 400 400" role="img" aria-label={`Hexagonal progress: ${axes.filter(a => a.completed).length} of 6 axes completed`}>
        {/* Background hexagon */}
        <polygon
          points={createHexagonPath(160, 200, 200)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        
        {/* Progress hexagon */}
        <AnimatePresence>
          {completionPercentage > 0 && (
            <motion.polygon
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: completionPercentage / 100, 
                opacity: 0.3 
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: showAnimations ? 0.5 : 0,
                ease: "easeInOut" 
              }}
              points={createHexagonPath(160, 200, 200)}
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
        
        {/* Axis points */}
        {axes.map((axis, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 2
          const x = 200 + 160 * Math.cos(angle)
          const y = 200 + 160 * Math.sin(angle)
          
          return (
            <g key={axis.id}>
              <motion.circle
                cx={x}
                cy={y}
                r="30"
                fill={axis.completed ? axis.color : 'rgba(255,255,255,0.1)'}
                fillOpacity={axis.completed ? 0.8 : 1}
                className="cursor-pointer transition-all"
                onClick={() => !isToggling && onToggleAxis(axis.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                role="button"
                aria-label={`${axis.name}: ${axis.completed ? 'completed' : 'not completed'}`}
                data-testid={`category-${axis.name.toLowerCase()}`}
                data-category={axis.name.toLowerCase()}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggleAxis(axis.id)
                  }
                }}
              />
              <foreignObject 
                x={x - 14} 
                y={y - 14} 
                width="28" 
                height="28"
                pointerEvents="none"
              >
                <AxisIcon 
                  axis={axis.icon}
                  size={28}
                  color={axis.completed ? 'white' : '#9ca3af'}
                  custom
                  animated={showAnimations && axis.completed}
                />
              </foreignObject>
            </g>
          )
        })}
      </svg>
    </div>
  )
})

HexagonVisualization.displayName = 'HexagonVisualization'

// Memoized category card
const MemoizedCategoryCard = memo(({ 
  axis, 
  onToggle,
  isToggling 
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
}) => {
  const showAnimations = usePreferencesStore(state => state.showAnimations)
  
  return (
    <motion.button
      whileHover={showAnimations ? { scale: 1.02 } : undefined}
      whileTap={showAnimations ? { scale: 0.98 } : undefined}
      onClick={onToggle}
      disabled={isToggling}
      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all min-h-[48px] sm:min-h-[56px] ${
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
    </motion.button>
  )
})

MemoizedCategoryCard.displayName = 'MemoizedCategoryCard'

// Main Dashboard Component
export default function DashboardPageV2() {
  const router = useRouter()
  const { addNotification } = useUIStore()
  const { locale } = usePreferencesStore()
  
  // Fetch all data in parallel with React Query
  const { data: user, isLoading: userLoading } = useUser()
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: checkins = [], isLoading: checkinsLoading } = useTodayCheckins(user?.id)
  const { data: streaks = [], isLoading: streaksLoading } = useStreaks(user?.id)
  const toggleCheckIn = useToggleCheckIn(user?.id)
  
  // Enable realtime updates for this user
  useRealtimeDashboard(user?.id)

  // Calculate derived state with memoization
  const completedCategoryIds = useMemo(
    () => new Set(checkins.map(c => Number(c.category_id))),
    [checkins]
  )
  
  const axes = useMemo(
    () => categories.map(cat => ({
      id: cat.id,
      name: cat.name?.en || cat.slug,
      color: cat.color,
      icon: cat.icon,
      completed: completedCategoryIds.has(cat.id)
    })),
    [categories, completedCategoryIds]
  )

  const currentStreak = useMemo(
    () => Math.max(...streaks.map(s => s.current_streak), 0),
    [streaks]
  )

  const longestStreak = useMemo(
    () => Math.max(...streaks.map(s => s.longest_streak), 0),
    [streaks]
  )

  // Handlers with useCallback for optimization
  const handleToggleAxis = useCallback((axisId: number) => {
    const axis = axes.find(a => a.id === axisId)
    if (axis) {
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
          },
          onError: () => {
            addNotification({
              type: 'error',
              message: 'Error updating. Please try again.'
            })
          }
        }
      )
    }
  }, [axes, toggleCheckIn, addNotification])

  const handleLogout = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

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

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login')
    return null
  }

  const completedCount = axes.filter(a => a.completed).length

  return (
    <QueryErrorBoundary>
      <div className="min-h-screen text-white">
        <DashboardHeader currentStreak={currentStreak} onLogout={handleLogout} />

        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Logo Section */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <LogoFull size="lg" className="h-16 sm:h-24 md:h-32 lg:h-40" priority />
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
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold">Your Progress Today</h3>
                  <span className="text-xs sm:text-sm text-gray-400">
                    {completedCount}/6 completed
                  </span>
                </div>

                <HexagonVisualization 
                  axes={axes}
                  onToggleAxis={handleToggleAxis}
                  isToggling={toggleCheckIn.isPending}
                />

                {/* Axes List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4" data-testid="category-cards">
                  {axes.map((axis) => (
                    <MemoizedCategoryCard
                      key={axis.id}
                      axis={axis}
                      onToggle={() => handleToggleAxis(axis.id)}
                      isToggling={toggleCheckIn.isPending}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="space-y-4 sm:space-y-6">
              {/* Quick Stats */}
              <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Statistics</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-gray-400">Current streak</span>
                    <span className="text-lg sm:text-xl font-bold text-orange-400">
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
                    <span className="text-lg sm:text-xl font-bold">{completedCount}/6</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 sm:space-y-3">
                <Link 
                  href="/analytics"
                  className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center justify-between hover:bg-white/5 transition text-sm sm:text-base"
                  aria-label="View complete progress analysis"
                >
                  <span>View Complete Analysis</span>
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" aria-hidden="true" />
                </Link>
                <Link 
                  href="/achievements"
                  className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 min-h-[48px] sm:min-h-[56px] flex items-center justify-between hover:bg-white/5 transition text-sm sm:text-base"
                  aria-label="View your achievements and recognitions"
                >
                  <span>Achievements</span>
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryErrorBoundary>
  )
}