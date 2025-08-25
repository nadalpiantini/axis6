'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useMemo, memo } from 'react'

interface HexagonChartProps {
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
}

// THE RITUAL OS - Updated category system with brand colors
const categories = [
  { 
    key: 'physical', 
    label: 'Movimiento Vivo', 
    shortLabel: 'Físico',
    color: '#D4845C', // Warm Terracotta
    softColor: '#F4E4DE',
    mantra: 'Hoy habito mi cuerpo con ternura',
    angle: 0 
  },
  { 
    key: 'mental', 
    label: 'Claridad Interna', 
    shortLabel: 'Mental',
    color: '#8B9DC3', // Sage Blue
    softColor: '#E8EDF4',
    mantra: 'Hoy hago espacio para pensar menos',
    angle: 60 
  },
  { 
    key: 'emotional', 
    label: 'Expresión Creadora', 
    shortLabel: 'Arte',
    color: '#B8A4C9', // Light Lavender
    softColor: '#F0EAEF',
    mantra: 'Hoy no creo para mostrar, creo para liberar',
    angle: 120 
  },
  { 
    key: 'social', 
    label: 'Vínculo Espejo', 
    shortLabel: 'Social',
    color: '#A8C8B8', // Soft Sage Green
    softColor: '#E8F1EC',
    mantra: 'Hoy me vinculo sin desaparecer',
    angle: 180 
  },
  { 
    key: 'spiritual', 
    label: 'Presencia Elevada', 
    shortLabel: 'Espiritual',
    color: '#7B6C8D', // Deep Lavender
    softColor: '#E9E4ED',
    mantra: 'Hoy me encuentro más allá del hacer',
    angle: 240 
  },
  { 
    key: 'material', 
    label: 'Sustento Terrenal', 
    shortLabel: 'Material',
    color: '#C19A6B', // Golden Brown
    softColor: '#F1EBE4',
    mantra: 'Hoy me sostengo, no me demuestro',
    angle: 300 
  }
]

const HexagonChart = memo(function HexagonChart({ 
  data, 
  size = 300,
  animate = true 
}: HexagonChartProps) {
  const [isClient, setIsClient] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)
  
  // Responsive size based on screen width
  const responsiveSize = useMemo(() => {
    if (windowWidth < 640) return Math.min(windowWidth - 48, 280) // Mobile
    if (windowWidth < 768) return 350 // Tablet
    return size // Desktop
  }, [windowWidth, size])
  
  const center = responsiveSize / 2
  const radius = responsiveSize * 0.4
  const labelDistance = radius * 1.3

  useEffect(() => {
    setIsClient(true)
    setWindowWidth(window.innerWidth)
    
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate hexagon points for the background
  const hexagonPoints = useMemo(() => 
    categories.map((cat) => {
      const angleRad = (cat.angle * Math.PI) / 180
      const x = center + radius * Math.cos(angleRad)
      const y = center + radius * Math.sin(angleRad)
      return `${x},${y}`
    }).join(' '),
    [center, radius]
  )

  // Calculate data polygon points
  const dataPoints = useMemo(() => 
    categories.map((cat) => {
      const value = data[cat.key as keyof typeof data] / 100
      const angleRad = (cat.angle * Math.PI) / 180
      const x = center + radius * value * Math.cos(angleRad)
      const y = center + radius * value * Math.sin(angleRad)
      return { x, y, value }
    }),
    [data, center, radius]
  )

  const dataPolygonPoints = useMemo(() => 
    dataPoints.map(p => `${p.x},${p.y}`).join(' '),
    [dataPoints]
  )

  // Create grid lines
  const gridLevels = useMemo(() => [0.2, 0.4, 0.6, 0.8, 1], [])

  if (!isClient) {
    return (
      <div 
        className="w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] aspect-square bg-gradient-to-br from-gray-200/40 to-gray-300/40 rounded-3xl animate-pulse backdrop-blur-sm mx-auto" 
      />
    )
  }

  return (
    <div className="relative ritual-card concentric-organic w-full max-w-[280px] sm:max-w-[350px] md:max-w-[400px] mx-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${responsiveSize} ${responsiveSize}`}
        className="transform relative z-10 w-full h-auto"
      >
        {/* THE RITUAL OS - Organic grid lines */}
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

        {/* THE RITUAL OS - Flowing axis lines */}
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

        {/* THE RITUAL OS - Organic hexagon outline */}
        <motion.polygon
          points={hexagonPoints}
          fill="none"
          stroke="rgba(212, 132, 92, 0.3)"
          strokeWidth="3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.8, duration: 1.2 }}
        />

        {/* THE RITUAL OS - Organic data polygon */}
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

        {/* THE RITUAL OS - Organic data points */}
        {dataPoints.map((point, idx) => (
          <motion.circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r="6"
            fill={categories[idx].color}
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="3"
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
              filter: `drop-shadow(0 2px 8px ${categories[idx].color}40)`
            }}
          />
        ))}

        {/* THE RITUAL OS - Organic gradient definitions */}
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

      {/* THE RITUAL OS - Organic labels */}
      {categories.map((cat, idx) => {
        const angleRad = (cat.angle * Math.PI) / 180
        const x = center + labelDistance * Math.cos(angleRad)
        const y = center + labelDistance * Math.sin(angleRad)
        const value = data[cat.key as keyof typeof data]

        return (
          <motion.div
            key={idx}
            className="absolute flex flex-col items-center backdrop-blur-sm"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)'
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
              className="text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-white/80 border border-white/40 mb-0.5 sm:mb-1"
              style={{ color: cat.color }}
              title={cat.mantra}
              whileHover={{ 
                scale: 1.1,
                boxShadow: `0 4px 12px ${cat.color}30`
              }}
            >
              {cat.shortLabel}
            </motion.span>
            <span 
              className="text-[10px] sm:text-xs text-gray-600/80 font-medium px-1 sm:px-1.5 py-0.5 rounded bg-white/60"
            >
              {value}%
            </span>
          </motion.div>
        )
      })}

      {/* THE RITUAL OS - Center ritual score */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={animate ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div 
          className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg border border-white/40"
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
          className="text-xs sm:text-sm text-gray-600/80 font-medium mt-1 sm:mt-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          Balance Ritual
        </motion.div>
      </motion.div>
    </div>
  )
})

HexagonChart.displayName = 'HexagonChart'

export default HexagonChart