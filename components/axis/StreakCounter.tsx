'use client'

import { motion } from 'framer-motion'
import { Flame, TrendingUp, Calendar } from 'lucide-react'

interface StreakData {
  category: string
  currentStreak: number
  longestStreak: number
  lastCheckin: string | null
  color: string
  icon: string
}

interface StreakCounterProps {
  streaks: StreakData[]
  loading?: boolean
}

export default function StreakCounter({ streaks, loading = false }: StreakCounterProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-navy-900/50 rounded-xl p-4 animate-pulse">
            <div className="h-20 bg-navy-800/50 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const getStreakStatus = (currentStreak: number) => {
    if (currentStreak === 0) return { label: 'Sin racha', emoji: '💤' }
    if (currentStreak < 3) return { label: 'Comenzando', emoji: '🌱' }
    if (currentStreak < 7) return { label: 'En progreso', emoji: '🔥' }
    if (currentStreak < 30) return { label: '¡Excelente!', emoji: '⚡' }
    if (currentStreak < 100) return { label: '¡Increíble!', emoji: '🌟' }
    return { label: '¡Legendario!', emoji: '👑' }
  }

  const getDaysAgo = (lastCheckin: string | null) => {
    if (!lastCheckin) return 'Nunca'
    const last = new Date(lastCheckin)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - last.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    return `Hace ${diffDays} días`
  }

  const getCategoryIcon = (icon: string) => {
    const icons: Record<string, string> = {
      'activity': '💪',
      'brain': '🧠',
      'heart': '❤️',
      'users': '👥',
      'sparkles': '✨',
      'briefcase': '💼'
    }
    return icons[icon] || '🎯'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Tus Rachas
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {streaks.map((streak, index) => {
          const status = getStreakStatus(streak.currentStreak)
          const isActive = streak.currentStreak > 0

          return (
            <motion.div
              key={streak.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative overflow-hidden rounded-xl border transition-all
                ${isActive
                  ? 'bg-navy-900/70 border-white/20 hover:border-white/30'
                  : 'bg-navy-950/50 border-white/10'
                }
              `}
            >
              {/* Streak Glow Effect */}
              {isActive && (
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `radial-gradient(circle at top right, ${streak.color}, transparent)`
                  }}
                />
              )}

              <div className="p-4 relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getCategoryIcon(streak.icon)}</span>
                    <span
                      className="font-semibold"
                      style={{ color: isActive ? streak.color : '#9CA3AF' }}
                    >
                      {streak.category}
                    </span>
                  </div>
                  <span className="text-lg">{status.emoji}</span>
                </div>

                {/* Current Streak */}
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Racha Actual</span>
                    <span className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {streak.currentStreak}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{status.label}</div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-navy-800/50 rounded-full overflow-hidden mb-3">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: streak.color,
                      width: `${Math.min((streak.currentStreak / streak.longestStreak) * 100, 100)}%`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((streak.currentStreak / streak.longestStreak) * 100, 100)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>Récord: {streak.longestStreak}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{getDaysAgo(streak.lastCheckin)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-physical/20 to-physical/5 rounded-xl p-4 text-center border border-physical/20"
        >
          <div className="text-2xl font-bold text-physical">
            {streaks.filter(s => s.currentStreak > 0).length}
          </div>
          <div className="text-xs text-gray-400">Rachas Activas</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-mental/20 to-mental/5 rounded-xl p-4 text-center border border-mental/20"
        >
          <div className="text-2xl font-bold text-mental">
            {Math.max(...streaks.map(s => s.currentStreak))}
          </div>
          <div className="text-xs text-gray-400">Racha Más Larga</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-spiritual/20 to-spiritual/5 rounded-xl p-4 text-center border border-spiritual/20"
        >
          <div className="text-2xl font-bold text-spiritual">
            {streaks.reduce((acc, s) => acc + s.currentStreak, 0)}
          </div>
          <div className="text-xs text-gray-400">Días Totales</div>
        </motion.div>
      </div>
    </div>
  )
}
