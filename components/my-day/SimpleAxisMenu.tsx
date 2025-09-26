'use client'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SimpleAxisMenuProps {
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

export function SimpleAxisMenu({ isOpen, onClose, axis, onSelect }: SimpleAxisMenuProps) {
  if (!isOpen || !axis) return null

  const activities = QUICK_ACTIVITIES[axis.name] || []

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
          className="bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 w-80 max-w-[90vw]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="text-lg">{axis.icon}</span>
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: axis.color }}
              />
              {axis.name}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Quick Activities */}
          <div className="space-y-2">
            {activities.map((activity, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelect(activity.name, activity.duration)
                  onClose()
                }}
                className="w-full p-3 text-left bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors group"
              >
                <div className="flex justify-between items-center">
                  <span className="group-hover:text-white/90">{activity.name}</span>
                  <span className="text-xs text-gray-400 group-hover:text-gray-300">
                    {activity.duration}m
                  </span>
                </div>
              </button>
            ))}
            
            {/* Quick add buttons */}
            <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
              {[15, 30, 60].map(duration => (
                <button
                  key={duration}
                  onClick={() => {
                    onSelect(`${axis.name} time`, duration)
                    onClose()
                  }}
                  className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm transition-colors"
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}