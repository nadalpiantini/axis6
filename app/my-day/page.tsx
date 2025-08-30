'use client'

import { format, addDays, subDays, isToday, parse, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
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
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { StandardHeader } from '@/components/layout/StandardHeader'
import { ActivityTimer } from '@/components/my-day/ActivityTimer'
import { PlanMyDay } from '@/components/my-day/PlanMyDay'
import { HexagonClock } from '@/components/hexagon-clock'
import { TimeBlockScheduler } from '@/components/my-day/TimeBlockScheduler'
import { LogoFull } from '@/components/ui/Logo'
import { useUser } from '@/lib/react-query/hooks'
import { useDashboardSlice } from '@/lib/react-query/hooks/useDashboardDataOptimized'
import { useMyDayData, useTimeDistribution, useUpdateTimeBlock } from '@/lib/react-query/hooks/useMyDay'

// Transform database time blocks to clock format
const transformTimeBlocksForClock = (timeBlocks: any[], currentDate: Date) => {
  return timeBlocks.map(block => ({
    id: block.time_block_id,
    startTime: `${format(currentDate, 'yyyy-MM-dd')}T${block.start_time}`,
    duration: block.duration_minutes,
    category: mapCategoryNameToKey(block.category_name),
    status: block.status as 'empty' | 'planned' | 'active' | 'completed' | 'overflowing',
    title: block.activity_name,
    progress: block.actual_duration > 0 ? block.actual_duration / block.duration_minutes : 0
  }))
}

// Map category names to clock position keys
const mapCategoryNameToKey = (categoryName: string): string => {
  const mapping: Record<string, string> = {
    'Physical': 'physical',
    'Mental': 'mental', 
    'Emotional': 'emotional',
    'Social': 'social',
    'Spiritual': 'spiritual',
    'Material': 'material'
  }
  return mapping[categoryName] || 'physical'
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

  // Handle time block drag on clock
  const handleTimeBlockDrag = async (blockId: string, newHour: number) => {
    if (!myDayData) return
    
    const timeBlock = myDayData.find(block => block.time_block_id === blockId)
    if (!timeBlock) return
    
    // Calculate new start time from hour
    const newStartTime = `${newHour.toString().padStart(2, '0')}:00`
    const startTime = parse(timeBlock.start_time, 'HH:mm', new Date())
    const endTime = parse(timeBlock.end_time, 'HH:mm', new Date())
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60) // duration in minutes
    
    const newEndTime = format(addMinutes(parse(newStartTime, 'HH:mm', new Date()), duration), 'HH:mm')
    
    try {
      await updateTimeBlock.mutateAsync({
        id: blockId,
        user_id: user?.id || '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        category_id: timeBlock.category_id,
        activity_id: timeBlock.activity_id,
        activity_name: timeBlock.activity_name,
        start_time: newStartTime,
        end_time: newEndTime,
        notes: timeBlock.notes,
        status: timeBlock.status
      })
      
      // Refetch data to update UI
      refetchData()
      refetchDistribution()
         } catch (error) {
       // Log error in development
       if (process.env.NODE_ENV === 'development') {
         // TODO: Replace with proper error handling
    // console.error('Failed to update time block:', error);
       }
       // Could add toast notification here if needed
     }
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
        title="Mi Día"
        subtitle={format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
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
        className="pb-6 sm:pb-8 px-2 sm:px-4"
        data-testid="my-day-main"
        style={{
          paddingTop: 'calc(8.5rem + env(safe-area-inset-top, 0px))'
        }}
      >
        <div className="container mx-auto max-w-7xl">
          {/* Date Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <div className="flex items-center justify-between glass rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-white">
              <button
                onClick={() => handleDateChange('prev')}
                className="p-2 min-h-[44px] min-w-[44px] hover:bg-white/10 rounded-lg transition-colors touch-manipulation active:scale-95 flex items-center justify-center"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center px-2">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 leading-tight">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE', { locale: es })}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-400">
                  {format(selectedDate, 'MMMM d, yyyy', { locale: es })}
                </p>
              </div>

              <button
                onClick={() => handleDateChange('next')}
                className="p-2 min-h-[44px] min-w-[44px] hover:bg-white/10 rounded-lg transition-colors touch-manipulation active:scale-95 flex items-center justify-center"
                aria-label="Next day"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-white"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">Planned</p>
                  <p className="text-sm sm:text-base lg:text-lg font-semibold text-white tabular-nums">
                    {Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-white"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">Actual</p>
                  <p className="text-sm sm:text-base lg:text-lg font-semibold text-white tabular-nums">
                    {Math.floor(totalActualMinutes / 60)}h {totalActualMinutes % 60}m
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-white"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg flex-shrink-0">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">Efficiency</p>
                  <p className="text-sm sm:text-base lg:text-lg font-semibold text-white tabular-nums">
                    {totalPlannedMinutes > 0
                      ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Enhanced Hexagon with Time Blocks */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 text-white overflow-hidden"
            >
              <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Day Overview
              </h2>

              <HexagonClock
                distribution={timeDistribution || []}
                timeBlocks={myDayData ? transformTimeBlocksForClock(myDayData, selectedDate) : []}
                categories={categories}
                onCategoryClick={handleAddTimeBlock}
                onTimeBlockDrag={handleTimeBlockDrag}
                activeTimer={activeTimer}
                showClockMarkers={true}
                showCurrentTime={true}
                showTimeBlocks={true}
                clockBasedPositioning={true}
                mobileOptimized={true}
                hardwareAccelerated={true}
              />
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
