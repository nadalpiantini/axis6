'use client'

import { motion } from 'framer-motion'

interface HexagonData {
  physical: number
  mental: number
  emotional: number
  social: number
  spiritual: number
  material: number
}

interface MiniHexagonProps {
  data: HexagonData
  size?: number
  onCategoryClick?: (categoryId: number | null) => void
  selectedCategory?: number | null
}

const categoryColors = {
  physical: 'var(--physical)',
  mental: 'var(--mental)',
  emotional: 'var(--emotional)',
  social: 'var(--social)',
  spiritual: 'var(--spiritual)',
  material: 'var(--material)'
}

const categoryLabels = {
  physical: 'Physical',
  mental: 'Mental',
  emotional: 'Emotional',
  social: 'Social',
  spiritual: 'Spiritual',
  material: 'Material'
}

const categoryIds = {
  physical: 1,
  mental: 2,
  emotional: 3,
  social: 4,
  spiritual: 5,
  material: 6
}

export default function MiniHexagon({
  data,
  size = 200,
  onCategoryClick,
  selectedCategory
}: MiniHexagonProps) {
  const centerX = size / 2
  const centerY = size / 2
  const radius = size * 0.4

  // Create hexagon points
  const createHexagonPath = (scale: number = 1) => {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const x = centerX + radius * scale * Math.cos(angle)
      const y = centerY + radius * scale * Math.sin(angle)
      points.push(`${x},${y}`)
    }
    return `M ${points.join(' L ')} Z`
  }

  // Create data points for the filled area
  const createDataPath = () => {
    const categories = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'] as const
    const points: string[] = []

    categories.forEach((category, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const value = data[category] / 100
      const x = centerX + radius * value * Math.cos(angle)
      const y = centerY + radius * value * Math.sin(angle)
      points.push(`${x},${y}`)
    })

    return `M ${points.join(' L ')} Z`
  }

  // Create individual segments for interaction
  const createSegment = (index: number) => {
    const angle1 = (Math.PI / 3) * index - Math.PI / 2
    const angle2 = (Math.PI / 3) * (index + 1) - Math.PI / 2

    const x1 = centerX + radius * Math.cos(angle1)
    const y1 = centerY + radius * Math.sin(angle1)
    const x2 = centerX + radius * Math.cos(angle2)
    const y2 = centerY + radius * Math.sin(angle2)

    return `M ${centerX},${centerY} L ${x1},${y1} L ${x2},${y2} Z`
  }

  const categories = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'] as const

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform transition-transform duration-300"
      >
        {/* Background hexagon */}
        <path
          d={createHexagonPath()}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
        />

        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map((scale) => (
          <path
            key={scale}
            d={createHexagonPath(scale)}
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Radial lines */}
        {categories.map((_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 2
          const x = centerX + radius * Math.cos(angle)
          const y = centerY + radius * Math.sin(angle)
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          )
        })}

        {/* Interactive segments */}
        {categories.map((category, i) => {
          const categoryId = categoryIds[category]
          const isSelected = selectedCategory === categoryId
          const isCompleted = data[category] > 0

          return (
            <g key={category}>
              <path
                d={createSegment(i)}
                fill={isSelected ? `${categoryColors[category]}20` : 'transparent'}
                stroke={isSelected ? categoryColors[category] : 'transparent'}
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300"
                onClick={() => onCategoryClick?.(isSelected ? null : categoryId)}
              />
              {isCompleted && (
                <motion.circle
                  initial={{ r: 0 }}
                  animate={{ r: 4 }}
                  cx={centerX + radius * 0.9 * Math.cos((Math.PI / 3) * i - Math.PI / 2)}
                  cy={centerY + radius * 0.9 * Math.sin((Math.PI / 3) * i - Math.PI / 2)}
                  fill={categoryColors[category]}
                />
              )}
            </g>
          )
        })}

        {/* Data visualization */}
        <motion.path
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.3, scale: 1 }}
          d={createDataPath()}
          fill="url(#gradient)"
          className="pointer-events-none"
        />
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          d={createDataPath()}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
          className="pointer-events-none"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={categoryColors.physical} />
            <stop offset="20%" stopColor={categoryColors.mental} />
            <stop offset="40%" stopColor={categoryColors.emotional} />
            <stop offset="60%" stopColor={categoryColors.social} />
            <stop offset="80%" stopColor={categoryColors.spiritual} />
            <stop offset="100%" stopColor={categoryColors.material} />
          </linearGradient>
        </defs>
      </svg>

      {/* Category labels */}
      {categories.map((category, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        const labelRadius = radius + 20
        const x = centerX + labelRadius * Math.cos(angle)
        const y = centerY + labelRadius * Math.sin(angle)
        const isCompleted = data[category] > 0

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="absolute text-xs font-medium pointer-events-none"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              color: isCompleted ? categoryColors[category] : 'rgba(255, 255, 255, 0.4)'
            }}
          >
            {categoryLabels[category]}
          </motion.div>
        )
      })}

      {/* Center score */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {Math.round(
              Object.values(data).reduce((acc, val) => acc + val, 0) / 6
            )}%
          </div>
          <div className="text-xs text-gray-400">Balance</div>
        </div>
      </div>
    </div>
  )
}
