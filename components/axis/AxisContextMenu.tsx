'use client'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Plus, 
  List, 
  X, 
  Calendar,
  ChevronRight,
  Activity,
  Brain,
  Heart,
  Users,
  Sparkles,
  Briefcase
} from 'lucide-react'
import { QuickTimeBlockCreator } from './QuickTimeBlockCreator'
import { useMyDayTimeBlocks } from '@/lib/react-query/hooks/useMyDayTimeBlocks'
import { useUser } from '@/lib/react-query/hooks'
import { format } from 'date-fns'

interface AxisContextMenuProps {
  isOpen: boolean
  onClose: () => void
  axis: {
    id: string | number
    name: string
    color: string
    icon: string
    completed: boolean
  }
  position: { x: number; y: number }
}

const AXIS_ICONS = {
  activity: Activity,
  brain: Brain,
  heart: Heart,
  users: Users,
  sparkles: Sparkles,
  briefcase: Briefcase
}

export function AxisContextMenu({
  isOpen,
  onClose,
  axis,
  position
}: AxisContextMenuProps) {
  const { data: user } = useUser()
  const menuRef = useRef<HTMLDivElement>(null)
  const [showQuickCreator, setShowQuickCreator] = useState(false)
  const [showTimeBlocks, setShowTimeBlocks] = useState(false)
  
  // Get today's date
  const today = format(new Date(), 'yyyy-MM-dd')
  
  // Fetch time blocks for this axis today
  const { data: timeBlocks = [] } = useMyDayTimeBlocks(user?.id, today)
  
  // Filter time blocks for this specific axis
  const axisTimeBlocks = timeBlocks.filter(block => 
    block.category_id === axis.id || 
    block.category_slug === axis.icon
  )

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleCreateTimeBlock = () => {
    setShowQuickCreator(true)
    onClose()
  }

  const handleViewTimeBlocks = () => {
    setShowTimeBlocks(true)
    onClose()
  }

  const handleQuickCreatorClose = () => {
    setShowQuickCreator(false)
  }

  const handleTimeBlocksClose = () => {
    setShowTimeBlocks(false)
  }

  const getAxisIcon = (iconName: string) => {
    const Icon = AXIS_ICONS[iconName as keyof typeof AXIS_ICONS] || Activity
    return <Icon className="w-4 h-4" />
  }

  if (!isOpen) return null

  return (
    <>
      <AnimatePresence>
        <motion.div
          ref={menuRef}
          className="fixed z-50 bg-navy-800 border border-navy-700 rounded-lg shadow-xl backdrop-blur-sm"
          style={{
            left: position.x,
            top: position.y,
            minWidth: '200px'
          }}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-navy-700">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: axis.color }}
              />
              {getAxisIcon(axis.icon)}
              <span className="text-sm font-medium text-white">{axis.name}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-navy-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-navy-400" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-1">
            {/* Create New Time Block */}
            <button
              onClick={handleCreateTimeBlock}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-navy-700 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                <Plus className="w-4 h-4 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Create Time Block</div>
                <div className="text-xs text-navy-400">Quick activity planning</div>
              </div>
              <ChevronRight className="w-4 h-4 text-navy-500 group-hover:text-navy-400 transition-colors" />
            </button>

            {/* View Existing Time Blocks */}
            <button
              onClick={handleViewTimeBlocks}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-navy-700 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                <List className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">View Time Blocks</div>
                <div className="text-xs text-navy-400">
                  {axisTimeBlocks.length} today
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-navy-500 group-hover:text-navy-400 transition-colors" />
            </button>

            {/* Go to My Day */}
            <a
              href="/my-day"
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-navy-700 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">Go to My Day</div>
                <div className="text-xs text-navy-400">Full day planning</div>
              </div>
              <ChevronRight className="w-4 h-4 text-navy-500 group-hover:text-navy-400 transition-colors" />
            </a>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Quick Time Block Creator Modal */}
      <QuickTimeBlockCreator
        isOpen={showQuickCreator}
        onClose={handleQuickCreatorClose}
        selectedAxis={axis.icon}
        onSuccess={() => {
          // Refresh data if needed
        }}
      />

      {/* Time Blocks List Modal */}
      <AnimatePresence>
        {showTimeBlocks && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleTimeBlocksClose}
          >
            <motion.div
              className="bg-navy-800 border border-navy-700 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-navy-700">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: axis.color }}
                  />
                  {getAxisIcon(axis.icon)}
                  <span className="text-lg font-medium text-white">{axis.name} Time Blocks</span>
                </div>
                <button
                  onClick={handleTimeBlocksClose}
                  className="p-1 hover:bg-navy-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-navy-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {axisTimeBlocks.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-navy-600 mx-auto mb-3" />
                    <p className="text-navy-400 mb-4">No time blocks planned for today</p>
                    <button
                      onClick={() => {
                        handleTimeBlocksClose()
                        setShowQuickCreator(true)
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all"
                    >
                      Create First Time Block
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {axisTimeBlocks.map((block, index) => (
                      <div
                        key={index}
                        className="p-3 bg-navy-700/50 border border-navy-600 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{block.activity_name}</h4>
                          <span className="text-xs text-navy-400 bg-navy-800 px-2 py-1 rounded">
                            {block.duration_minutes}min
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-navy-400">
                          <Clock className="w-3 h-3" />
                          <span>{block.start_time} - {block.end_time}</span>
                        </div>
                        {block.notes && (
                          <p className="text-sm text-navy-400 mt-2">{block.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}



