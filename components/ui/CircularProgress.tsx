'use client'

import { motion } from 'framer-motion'

interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  color?: string
  showPercentage?: boolean
}

export default function CircularProgress({
  value,
  size = 200,
  strokeWidth = 12,
  label,
  sublabel,
  color = '#4ECCA3',
  showPercentage = true
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
            filter: `drop-shadow(0 0 10px ${color}50)`
          }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        {showPercentage && (
          <div className="text-3xl font-bold text-white">
            {Math.round(value)}%
          </div>
        )}
        {label && (
          <div className="text-sm font-medium text-gray-300 mt-1">
            {label}
          </div>
        )}
        {sublabel && (
          <div className="text-xs text-gray-500">
            {sublabel}
          </div>
        )}
      </motion.div>

      {/* Decorative dots */}
      {value === 100 && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-${size / 2 + 10}px)`
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
            />
          ))}
        </>
      )}
    </div>
  )
}
