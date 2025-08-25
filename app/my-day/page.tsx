'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Play, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Timer
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, addDays, subDays, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { LogoFull } from '@/components/ui/Logo'
import { TimeBlockHexagon } from '@/components/my-day/TimeBlockHexagon'
import { TimeBlockScheduler } from '@/components/my-day/TimeBlockScheduler'
import { ActivityTimer } from '@/components/my-day/ActivityTimer'
import { useUser, useCategories } from '@/lib/react-query/hooks'
import { useMyDayData, useTimeDistribution } from '@/lib/react-query/hooks/useMyDay'

export default function MyDayPage() {
  const router = useRouter()
  const { data: user } = useUser()
  const { data: categories = [] } = useCategories()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showScheduler, setShowScheduler] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [activeTimer, setActiveTimer] = useState<any>(null)
  
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

  const totalPlannedMinutes = myDayData?.reduce((sum: number, block: any) => 
    sum + block.duration_minutes, 0) || 0
  
  const totalActualMinutes = timeDistribution?.reduce((sum: number, cat: any) => 
    sum + cat.actual_minutes, 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 glass-premium border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
              <LogoFull className="h-8" />
            </Link>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleStartTimer}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
              >
                <Timer className="w-4 h-4" />
                <span className="hidden sm:inline">Start Timer</span>
              </button>
              
              <button
                onClick={() => handleAddTimeBlock()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Block</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Date Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between glass rounded-2xl p-6">
              <button
                onClick={() => handleDateChange('prev')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-1">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE', { locale: es })}
                </h1>
                <p className="text-gray-400">
                  {format(selectedDate, 'MMMM d, yyyy', { locale: es })}
                </p>
              </div>
              
              <button
                onClick={() => handleDateChange('next')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Planned</p>
                  <p className="text-lg font-semibold text-white">
                    {Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Play className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Actual</p>
                  <p className="text-lg font-semibold text-white">
                    {Math.floor(totalActualMinutes / 60)}h {totalActualMinutes % 60}m
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Efficiency</p>
                  <p className="text-lg font-semibold text-white">
                    {totalPlannedMinutes > 0 
                      ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100) 
                      : 0}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hexagon Visualization */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Day Overview
              </h2>
              
              <TimeBlockHexagon
                distribution={timeDistribution || []}
                categories={categories}
                onCategoryClick={handleAddTimeBlock}
                activeTimer={activeTimer}
              />
            </motion.div>

            {/* Time Blocks List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Time Blocks
              </h2>
              
              {loadingData ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-2"></div>
                  <p className="text-gray-400">Loading schedule...</p>
                </div>
              ) : myDayData && myDayData.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {myDayData.map((block: any) => (
                    <motion.div
                      key={block.time_block_id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-xl border transition-all ${
                        block.status === 'active' 
                          ? 'bg-green-500/10 border-green-500/30'
                          : block.status === 'completed'
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: block.category_color }}
                          />
                          <span className="text-sm font-medium text-white">
                            {block.category_name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {format(new Date(`2024-01-01 ${block.start_time}`), 'HH:mm')} - 
                          {format(new Date(`2024-01-01 ${block.end_time}`), 'HH:mm')}
                        </span>
                      </div>
                      
                      <p className="text-white mb-1">{block.activity_name}</p>
                      
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
                          <span className="text-xs text-gray-400">
                            {block.actual_duration}m / {block.duration_minutes}m
                          </span>
                        </div>
                      )}
                      
                      {block.status === 'planned' && isToday(selectedDate) && (
                        <button
                          onClick={() => {
                            setActiveTimer(block)
                            handleStartTimer()
                          }}
                          className="mt-2 text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
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
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
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
      </AnimatePresence>
    </div>
  )
}