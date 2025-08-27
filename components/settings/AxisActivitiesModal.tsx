'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'

import { AxisIcon } from '@/components/icons'
import { 
  useAxisActivities, 
  useCreateActivity, 
  useUpdateActivity, 
  useDeleteActivity 
} from '@/lib/react-query/hooks/useAxisActivities'

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
    'Call a friend', 'Family dinner', 'Team meeting', 'Social event', 'Date night',
    'Coffee with colleague', 'Group activity', 'Networking', 'Video call', 'Send thank you note',
    'Join community', 'Volunteer work', 'Game night', 'Book club', 'Support someone',
    'Make new connection', 'Reconnect with old friend', 'Team building', 'Social media detox', 'Active listening'
  ],
  spiritual: [
    'Prayer', 'Meditation', 'Nature walk', 'Gratitude journal', 'Volunteer service',
    'Reading scripture', 'Spiritual study', 'Contemplation', 'Forgiveness practice', 'Acts of kindness',
    'Mindful breathing', 'Yoga practice', 'Sunset watching', 'Sacred ritual', 'Chanting',
    'Energy healing', 'Crystal meditation', 'Intention setting', 'Moon gazing', 'Sound bath'
  ],
  purpose: [
    'Goal setting', 'Vision boarding', 'Career planning', 'Skill development', 'Project work',
    'Mentoring', 'Teaching', 'Creating content', 'Business planning', 'Innovation session',
    'Strategic thinking', 'Impact assessment', 'Legacy planning', 'Contribution review', 'Mission alignment',
    'Value clarification', 'Purpose meditation', 'Achievement tracking', 'Milestone celebration', 'Future visioning'
  ]
}

interface AxisActivitiesModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  axis: {
    id: number
    name: string
    color: string
    icon: string
  }
}

interface ActivityForm {
  id?: number
  activity_name: string
  description: string
}

export function AxisActivitiesModal({ 
  isOpen, 
  onClose, 
  userId, 
  axis 
}: AxisActivitiesModalProps) {
  const { data: activities = [], isLoading, refetch } = useAxisActivities(userId, axis.id)
  const createActivity = useCreateActivity()
  const updateActivity = useUpdateActivity()
  const deleteActivity = useDeleteActivity()
  
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<ActivityForm>({
    activity_name: '',
    description: ''
  })
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({ show: false, type: 'success', message: '' })
  
  // Track used suggestions to avoid immediate repeats
  const [usedSuggestions, setUsedSuggestions] = useState<Set<string>>(new Set())
  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>([])
  
  // Get the axis type from the icon name
  const axisType = useMemo(() => {
    const iconToType: Record<string, string> = {
      'activity': 'physical',
      'brain': 'mental',
      'heart': 'emotional',
      'users': 'social',
      'sparkles': 'spiritual',
      'briefcase': 'purpose'
    }
    return iconToType[axis.icon] || 'physical'
  }, [axis.icon])
  
  // Get random suggestions that haven't been used recently
  const getRandomSuggestions = (count: number = 6) => {
    const availableSuggestions = ACTIVITY_SUGGESTIONS[axisType]
    if (!availableSuggestions) return []
    const unused = availableSuggestions.filter(s => !usedSuggestions.has(s))
    const pool = unused.length >= count ? unused : availableSuggestions
    
    const selected: string[] = []
    const tempSet = new Set(selected)
    
    while (selected.length < count && selected.length < pool.length) {
      const randomIndex = Math.floor(Math.random() * pool.length)
      const suggestion = pool[randomIndex]
      if (suggestion && !tempSet.has(suggestion)) {
        selected.push(suggestion)
        tempSet.add(suggestion)
      }
    }
    
    return selected
  }
  
  // Initialize suggestions when adding new activity
  useEffect(() => {
    if (isAddingNew) {
      setDisplayedSuggestions(getRandomSuggestions())
    }
  }, [isAddingNew, axisType])
  
  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string, index: number) => {
    setFormData(prev => ({ ...prev, activity_name: suggestion }))
    setUsedSuggestions(prev => new Set(prev).add(suggestion))
    
    // Replace the clicked suggestion with a new one
    const newSuggestions = [...displayedSuggestions]
    const suggestions = ACTIVITY_SUGGESTIONS[axisType]
    if (!suggestions) return
    const availableSuggestions = suggestions.filter(
      s => !displayedSuggestions.includes(s) && s !== suggestion
    )
    
    if (availableSuggestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableSuggestions.length)
      const newSuggestion = availableSuggestions[randomIndex]
      if (newSuggestion) {
        newSuggestions[index] = newSuggestion
        setDisplayedSuggestions(newSuggestions)
      }
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
    setEditingId(null)
    setFormData({ activity_name: '', description: '' })
  }

  const handleEdit = (activity: any) => {
    setEditingId(activity.id)
    setIsAddingNew(false)
    setFormData({
      id: activity.id,
      activity_name: activity.activity_name,
      description: activity.description || ''
    })
  }

  const handleCancel = () => {
    setIsAddingNew(false)
    setEditingId(null)
    setFormData({ activity_name: '', description: '' })
  }

  const handleSave = async () => {
    if (!formData.activity_name.trim()) {
      showNotification('error', 'Activity name is required')
      return
    }

    try {
      if (isAddingNew) {
        await createActivity.mutateAsync({
          user_id: userId,
          category_id: axis.id,
          activity_name: formData.activity_name.trim(),
          description: formData.description.trim()
        })
        showNotification('success', 'Activity added successfully!')
      } else if (editingId && formData.id) {
        await updateActivity.mutateAsync({
          id: formData.id,
          activity_name: formData.activity_name.trim(),
          description: formData.description.trim()
        })
        showNotification('success', 'Activity updated successfully!')
      }
      
      handleCancel()
      refetch()
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Error saving activity:', error);
      showNotification('error', 'Failed to save activity')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return
    }

    try {
      await deleteActivity.mutateAsync(id)
      showNotification('success', 'Activity deleted successfully!')
      refetch()
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Error deleting activity:', error);
      showNotification('error', 'Failed to delete activity')
    }
  }

  const handleToggleActive = async (activity: any) => {
    try {
      await updateActivity.mutateAsync({
        id: activity.id,
        is_active: !activity.is_active
      })
      refetch()
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Error toggling activity:', error);
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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6"
          >
            <div className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] glass rounded-2xl overflow-hidden flex flex-col"
                 style={{ 
                   paddingTop: 'env(safe-area-inset-top, 0px)',
                   paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                   paddingLeft: 'env(safe-area-inset-left, 0px)',
                   paddingRight: 'env(safe-area-inset-right, 0px)'
                 }}>
              {/* Header */}
              <div className="flex-shrink-0 p-4 sm:p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div 
                      className="p-2 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${axis.color  }20` }}
                    >
                      <AxisIcon 
                        axis={axis.icon}
                        size={24}
                        color={axis.color}
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                        {axis.name} Activities
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">
                        Customize your daily activities for this axis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <div className="p-4 sm:p-6 h-full overflow-y-auto overscroll-contain"
                     style={{ 
                       scrollbarWidth: 'thin',
                       WebkitOverflowScrolling: 'touch'
                     }}>
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
                    <p className="text-gray-400">Loading activities...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Add New Button */}
                    {!isAddingNew && !editingId && (
                      <button
                        onClick={handleAddNew}
                        className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-white min-h-[44px] touch-manipulation"
                        aria-label="Add new activity"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-sm sm:text-base">Add New Activity</span>
                      </button>
                    )}

                    {/* Add/Edit Form */}
                    {(isAddingNew || editingId) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30"
                      >
                        <div className="space-y-3">
                          {/* Suggestions - Only show when adding new */}
                          {isAddingNew && displayedSuggestions.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Sparkles className="w-3 h-3" />
                                <span>Quick suggestions (tap to use):</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {displayedSuggestions.map((suggestion, index) => (
                                  <motion.button
                                    key={`${suggestion}-${index}`}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSuggestionClick(suggestion, index)}
                                    className="px-3 py-2 text-xs sm:text-sm bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-gray-300 hover:text-white transition-all text-center min-h-[44px] touch-manipulation flex items-center justify-center"
                                    type="button"
                                    aria-label={`Use suggestion: ${suggestion}`}
                                  >
                                    <span className="truncate">{suggestion}</span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <input
                            type="text"
                            value={formData.activity_name}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              activity_name: e.target.value 
                            }))}
                            placeholder="Activity name (e.g., 'Go for a run')"
                            className="w-full px-4 py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 min-h-[44px] touch-manipulation"
                            autoFocus
                            aria-label="Activity name"
                          />
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              description: e.target.value 
                            }))}
                            placeholder="Description (optional)"
                            className="w-full px-4 py-3 text-sm sm:text-base bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 resize-none touch-manipulation"
                            rows={3}
                            aria-label="Activity description"
                          />
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={handleSave}
                              disabled={createActivity.isPending || updateActivity.isPending}
                              className="flex-1 py-3 text-sm sm:text-base bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
                              aria-label="Save activity"
                            >
                              {(createActivity.isPending || updateActivity.isPending) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              <span>Save</span>
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-6 py-3 text-sm sm:text-base bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors min-h-[44px] touch-manipulation"
                              aria-label="Cancel editing"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Activities List */}
                    {activities.map((activity) => (
                      <motion.div
                        key={activity.id}
                        layout
                        className={`p-4 rounded-xl transition-all ${
                          editingId === activity.id
                            ? 'hidden'
                            : activity.is_active
                            ? 'bg-white/5 hover:bg-white/10'
                            : 'bg-white/5 opacity-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={activity.is_active}
                                onChange={() => handleToggleActive(activity)}
                                className="rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                              />
                              <h4 className={`font-medium ${
                                activity.is_active ? 'text-white' : 'text-gray-400'
                              }`}>
                                {activity.activity_name}
                              </h4>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-gray-400 mt-1 ml-6">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(activity)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                              aria-label={`Edit ${activity.activity_name}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(activity.id)}
                              disabled={deleteActivity.isPending}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                              aria-label={`Delete ${activity.activity_name}`}
                            >
                              {deleteActivity.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {activities.length === 0 && !isAddingNew && (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4 text-sm sm:text-base">No activities yet</p>
                        <button
                          onClick={handleAddNew}
                          className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors min-h-[44px] touch-manipulation"
                          aria-label="Add your first activity"
                        >
                          <span className="text-sm sm:text-base">Add Your First Activity</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 p-4 sm:p-6 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm sm:text-base bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors min-h-[44px] touch-manipulation"
                  aria-label="Close modal"
                >
                  Done
                </button>
              </div>
            </div>

            {/* Notification */}
            <AnimatePresence>
              {notification.show && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] mx-4"
                  style={{
                    maxWidth: 'calc(100vw - 2rem)'
                  }}
                >
                  <div className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg backdrop-blur-md min-h-[44px]
                    ${notification.type === 'success' 
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                      : 'bg-red-500/20 border border-red-500/50 text-red-400'
                    }
                  `}>
                    {notification.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium flex-1 text-center">{notification.message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}