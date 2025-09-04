'use client'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Activity, Brain, Heart, Users, Sparkles, Briefcase, Clock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateTimeBlock } from '@/lib/react-query/hooks/useMyDayTimeBlocks'
import { useUser } from '@/lib/react-query/hooks/useUser'
import { useCategories } from '@/lib/react-query/hooks/useCategories'
import { format } from 'date-fns'

interface QuickTimeBlockCreatorProps {
  isOpen: boolean
  onClose: () => void
  selectedAxis?: string
  onSuccess?: () => void
}

// Predefined activity suggestions for each axis
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

const AXIS_OPTIONS = [
  { value: 'physical', label: 'Physical', icon: Activity, color: '#D4845C' },
  { value: 'mental', label: 'Mental', icon: Brain, color: '#8B9DC3' },
  { value: 'emotional', label: 'Emotional', icon: Heart, color: '#B8A4C9' },
  { value: 'social', label: 'Social', icon: Users, color: '#A8C8B8' },
  { value: 'spiritual', label: 'Spiritual', icon: Sparkles, color: '#7B6C8D' },
  { value: 'material', label: 'Material', icon: Briefcase, color: '#C19A6B' }
]

const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
]

export function QuickTimeBlockCreator({
  isOpen,
  onClose,
  selectedAxis,
  onSuccess
}: QuickTimeBlockCreatorProps) {
  const { user } = useUser()
  const { data: categories = [] } = useCategories()
  const createTimeBlock = useCreateTimeBlock()
  
  const [currentAxis, setCurrentAxis] = useState(selectedAxis || 'physical')
  const [selectedActivity, setSelectedActivity] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [customActivity, setCustomActivity] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Get suggestions for current axis
  const currentSuggestions = ACTIVITY_SUGGESTIONS[currentAxis] || []
  
  // Get current time for default start time
  const getCurrentTime = () => {
    const now = new Date()
    return format(now, 'HH:mm')
  }

  const handleAxisChange = (axis: string) => {
    setCurrentAxis(axis)
    setSelectedActivity('')
    setCustomActivity('')
    setShowCustomInput(false)
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

  const handleCreate = async () => {
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
    const category = categories.find(cat => cat.slug === currentAxis)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-navy-800 border-navy-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Quick Time Block
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Axis Selection */}
          <div>
            <Label className="text-sm font-medium text-navy-200 mb-3 block">
              Choose Axis
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {AXIS_OPTIONS.map((axis) => {
                const Icon = axis.icon
                return (
                  <button
                    key={axis.value}
                    onClick={() => handleAxisChange(axis.value)}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200
                      ${currentAxis === axis.value
                        ? 'border-white bg-navy-700'
                        : 'border-navy-600 hover:border-navy-500 bg-navy-800/50'
                      }
                    `}
                  >
                    <Icon 
                      className={`w-5 h-5 mx-auto mb-1 ${
                        currentAxis === axis.value ? 'text-white' : 'text-navy-400'
                      }`} 
                    />
                    <p className={`text-xs ${
                      currentAxis === axis.value ? 'text-white font-medium' : 'text-navy-400'
                    }`}>
                      {axis.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Activity Selection */}
          <div>
            <Label className="text-sm font-medium text-navy-200 mb-3 block">
              Choose Activity
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {currentSuggestions.slice(0, 12).map((activity, index) => (
                <button
                  key={index}
                  onClick={() => handleActivitySelect(activity)}
                  className={`
                    p-2 rounded-lg border transition-all duration-200 text-left
                    ${selectedActivity === activity
                      ? 'border-white bg-navy-700 text-white'
                      : 'border-navy-600 hover:border-navy-500 bg-navy-800/50 text-navy-300 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xs">{activity}</span>
                </button>
              ))}
              <button
                onClick={handleCustomActivity}
                className="p-2 rounded-lg border border-dashed border-navy-500 hover:border-navy-400 bg-navy-800/30 text-navy-400 hover:text-white transition-all duration-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span className="text-xs">Custom</span>
              </button>
            </div>
            
            {/* Custom Activity Input */}
            {showCustomInput && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                  placeholder="Enter custom activity..."
                  className="w-full p-2 bg-navy-700 border border-navy-600 rounded-lg text-white placeholder-navy-400 focus:border-navy-400 focus:outline-none"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Duration Selection */}
          <div>
            <Label className="text-sm font-medium text-navy-200 mb-3 block">
              Duration
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setSelectedDuration(duration.value)}
                  className={`
                    p-2 rounded-lg border transition-all duration-200
                    ${selectedDuration === duration.value
                      ? 'border-white bg-navy-700 text-white'
                      : 'border-navy-600 hover:border-navy-500 bg-navy-800/50 text-navy-300 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xs">{duration.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createTimeBlock.isPending || (!selectedActivity && !customActivity.trim())}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {createTimeBlock.isPending ? 'Creating...' : 'Create Time Block'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
