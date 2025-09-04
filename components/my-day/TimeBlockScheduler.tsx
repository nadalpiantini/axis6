'use client'
import React from 'react'
import { format, parse, addMinutes } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Clock,
  Calendar,
  Save,
  Loader2,
  ChevronDown,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { AxisIcon } from '@/components/icons'
import { useAxisActivities, AxisActivity } from '@/lib/react-query/hooks/useAxisActivities'
import { useCreateTimeBlock, useUpdateTimeBlock } from '@/lib/react-query/hooks/useMyDay'
import { handleError } from '@/lib/error/standardErrorHandler'
import { getLocalizedText } from '@/lib/utils/i18n'
interface TimeBlockSchedulerProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: any[]
  selectedCategory?: any
  selectedDate: Date
  editingBlock?: any
}
export function TimeBlockScheduler({
  isOpen,
  onClose,
  userId,
  categories,
  selectedCategory,
  selectedDate,
  editingBlock
}: TimeBlockSchedulerProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    selectedCategory?.id || editingBlock?.category_id || categories[0]?.id
  )
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    editingBlock?.activity_id || null
  )
  const [activityName, setActivityName] = useState(editingBlock?.activity_name || '')
  const [startTime, setStartTime] = useState(
    editingBlock?.start_time || format(new Date(), 'HH:mm')
  )
  const [duration, setDuration] = useState(editingBlock?.duration_minutes || 30)
  const [notes, setNotes] = useState(editingBlock?.notes || '')
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const createTimeBlock = useCreateTimeBlock()
  const updateTimeBlock = useUpdateTimeBlock()
  // Fetch activities for selected category
  const { data: activities = [] } = useAxisActivities(userId, selectedCategoryId)
  const typedActivities = activities as AxisActivity[]
  // Update activity name when selection changes
  useEffect(() => {
    if (selectedActivityId) {
      const activity = typedActivities.find((a: AxisActivity) => a.id === selectedActivityId)
      if (activity) {
        setActivityName(activity.activity_name)
      }
    }
  }, [selectedActivityId, typedActivities])
  // Calculate end time based on start time and duration
  const calculateEndTime = () => {
    const start = parse(startTime, 'HH:mm', new Date())
    const end = addMinutes(start, duration)
    return format(end, 'HH:mm')
  }
  const selectedCategoryData = categories.find(c => c.id === selectedCategoryId)
  const [error, setError] = useState<string | null>(null)
  const handleSave = async () => {
    setError(null)
    if (!activityName.trim()) {
      setError('Please enter an activity name')
      return
    }
    const timeBlockData = {
      user_id: userId,
      date: format(selectedDate, 'yyyy-MM-dd'),
      category_id: selectedCategoryId.toString(), // Convert numeric ID to string
      activity_id: selectedActivityId,
      activity_name: activityName.trim(),
      start_time: startTime,
      end_time: calculateEndTime(),
      notes: notes.trim(),
      status: 'planned' as const
    }
    try {
      if (editingBlock) {
        await updateTimeBlock.mutateAsync({
          id: editingBlock.time_block_id,
          ...timeBlockData
        })
      } else {
        await createTimeBlock.mutateAsync(timeBlockData)
      }
      onClose()
    } catch (error: any) {
      // Ensure we have a proper error object with details
      const errorDetails = {
        message: error?.message || 'Unknown error occurred',
        details: error?.details || error?.toString() || 'No additional details',
        code: error?.code || 'UNKNOWN_ERROR',
        operation: 'plan_my_day',
        component: 'TimeBlockScheduler',
        context: {
          userId,
          selectedDate: format(selectedDate, 'yyyy-MM-dd'),
          categoryId: selectedCategoryId,
          activityId: selectedActivityId,
          timeBlockData
        }
      }
      
      handleError(errorDetails, {
        operation: 'plan_my_day', 
        component: 'TimeBlockScheduler',
        userMessage: 'Failed to plan your day. Please try again.'
      })
      
      // Set user-friendly error message
      setError(errorDetails.message || 'Failed to save time block. Please try again.')
    }
  }
  const durationOptions = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' }
  ]
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
                <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    {editingBlock ? 'Edit Time Block' : 'Schedule Time Block'}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
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
                  {typedActivities.length > 0 ? (
                    <select
                      value={selectedActivityId || ''}
                      onChange={(e) => {
                        const id = e.target.value ? parseInt(e.target.value) : null
                        setSelectedActivityId(id)
                      }}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="">Custom activity...</option>
                      {typedActivities.filter((a: AxisActivity) => a.is_active).map((activity: AxisActivity) => (
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
                  {(!selectedActivityId || typedActivities.length === 0) && (
                    <input
                      type="text"
                      value={activityName}
                      onChange={(e) => setActivityName(e.target.value)}
                      placeholder="Enter activity name..."
                      className="w-full mt-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  )}
                </div>
                {/* Time Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Start Time
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:filter-invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:saturate-100 [&::-webkit-calendar-picker-indicator]:hue-rotate-[200deg]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    >
                      {durationOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* End Time Display */}
                <div className="px-4 py-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">End Time</span>
                    <span className="text-white font-medium">{calculateEndTime()}</span>
                  </div>
                </div>
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes or reminders..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>
              </div>
              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-white/10">
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!activityName.trim() || createTimeBlock.isPending || updateTimeBlock.isPending}
                    className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {(createTimeBlock.isPending || updateTimeBlock.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingBlock ? 'Update' : 'Schedule'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
