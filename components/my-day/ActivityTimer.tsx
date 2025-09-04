'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Play,
  Pause,
  Square,
  Timer,
  ChevronDown,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { AxisIcon } from '@/components/icons'
import { useAxisActivities } from '@/lib/react-query/hooks/useAxisActivities'
import { useStartTimer, useStopTimer } from '@/lib/react-query/hooks/useMyDay'
import { handleError, handleMutationError } from '@/lib/error/standardErrorHandler'
import { getLocalizedText } from '@/lib/utils/i18n'
interface ActivityTimerProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: any[]
  selectedCategory?: any
  timeBlock?: any
}
export function ActivityTimer({
  isOpen,
  onClose,
  userId,
  categories,
  selectedCategory,
  timeBlock
}: ActivityTimerProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    timeBlock?.category_id || selectedCategory?.id || categories[0]?.id
  )
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    timeBlock?.activity_id || null
  )
  const [activityName, setActivityName] = useState(timeBlock?.activity_name || '')
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [activeLogId, setActiveLogId] = useState<number | null>(null)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()
  // Fetch activities for selected category
  const { data: activities = [] } = useAxisActivities(userId, selectedCategoryId)
  // Update activity name when selection changes
  useEffect(() => {
    if (selectedActivityId) {
      const activity = activities.find((a: any) => a.id === selectedActivityId)
      if (activity) {
        setActivityName(activity.activity_name)
      }
    }
  }, [selectedActivityId, activities])
  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])
  const selectedCategoryData = categories.find(c => c.id === selectedCategoryId)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  const handleStart = async () => {
    setError(null)
    if (!activityName.trim()) {
      setError('Please enter an activity name')
      return
    }
    try {
      const result = await startTimer.mutateAsync({
        user_id: userId,
        activity_id: selectedActivityId,
        category_id: selectedCategoryId,
        activity_name: activityName.trim(),
        time_block_id: timeBlock?.time_block_id
      })
      setActiveLogId(result.log_id)
      setIsRunning(true)
      setElapsedSeconds(0)
    } catch (error: any) {
      handleMutationError(error, {
        mutationName: 'start_activity_timer',
        component: 'ActivityTimer',
        userId,
        showToast: false, // Using local error state
        context: {
          categoryId: selectedCategoryId,
          activityName: activityName.trim(),
          timeBlockId: timeBlock?.time_block_id
        }
      })
      setError(error?.message || 'Failed to start timer. Please try again.')
    }
  }
  const handlePause = () => {
    setIsRunning(false)
  }
  const handleResume = () => {
    setIsRunning(true)
  }
  const handleStop = async () => {
    if (!activeLogId) return
    try {
      await stopTimer.mutateAsync({
        user_id: userId,
        log_id: activeLogId
      })
      setIsRunning(false)
      setElapsedSeconds(0)
      setActiveLogId(null)
      onClose()
    } catch (error) {
      handleMutationError(error, {
        mutationName: 'stop_activity_timer',
        component: 'ActivityTimer',
        userId,
        userMessage: 'Failed to stop timer properly. Your time may not be saved.',
        context: { logId: activeLogId }
      })
    }
  }
  if (!isOpen) return null
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          {/* Modal - Perfect centering with flexbox */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-green-900/50 to-blue-900/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                    <Timer className="w-5 h-5 text-green-400" />
                    Activity Timer
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-400">{error}</span>
                  </motion.div>
                )}
                {/* Timer Display */}
                <motion.div
                  className="text-center py-8"
                  animate={isRunning ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
                >
                  <div className="text-6xl font-mono font-bold text-white mb-2">
                    {formatTime(elapsedSeconds)}
                  </div>
                  {isRunning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-center gap-2 text-green-400"
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm">Recording</span>
                    </motion.div>
                  )}
                </motion.div>
                {!activeLogId && (
                  <>
                    {/* Category Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Axis Category
                      </label>
                      <div className="relative">
                        <button
                          onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white flex items-center justify-between hover:bg-white/15 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {selectedCategoryData && (
                              <>
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: selectedCategoryData.color }}
                                />
                                <AxisIcon
                                  axis={selectedCategoryData.icon}
                                  size={16}
                                  color={selectedCategoryData.color}
                                />
                                <span>{selectedCategoryData.name?.en || selectedCategoryData.slug}</span>
                              </>
                            )}
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        {showCategoryDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/20 rounded-lg overflow-hidden z-10">
                            {categories.map(category => (
                              <button
                                key={category.id}
                                onClick={() => {
                                  setSelectedCategoryId(category.id)
                                  setSelectedActivityId(null)
                                  setActivityName('')
                                  setShowCategoryDropdown(false)
                                }}
                                className="w-full px-4 py-3 flex items-center gap-2 hover:bg-white/10 transition-colors text-left"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                <AxisIcon
                                  axis={category.icon}
                                  size={16}
                                  color={category.color}
                                />
                                <span className="text-white">
                                  {getLocalizedText(category.name, 'en', category.slug)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Activity Selector */}
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Activity
                      </label>
                      {activities.length > 0 ? (
                        <select
                          value={selectedActivityId || ''}
                          onChange={(e) => {
                            const id = e.target.value ? parseInt(e.target.value) : null
                            setSelectedActivityId(id)
                          }}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                        >
                          <option value="">Custom activity...</option>
                          {activities.filter((a: any) => a.is_active).map((activity: any) => (
                            <option key={activity.id} value={activity.id}>
                              {activity.activity_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No activities configured for this axis
                        </p>
                      )}
                      {(!selectedActivityId || activities.length === 0) && (
                        <input
                          type="text"
                          value={activityName}
                          onChange={(e) => setActivityName(e.target.value)}
                          placeholder="What are you working on?"
                          className="w-full mt-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                        />
                      )}
                    </div>
                  </>
                )}
                {activeLogId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${selectedCategoryData?.color  }30` }}
                      >
                        <AxisIcon
                          axis={selectedCategoryData?.icon}
                          size={20}
                          color={selectedCategoryData?.color}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-400">
                          {selectedCategoryData?.name?.en || selectedCategoryData?.slug}
                        </p>
                        <p className="text-white font-medium">{activityName}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-white/10">
                {!activeLogId ? (
                  <button
                    onClick={handleStart}
                    disabled={!activityName.trim() || startTimer.isPending}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Start Timer
                  </button>
                ) : (
                  <div className="flex gap-3">
                    {isRunning ? (
                      <button
                        onClick={handlePause}
                        className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Pause className="w-5 h-5" />
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={handleResume}
                        className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Resume
                      </button>
                    )}
                    <button
                      onClick={handleStop}
                      disabled={stopTimer.isPending}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Square className="w-5 h-5" />
                      Stop & Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
