'use client'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { AxisIcon } from '@/components/icons'
import { getLocalizedText } from '@/lib/utils/i18n'

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

// Soft pastel colors for the nodes
const PASTEL_COLORS = [
  '#A8E6CF', // mint green
  '#B8E0D2', // light blue
  '#FFB3BA', // peach
  '#E6B3D3', // lavender
  '#FFE5B4', // yellow
  '#FFB3D9'  // pink
]

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

  // Create hexagon with softly rounded corners
  const createRoundedHexagonPath = () => {
    const centerX = 200
    const centerY = 200
    const radius = 140
    const cornerRadius = 15 // Soft corner radius
    
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (360 / 6) * i - 90 // Start from top
      const rad = (angle * Math.PI) / 180
      const x = centerX + Math.cos(rad) * radius
      const y = centerY + Math.sin(rad) * radius
      points.push({ x, y })
    }
    
    // Create rounded hexagon path
    let path = `M ${points[0].x - cornerRadius} ${points[0].y}`
    for (let i = 0; i < 6; i++) {
      const current = points[i]
      const next = points[(i + 1) % 6]
      const angle = Math.atan2(next.y - current.y, next.x - current.x)
      
      const startX = current.x + Math.cos(angle) * cornerRadius
      const startY = current.y + Math.sin(angle) * cornerRadius
      const endX = next.x - Math.cos(angle) * cornerRadius
      const endY = next.y - Math.sin(angle) * cornerRadius
      
      path += ` L ${startX} ${startY}`
      path += ` Q ${current.x} ${current.y} ${endX} ${endY}`
    }
    path += ' Z'
    return path
  }

  // Calculate node positions
  const getNodePosition = (index: number) => {
    const angle = (360 / 6) * index - 90
    const rad = (angle * Math.PI) / 180
    const radius = 140
    return {
      x: 200 + Math.cos(rad) * radius,
      y: 200 + Math.sin(rad) * radius
    }
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="400"
        height="400"
        viewBox="0 0 400 400"
        className="transform rotate-0"
      >
        {/* Dark purple gradient background */}
        <defs>
          <linearGradient id="hexagonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D1B69" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#4C1D95" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.4" />
          </linearGradient>
          
          {/* Glow filter for nodes */}
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Ripple effect for nodes */}
          <filter id="rippleEffect">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background hexagon with gradient */}
        <motion.path
          d={createRoundedHexagonPath()}
          fill="url(#hexagonGradient)"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Subtle connecting lines */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const angle = (360 / 6) * i - 90
          const rad = (angle * Math.PI) / 180
          const x = 200 + Math.cos(rad) * 140
          const y = 200 + Math.sin(rad) * 140
          return (
            <motion.line
              key={i}
              x1="200"
              y1="200"
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="0.8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
            />
          )
        })}

        {/* Circular nodes with soft pastel colors */}
        {categories.map((category, index) => {
          const position = getNodePosition(index)
          const pastelColor = PASTEL_COLORS[index % PASTEL_COLORS.length]
          const dist = distribution.find(d => d.category_id === category.id)
          const actualMinutes = dist?.actual_minutes || 0
          const plannedMinutes = dist?.planned_minutes || 0
          const isActive = activeTimer?.category_id === category.id
          
          return (
            <motion.g key={category.id}>
              {/* Outer glow ring */}
              <motion.circle
                cx={position.x}
                cy={position.y}
                r="18"
                fill="none"
                stroke={pastelColor}
                strokeWidth="2"
                opacity="0.3"
                filter="url(#nodeGlow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              />
              
              {/* Main node circle */}
              <motion.circle
                cx={position.x}
                cy={position.y}
                r="12"
                fill={pastelColor}
                filter="url(#rippleEffect)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isActive ? [1, 1.2, 1] : 1,
                  opacity: 1
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  repeat: isActive ? Infinity : 0,
                  repeatType: "reverse"
                }}
                whileHover={{ scale: 1.1 }}
                onClick={() => onCategoryClick?.(category)}
                className="cursor-pointer"
              />
              
              {/* Inner concentric circle */}
              <motion.circle
                cx={position.x}
                cy={position.y}
                r="6"
                fill="rgba(255, 255, 255, 0.8)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
              />
              
              {/* Center dot */}
              <motion.circle
                cx={position.x}
                cy={position.y}
                r="2"
                fill={pastelColor}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
              />
              
              {/* Category icon */}
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.6 }}
              >
                <foreignObject 
                  x={position.x - 10} 
                  y={position.y - 10} 
                  width="20" 
                  height="20"
                >
                  <div className="flex items-center justify-center w-full h-full">
                    <AxisIcon
                      axis={category.icon}
                      size={16}
                      color={actualMinutes > 0 ? "#2D1B69" : "rgba(255, 255, 255, 0.8)"}
                    />
                  </div>
                </foreignObject>
              </motion.g>
              
              {/* Category label */}
              <motion.text
                x={position.x}
                y={position.y + 35}
                textAnchor="middle"
                className="fill-white text-xs font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.7 }}
              >
                                    {getLocalizedText(category.name, 'en', category.slug)}
              </motion.text>
              
              {/* Time indicator */}
              {(actualMinutes > 0 || plannedMinutes > 0) && (
                <motion.text
                  x={position.x}
                  y={position.y + 50}
                  textAnchor="middle"
                  className="fill-gray-300 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.8 }}
                >
                  {Math.floor(actualMinutes / 60)}h {actualMinutes % 60}m
                </motion.text>
              )}
            </motion.g>
          )
        })}

        {/* Center circle with total time */}
        <motion.circle
          cx="200"
          cy="200"
          r="45"
          fill="rgba(45, 27, 105, 0.8)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        />
        
        {/* Center text */}
        <motion.text
          x="200"
          y="195"
          textAnchor="middle"
          className="fill-white text-lg font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          {totalHours}h {remainingMinutes}m
        </motion.text>
        <motion.text
          x="200"
          y="215"
          textAnchor="middle"
          className="fill-gray-300 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          Total Time
        </motion.text>
      </svg>

      {/* Add time button hint */}
      {totalMinutes === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <button
            onClick={() => onCategoryClick?.(null)}
            className="flex flex-col items-center gap-3 p-6 hover:bg-white/5 rounded-2xl transition-all duration-300 hover:scale-105"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm text-gray-300 font-medium">Start Planning</span>
          </button>
        </motion.div>
      )}
    </div>
  )
}
