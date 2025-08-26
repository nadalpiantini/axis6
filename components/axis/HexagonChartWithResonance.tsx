'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useMemo, memo } from 'react'
import { useHexagonResonance } from '@/hooks/useHexagonResonance'
import { useUser } from '@/lib/react-query/hooks'

interface HexagonChartWithResonanceProps {
  data: {
    physical: number
    mental: number
    emotional: number
    social: number
    spiritual: number
    material: number
  }
  size?: number
  animate?: boolean
  showResonance?: boolean
  // Dashboard integration props
  onToggleAxis?: (id: string | number) => void
  isToggling?: boolean
  axes?: Array<{
    id: string | number
    name: string
    color: string
    icon: string
    completed: boolean
  }>
}

// THE RITUAL OS - Updated category system with brand colors (same as original)
const categories = [
  { 
    key: 'physical', 
    label: 'Living Movement', 
    shortLabel: 'Physical',
    color: '#D4845C', // Warm Terracotta
    softColor: '#F4E4DE',
    mantra: 'Today I inhabit my body with tenderness',
    angle: 0 
  },
  { 
    key: 'mental', 
    label: 'Inner Clarity', 
    shortLabel: 'Mental',
    color: '#8B9DC3', // Sage Blue
    softColor: '#E8EDF4',
    mantra: 'Today I make space to think less',
    angle: 60 
  },
  { 
    key: 'emotional', 
    label: 'Creative Expression', 
    shortLabel: 'Emotional',
    color: '#B8A4C9', // Light Lavender
    softColor: '#F0EAEF',
    mantra: 'Today I create not to show, but to free',
    angle: 120 
  },
  { 
    key: 'social', 
    label: 'Mirror Connection', 
    shortLabel: 'Social',
    color: '#A8C8B8', // Soft Sage Green
    softColor: '#E8F1EC',
    mantra: 'Today I connect without disappearing',
    angle: 180 
  },
  { 
    key: 'spiritual', 
    label: 'Elevated Presence', 
    shortLabel: 'Spiritual',
    color: '#7B6C8D', // Deep Lavender
    softColor: '#E9E4ED',
    mantra: 'Today I find myself beyond doing',
    angle: 240 
  },
  { 
    key: 'material', 
    label: 'Earthly Sustenance', 
    shortLabel: 'Material',
    color: '#C19A6B', // Golden Brown
    softColor: '#F1EBE4',
    mantra: 'Today I sustain myself, not prove myself',
    angle: 300 
  }
]

const HexagonChartWithResonance = memo(function HexagonChartWithResonance({ 
  data, 
  size = 300,
  animate = true,
  showResonance = true,
  onToggleAxis,
  isToggling = false,
  axes
}: HexagonChartWithResonanceProps) {
  const [isClient, setIsClient] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)
  
  // Get user data and resonance data
  const { data: user, isLoading: userLoading } = useUser()
  const { data: resonanceData, isLoading: resonanceLoading } = useHexagonResonance(
    user?.id || '', 
    new Date().toISOString().split('T')[0]
  )
  
  // Enhanced responsive size based on screen width and safe areas
  const responsiveSize = useMemo(() => {
    if (windowWidth < 375) return Math.min(windowWidth - 32, 260) // Small mobile
    if (windowWidth < 640) return Math.min(windowWidth - 40, 300) // Mobile
    if (windowWidth < 768) return Math.min(windowWidth - 64, 350) // Large mobile/small tablet
    if (windowWidth < 1024) return 380 // Tablet
    return size // Desktop
  }, [windowWidth, size])
  
  const center = responsiveSize / 2
  const radius = responsiveSize * 0.38 // Slightly smaller for better mobile fit
  const labelDistance = windowWidth < 640 ? radius * 1.25 : radius * 1.3 // Closer labels on mobile
  const resonanceRadius = radius * 1.15 // Radius for resonance dots

  useEffect(() => {
    setIsClient(true)
    setWindowWidth(window.innerWidth)
    
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate hexagon points for the background (same as original)
  const hexagonPoints = useMemo(() => 
    categories.map((cat) => {
      const angleRad = (cat.angle * Math.PI) / 180
      const x = center + radius * Math.cos(angleRad)
      const y = center + radius * Math.sin(angleRad)
      return `${x},${y}`
    }).join(' '),
    [center, radius]
  )

  // Calculate data polygon points (same as original)
  const dataPoints = useMemo(() => {
    if (!data || typeof data !== 'object') return []
    
    return categories.map((cat) => {
      const value = (data[cat.key as keyof typeof data] || 0) / 100
      const angleRad = (cat.angle * Math.PI) / 180
      const x = center + radius * value * Math.cos(angleRad)
      const y = center + radius * value * Math.sin(angleRad)
      return { x, y, value }
    })
  }, [data, center, radius])

  const dataPolygonPoints = useMemo(() => 
    dataPoints.map(p => `${p.x},${p.y}`).join(' '),
    [dataPoints]
  )

  // Calculate resonance dots positions
  const resonancePoints = useMemo(() => {
    if (!showResonance || !resonanceData?.resonance) return []
    
    return categories.map((cat, index) => {
      const resonanceInfo = resonanceData.resonance.find(r => r.axisSlug === cat.key)
      if (!resonanceInfo || !resonanceInfo.hasResonance) return null
      
      const angleRad = (cat.angle * Math.PI) / 180
      const dotsCount = Math.min(resonanceInfo.resonanceCount, 8) // Max 8 dots per axis
      const dots = []
      
      for (let i = 0; i < dotsCount; i++) {
        // Create spiral pattern around each axis point
        const dotAngle = angleRad + (i * Math.PI / 6) // Spread dots around axis
        const dotRadius = resonanceRadius + (i % 2) * 15 // Alternating distances
        const x = center + dotRadius * Math.cos(dotAngle)
        const y = center + dotRadius * Math.sin(dotAngle)
        
        dots.push({
          x,
          y,
          color: cat.color,
          delay: i * 0.2,
          intensity: Math.min(resonanceInfo.resonanceCount / 5, 1) // Scale intensity
        })
      }
      
      return dots
    }).filter(Boolean).flat()
  }, [resonanceData, showResonance, center, resonanceRadius])

  // Create grid lines (same as original)
  const gridLevels = useMemo(() => [0.2, 0.4, 0.6, 0.8, 1], [])

  if (!isClient || userLoading) {
    return (
      <div 
        className="w-full max-w-[260px] xs:max-w-[280px] sm:max-w-[350px] md:max-w-[400px] aspect-square bg-gradient-to-br from-gray-200/40 to-gray-300/40 rounded-2xl sm:rounded-3xl animate-pulse backdrop-blur-sm mx-auto" 
      />
    )
  }

  return (
    <div className="relative ritual-card concentric-organic w-full max-w-[260px] xs:max-w-[300px] sm:max-w-[350px] lg:max-w-[400px] mx-auto overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${responsiveSize} ${responsiveSize}`}
        className="transform relative z-10 w-full h-auto touch-manipulation"
        style={{ maxHeight: '100vw' }}
      >
        {/* THE RITUAL OS - Organic grid lines (same as original) */}
        {gridLevels.map((level, idx) => (
          <motion.polygon
            key={idx}
            points={categories.map((cat) => {
              const angleRad = (cat.angle * Math.PI) / 180
              const x = center + radius * level * Math.cos(angleRad)
              const y = center + radius * level * Math.sin(angleRad)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke={`rgba(${idx % 2 === 0 ? '212, 132, 92' : '168, 200, 184'}, ${0.15 - idx * 0.02})`}
            strokeWidth={idx === gridLevels.length - 1 ? "2" : "1"}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.8 }}
          />
        ))}

        {/* THE RITUAL OS - Flowing axis lines (same as original) */}
        {categories.map((cat, idx) => (
          <motion.line
            key={idx}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos((cat.angle * Math.PI) / 180)}
            y2={center + radius * Math.sin((cat.angle * Math.PI) / 180)}
            stroke={`${cat.color}40`}
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.3 + idx * 0.05, duration: 0.6 }}
          />
        ))}

        {/* RESONANCE DOTS - Enhanced for mobile visibility */}
        {showResonance && resonancePoints.map((dot, idx) => (
          <motion.circle
            key={`resonance-${idx}`}
            cx={dot.x}
            cy={dot.y}
            r={windowWidth < 640 ? "1.5" : "2"}
            fill={dot.color}
            opacity={0.6}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0.8, 1.2, 0.8],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: dot.delay,
              ease: "easeInOut"
            }}
            style={{
              filter: `drop-shadow(0 1px 3px ${dot.color}60)`
            }}
          />
        ))}

        {/* THE RITUAL OS - Organic hexagon outline (same as original) */}
        <motion.polygon
          points={hexagonPoints}
          fill="none"
          stroke="rgba(212, 132, 92, 0.3)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8, duration: 1.2 }}
        />

        {/* THE RITUAL OS - Organic data polygon (same as original) */}
        <motion.polygon
          points={dataPolygonPoints}
          fill="url(#ritualGradient)"
          fillOpacity="0.4"
          stroke="url(#ritualStroke)"
          strokeWidth="3"
          initial={animate ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: "easeOut",
            delay: 1
          }}
        />

        {/* THE RITUAL OS - Enhanced mobile data points */}
        {dataPoints.map((point, idx) => {
          const pointRadius = windowWidth < 640 ? "5" : "6"
          const strokeWidth = windowWidth < 640 ? "2" : "3"
          
          return (
            <motion.circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r={pointRadius}
              fill={categories[idx]?.color || '#666'}
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth={strokeWidth}
              initial={animate ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: 1
              }}
              transition={{ 
                delay: 1.2 + idx * 0.1, 
                duration: 0.8,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 3
              }}
              style={{
                filter: `drop-shadow(0 2px 8px ${categories[idx]?.color || '#666'}40)`
              }}
              className="cursor-pointer"
            />
          )
        })}

        {/* THE RITUAL OS - Organic gradient definitions (same as original) */}
        <defs>
          <linearGradient id="ritualGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4845C" stopOpacity="0.8" />
            <stop offset="25%" stopColor="#A8C8B8" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#7B6C8D" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#C19A6B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8B9DC3" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="ritualStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4845C" />
            <stop offset="33%" stopColor="#A8C8B8" />
            <stop offset="66%" stopColor="#7B6C8D" />
            <stop offset="100%" stopColor="#C19A6B" />
          </linearGradient>
        </defs>
      </svg>

      {/* THE RITUAL OS - Enhanced mobile labels with better touch targets */}
      {categories.map((cat, idx) => {
        const angleRad = (cat.angle * Math.PI) / 180
        const x = center + labelDistance * Math.cos(angleRad)
        const y = center + labelDistance * Math.sin(angleRad)
        const value = data[cat.key as keyof typeof data]
        
        // Get resonance info for balance whisper
        const resonanceInfo = resonanceData?.resonance?.find(r => r.axisSlug === cat.key)
        const whisperText = resonanceInfo?.hasResonance 
          ? `${resonanceInfo.resonanceCount} others found balance in ${cat.shortLabel} today`
          : cat.mantra

        // Enhanced mobile positioning to prevent overflow
        const isMobile = windowWidth < 640
        const edgeOffset = isMobile ? 10 : 5
        const adjustedX = Math.max(edgeOffset, Math.min(responsiveSize - edgeOffset, x))
        const adjustedY = Math.max(edgeOffset, Math.min(responsiveSize - edgeOffset, y))

        return (
          <motion.div
            key={idx}
            className="absolute flex flex-col items-center backdrop-blur-sm touch-manipulation"
            style={{
              left: adjustedX,
              top: adjustedY,
              transform: 'translate(-50%, -50%)',
              minHeight: isMobile ? '44px' : 'auto',
              minWidth: isMobile ? '44px' : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            initial={animate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 1.5 + 0.1 * idx,
              duration: 0.6,
              type: "spring",
              stiffness: 200
            }}
          >
            <motion.span 
              className="text-[9px] xs:text-[10px] sm:text-xs font-semibold px-1.5 xs:px-2 sm:px-2.5 py-1 xs:py-1.5 sm:py-2 rounded-full bg-white/85 border border-white/50 mb-1 sm:mb-1.5 cursor-pointer select-none"
              style={{ color: cat.color }}
              title={whisperText}
              whileHover={{ 
                scale: 1.1,
                boxShadow: `0 4px 12px ${cat.color}30`
              }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.shortLabel}
              {/* Subtle resonance indicator */}
              {resonanceInfo?.hasResonance && (
                <motion.span
                  className="ml-1 inline-block w-1 h-1 rounded-full"
                  style={{ backgroundColor: cat.color }}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.span>
            <span 
              className="text-[9px] xs:text-[10px] sm:text-xs text-gray-600/80 font-medium px-1.5 xs:px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/70 border border-white/30 tabular-nums"
            >
              {value}%
            </span>
          </motion.div>
        )
      })}

      {/* THE RITUAL OS - Enhanced mobile center score */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center touch-manipulation"
        initial={animate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div 
          className={`font-serif font-bold bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl px-2.5 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 shadow-lg border border-white/40 min-h-[44px] sm:min-h-auto flex items-center justify-center select-none ${
            windowWidth < 375 ? 'text-xl' :
            windowWidth < 640 ? 'text-2xl' : 
            windowWidth < 768 ? 'text-3xl' : 'text-4xl'
          }`}
          style={{ 
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(244,228,222,0.8) 100%)',
            color: '#A86847'
          }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {useMemo(() => 
            Math.round(Object.values(data).reduce((acc, val) => acc + val, 0) / 6),
            [data]
          )}%
        </motion.div>
        <motion.div 
          className={`text-gray-600/80 font-medium mt-1 sm:mt-2 px-2 xs:px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/70 border border-white/30 select-none ${
            windowWidth < 640 ? 'text-xs' : 'text-sm'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          Balance Ritual
          {/* Enhanced mobile community indicator */}
          {resonanceData?.totalResonance && resonanceData.totalResonance > 0 && (
            <span className={`ml-1 opacity-60 ${
              windowWidth < 640 ? 'text-xs' : 'text-xs'
            }`}>
              • {resonanceData.totalResonance} community
            </span>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
})

HexagonChartWithResonance.displayName = 'HexagonChartWithResonance'

export default HexagonChartWithResonance