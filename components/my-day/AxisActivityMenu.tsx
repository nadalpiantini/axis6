'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Brain, 
  Heart, 
  Users, 
  Sparkles, 
  Briefcase, 
  Plus, 
  Clock,
  X,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import { useCreateTimeBlock } from '@/lib/react-query/hooks/useMyDayTimeBlocks'
import { useUser } from '@/lib/react-query/hooks/useUser'
import { useCategories } from '@/lib/react-query/hooks/useCategories'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface AxisActivityMenuProps {
  isOpen: boolean
  onClose: () => void
  selectedAxis: string
  position: { x: number; y: number }
  onSuccess?: () => void
}

// Predefined activity suggestions for each axis (same as QuickTimeBlockCreator)
const ACTIVITY_SUGGESTIONS: Record<string, string[]> = {
  physical: [
    'Running', 'Yoga', 'Swimming', 'Cycling', 'Gym workout',
    'Tennis', 'Padel', 'Basketball', 'Soccer', 'Walking',
    'Hiking', 'Dancing', 'Boxing', 'Pilates', 'CrossFit',
    'Rock climbing', 'Martial arts', 'Stretching', 'Jump rope', 'Rowing'
  ],
  mental: [
    'Reading', 'Meditation', 'Journaling', 'Learning new skill', 'Puzzle solving',
    'Study session', 'Online course', 'Documentary', 'Podcast', 'Chess',
    'Coding', 'Writing', 'Research', 'Language learning', 'Memory exercises',
    'Brain training', 'Creative writing', 'Mind mapping', 'Planning', 'Reviewing notes'
  ],
  emotional: [
    'Deep breathing', 'Gratitude practice', 'Self-reflection', 'Music therapy', 'Art therapy',
    'Emotional check-in', 'Mindfulness', 'Positive affirmations', 'Therapy session', 'Support group',
    'Stress relief', 'Mood tracking', 'Self-care ritual', 'Relaxation', 'Expressing feelings',
    'Boundary setting', 'Self-compassion', 'Emotional release', 'Visualization', 'Progressive relaxation'
  ],
  social: [
    'Coffee with friend', 'Family dinner', 'Team meeting', 'Networking event', 'Volunteering',
    'Group workout', 'Book club', 'Dinner party', 'Phone call', 'Video chat',
    'Social media break', 'Community event', 'Support group', 'Mentoring', 'Collaboration',
    'Team building', 'Social learning', 'Cultural event', 'Group meditation', 'Shared meal'
  ],
  spiritual: [
    'Meditation', 'Prayer', 'Nature walk', 'Journaling', 'Reading spiritual texts',
    'Yoga', 'Breathing exercises', 'Gratitude practice', 'Mindfulness', 'Reflection time',
    'Sacred music', 'Ritual practice', 'Energy work', 'Chanting', 'Silent contemplation',
    'Spiritual community', 'Sacred space creation', 'Intention setting', 'Divine connection', 'Soul work'
  ],
  material: [
    'Budget review', 'Investment research', 'Career planning', 'Skill development', 'Networking',
    'Financial planning', 'Goal setting', 'Market research', 'Business planning', 'Professional development',
    'Asset management', 'Income optimization', 'Expense tracking', 'Financial education', 'Career advancement',
    'Business networking', 'Professional certification', 'Market analysis', 'Financial literacy', 'Wealth building'
  ]
}

const AXIS_CONFIG = {
  physical: { label: 'Physical', icon: Activity, color: '#A6C26F' },
  mental: { label: 'Mental', icon: Brain, color: '#D4A5F3' },
  emotional: { label: 'Emotional', icon: Heart, color: '#FF6B6B' },
  social: { label: 'Social', icon: Users, color: '#4ECDC4' },
  spiritual: { label: 'Spiritual', icon: Sparkles, color: '#45B7D1' },
  material: { label: 'Material', icon: Briefcase, color: '#FFD93D' }
}

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
]

export function AxisActivityMenu({
  isOpen,
  onClose,
  selectedAxis,
  position,
  onSuccess
}: AxisActivityMenuProps) {
  const { data: user } = useUser()
  const { data: categories = [] } = useCategories()
  const createTimeBlock = useCreateTimeBlock()
  
  const [selectedActivity, setSelectedActivity] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [customActivity, setCustomActivity] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customActivities, setCustomActivities] = useState<string[]>([])

  const axisConfig = AXIS_CONFIG[selectedAxis as keyof typeof AXIS_CONFIG]
  const currentSuggestions = ACTIVITY_SUGGESTIONS[selectedAxis] || []

  // Get current time for default start time
  const getCurrentTime = () => {
    const now = new Date()
    return format(now, 'HH:mm')
  }

  // Load custom activities from localStorage
  useEffect(() => {
    if (user?.id && selectedAxis) {
      const key = `custom_activities_${user.id}_${selectedAxis}`
      const saved = localStorage.getItem(key)
      if (saved) {
        try {
          setCustomActivities(JSON.parse(saved))
        } catch (error) {
          // TODO: Replace with proper error handling
    // console.error('Error loading custom activities:', error);
        }
      }
    }
  }, [user?.id, selectedAxis])

  // Save custom activity to localStorage
  const saveCustomActivity = (activity: string) => {
    if (!user?.id || !selectedAxis || !activity.trim()) return
    
    const key = `custom_activities_${user.id}_${selectedAxis}`
    const newActivities = [...customActivities, activity.trim()]
    setCustomActivities(newActivities)
    localStorage.setItem(key, JSON.stringify(newActivities))
  }

  const handleActivitySelect = (activity: string) => {
    setSelectedActivity(activity)
    setCustomActivity('')
    setShowCustomInput(false)
  }

  const handleCustomActivity = () => {
    setShowCustomInput(true)
    setSelectedActivity('')
  }

  const handleCreateCustomActivity = () => {
    if (!customActivity.trim()) return
    
    saveCustomActivity(customActivity)
    setSelectedActivity(customActivity.trim())
    setCustomActivity('')
    setShowCustomInput(false)
    toast.success('Custom activity saved!')
  }

  const handleCreateTimeBlock = async () => {
    if (!user?.id) {
      toast.error('User not authenticated')
      return
    }

    const activityName = selectedActivity || customActivity.trim()
    if (!activityName) {
      toast.error('Please select or enter an activity')
      return
    }

    // Find the category UUID based on the axis slug
    const category = categories.find(cat => cat.slug === selectedAxis)
    if (!category) {
      toast.error('Category not found')
      return
    }

    try {
      await createTimeBlock.mutateAsync({
        categoryId: category.id.toString(), // Convert numeric ID to string
        activityName,
        startTime: getCurrentTime(),
        durationMinutes: selectedDuration,
        date: format(new Date(), 'yyyy-MM-dd')
      })

      toast.success(`Time block created: ${activityName}`)
      onSuccess?.()
      onClose()
      
      // Reset form
      setSelectedActivity('')
      setCustomActivity('')
      setShowCustomInput(false)
    } catch (error) {
      toast.error('Failed to create time block. Please try again.')
    }
  }

  if (!isOpen || !axisConfig) return null

  const Icon = axisConfig.icon

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
            <div className="w-full max-w-sm sm:max-w-md bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: axisConfig.color }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {axisConfig.label} Activities
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  Choose or create an activity
                </p>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Predefined Activities */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">
                    Suggested Activities
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {currentSuggestions.slice(0, 8).map((activity, index) => (
                      <button
                        key={index}
                        onClick={() => handleActivitySelect(activity)}
                        className={`
                          p-2 rounded-lg border transition-all duration-200 text-left
                          ${selectedActivity === activity
                            ? 'border-white bg-white/10 text-white'
                            : 'border-white/20 hover:border-white/30 bg-white/5 text-gray-300 hover:text-white'
                          }
                        `}
                      >
                        <span className="text-xs">{activity}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Activities */}
                {customActivities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">
                      Your Custom Activities
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {customActivities.map((activity, index) => (
                        <button
                          key={index}
                          onClick={() => handleActivitySelect(activity)}
                          className={`
                            p-2 rounded-lg border transition-all duration-200 text-left
                            ${selectedActivity === activity
                              ? 'border-white bg-white/10 text-white'
                              : 'border-white/20 hover:border-white/30 bg-white/5 text-gray-300 hover:text-white'
                            }
                          `}
                        >
                          <span className="text-xs">{activity}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Custom Activity */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">
                    Create Custom Activity
                  </h4>
                  
                  {!showCustomInput ? (
                    <button
                      onClick={handleCustomActivity}
                      className="w-full p-3 rounded-lg border border-dashed border-white/30 hover:border-white/50 bg-white/5 text-gray-400 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Add Custom Activity</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customActivity}
                        onChange={(e) => setCustomActivity(e.target.value)}
                        placeholder="Enter your custom activity..."
                        className="w-full p-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-white/40 focus:outline-none"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateCustomActivity()
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateCustomActivity}
                          disabled={!customActivity.trim()}
                          variant="secondary"
                          size="sm"
                          fullWidth
                          className="flex items-center justify-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          <span className="text-sm">Save</span>
                        </Button>
                        <Button
                          onClick={() => {
                            setShowCustomInput(false)
                            setCustomActivity('')
                          }}
                          variant="outline"
                          size="sm"
                          fullWidth
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration Selection */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-3">
                    Duration
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATION_OPTIONS.map((duration) => (
                      <button
                        key={duration.value}
                        onClick={() => setSelectedDuration(duration.value)}
                        className={`
                          p-2 rounded-lg border transition-all duration-200
                          ${selectedDuration === duration.value
                            ? 'border-white bg-white/10 text-white'
                            : 'border-white/20 hover:border-white/30 bg-white/5 text-gray-300 hover:text-white'
                          }
                        `}
                      >
                        <span className="text-xs">{duration.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 border-t border-white/10 bg-white/5">
                <div className="flex gap-3">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTimeBlock}
                    disabled={createTimeBlock.isPending || (!selectedActivity && !customActivity.trim())}
                    fullWidth
                    className="flex items-center justify-center gap-2"
                    style={{ 
                      background: `linear-gradient(135deg, ${axisConfig.color}, ${axisConfig.color}CC)`,
                      border: `1px solid ${axisConfig.color}`
                    }}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {createTimeBlock.isPending ? 'Creating...' : 'Create Time Block'}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}