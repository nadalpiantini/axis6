'use client'
import { useState, useEffect, memo } from 'react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { AxisIcon } from '@/components/icons'
import { useDayData, useQuickAddBlock, AXES } from '@/lib/hooks/useDayData'

interface MobileFriendlyMyDayProps {
  selectedDate: Date
  onDateChange: (direction: 'prev' | 'next') => void
  blocks: Array<{
    id: number
    axis_id: number
    minutes: number
    start_ts: string
    note?: string
    axis_name: string
    axis_color: string
    subcat_name?: string
  }>
  onAxisClick: (axis: { id: number; name: string; color: string; icon: string }) => void
  onBlockClick: (hour: number, minutes: number) => void
  onEditBlock: (block: any) => void
}

// Master Hexagon from Dashboard - adapted for My Day
const MasterHexagon = memo(({ 
  axes, 
  onAxisClick,
  isToggling,
  selectedDate
}: {
  axes: Array<{
    id: number
    name: string
    color: string
    icon: string
    minutes: number
  }>
  onAxisClick: (axis: any) => void
  isToggling: boolean
  selectedDate: Date
}) => {
  const handleAxisClick = (axis: any, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onAxisClick(axis)
  }

  return (
    <div className="flex justify-center mb-6" data-testid="hexagon-chart">
      <svg 
        className="w-full h-auto max-w-[300px] sm:max-w-[350px]" 
        viewBox="0 0 400 400" 
        role="img" 
        aria-label="Daily progress overview"
        style={{ pointerEvents: 'auto' }}
      >
        {/* Background hexagon */}
        <polygon
          points="200,40 340,120 340,280 200,360 60,280 60,120"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        
        {/* Axis points with growing nodes based on minutes */}
        {axes.slice(0, 6).map((axis, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 2
          const x = 200 + 160 * Math.cos(angle)
          const y = 200 + 160 * Math.sin(angle)
          
          // Calculate node size based on minutes (0-120 minutes = 20-40px radius)
          const nodeSize = Math.max(20, Math.min(40, 20 + (axis.minutes / 120) * 20))
          const isActive = axis.minutes > 0
          
          return (
            <g key={axis.id}>
              {/* Click target */}
              <circle
                cx={x}
                cy={y}
                r="45"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={(e) => handleAxisClick(axis, e)}
              />
              {/* Visual circle - grows with minutes */}
              <circle
                cx={x}
                cy={y}
                r={nodeSize}
                fill={isActive ? "rgba(255, 255, 255, 0.15)" : "rgba(255,255,255,0.08)"}
                stroke={isActive ? "rgba(255, 255, 255, 0.4)" : "rgba(255,255,255,0.15)"}
                strokeWidth="2"
                className="transition-all duration-500 ease-out"
              />
              {/* Icon */}
              <foreignObject 
                x={x - 14} 
                y={y - 14} 
                width="28" 
                height="28"
                style={{ pointerEvents: 'none' }}
              >
                <AxisIcon 
                  axis={axis.icon}
                  size={28}
                  color={isActive ? "#ffffff" : "#9ca3af"}
                  custom
                />
              </foreignObject>
              {/* Minutes badge */}
              {axis.minutes > 0 && (
                <>
                  <circle
                    cx={x + 25}
                    cy={y - 25}
                    r="12"
                    fill={axis.color}
                    stroke="white"
                    strokeWidth="1"
                  />
                  <text
                    x={x + 25}
                    y={y - 20}
                    textAnchor="middle"
                    fontSize="10"
                    fill="white"
                    className="font-bold"
                  >
                    {axis.minutes}m
                  </text>
                </>
              )}
            </g>
          )
        })}
        
        {/* Center text - removed to avoid duplication with header */}
      </svg>
    </div>
  )
})

// Axis buttons with minutes display
const AxisButtons = memo(({ 
  axes, 
  onAxisClick 
}: {
  axes: Array<{
    id: number
    name: string
    color: string
    icon: string
    minutes: number
  }>
  onAxisClick: (axis: any) => void
}) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {axes.map(axis => (
        <button
          key={axis.id}
          onClick={() => onAxisClick(axis)}
          className="p-4 rounded-lg transition-all duration-200 hover:scale-105 group relative overflow-hidden"
          style={{ 
            backgroundColor: `${axis.color}20`,
            borderLeft: `4px solid ${axis.color}`,
            borderColor: `${axis.color}40`
          }}
        >
          {/* Background gradient */}
          <div 
            className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
            style={{ backgroundColor: axis.color }}
          />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{axis.icon}</div>
              <div className="text-left">
                <div className="font-medium text-white">{axis.name}</div>
                <div className="text-sm opacity-70" style={{ color: axis.color }}>
                  {axis.minutes > 0 ? `${axis.minutes}m today` : 'No activity yet'}
                </div>
              </div>
            </div>
            
            {/* Minutes badge */}
            <div 
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ 
                backgroundColor: axis.minutes > 0 ? axis.color : 'rgba(255,255,255,0.2)',
                color: 'white'
              }}
            >
              {axis.minutes}m
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${Math.min((axis.minutes / 120) * 100, 100)}%`,
                backgroundColor: axis.color
              }}
            />
          </div>
        </button>
      ))}
    </div>
  )
})

// Integrated Timeline
const IntegratedTimeline = memo(({ 
  onBlockClick, 
  onEditBlock, 
  blocks, 
  selectedAxis 
}: {
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
}) => {
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
      
      <div className="space-y-1 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
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
                    disabled={!!block && !isPast}
                    className={`
                      flex-1 h-8 border transition-all relative group
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
                      <div className="absolute inset-0 p-1 flex items-center justify-center">
                        <div className="text-[8px] font-medium text-white/90 truncate">
                          {getActivityIcon(block.axis_id)}
                        </div>
                      </div>
                    )}
                    
                    {/* Current time indicator */}
                    {isNow && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
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
          <Clock className="w-3 h-3" />
          Now: {formatTime(currentHour)}:{currentMinute.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  )
})

export function MobileFriendlyMyDay({ 
  selectedDate, 
  onDateChange, 
  blocks, 
  onAxisClick, 
  onBlockClick, 
  onEditBlock 
}: MobileFriendlyMyDayProps) {
  // Calculate minutes per axis
  const minutesByAxis = AXES.map(axis => {
    const axisBlocks = blocks.filter(block => block.axis_id === axis.id)
    const totalMinutes = axisBlocks.reduce((sum, block) => sum + block.minutes, 0)
    return { ...axis, minutes: totalMinutes }
  })

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      {/* Date navigation removed - handled by parent component */}

      {/* Main Content - Vertical Layout */}
      <div className="space-y-6">
        {/* Hexagon Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 flex flex-col items-center justify-center text-white"
        >
          <MasterHexagon
            axes={minutesByAxis}
            onAxisClick={onAxisClick}
            isToggling={false}
            selectedDate={selectedDate}
          />
        </motion.div>

        {/* Axis Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AxisButtons
            axes={minutesByAxis}
            onAxisClick={onAxisClick}
          />
        </motion.div>

        {/* Integrated Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <IntegratedTimeline
            onBlockClick={onBlockClick}
            onEditBlock={onEditBlock}
            blocks={blocks}
            selectedAxis={null}
          />
        </motion.div>
      </div>
    </div>
  )
}
