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
// AXIS6 Original First Design - Restored from first commit (moved outside component to prevent infinite loops)
const HEXAGON_CATEGORIES = [
  { key: 'physical', label: 'Física', color: '#65D39A', angle: 0 },
  { key: 'mental', label: 'Mental', color: '#9B8AE6', angle: 60 },
  { key: 'emotional', label: 'Emocional', color: '#FF8B7D', angle: 120 },
  { key: 'social', label: 'Social', color: '#6AA6FF', angle: 180 },
  { key: 'spiritual', label: 'Espiritual', color: '#4ECDC4', angle: 240 },
  { key: 'material', label: 'Material', color: '#FFD166', angle: 300 }
] as const
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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 640)
  // Get user data and resonance data
  const { data: user, isLoading: userLoading } = useUser()
  // Memoize the date to prevent unnecessary re-renders
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const { data: resonanceData, isLoading: resonanceLoading } = useHexagonResonance(
    user?.id || '',
    today
  )
  // Enhanced responsive size based on screen width and safe areas
  const responsiveSize = useMemo(() => {
    if (windowWidth < 375) return Math.min(windowWidth - 32, 260) // Small mobile
    if (windowWidth < 640) return Math.min(windowWidth - 40, 300) // Mobile
    if (windowWidth < 768) return Math.min(windowWidth - 64, 350) // Large mobile/small tablet
    if (windowWidth < 1024) return 380 // Tablet
    return size // Desktop
  }, [windowWidth, size])
  // Optimized: Calculate all related values in single useMemo to prevent circular dependencies
  const hexagonDimensions = useMemo(() => {
    const center = responsiveSize / 2
    const radius = responsiveSize * 0.38 // Slightly smaller for better mobile fit
    const labelDistance = windowWidth < 640 ? radius * 1.25 : radius * 1.3 // Closer labels on mobile
    const resonanceRadius = radius * 1.15 // Radius for resonance dots
    return { center, radius, labelDistance, resonanceRadius }
  }, [responsiveSize, windowWidth])
  // Calculate center percentage value
  const centerPercentage = useMemo(() =>
    Math.round(Object.values(data).reduce((acc, val) => acc + val, 0) / 6),
    [data]
  )
  useEffect(() => {
    setIsClient(true)
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  // Calculate hexagon points for the background (same as original)
  const hexagonPoints = useMemo(() =>
    HEXAGON_CATEGORIES.map((cat) => {
      const angleRad = (cat.angle * Math.PI) / 180
      const x = hexagonDimensions.center + hexagonDimensions.radius * Math.cos(angleRad)
      const y = hexagonDimensions.center + hexagonDimensions.radius * Math.sin(angleRad)
      return `${x},${y}`
    }).join(' '),
    [hexagonDimensions]
  )
  // Calculate data polygon points (same as original)
  const dataPoints = useMemo(() => {
    if (!data || typeof data !== 'object') return []
    return HEXAGON_CATEGORIES.map((cat) => {
      const value = (data[cat.key as keyof typeof data] || 0) / 100
      const angleRad = (cat.angle * Math.PI) / 180
      const x = hexagonDimensions.center + hexagonDimensions.radius * value * Math.cos(angleRad)
      const y = hexagonDimensions.center + hexagonDimensions.radius * value * Math.sin(angleRad)
      return { x, y, value }
    })
  }, [data, hexagonDimensions])
  const dataPolygonPoints = useMemo(() =>
    dataPoints.map(p => `${p.x},${p.y}`).join(' '),
    [dataPoints]
  )
  // Calculate resonance dots positions
  const resonancePoints = useMemo(() => {
    if (!showResonance || !resonanceData?.resonance || !Array.isArray(resonanceData.resonance)) return []
    try {
      return HEXAGON_CATEGORIES.map((cat, index) => {
        const resonanceInfo = resonanceData.resonance.find(r => r?.axisSlug === cat.key)
        if (!resonanceInfo || !resonanceInfo.hasResonance) return null
        const angleRad = (cat.angle * Math.PI) / 180
        const dotsCount = Math.min(resonanceInfo.resonanceCount || 0, 8) // Max 8 dots per axis
        const dots = []
        for (let i = 0; i < dotsCount; i++) {
          // Create spiral pattern around each axis point
          const dotAngle = angleRad + (i * Math.PI / 6) // Spread dots around axis
          const dotRadius = hexagonDimensions.resonanceRadius + (i % 2) * 15 // Alternating distances
          const x = hexagonDimensions.center + dotRadius * Math.cos(dotAngle)
          const y = hexagonDimensions.center + dotRadius * Math.sin(dotAngle)
          dots.push({
            x,
            y,
            color: cat.color,
            delay: i * 0.2,
            intensity: Math.min((resonanceInfo.resonanceCount || 0) / 5, 1) // Scale intensity
          })
        }
        return dots
      }).filter(Boolean).flat()
    } catch (error) {
      return []
    }
  }, [resonanceData, showResonance, hexagonDimensions])
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
        {/* Background circles/grid */}
        {gridLevels.map((level, idx) => (
          <polygon
            key={idx}
            points={HEXAGON_CATEGORIES.map((cat) => {
              const angleRad = (cat.angle * Math.PI) / 180
              const x = hexagonDimensions.center + hexagonDimensions.radius * level * Math.cos(angleRad)
              const y = hexagonDimensions.center + hexagonDimensions.radius * level * Math.sin(angleRad)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {HEXAGON_CATEGORIES.map((cat, idx) => (
          <line
            key={idx}
            x1={hexagonDimensions.center}
            y1={hexagonDimensions.center}
            x2={hexagonDimensions.center + hexagonDimensions.radius * Math.cos((cat.angle * Math.PI) / 180)}
            y2={hexagonDimensions.center + hexagonDimensions.radius * Math.sin((cat.angle * Math.PI) / 180)}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
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
        {/* Main hexagon outline */}
        <polygon
          points={hexagonPoints}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="2"
        />

        {/* Data polygon */}
        <motion.polygon
          points={dataPolygonPoints}
          fill="url(#gradient)"
          fillOpacity="0.3"
          stroke="url(#gradientStroke)"
          strokeWidth="2"
          initial={animate ? { scale: 0 } : { scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        {/* Data points */}
        {dataPoints.map((point, idx) => (
          <motion.circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={HEXAGON_CATEGORIES[idx]?.color || '#666'}
            stroke="white"
            strokeWidth="2"
            initial={animate ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 * idx, duration: 0.3 }}
            className="cursor-pointer"
          />
        ))}

        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#65D39A" />
            <stop offset="50%" stopColor="#9B8AE6" />
            <stop offset="100%" stopColor="#4ECDC4" />
          </linearGradient>
          <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#65D39A" />
            <stop offset="50%" stopColor="#9B8AE6" />
            <stop offset="100%" stopColor="#4ECDC4" />
          </linearGradient>
        </defs>
      </svg>
      {/* Labels */}
      {HEXAGON_CATEGORIES.map((cat, idx) => {
        const angleRad = (cat.angle * Math.PI) / 180
        const x = hexagonDimensions.center + hexagonDimensions.labelDistance * Math.cos(angleRad)
        const y = hexagonDimensions.center + hexagonDimensions.labelDistance * Math.sin(angleRad)
        const value = data[cat.key as keyof typeof data]
        // Get resonance info for balance whisper
        const resonanceInfo = resonanceData?.resonance?.find(r => r.axisSlug === cat.key)
        const whisperText = resonanceInfo?.hasResonance
          ? `${resonanceInfo.resonanceCount} others found balance in ${cat.label} today`
          : `Balance your ${cat.label} axis today`

        return (
          <motion.div
            key={idx}
            className="absolute flex flex-col items-center"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)'
            }}
            initial={animate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + 0.1 * idx }}
            title={whisperText}
          >
            <span 
              className="text-xs font-medium"
              style={{ color: cat.color }}
            >
              {cat.label}
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
            </span>
            <span className="text-xs text-gray-400">
              {value}%
            </span>
          </motion.div>
        )
      })}
      {/* Center score */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={animate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-3xl font-bold text-white">
          {Math.round(
            Object.values(data).reduce((acc, val) => acc + val, 0) / 6
          )}%
        </div>
        <div className="text-xs text-gray-400">
          Balance Total
          {/* Community indicator for resonance */}
          {resonanceData?.totalResonance && resonanceData.totalResonance > 0 && (
            <span className="ml-1 opacity-70">
              • {resonanceData.totalResonance} community
            </span>
          )}
        </div>
      </motion.div>
    </div>
  )
})
HexagonChartWithResonance.displayName = 'HexagonChartWithResonance'
export default HexagonChartWithResonance
