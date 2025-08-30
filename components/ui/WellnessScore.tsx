'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Award, Zap, Target } from 'lucide-react'

interface WellnessScoreProps {
  score: number
  currentStreak: number
  longestStreak: number
  completedToday: number
  totalCategories: number
}

export default function WellnessScore({
  score,
  currentStreak,
  longestStreak,
  completedToday,
  totalCategories
}: WellnessScoreProps) {
  // Calculate wellness level
  const getWellnessLevel = () => {
    if (score >= 90) return { level: 'Excelente', color: '#86EFAC', emoji: '🌟' }
    if (score >= 70) return { level: 'Muy Bien', color: '#93C5FD', emoji: '💪' }
    if (score >= 50) return { level: 'Bien', color: '#C084FC', emoji: '👍' }
    if (score >= 30) return { level: 'Regular', color: '#FDE047', emoji: '💭' }
    return { level: 'Mejorable', color: '#FDA4AF', emoji: '🌱' }
  }

  const wellness = getWellnessLevel()

  // Calculate trend (simplified for demo)
  const trend = currentStreak > 0 ? 'up' : 'neutral'

  return (
    <div className="h-full flex flex-col">
      {/* Main Score Display */}
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative inline-block"
        >
          {/* Circular Progress Background */}
          <svg width="120" height="120" className="transform -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              cx="60"
              cy="60"
              r="54"
              stroke={wellness.color}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - score / 100)}`}
            />
          </svg>

          {/* Score Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl"
            >
              {wellness.emoji}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-2xl font-bold text-white"
            >
              {score}
            </motion.div>
          </div>
        </motion.div>

        {/* Wellness Level */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-3"
        >
          <span
            className="text-sm font-semibold px-3 py-1 rounded-full"
            style={{
              backgroundColor: `${wellness.color}20`,
              color: wellness.color
            }}
          >
            {wellness.level}
          </span>
        </motion.div>
      </div>

      {/* Quick Stats */}
      <div className="space-y-3 flex-1">
        {/* Daily Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(94, 234, 212, 0.2)' }}
          >
            <Target className="w-4 h-4" style={{ color: '#5EEAD4' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Hoy</p>
            <p className="text-sm font-semibold text-white">
              {completedToday}/{totalCategories} completados
            </p>
          </div>
        </motion.div>

        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(192, 132, 252, 0.2)' }}
          >
            <Zap className="w-4 h-4" style={{ color: '#C084FC' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Racha Actual</p>
            <p className="text-sm font-semibold text-white">
              {currentStreak} {currentStreak === 1 ? 'día' : 'días'}
            </p>
          </div>
          {trend === 'up' && (
            <TrendingUp className="w-3 h-3 text-green-400" />
          )}
        </motion.div>

        {/* Best Streak */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2 }}
          className="flex items-center gap-3"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(253, 164, 175, 0.2)' }}
          >
            <Award className="w-4 h-4" style={{ color: '#FDA4AF' }} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Mejor Racha</p>
            <p className="text-sm font-semibold text-white">
              {longestStreak} {longestStreak === 1 ? 'día' : 'días'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Motivational Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="mt-4 p-3 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10"
      >
        <p className="text-xs text-center text-gray-300">
          {score >= 90 && "¡Increíble! Mantén este ritmo 🚀"}
          {score >= 70 && score < 90 && "¡Vas muy bien! Sigue así 💪"}
          {score >= 50 && score < 70 && "Buen progreso, continúa 🌟"}
          {score >= 30 && score < 50 && "Cada paso cuenta 🌱"}
          {score < 30 && "¡Empieza pequeño, logra grande! 🌈"}
        </p>
      </motion.div>
    </div>
  )
}
