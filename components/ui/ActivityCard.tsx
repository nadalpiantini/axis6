'use client'

import { motion } from 'framer-motion'
import { Clock, Zap, Target } from 'lucide-react'

interface ActivityCardProps {
  icon: string
  title: string
  suggestion: string
  color: string
  duration?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  onClick?: () => void
}

export default function ActivityCard({
  icon,
  title,
  suggestion,
  color,
  duration = '5 min',
  difficulty = 'easy',
  onClick
}: ActivityCardProps) {
  const getDifficultyIcon = () => {
    switch (difficulty) {
      case 'easy':
        return <Zap className="w-3 h-3" />
      case 'medium':
        return (
          <>
            <Zap className="w-3 h-3" />
            <Zap className="w-3 h-3" />
          </>
        )
      case 'hard':
        return (
          <>
            <Zap className="w-3 h-3" />
            <Zap className="w-3 h-3" />
            <Zap className="w-3 h-3" />
          </>
        )
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{
          background: `linear-gradient(135deg, ${color}40, transparent)`
        }}
      />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              backgroundColor: `${color}20`,
              boxShadow: `0 0 20px ${color}20`
            }}
          >
            <span>{icon}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Duration */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{duration}</span>
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-0.5" style={{ color }}>
              {getDifficultyIcon()}
            </div>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed">{suggestion}</p>

        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full transition-all"
          style={{
            backgroundColor: `${color}20`,
            color
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${color}30`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${color}20`
          }}
        >
          <Target className="w-3 h-3" />
          Empezar
        </motion.button>
      </div>

      {/* Hover effect line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: color }}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}
