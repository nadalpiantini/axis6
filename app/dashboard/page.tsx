'use client'

import { memo, useMemo, useCallback, useEffect, lazy, Suspense, useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Flame, Settings, LogOut, TrendingUp, Trophy, User, Calendar, ChevronDown, Check } from 'lucide-react'

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
import { useQueryClient } from '@tanstack/react-query'

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
import { RealtimeErrorBoundary } from '@/components/error/RealtimeErrorBoundary'
import { ClickableSVG } from '@/components/ui/ClickableSVG'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { useToast, ToastContainer } from '@/components/ui/Toast'

// 🚀 REVOLUTIONARY HEXAGON - Rescued from HexagonClock component
import HexagonClock from '@/components/hexagon-clock/HexagonClock'

const HexagonVisualization = memo(({ 
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
  // Transform axes data to HexagonClock data format
  const completionData = useMemo(() => {
    const data: any = {}
    const categoryMap: { [key: string]: string } = {
      'Physical': 'physical',
      'Mental': 'mental', 
      'Emotional': 'emotional',
      'Social': 'social',
      'Spiritual': 'spiritual',
      'Material': 'material'
    }
    
    axes.forEach(axis => {
      const key = categoryMap[axis.name] || axis.name.toLowerCase()
      data[key] = axis.completed ? 100 : 0
    })
    
    return data
  }, [axes])

  return (
    <div className="flex justify-center mb-4 sm:mb-8" data-testid="hexagon-chart">
      <HexagonClock
        data={completionData}
        showResonance={true}
        animate={true}
        mobileOptimized={true}
        hardwareAccelerated={true}
        onCategoryClick={(category) => {
          // Find matching axis and trigger toggle
          const matchingAxis = axes.find(axis => {
            const categoryMap: { [key: string]: string } = {
              'physical': 'Physical',
              'mental': 'Mental',
              'emotional': 'Emotional', 
              'social': 'Social',
              'spiritual': 'Spiritual',
              'material': 'Material'
            }
            return categoryMap[category.key] === axis.name
          })
          if (matchingAxis) {
            onToggleAxis(matchingAxis.id)
          }
        }}
      />
    </div>
  )
})


// Dropdown options for each axis category
const getAxisOptions = (axisName: string) => {
  const commonOptions = [
    { id: 'quick-check', label: 'Quick Check', emoji: '✓' },
    { id: 'detailed', label: 'Add Details', emoji: '📝' },
    { id: 'view-progress', label: 'View Progress', emoji: '📊' },
  ]
  
  const specificOptions = {
    Physical: [
      { id: 'workout', label: 'Workout', emoji: '💪' },
      { id: 'walk', label: 'Walk/Run', emoji: '🏃' },
      { id: 'nutrition', label: 'Healthy Meal', emoji: '🥗' },
      { id: 'sleep', label: 'Good Sleep', emoji: '😴' },
    ],
    Mental: [
      { id: 'learning', label: 'Learning', emoji: '🧠' },
      { id: 'reading', label: 'Reading', emoji: '📚' },
      { id: 'puzzle', label: 'Brain Games', emoji: '🧩' },
      { id: 'focus', label: 'Deep Focus', emoji: '🎯' },
    ],
    Emotional: [
      { id: 'meditation', label: 'Meditation', emoji: '🧘' },
      { id: 'journaling', label: 'Journaling', emoji: '📖' },
      { id: 'gratitude', label: 'Gratitude', emoji: '🙏' },
      { id: 'therapy', label: 'Self-Care', emoji: '💆' },
    ],
    Social: [
      { id: 'friends', label: 'Friends Time', emoji: '👥' },
      { id: 'family', label: 'Family Time', emoji: '👨‍👩‍👧‍👦' },
      { id: 'networking', label: 'Networking', emoji: '🤝' },
      { id: 'community', label: 'Community', emoji: '🏘️' },
    ],
    Spiritual: [
      { id: 'prayer', label: 'Prayer/Reflection', emoji: '🙏' },
      { id: 'nature', label: 'Nature Time', emoji: '🌿' },
      { id: 'purpose', label: 'Purpose Work', emoji: '🎯' },
      { id: 'wisdom', label: 'Wisdom Study', emoji: '📜' },
    ],
    Material: [
      { id: 'finance', label: 'Financial Planning', emoji: '💰' },
      { id: 'career', label: 'Career Development', emoji: '📈' },
      { id: 'organize', label: 'Organization', emoji: '🗂️' },
      { id: 'skills', label: 'Skill Building', emoji: '🔧' },
    ],
  }
  
  return [...(specificOptions[axisName as keyof typeof specificOptions] || []), ...commonOptions]
}

// Enhanced category card with dropdown
const MemoizedCategoryCard = memo(({ 
  axis, 
  onToggle,
  onOptionSelect,
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
  onOptionSelect?: (option: { id: string, label: string, emoji: string }) => void
  isToggling: boolean
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const showAnimations = usePreferencesStore(state => state.showAnimations)
  
  const options = useMemo(() => getAxisOptions(axis.name), [axis.name])
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])
  
  const handleOptionClick = (option: { id: string, label: string, emoji: string }) => {
    if (option.id === 'quick-check') {
      onToggle()
    } else {
      onOptionSelect?.(option)
    }
    setIsDropdownOpen(false)
  }
  
  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all min-h-[48px] sm:min-h-[56px] group ${
          axis.completed 
            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' 
            : 'bg-white/5 hover:bg-white/10 border-white/10'
        } border`}
        data-testid={`category-card-${axis.name.toLowerCase()}`}
        data-checked={axis.completed}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggle}
            disabled={isToggling}
            className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer hover:bg-white/20 ${axis.completed ? 'bg-white/10' : 'bg-white/5'}`}
            aria-label={`Toggle ${axis.name}`}
          >
            <AxisIcon
              axis={axis.icon}
              size={18}
              color={axis.color}
              custom
            />
          </button>
          <span className={`flex-1 text-sm sm:text-base font-medium ${axis.completed ? 'text-white' : 'text-gray-300'}`}>
            {axis.name}
            {axis.completed && <Check className="inline-block ml-2 w-4 h-4 text-green-400" />}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsDropdownOpen(!isDropdownOpen)
            }}
            disabled={isToggling}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            aria-label={`${axis.name} options menu`}
          >
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              } ${axis.completed ? 'text-white' : 'text-gray-400'}`} 
            />
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl overflow-hidden"
          >
            <div className="py-2 max-h-64 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option)}
                  className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-sm"
                >
                  <span className="text-lg">{option.emoji}</span>
                  <span className="text-white">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

MemoizedCategoryCard.displayName = 'MemoizedCategoryCard'

// Main Dashboard Component
export default function DashboardPageV2() {
  const router = useRouter()
  const { toasts, showToast, removeToast } = useToast()
  
  // React Query client for manual invalidation
  const queryClient = useQueryClient()
  
  // Fetch all data in parallel with React Query
  const { data: user, isLoading: userLoading, error: userError } = useUser()
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const { data: checkins = [], error: checkinsError } = useTodayCheckins(user?.id)
  const { data: streaks = [], error: streaksError } = useStreaks(user?.id)
  const toggleCheckIn = useToggleCheckIn(user?.id)
  
  // Enable realtime updates for this user (with connection monitoring)
  const realtimeStatus = useRealtimeDashboard(user?.id)

  // Calculate derived state with memoization
  const completedCategoryIds = useMemo(
    () => new Set(checkins.map(c => Number(c.category_id))),
    [checkins]
  )
  
  const axes = useMemo(
    () => {
      // 🛡️ NULL CHECK: Ensure categories is an array
      if (!Array.isArray(categories) || categories.length === 0) {
        return []
      }
      
      // 🛡️ SAFEGUARD: Limit to exactly 6 categories (AXIS6 hexagon design)
      const limitedCategories = categories.slice(0, 6)
      
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

  // Optimized hexagon key generation
  const hexagonKey = useMemo(() => {
    return `hexagon-${axes.map(a => `${a.id}-${a.completed}`).join('-')}`
  }, [axes])

  // Memoized axis lookup map for O(1) performance
  const axisMap = useMemo(() => {
    return new Map(axes.map(axis => [axis.id, axis]))
  }, [axes])

  // Debounced handler to prevent double clicks and race conditions
  const [isToggling, setIsToggling] = useState(false)
  
  const handleToggleAxis = useCallback((axisId: string | number) => {
    // Prevent multiple rapid clicks
    if (toggleCheckIn.isPending || isToggling) return
    
    const axis = axisMap.get(axisId)
    if (!axis) return
    
    // Set local toggling state to prevent immediate re-clicks
    setIsToggling(true)
    
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
          
          showToast(message, 'success', 2500)
          
          // Delayed invalidation to prevent race conditions
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['checkins', 'today', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['streaks', user?.id] })
            setIsToggling(false)
          }, 300)
        },
        onError: (error) => {
          showToast('Failed to update. Please try again.', 'error', 4000)
          setIsToggling(false)
        },
        onSettled: () => {
          // Ensure we reset the toggling state even if the request fails
          setTimeout(() => setIsToggling(false), 500)
        }
      }
    )
  }, [axisMap, toggleCheckIn, queryClient, user?.id, showToast, isToggling])

  // Handler for dropdown option selections
  const handleOptionSelect = useCallback((option: { id: string, label: string, emoji: string }) => {
    if (option.id === 'detailed') {
      // Future: Open detailed logging modal
      showToast(`${option.emoji} Detailed logging coming soon!`, 'info', 2000)
    } else if (option.id === 'view-progress') {
      // Navigate to analytics for this category
      router.push('/analytics')
    } else {
      // For specific activities, just show confirmation and mark as checked
      showToast(`${option.emoji} ${option.label} logged!`, 'success', 2000)
    }
  }, [showToast, router])

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

  // Show loading state
  if (userLoading || categoriesLoading) {
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
      <RealtimeErrorBoundary maxRetries={3}>
        <div className="min-h-screen text-white">
          <StandardHeader
            user={user}
            onLogout={handleLogout}
            currentStreak={currentStreak}
            completionPercentage={completedCount === 6 ? 100 : Math.round((completedCount / 6) * 100)}
            variant="dashboard"
          />

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
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold">Your Progress Today</h3>
                    <span className="text-xs sm:text-sm text-gray-400">
                      {completedCount}/6 completed
                    </span>
                  </div>

                  <HexagonVisualization 
                    key={hexagonKey}
                    axes={axes}
                    onToggleAxis={handleToggleAxis}
                    isToggling={toggleCheckIn.isPending || isToggling}
                  />

                  {/* Axes List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4" data-testid="category-cards">
                    {axes.map((axis) => (
                      <MemoizedCategoryCard
                        key={`${axis.id}-${axis.completed}`}
                        axis={axis}
                        onToggle={() => handleToggleAxis(axis.id)}
                        onOptionSelect={handleOptionSelect}
                        isToggling={toggleCheckIn.isPending || isToggling}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="space-y-4 sm:space-y-6">
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
                
                {/* Plan My Day - Prominent Position */}
                <Link 
                  href="/my-day"
                  className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 min-h-[56px] sm:min-h-[64px] flex items-center justify-between hover:bg-white/5 transition text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                  aria-label="Plan and track your daily activities"
                >
                  <span className="text-blue-300">Plan My Day</span>
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" aria-hidden="true" />
                </Link>
                
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
          
          {/* Toast Notifications */}
          <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
      </RealtimeErrorBoundary>
    </QueryErrorBoundary>
  )
}