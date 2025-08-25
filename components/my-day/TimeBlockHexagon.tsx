'use client'

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
    const centerX = 150
    const centerY = 150
    const maxRadius = 120
    const radius = (percentage / 100) * maxRadius || 10
    
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
  
  // Map categories to hexagon segments
  const hexagonSegments = categories.map((category, index) => {
    const dist = distribution.find(d => d.category_id === category.id)
    const percentage = dist ? (dist.actual_minutes / Math.max(totalMinutes, 1)) * 100 : 0
    const isActive = activeTimer?.category_id === category.id
    
    return {
      ...category,
      index,
      percentage,
      actualMinutes: dist?.actual_minutes || 0,
      plannedMinutes: dist?.planned_minutes || 0,
      path: createHexagonPath(index, 6, percentage),
      isActive
    }
  })

  return (
    <div className="relative flex items-center justify-center">
      <svg 
        width="300" 
        height="300" 
        viewBox="0 0 300 300" 
        className="transform rotate-0"
      >
        {/* Background hexagon */}
        <motion.path
          d="M 150 30 L 240 75 L 240 165 L 150 210 L 60 165 L 60 75 Z"
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
          const x = 150 + Math.cos(rad) * 120
          const y = 150 + Math.sin(rad) * 120
          
          return (
            <motion.line
              key={i}
              x1="150"
              y1="150"
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
        {hexagonSegments.map((segment, index) => (
          <motion.g key={segment.id}>
            <motion.path
              d={segment.path}
              fill={segment.color}
              fillOpacity={segment.isActive ? 0.5 : 0.3}
              stroke={segment.color}
              strokeWidth={segment.isActive ? "3" : "2"}
              initial={{ scale: 0 }}
              animate={{ 
                scale: segment.isActive ? [1, 1.05, 1] : 1,
                fillOpacity: segment.isActive ? [0.3, 0.6, 0.5] : 0.3
              }}
              transition={{ 
                duration: segment.isActive ? 2 : 0.5,
                delay: index * 0.1,
                repeat: segment.isActive ? Infinity : 0
              }}
              whileHover={{ fillOpacity: 0.5, scale: 1.05 }}
              onClick={() => onCategoryClick?.(segment)}
              className="cursor-pointer"
            />
            
            {/* Category icon */}
            {segment.actualMinutes > 0 && (
              <g
                transform={`translate(${
                  150 + Math.cos(((360 / 6) * index - 30) * Math.PI / 180) * 80
                }, ${
                  150 + Math.sin(((360 / 6) * index - 30) * Math.PI / 180) * 80
                })`}
              >
                <foreignObject x="-15" y="-15" width="30" height="30">
                  <div className="flex items-center justify-center w-full h-full">
                    <AxisIcon
                      axis={segment.icon}
                      size={20}
                      color="white"
                    />
                  </div>
                </foreignObject>
              </g>
            )}
          </motion.g>
        ))}
        
        {/* Center circle with total time */}
        <motion.circle
          cx="150"
          cy="150"
          r="40"
          fill="rgba(0, 0, 0, 0.5)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        />
        
        {/* Center text */}
        <motion.text
          x="150"
          y="145"
          textAnchor="middle"
          className="fill-white text-lg font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          {totalHours}h {remainingMinutes}m
        </motion.text>
        
        <motion.text
          x="150"
          y="165"
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