'use client'

import React from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Sparkles,
  Clock,
  Calendar,
  Loader2,
  ChevronRight,
  Check,
  AlertCircle
} from 'lucide-react'
import { useState } from 'react'

import { AxisIcon } from '@/components/icons'
import { useCreateTimeBlock } from '@/lib/react-query/hooks/useMyDay'

import { handleError } from '@/lib/error/standardErrorHandler'
interface PlanMyDayProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: any[]
  selectedDate: Date
  existingBlocks?: any[]
}

interface SuggestedBlock {
  category_id: number
  activity_name: string
  start_time: string
  duration_minutes: number
  notes?: string
  reason?: string
}

export function PlanMyDay({
  isOpen,
  onClose,
  userId,
  categories,
  selectedDate,
  existingBlocks = []
}: PlanMyDayProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestedPlan, setSuggestedPlan] = useState<SuggestedBlock[]>([])
  const [selectedBlocks, setSelectedBlocks] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const createTimeBlock = useCreateTimeBlock()

  // AI-powered plan generation (mock for now - would connect to actual AI service)
  const generateDayPlan = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate balanced day plan based on user patterns and preferences
      const suggestions: SuggestedBlock[] = [
        {
          category_id: categories.find(c => c.slug === 'physical')?.id || 1,
          activity_name: 'Morning Workout',
          start_time: '07:00',
          duration_minutes: 45,
          notes: 'Start your day with energy',
          reason: 'Based on your peak energy times'
        },
        {
          category_id: categories.find(c => c.slug === 'mental')?.id || 2,
          activity_name: 'Deep Work Session',
          start_time: '09:00',
          duration_minutes: 90,
          notes: 'Focus on your most important task',
          reason: 'Your most productive hours'
        },
        {
          category_id: categories.find(c => c.slug === 'social')?.id || 4,
          activity_name: 'Team Sync',
          start_time: '11:00',
          duration_minutes: 30,
          notes: 'Connect with colleagues',
          reason: 'Maintain social connections'
        },
        {
          category_id: categories.find(c => c.slug === 'emotional')?.id || 3,
          activity_name: 'Mindfulness Break',
          start_time: '13:00',
          duration_minutes: 15,
          notes: 'Reset and recharge',
          reason: 'Post-lunch energy dip'
        },
        {
          category_id: categories.find(c => c.slug === 'mental')?.id || 2,
          activity_name: 'Learning Time',
          start_time: '14:30',
          duration_minutes: 60,
          notes: 'Study or skill development',
          reason: 'Consistent growth'
        },
        {
          category_id: categories.find(c => c.slug === 'spiritual')?.id || 5,
          activity_name: 'Evening Reflection',
          start_time: '20:00',
          duration_minutes: 20,
          notes: 'Journal and gratitude',
          reason: 'End day with clarity'
        }
      ]

      // Filter out times that conflict with existing blocks
      const nonConflicting = suggestions.filter(suggestion => {
        const sugStart = parseInt(suggestion.start_time.replace(':', ''))
        const sugEnd = sugStart + Math.round(suggestion.duration_minutes / 60 * 100)

        return !existingBlocks.some(block => {
          const blockStart = parseInt(block.start_time.replace(':', ''))
          const blockEnd = parseInt(block.end_time.replace(':', ''))
          return (sugStart >= blockStart && sugStart < blockEnd) ||
                 (sugEnd > blockStart && sugEnd <= blockEnd)
        })
      })

      setSuggestedPlan(nonConflicting)
      // Auto-select all suggestions
      setSelectedBlocks(new Set(nonConflicting.map((_, i) => i)))
    } catch (err) {
                setError('Failed to generate plan. Please try again.')
          handleError(error, {
      operation: 'plan_my_day', component: 'PlanMyDay',

            userMessage: 'Failed to plan your day. Please try again.'

          })
          // Error logged via handleError
        } finally {
      setIsGenerating(false)
    }
  }

  const toggleBlockSelection = (index: number) => {
    const newSelection = new Set(selectedBlocks)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedBlocks(newSelection)
  }

  const applySelectedBlocks = async () => {
    if (selectedBlocks.size === 0) return

    try {
      const blocksToCreate = suggestedPlan.filter((_, i) => selectedBlocks.has(i))

      for (const block of blocksToCreate) {
        const endTime = calculateEndTime(block.start_time, block.duration_minutes)
        await createTimeBlock.mutateAsync({
          user_id: userId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          category_id: block.category_id,
          activity_id: null,
          activity_name: block.activity_name,
          start_time: block.start_time,
          end_time: endTime,
          notes: block.notes || '',
          status: 'planned' as const
        })
      }

      onClose()
    } catch (error) {
      setError('Failed to create time blocks. Please try again.')
      handleError(error, {
      operation: 'plan_my_day', component: 'PlanMyDay',

        userMessage: 'Failed to plan your day. Please try again.'

      })
            // Error logged via handleError
    }
  }

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  const getCategoryData = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal - Perfect flexbox centering */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
            style={{
              paddingTop: 'max(1rem, env(safe-area-inset-top))',
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              paddingLeft: 'max(1rem, env(safe-area-inset-left))',
              paddingRight: 'max(1rem, env(safe-area-inset-right))'
            }}
          >
            <div className="w-full max-w-2xl lg:max-w-3xl max-h-full overflow-y-auto">
            <div className="glass rounded-2xl">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Plan My Day with AI
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
              <div className="p-6">
                {!suggestedPlan.length && !isGenerating && (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Get AI-Powered Day Planning
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Let AI analyze your habits and create a balanced schedule
                      across all six life dimensions for optimal productivity and wellbeing.
                    </p>
                    <button
                      onClick={generateDayPlan}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all flex items-center gap-2 mx-auto"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate My Perfect Day
                    </button>
                  </div>
                )}

                {isGenerating && (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Analyzing Your Patterns...
                    </h3>
                    <p className="text-gray-400">
                      Creating a balanced schedule based on your preferences and habits
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {suggestedPlan.length > 0 && !isGenerating && (
                  <React.Fragment>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-white mb-2">
                        Your Optimized Schedule
                      </h3>
                      <p className="text-sm text-gray-400">
                        Select the time blocks you want to add to your day
                      </p>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {suggestedPlan.map((block, index) => {
                        const category = getCategoryData(block.category_id)
                        const isSelected = selectedBlocks.has(index)

                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => toggleBlockSelection(index)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-500/20 border-purple-500/40'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg transition-all ${
                                isSelected ? 'bg-purple-500/30' : 'bg-white/10'
                              }`}>
                                {isSelected ? (
                                  <Check className="w-4 h-4 text-purple-400" />
                                ) : (
                                  <div className="w-4 h-4 border border-gray-400 rounded" />
                                )}
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {category && (
                                    <React.Fragment>
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                      />
                                      <AxisIcon
                                        axis={category.icon}
                                        size={16}
                                        color={category.color}
                                      />
                                      <span className="text-xs text-gray-400">
                                        {category.name?.en || category.slug}
                                      </span>
                                    </React.Fragment>
                                  )}
                                  <span className="text-xs text-gray-500">•</span>
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-400">
                                    {block.start_time} ({block.duration_minutes}min)
                                  </span>
                                </div>

                                <h4 className="text-white font-medium mb-1">
                                  {block.activity_name}
                                </h4>

                                {block.notes && (
                                  <p className="text-sm text-gray-400 mb-1">
                                    {block.notes}
                                  </p>
                                )}

                                {block.reason && (
                                  <p className="text-xs text-purple-400 italic">
                                    <ChevronRight className="w-3 h-3 inline" />
                                    {block.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </React.Fragment>
                )}
              </div>

              {/* Footer */}
              {suggestedPlan.length > 0 && !isGenerating && (
                <div className="p-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">
                      {selectedBlocks.size} of {suggestedPlan.length} blocks selected
                    </span>
                    <button
                      onClick={() => setSelectedBlocks(new Set(suggestedPlan.map((_, i) => i)))}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Select All
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSuggestedPlan([])
                        setSelectedBlocks(new Set())
                      }}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={applySelectedBlocks}
                      disabled={selectedBlocks.size === 0 || createTimeBlock.isPending}
                      className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {createTimeBlock.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                      Add to Schedule
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  )
}
