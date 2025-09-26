'use client'
import { useState, useEffect } from 'react'
import { AXES } from '@/lib/hooks/useDayData'
import { Edit3, Clock } from 'lucide-react'

interface EnhancedTimelineProps {
  onBlockClick: (hour: number, minutes: number) => void
  onEditBlock: (block: any) => void
  blocks: Array<{
    id: number
    axis_id: number
    start_ts: string
    minutes: number
    axis_color: string
    axis_name: string
    note?: string
  }>
  selectedAxis?: { id: number; name: string; color: string } | null
}

export function EnhancedTimeline({ onBlockClick, onEditBlock, blocks, selectedAxis }: EnhancedTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const hours = Array.from({ length: 17 }, (_, i) => i + 5) // 5am to 9pm
  const currentHour = currentTime.getHours()
  const currentMinute = currentTime.getMinutes()
  const currentQuarter = Math.floor(currentMinute / 15)

  // Check if a time slot has an activity
  const getBlockForSlot = (hour: number, quarter: number) => {
    const slotStart = new Date()
    slotStart.setHours(hour, quarter * 15, 0, 0)
    const slotEnd = new Date(slotStart.getTime() + 15 * 60 * 1000)

    return blocks.find(block => {
      const blockStart = new Date(block.start_ts)
      const blockEnd = new Date(blockStart.getTime() + block.minutes * 60 * 1000)
      
      // Check if this 15-min slot overlaps with the block
      return blockStart < slotEnd && blockEnd > slotStart
    })
  }

  const formatTime = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }

  const getActivityIcon = (axisId: number) => {
    const axis = AXES.find(a => a.id === axisId)
    return axis?.icon || '⚡'
  }

  return (
    <div className="glass rounded-xl p-4 text-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🕐 Timeline
        <span className="text-xs text-gray-400">
          (click to add {selectedAxis?.name || 'activity'})
        </span>
      </h3>
      
      <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
        {hours.map(hour => (
          <div key={hour} className="flex items-center gap-2 relative">
            {/* Hour label */}
            <span className="text-xs text-gray-400 w-14 text-right font-mono">
              {formatTime(hour)}
            </span>
            
            {/* 15-minute quarters */}
            <div className="flex gap-0.5 flex-1">
              {[0, 1, 2, 3].map(quarter => {
                const block = getBlockForSlot(hour, quarter)
                const isNow = hour === currentHour && quarter === currentQuarter
                const isPast = hour < currentHour || (hour === currentHour && quarter < currentQuarter)
                
                return (
                  <button
                    key={quarter}
                    onClick={() => block ? onEditBlock(block) : onBlockClick(hour, quarter * 15)}
                    disabled={!!block && !isPast} // Allow editing past blocks
                    className={`
                      flex-1 h-10 border transition-all relative group
                      ${block 
                        ? 'cursor-pointer hover:scale-105' 
                        : 'cursor-pointer hover:border-white/40 hover:bg-white/5'
                      }
                      ${isNow 
                        ? 'ring-2 ring-yellow-400 ring-opacity-60 border-yellow-400' 
                        : 'border-white/10'
                      }
                      ${isPast && !block ? 'opacity-50' : ''}
                    `}
                    style={{
                      backgroundColor: block 
                        ? `${block.axis_color}60` 
                        : selectedAxis 
                          ? `${selectedAxis.color}10`
                          : 'transparent',
                      borderLeftWidth: block ? '4px' : '1px',
                      borderLeftColor: block ? block.axis_color : undefined
                    }}
                    title={
                      block 
                        ? `${block.axis_name}: ${block.minutes}m${block.note ? ` - ${block.note}` : ''} - Click to edit`
                        : `${hour}:${(quarter * 15).toString().padStart(2, '0')} - Click to add activity`
                    }
                  >
                    {/* Block content */}
                    {block && (
                      <div className="absolute inset-0 p-1 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div className="text-sm font-medium">
                            {getActivityIcon(block.axis_id)}
                          </div>
                          <div className="text-[8px] font-medium text-white/90 truncate">
                            {block.note || block.axis_name}
                          </div>
                        </div>
                        {isPast && (
                          <Edit3 className="w-3 h-3 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    )}
                    
                    {/* Current time indicator */}
                    {isNow && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                    
                    {/* Hover effect for empty slots */}
                    {!block && selectedAxis && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="text-xs text-white/60">+</div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      
      {/* NOW indicator line */}
      {currentHour >= 5 && currentHour <= 21 && (
        <div 
          className="absolute left-0 right-0 h-0.5 bg-yellow-400 z-10"
          style={{
            top: `${((currentHour - 5) * 4 + currentQuarter) * 2.5 + 60}px`
          }}
        >
          <div className="absolute -left-2 -top-1 w-4 h-2 bg-yellow-400 transform rotate-45"></div>
          <div className="absolute -right-2 -top-1 w-4 h-2 bg-yellow-400 transform rotate-45"></div>
        </div>
      )}
      
      {/* Footer info */}
      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs text-gray-400">
        <span>15min blocks</span>
        <span>{blocks.length} activities</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Now: {formatTime(currentHour)}:{currentMinute.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
