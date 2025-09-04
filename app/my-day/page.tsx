'use client'
import { format, addDays, subDays, isToday, parse, addMinutes } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Play,
  Plus,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Timer,
  Sparkles,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { ActivityTimer } from '@/components/my-day/ActivityTimer'
import { PlanMyDay } from '@/components/my-day/PlanMyDay'
import { TimeBlockScheduler } from '@/components/my-day/TimeBlockScheduler'
import { LogoFull } from '@/components/ui/Logo'
import { useUser } from '@/lib/react-query/hooks'
import { useDashboardSlice } from '@/lib/react-query/hooks/useDashboardDataOptimized'
import { useMyDayData, useTimeDistribution, useUpdateTimeBlock } from '@/lib/react-query/hooks/useMyDay'
import { getLocalizedText } from '@/lib/utils/i18n'

// Simple hexagon component following original design
const SimpleHexagon = ({ categories, onCategoryClick }: { 
  categories: any[], 
  onCategoryClick?: (category: any) => void 
}) => {
  const hexagonColors = [
    '#A6C26F', // Green (Physical)
    '#D4A5F3', // Lavender (Mental) 
    '#FF6B6B', // Red-orange (Emotional)
    '#4ECDC4', // Teal (Social)
    '#45B7D1', // Blue (Spiritual)
    '#FFD93D'  // Yellow-orange (Material)
  ]

  const getNodePosition = (index: number) => {
    const angle = (360 / 6) * index - 90 // Start from top
    const rad = (angle * Math.PI) / 180
    const radius = 80
    return {
      x: 120 + Math.cos(rad) * radius,
      y: 120 + Math.sin(rad) * radius
    }
  }

  return (
    <div className="relative flex items-center justify-center w-full h-64">
      <svg
        width="240"
        height="240"
        viewBox="0 0 240 240"
        className="transform rotate-0"
      >
        <defs>
          {/* Subtle glow filter */}
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Subtle hexagon outline */}
        <motion.path
          d="M 120 40 L 200 80 L 200 160 L 120 200 L 40 160 L 40 80 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Subtle connecting lines to center */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const pos = getNodePosition(i)
          return (
            <motion.line
              key={i}
              x1={pos.x}
              y1={pos.y}
              x2={120}
              y2={120}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
            />
          )
        })}

        {/* Category nodes */}
        {categories.slice(0, 6).map((category, index) => {
          const pos = getNodePosition(index)
          return (
            <motion.g
              key={category.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
            >
              {/* Outer circle with color */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="12"
                fill={hexagonColors[index]}
                opacity="0.8"
                filter="url(#nodeGlow)"
                className="cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => onCategoryClick?.(category)}
              />
              {/* Inner target icon */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r="6"
                fill="rgba(255, 255, 255, 0.9)"
                className="cursor-pointer"
                onClick={() => onCategoryClick?.(category)}
              />
              <circle
                cx={pos.x}
                cy={pos.y}
                r="3"
                fill={hexagonColors[index]}
                className="cursor-pointer"
                onClick={() => onCategoryClick?.(category)}
              />
            </motion.g>
          )
        })}

        {/* Center node */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
        >
          <circle
            cx="120"
            cy="120"
            r="14"
            fill="#2C3E50"
            opacity="0.9"
            filter="url(#nodeGlow)"
          />
          <circle
            cx="120"
            cy="120"
            r="7"
            fill="rgba(255, 255, 255, 0.9)"
          />
          <circle
            cx="120"
            cy="120"
            r="3.5"
            fill="#2C3E50"
          />
        </motion.g>
      </svg>
    </div>
  )
}

export default function MyDayPage() {
  const router = useRouter()
  const { data: authUser } = useUser()
  const categories = useDashboardSlice(authUser?.id, 'categories') || [] // Get categories from optimized hook
  const user = authUser // Keep user reference for compatibility
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showScheduler, setShowScheduler] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [showPlanMyDay, setShowPlanMyDay] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [activeTimer, setActiveTimer] = useState<any>(null)
  // Add mutation for drag updates
  const updateTimeBlock = useUpdateTimeBlock()
  // Fetch data for selected date
  const { data: myDayData, isLoading: loadingData, refetch: refetchData } = useMyDayData(
    user?.id || '',
    format(selectedDate, 'yyyy-MM-dd')
  )
  const { data: timeDistribution, refetch: refetchDistribution } = useTimeDistribution(
    user?.id || '',
    format(selectedDate, 'yyyy-MM-dd')
  )
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])
  const handleDateChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(prev => subDays(prev, 1))
    } else {
      setSelectedDate(prev => addDays(prev, 1))
    }
  }
  const handleAddTimeBlock = (category?: any) => {
    setSelectedCategory(category)
    setShowScheduler(true)
  }
  const handleStartTimer = (category?: any) => {
    setSelectedCategory(category)
    setShowTimer(true)
  }
  const handleSchedulerClose = () => {
    setShowScheduler(false)
    setSelectedCategory(null)
    refetchData()
    refetchDistribution()
  }
  const handleTimerClose = () => {
    setShowTimer(false)
    setSelectedCategory(null)
    setActiveTimer(null)
    refetchData()
    refetchDistribution()
  }
  const handlePlanMyDayClose = () => {
    setShowPlanMyDay(false)
    refetchData()
    refetchDistribution()
  }

  const totalPlannedMinutes = myDayData?.reduce((sum: number, block: any) =>
    sum + block.duration_minutes, 0) || 0
  const totalActualMinutes = timeDistribution?.reduce((sum: number, cat: any) =>
    sum + cat.actual_minutes, 0) || 0
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      {/* Header */}
      <StandardHeader
        user={user}
        variant="default"
        title="My Day"
        subtitle={format(selectedDate, 'EEEE, MMMM d, yyyy')}
        showBackButton={true}
        backUrl="/dashboard"
      />
      {/* Action Bar */}
      <div
        className="fixed left-0 right-0 z-20 glass-premium border-b border-white/10"
        style={{ top: 'calc(4rem + env(safe-area-inset-top, 0px))' }}
      >
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-end gap-1 sm:gap-2 lg:gap-4">
            <button
              onClick={() => setShowPlanMyDay(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 min-h-[44px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all touch-manipulation active:scale-95"
              data-testid="plan-my-day-btn"
              aria-label="Plan my day"
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm lg:text-base font-medium">Plan My Day</span>
            </button>
            <button
              onClick={handleStartTimer}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 min-h-[44px] bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors touch-manipulation active:scale-95"
              data-testid="start-timer-btn"
              aria-label="Start activity timer"
            >
              <Timer className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm lg:text-base font-medium">Start Timer</span>
            </button>
            <button
              onClick={() => handleAddTimeBlock()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 min-h-[44px] bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors touch-manipulation active:scale-95"
              data-testid="add-time-block-btn"
              aria-label="Add time block"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm lg:text-base font-medium">Add Block</span>
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main
        className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8"
        style={{ paddingTop: 'calc(8rem + env(safe-area-inset-top, 0px))' }}
      >
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Date Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between glass rounded-lg sm:rounded-xl p-3 sm:p-4"
          >
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
              </h1>
              <p className="text-sm text-gray-400">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
            <button
              onClick={() => handleDateChange('next')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Planned</p>
            </div>
            <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
                {Math.floor(totalActualMinutes / 60)}h {totalActualMinutes % 60}m
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Completed</p>
            </div>
            <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">
                {myDayData?.length || 0}
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Blocks</p>
            </div>
            <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">
                {totalPlannedMinutes > 0
                  ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100)
                  : 0}%
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Progress</p>
            </div>
          </motion.div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Simple Hexagon */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-white overflow-hidden"
            >
              <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Day Overview
              </h2>
              <SimpleHexagon 
                categories={categories}
                onCategoryClick={handleAddTimeBlock}
              />
              {/* Category Labels */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
                {categories.slice(0, 6).map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    onClick={() => handleAddTimeBlock(category)}
                    className="flex items-center gap-2 p-2 sm:p-3 glass rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                  >
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: [
                          '#A6C26F', '#D4A5F3', '#FF6B6B', 
                          '#4ECDC4', '#45B7D1', '#FFD93D'
                        ][index] 
                      }}
                    />
                    <span className="text-xs sm:text-sm text-white truncate">
                      {getLocalizedText(category.name, 'en', category.slug)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Time Blocks List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-white"
              data-testid="time-blocks-list"
            >
              <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                Time Blocks
              </h2>
              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
                  <p className="text-gray-400">Loading schedule...</p>
                </div>
              ) : myDayData && myDayData.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  {myDayData.map((block: any) => (
                    <motion.div
                      key={block.time_block_id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all touch-manipulation ${
                        block.status === 'active'
                          ? 'bg-green-500/10 border-green-500/30'
                          : block.status === 'completed'
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: block.category_color }}
                          />
                          <span className="text-xs sm:text-sm font-medium text-white truncate">
                            {block.category_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
                          {format(new Date(`2024-01-01 ${block.start_time}`), 'HH:mm')}-{format(new Date(`2024-01-01 ${block.end_time}`), 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm lg:text-base text-white mb-1 line-clamp-2">{block.activity_name}</p>
                      {block.actual_duration > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all"
                              style={{
                                width: `${Math.min((block.actual_duration / block.duration_minutes) * 100, 100)}%`
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
                            {block.actual_duration}m/{block.duration_minutes}m
                          </span>
                        </div>
                      )}
                      {block.status === 'planned' && isToday(selectedDate) && (
                        <button
                          onClick={() => {
                            setActiveTimer(block)
                            handleStartTimer()
                          }}
                          className="mt-2 text-xs text-green-400 hover:text-green-300 flex items-center gap-1 min-h-[32px] touch-manipulation active:scale-95 transition-transform"
                          aria-label={`Start ${block.activity_name}`}
                        >
                          <Play className="w-3 h-3" />
                          Start
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">No time blocks scheduled</p>
                  <button
                    onClick={() => handleAddTimeBlock()}
                    className="px-4 py-2 min-h-[44px] bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors touch-manipulation active:scale-95"
                    aria-label="Schedule your day"
                  >
                    Schedule Your Day
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      {/* Modals */}
      <AnimatePresence>
        {showScheduler && (
          <TimeBlockScheduler
            isOpen={showScheduler}
            onClose={handleSchedulerClose}
            userId={user?.id || ''}
            categories={categories}
            selectedCategory={selectedCategory}
            selectedDate={selectedDate}
          />
        )}
        {showTimer && (
          <ActivityTimer
            isOpen={showTimer}
            onClose={handleTimerClose}
            userId={user?.id || ''}
            categories={categories}
            selectedCategory={selectedCategory}
            timeBlock={activeTimer}
          />
        )}
        {showPlanMyDay && (
          <PlanMyDay
            isOpen={showPlanMyDay}
            onClose={handlePlanMyDayClose}
            userId={user?.id || ''}
            categories={categories}
            selectedDate={selectedDate}
            existingBlocks={myDayData}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
