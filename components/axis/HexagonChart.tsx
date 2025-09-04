'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

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

const categories = [
  { key: 'physical', label: 'Física', color: '#65D39A', angle: 0 },
  { key: 'mental', label: 'Mental', color: '#9B8AE6', angle: 60 },
  { key: 'emotional', label: 'Emocional', color: '#FF8B7D', angle: 120 },
  { key: 'social', label: 'Social', color: '#6AA6FF', angle: 180 },
  { key: 'spiritual', label: 'Espiritual', color: '#4ECDC4', angle: 240 },
  { key: 'material', label: 'Material', color: '#FFD166', angle: 300 }
]

export default function HexagonChart({ 
  data, 
  size = 300,
  animate = true 
}: HexagonChartProps) {
  const [isClient, setIsClient] = useState(false)
  const center = size / 2
  const radius = size * 0.4
  const labelDistance = radius * 1.3

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calculate hexagon points for the background
  const hexagonPoints = categories.map((cat) => {
    const angleRad = (cat.angle * Math.PI) / 180
    const x = center + radius * Math.cos(angleRad)
    const y = center + radius * Math.sin(angleRad)
    return `${x},${y}`
  }).join(' ')

  // Calculate data polygon points
  const dataPoints = categories.map((cat) => {
    const value = data[cat.key as keyof typeof data] / 100
    const angleRad = (cat.angle * Math.PI) / 180
    const x = center + radius * value * Math.cos(angleRad)
    const y = center + radius * value * Math.sin(angleRad)
    return { x, y, value }
  })

  const dataPolygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Create grid lines
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1]

  if (!isClient) {
    return (
      <div style={{ width: size, height: size }} className="bg-navy-900/20 rounded-full animate-pulse" />
    )
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform"
      >
        {/* Background circles/grid */}
        {gridLevels.map((level, idx) => (
          <polygon
            key={idx}
            points={categories.map((cat) => {
              const angleRad = (cat.angle * Math.PI) / 180
              const x = center + radius * level * Math.cos(angleRad)
              const y = center + radius * level * Math.sin(angleRad)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines */}
        {categories.map((cat, idx) => (
          <line
            key={idx}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos((cat.angle * Math.PI) / 180)}
            y2={center + radius * Math.sin((cat.angle * Math.PI) / 180)}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
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
            fill={categories[idx].color}
            stroke="white"
            strokeWidth="2"
            initial={animate ? { scale: 0 } : { scale: 1 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 * idx, duration: 0.3 }}
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
      {categories.map((cat, idx) => {
        const angleRad = (cat.angle * Math.PI) / 180
        const x = center + labelDistance * Math.cos(angleRad)
        const y = center + labelDistance * Math.sin(angleRad)
        const value = data[cat.key as keyof typeof data]

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
          >
            <span 
              className="text-xs font-medium"
              style={{ color: cat.color }}
            >
              {cat.label}
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
        <div className="text-xs text-gray-400">Balance Total</div>
      </motion.div>
    </div>
  )
}