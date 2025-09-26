'use client'
import { X, Clock, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ImprovedAxisMenuProps {
  isOpen: boolean
  onClose: () => void
  axis: { id: number; name: string; color: string; icon: string } | null
  onSelect: (activity: string, duration: number) => void
}

// Simple predefined activities per axis (max 4 each)
const QUICK_ACTIVITIES: Record<string, Array<{name: string, duration: number}>> = {
  'Physical': [
    { name: '🏃 Exercise', duration: 30 },
    { name: '🚶 Walk', duration: 15 },
    { name: '🧘 Stretch', duration: 15 },
    { name: '🏋️ Gym', duration: 60 }
  ],
  'Mental': [
    { name: '📚 Reading', duration: 30 },
    { name: '💻 Learning', duration: 60 },
    { name: '🧠 Focus Work', duration: 45 },
    { name: '📝 Planning', duration: 15 }
  ],
  'Emotional': [
    { name: '🧘 Meditation', duration: 15 },
    { name: '📖 Journaling', duration: 20 },
    { name: '🎵 Music', duration: 30 },
    { name: '🌿 Relax', duration: 30 }
  ],
  'Social': [
    { name: '☕ Coffee Chat', duration: 30 },
    { name: '📞 Call Friend', duration: 15 },
    { name: '🍽️ Meal Together', duration: 60 },
    { name: '🎯 Team Meeting', duration: 45 }
  ],
  'Spiritual': [
    { name: '🙏 Prayer', duration: 15 },
    { name: '🌳 Nature Time', duration: 30 },
    { name: '✨ Reflection', duration: 15 },
    { name: '📿 Mindfulness', duration: 20 }
  ],
  'Material': [
    { name: '💰 Budget Review', duration: 30 },
    { name: '📊 Goal Planning', duration: 45 },
    { name: '🎯 Project Work', duration: 60 },
    { name: '📈 Admin Tasks', duration: 30 }
  ]
}

export function ImprovedAxisMenu({ isOpen, onClose, axis, onSelect }: ImprovedAxisMenuProps) {
  const [selectedActivity, setSelectedActivity] = useState<{name: string, duration: number} | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  if (!isOpen || !axis) return null

  const activities = QUICK_ACTIVITIES[axis.name] || []

  const handleActivitySelect = (activity: {name: string, duration: number}) => {
    setSelectedActivity(activity)
    setShowSuccess(false)
  }

  const handleConfirmActivity = () => {
    if (selectedActivity) {
      onSelect(selectedActivity.name, selectedActivity.duration)
      setShowSuccess(true)
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose()
        setSelectedActivity(null)
        setShowSuccess(false)
      }, 2000)
    }
  }

  const handleQuickAdd = (duration: number) => {
    onSelect(`${axis.name} time`, duration)
    setShowSuccess(true)
    // Auto close after 2 seconds
    setTimeout(() => {
      onClose()
      setShowSuccess(false)
    }, 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gray-900/80 backdrop-blur-2xl border border-white/30 rounded-2xl p-6 w-96 max-w-[90vw] shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-3">
              <span className="text-2xl">{axis.icon}</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: axis.color }}
                />
                <span className="text-lg">{axis.name}</span>
              </div>
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {showSuccess ? (
            /* Success State */
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-green-400" />
              </motion.div>
              <h4 className="text-lg font-semibold text-white mb-2">Activity Added!</h4>
              <p className="text-gray-400 text-sm">Added to your timeline</p>
            </div>
          ) : selectedActivity ? (
            /* Confirmation State */
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-white mb-2">Confirm Activity</h4>
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{selectedActivity.name}</span>
                    <span className="text-sm text-gray-400 bg-white/10 px-3 py-1 rounded-full">
                      {selectedActivity.duration}m
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmActivity}
                  className="flex-1 py-3 px-4 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 font-medium transition-all duration-200 hover:scale-105"
                >
                  Add to Timeline
                </button>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all duration-200"
                >
                  Back
                </button>
              </div>
            </div>
          ) : (
            /* Initial State */
            <>
              {/* Quick Activities */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Quick Activities
                </h4>
                {activities.map((activity, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleActivitySelect(activity)}
                    className="w-full p-4 text-left bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all duration-200 group hover:scale-[1.02]"
                    style={{ borderLeft: `3px solid ${axis.color}` }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="group-hover:text-white/90 font-medium">{activity.name}</span>
                      <span className="text-sm text-gray-400 group-hover:text-gray-300 bg-white/10 px-2 py-1 rounded">
                        {activity.duration}m
                      </span>
                    </div>
                  </button>
                ))}
              </div>
                
              {/* Quick add buttons */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Quick Add Time
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[15, 30, 60].map(duration => (
                    <button
                      key={duration}
                      onClick={() => handleQuickAdd(duration)}
                      className="py-3 px-4 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-all duration-200 hover:scale-105 font-medium"
                      style={{ 
                        borderColor: axis.color + '40',
                        borderWidth: '1px'
                      }}
                    >
                      +{duration}m
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
