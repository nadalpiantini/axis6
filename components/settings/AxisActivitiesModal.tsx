'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { AxisIcon } from '@/components/icons'
import { 
  useAxisActivities, 
  useCreateActivity, 
  useUpdateActivity, 
  useDeleteActivity 
} from '@/lib/react-query/hooks/useAxisActivities'

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
      console.error('Error saving activity:', error)
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
      console.error('Error deleting activity:', error)
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
      console.error('Error toggling activity:', error)
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] overflow-hidden z-50"
          >
            <div className="glass rounded-2xl">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: axis.color + '20' }}
                    >
                      <AxisIcon 
                        axis={axis.icon}
                        size={24}
                        color={axis.color}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">
                        {axis.name} Activities
                      </h2>
                      <p className="text-sm text-gray-400">
                        Customize your daily activities for this axis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[50vh] overflow-y-auto">
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
                        className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500/50 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-gray-400 hover:text-white"
                      >
                        <Plus className="w-5 h-5" />
                        Add New Activity
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
                          <input
                            type="text"
                            value={formData.activity_name}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              activity_name: e.target.value 
                            }))}
                            placeholder="Activity name (e.g., 'Go for a run')"
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                            autoFocus
                          />
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              description: e.target.value 
                            }))}
                            placeholder="Description (optional)"
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleSave}
                              disabled={createActivity.isPending || updateActivity.isPending}
                              className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              {(createActivity.isPending || updateActivity.isPending) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
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
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(activity.id)}
                              disabled={deleteActivity.isPending}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                        <p className="text-gray-400 mb-4">No activities yet</p>
                        <button
                          onClick={handleAddNew}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                        >
                          Add Your First Activity
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
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
                  className="absolute bottom-4 left-1/2 -translate-x-1/2"
                >
                  <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-md
                    ${notification.type === 'success' 
                      ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                      : 'bg-red-500/20 border border-red-500/50 text-red-400'
                    }
                  `}>
                    {notification.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">{notification.message}</span>
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