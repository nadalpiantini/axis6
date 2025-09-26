'use client'
import { useState, useEffect } from 'react'
import { AXES } from '@/lib/hooks/useDayData'

interface TimelineGridProps {
  onBlockClick: (hour: number, minutes: number) => void
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

export function TimelineGrid({ onBlockClick, blocks, selectedAxis }: TimelineGridProps) {
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
          <div key={hour} className="flex items-center gap-2">
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
                    onClick={() => onBlockClick(hour, quarter * 15)}
                    disabled={!!block}
                    className={`
                      flex-1 h-8 border transition-all relative group
                      ${block 
                        ? 'cursor-default' 
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
                        ? `${block.axis_color}40` 
                        : selectedAxis 
                          ? `${selectedAxis.color}10`
                          : 'transparent',
                      borderLeftWidth: block ? '3px' : '1px',
                      borderLeftColor: block ? block.axis_color : undefined
                    }}
                    title={
                      block 
                        ? `${block.axis_name}: ${block.minutes}m${block.note ? ` - ${block.note}` : ''}`
                        : `${hour}:${(quarter * 15).toString().padStart(2, '0')} - Click to add activity`
                    }
                  >
                    {/* Block content */}
                    {block && (
                      <div className="absolute inset-0 p-1 flex items-center justify-center">
                        <div className="text-[8px] font-medium text-white/90 truncate">
                          {AXES.find(a => a.id === block.axis_id)?.icon}
                        </div>
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
      
      {/* Footer info */}
      <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-xs text-gray-400">
        <span>15min blocks</span>
        <span>{blocks.length} activities</span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          Now: {formatTime(currentHour)}:{currentMinute.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}