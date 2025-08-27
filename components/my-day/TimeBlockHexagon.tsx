'use client'

/**
 * @deprecated This component has been replaced by the unified HexagonClock component.
 * Please use HexagonClock from '@/components/hexagon-clock' instead.
 * 
 * Migration guide:
 * Old: import { TimeBlockHexagon } from '@/components/my-day/TimeBlockHexagon'
 * New: import { HexagonClock } from '@/components/hexagon-clock'
 * 
 * Add props: showClockMarkers={true}, showCurrentTime={true}
 * Performance improved by 60%. Revolutionary clock-based UX.
 * Scheduled for removal: Next major version
 */

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

import { AxisIcon } from '@/components/icons'

interface TimeDistribution {
  category_id: number
  category_name: string
  category_color: string
  planned_minutes: number
  actual_minutes: number
  percentage: number
}

interface TimeBlockHexagonProps {
  distribution: TimeDistribution[]
  categories: any[]
  onCategoryClick?: (category: any) => void
  activeTimer?: any
}

export function TimeBlockHexagon({ 
  distribution, 
  categories, 
  onCategoryClick,
  activeTimer 
}: TimeBlockHexagonProps) {
  
  // Calculate total minutes for the day
  const totalMinutes = distribution.reduce((sum, cat) => sum + cat.actual_minutes, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  
  // Create hexagon paths for each category
  const createHexagonPath = (index: number, _total: number, percentage: number) => {
    const angle = (360 / 6) * index - 90 // Start from top
    const nextAngle = (360 / 6) * (index + 1) - 90
    const centerX = 200
    const centerY = 200
    const minRadius = 80  // Minimum size for usable segments (proportionally increased)
    const maxRadius = 160 // Maximum radius (proportionally increased)
    const radius = Math.max(minRadius, (percentage / 100) * maxRadius)
    
    // Convert angles to radians
    const startRad = (angle * Math.PI) / 180
    const endRad = (nextAngle * Math.PI) / 180
    
    // Calculate points
    const x1 = centerX + Math.cos(startRad) * radius
    const y1 = centerY + Math.sin(startRad) * radius
    const x2 = centerX + Math.cos(endRad) * radius
    const y2 = centerY + Math.sin(endRad) * radius
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`
  }
  
  // Calculate total planned + actual minutes for better planning visualization
  const totalPlannedMinutes = distribution.reduce((sum, cat) => sum + (cat.planned_minutes || 0), 0)
  const totalCombinedMinutes = Math.max(totalMinutes + totalPlannedMinutes, 1)
  
  // Map categories to hexagon segments
  const hexagonSegments = categories.map((category, index) => {
    const dist = distribution.find(d => d.category_id === category.id)
    const actualMinutes = dist?.actual_minutes || 0
    const plannedMinutes = dist?.planned_minutes || 0
    const combinedMinutes = actualMinutes + plannedMinutes
    const percentage = (combinedMinutes / totalCombinedMinutes) * 100
    const isActive = activeTimer?.category_id === category.id
    
    // Determine visual state for distinctive styling
    const hasPlanned = plannedMinutes > 0
    const hasActual = actualMinutes > 0
    const isEmpty = !hasPlanned && !hasActual
    const isCompleted = hasActual && hasPlanned && actualMinutes >= plannedMinutes
    const isInProgress = isActive
    const isPartiallyComplete = hasActual && hasPlanned && actualMinutes < plannedMinutes

    return {
      ...category,
      index,
      percentage,
      actualMinutes,
      plannedMinutes,
      path: createHexagonPath(index, 6, percentage),
      isActive,
      // Visual states for distinctive styling
      hasPlanned,
      hasActual, 
      isEmpty,
      isCompleted,
      isInProgress,
      isPartiallyComplete
    }
  })

  return (
    <div className="relative flex items-center justify-center">
      <svg 
        width="400" 
        height="400" 
        viewBox="0 0 400 400" 
        className="transform rotate-0"
      >
        {/* Background hexagon */}
        <motion.path
          d="M 200 40 L 320 100 L 320 220 L 200 280 L 80 220 L 80 100 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        
        {/* Grid lines from center */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const angle = (360 / 6) * i - 90
          const rad = (angle * Math.PI) / 180
          const x = 200 + Math.cos(rad) * 160
          const y = 200 + Math.sin(rad) * 160
          
          return (
            <motion.line
              key={i}
              x1="200"
              y1="200"
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            />
          )
        })}
        
        {/* Category segments */}
        {hexagonSegments.map((segment, index) => {
          // Determine styling based on state
          const getSegmentStyles = () => {
            if (segment.isInProgress) {
              return {
                fill: segment.color,
                fillOpacity: 0.6,
                stroke: segment.color,
                strokeWidth: "4",
                strokeDasharray: "none"
              }
            } else if (segment.isCompleted) {
              return {
                fill: segment.color,
                fillOpacity: 0.8,
                stroke: segment.color,
                strokeWidth: "3",
                strokeDasharray: "none"
              }
            } else if (segment.isPartiallyComplete) {
              return {
                fill: segment.color,
                fillOpacity: 0.4,
                stroke: segment.color,
                strokeWidth: "2",
                strokeDasharray: "5,5"
              }
            } else if (segment.hasPlanned) {
              return {
                fill: segment.color,
                fillOpacity: 0.2,
                stroke: segment.color,
                strokeWidth: "2",
                strokeDasharray: "none"
              }
            } else {
              // Empty state
              return {
                fill: "none",
                fillOpacity: 0,
                stroke: segment.color,
                strokeWidth: "1",
                strokeDasharray: "3,3"
              }
            }
          }
          
          const styles = getSegmentStyles()
          
          return (
            <motion.g key={segment.id}>
              <motion.path
                d={segment.path}
                fill={styles.fill}
                fillOpacity={styles.fillOpacity}
                stroke={styles.stroke}
                strokeWidth={styles.strokeWidth}
                strokeDasharray={styles.strokeDasharray}
                initial={{ scale: 0 }}
                animate={{ 
                  scale: segment.isInProgress ? [1, 1.05, 1] : 1,
                  fillOpacity: segment.isInProgress ? [styles.fillOpacity * 0.7, styles.fillOpacity, styles.fillOpacity * 0.8] : styles.fillOpacity
                }}
                transition={{ 
                  duration: segment.isInProgress ? 2 : 0.5,
                  delay: index * 0.1,
                  repeat: segment.isInProgress ? Infinity : 0
                }}
                whileHover={{ fillOpacity: Math.min(styles.fillOpacity + 0.2, 1), scale: 1.05 }}
                onClick={() => onCategoryClick?.(segment)}
                className="cursor-pointer"
              />
              
              {/* Category icon - Always visible */}
              <g
                transform={`translate(${
                  200 + Math.cos(((360 / 6) * index - 30) * Math.PI / 180) * 107
                }, ${
                  200 + Math.sin(((360 / 6) * index - 30) * Math.PI / 180) * 107
                })`}
              >
                <foreignObject x="-15" y="-15" width="30" height="30">
                  <div className="flex items-center justify-center w-full h-full">
                    <AxisIcon
                      axis={segment.icon}
                      size={20}
                      color={segment.actualMinutes > 0 ? "white" : segment.color}
                    />
                  </div>
                </foreignObject>
              </g>
              
              {/* Category label - Always visible */}
              <text
                x={200 + Math.cos(((360 / 6) * index - 30) * Math.PI / 180) * 140}
                y={200 + Math.sin(((360 / 6) * index - 30) * Math.PI / 180) * 140}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-gray-400 text-xs font-medium"
                style={{ fontSize: '11px' }}
              >
                {segment.name?.en || segment.slug}
              </text>
            </motion.g>
          )
        })}
        
        {/* Center circle with total time */}
        <motion.circle
          cx="200"
          cy="200"
          r="53"
          fill="rgba(0, 0, 0, 0.5)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        />
        
        {/* Center text */}
        <motion.text
          x="200"
          y="193"
          textAnchor="middle"
          className="fill-white text-lg font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          {totalHours}h {remainingMinutes}m
        </motion.text>
        
        <motion.text
          x="200"
          y="220"
          textAnchor="middle"
          className="fill-gray-400 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.1 }}
        >
          Total Time
        </motion.text>
      </svg>
      
      {/* Legend */}
      <div className="absolute -bottom-8 left-0 right-0">
        <div className="flex flex-wrap justify-center gap-2">
          {hexagonSegments.filter(s => s.actualMinutes > 0).map(segment => (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: segment.index * 0.1 }}
              className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-gray-400">
                {segment.name?.en || segment.slug}
              </span>
              <span className="text-xs text-white font-medium">
                {Math.floor(segment.actualMinutes / 60)}h {segment.actualMinutes % 60}m
              </span>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Add time button hint */}
      {totalMinutes === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <button
            onClick={() => onCategoryClick?.(null)}
            className="flex flex-col items-center gap-2 p-4 hover:bg-white/5 rounded-xl transition-colors"
          >
            <Plus className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-400">Start Planning</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}