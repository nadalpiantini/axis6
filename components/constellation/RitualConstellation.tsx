'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, memo } from 'react'
import { BalanceWhisper } from '@/components/ui/BalanceWhisper'
import { useConstellation } from '@/hooks/useConstellation'
import { getCategoryName } from '@/lib/utils/i18n'
interface RitualConstellationProps {
  date?: string
  size?: number
  showMetrics?: boolean
  className?: string
}
// Community constellation visualization - abstract representation of collective balance
const RitualConstellation = memo(function RitualConstellation({
  date,
  size = 400,
  showMetrics = true,
  className = ''
}: RitualConstellationProps) {
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null)
  const { data: constellationData, isLoading, error } = useConstellation(date)
  const constellation = constellationData?.constellation
  const center = size / 2
  // Memoize mood colors for different activity levels
  const moodColors = useMemo(() => ({
    quiet: { primary: '#E8EDF4', secondary: '#D4E6F1' },
    peaceful: { primary: '#E9F7EF', secondary: '#D5F3E0' },
    active: { primary: '#FEF9E7', secondary: '#FCF3CF' },
    vibrant: { primary: '#FDEAA7', secondary: '#F9E79F' },
    energetic: { primary: '#FFE4E1', secondary: '#FFCCCB' }
  }), [])
  const currentMoodColors = constellation ? moodColors[constellation.metrics.mood] : moodColors.quiet
  // Memoize constellation points with scaled positions
  const scaledPoints = useMemo(() => {
    if (!constellation) return []
    const scale = size / constellation.visualHints.recommendedSize
    return constellation.points.map(point => ({
      ...point,
      scaledPosition: {
        x: point.position.x * scale,
        y: point.position.y * scale,
        angle: point.position.angle
      }
    }))
  }, [constellation, size])
  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-gray-100/60 to-gray-200/60 rounded-3xl ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-300/60 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Reading constellation...</p>
        </div>
      </div>
    )
  }
  if (error || !constellation) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-gray-100/40 to-gray-200/40 rounded-3xl ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-sm text-gray-400 text-center px-4">
          Constellation view unavailable
        </p>
      </div>
    )
  }
  return (
    <div className={`relative ${className}`}>
      {/* Main constellation visualization */}
      <div
        className="relative ritual-card concentric-organic overflow-hidden"
        style={{ width: size, height: size }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
        >
          {/* Background energy field */}
          <defs>
            <radialGradient id="constellationGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={currentMoodColors.primary} stopOpacity="0.8" />
              <stop offset="70%" stopColor={currentMoodColors.secondary} stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Energy field background */}
          <motion.circle
            cx={center}
            cy={center}
            r={center * 0.9}
            fill="url(#constellationGradient)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Connecting lines between active axes */}
          {scaledPoints
            .filter(point => point.completionCount > 0)
            .map((point, index, activePoints) => (
              activePoints.map((otherPoint, otherIndex) => {
                if (index >= otherIndex) return null
                return (
                  <motion.line
                    key={`connection-${point.axisSlug}-${otherPoint.axisSlug}`}
                    x1={point.scaledPosition.x}
                    y1={point.scaledPosition.y}
                    x2={otherPoint.scaledPosition.x}
                    y2={otherPoint.scaledPosition.y}
                    stroke="rgba(168, 200, 184, 0.3)"
                    strokeWidth="1"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{
                      delay: 0.5 + index * 0.1,
                      duration: 1,
                      ease: "easeInOut"
                    }}
                  />
                )
              }).filter(Boolean)
            ))}
          {/* Constellation points */}
          {scaledPoints.map((point, index) => {
            const isHovered = hoveredAxis === point.axisSlug
            const isActive = point.completionCount > 0
            const pointSize = isActive
              ? Math.min(8 + point.resonanceIntensity * 4, 16)
              : 4
            return (
              <motion.g key={point.axisSlug}>
                {/* Glow effect for active points */}
                {isActive && (
                  <motion.circle
                    cx={point.scaledPosition.x}
                    cy={point.scaledPosition.y}
                    r={pointSize * 2}
                    fill={point.color}
                    opacity={0.2}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.2
                    }}
                  />
                )}
                {/* Main constellation point */}
                <motion.circle
                  cx={point.scaledPosition.x}
                  cy={point.scaledPosition.y}
                  r={pointSize}
                  fill={isActive ? point.color : 'rgba(255, 255, 255, 0.6)'}
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  className="cursor-help"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: isHovered ? 1.3 : 1,
                    opacity: 1
                  }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    duration: 0.6,
                    type: "spring",
                    stiffness: 300
                  }}
                  onMouseEnter={() => setHoveredAxis(point.axisSlug)}
                  onMouseLeave={() => setHoveredAxis(null)}
                  style={{
                    filter: isActive
                      ? `drop-shadow(0 2px 8px ${point.color}40)`
                      : 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))'
                  }}
                />
                {/* Subtle axis label */}
                <motion.text
                  x={point.scaledPosition.x}
                  y={point.scaledPosition.y + pointSize + 16}
                  textAnchor="middle"
                  className="text-xs font-medium"
                  fill="#6B5B73"
                  opacity={isHovered ? 1 : 0.7}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0.7 }}
                  transition={{ duration: 0.3 }}
                >
                  {point.axisSlug}
                </motion.text>
              </motion.g>
            )
          })}
          {/* Central balance indicator */}
          <motion.circle
            cx={center}
            cy={center}
            r="6"
            fill="rgba(168, 132, 92, 0.8)"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: 1
            }}
            transition={{
              delay: 1.5,
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              filter: 'drop-shadow(0 2px 8px rgba(168, 132, 92, 0.4))'
            }}
          />
        </svg>
        {/* Constellation mood indicator */}
        <motion.div
          className="absolute bottom-4 left-4 flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: currentMoodColors.primary }}
          />
          <span className="text-xs font-medium text-gray-700 capitalize">
            {constellation.metrics.mood}
          </span>
        </motion.div>
      </div>
      {/* Community metrics panel */}
      <AnimatePresence>
        {showMetrics && (
          <motion.div
            className="mt-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 2.5, duration: 0.6 }}
          >
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Community Balance Today
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total completions:</span>
                <span className="font-medium text-gray-800">
                  {constellation.metrics.totalCompletions}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active axes:</span>
                <span className="font-medium text-gray-800">
                  {constellation.metrics.activeAxes}/6
                </span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-gray-600">Resonance intensity:</span>
                <span className="font-medium text-gray-800">
                  {Math.round(constellation.metrics.averageIntensity * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Tooltip for hovered axis */}
      <AnimatePresence>
        {hoveredAxis && (
          <motion.div
            className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-white/40"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {(() => {
              const point = scaledPoints.find(p => p.axisSlug === hoveredAxis)
              if (!point) return null
              return (
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: point.color }}>
                    {getCategoryName({ name: point.name }, 'en') || point.axisSlug}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {point.completionCount === 0
                      ? 'Awaiting balance'
                      : `${point.completionCount} completions today`
                    }
                  </p>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
RitualConstellation.displayName = 'RitualConstellation'
export default RitualConstellation
