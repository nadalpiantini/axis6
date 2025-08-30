'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Award, Calendar, Target } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subvalue?: string
  color: string
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ icon, label, value, subvalue, color, trend }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm border border-white/10 p-4"
    >
      {/* Background decoration */}
      <div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle at center, ${color}, transparent)`
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: `${color}20`,
              color
            }}
          >
            {icon}
          </div>

          {trend && (
            <div className={`
              text-xs px-2 py-1 rounded-full flex items-center gap-1
              ${trend === 'up' ? 'bg-green-500/20 text-green-400' : ''}
              ${trend === 'down' ? 'bg-red-500/20 text-red-400' : ''}
              ${trend === 'neutral' ? 'bg-gray-500/20 text-gray-400' : ''}
            `}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingUp className="w-3 h-3 rotate-180" />}
              {trend === 'neutral' && <span>—</span>}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subvalue && (
            <p className="text-xs text-gray-500 mt-1">{subvalue}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface QuickStatsProps {
  completedToday: number
  totalCategories: number
  currentStreak?: number
  longestStreak?: number
  weeklyProgress?: number
}

export default function QuickStats({
  completedToday,
  totalCategories,
  currentStreak = 0,
  longestStreak = 0,
  weeklyProgress = 0
}: QuickStatsProps) {
  const completionPercentage = Math.round((completedToday / totalCategories) * 100)

  const stats: StatCardProps[] = [
    {
      icon: <Target className="w-5 h-5" />,
      label: "Progreso de Hoy",
      value: `${completionPercentage}%`,
      subvalue: `${completedToday}/${totalCategories} ejes`,
      color: '#4ECCA3',
      trend: completionPercentage >= 80 ? 'up' : completionPercentage >= 50 ? 'neutral' : 'down'
    },
    {
      icon: <Award className="w-5 h-5" />,
      label: "Racha Actual",
      value: currentStreak,
      subvalue: currentStreak === 1 ? 'día' : 'días',
      color: '#A78BFA',
      trend: currentStreak > 0 ? 'up' : 'neutral'
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: "Mejor Racha",
      value: longestStreak,
      subvalue: longestStreak === 1 ? 'día' : 'días',
      color: '#60A5FA',
      trend: 'neutral'
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Progreso Semanal",
      value: `${weeklyProgress}%`,
      subvalue: "últimos 7 días",
      color: '#FBBF24',
      trend: weeklyProgress >= 70 ? 'up' : weeklyProgress >= 40 ? 'neutral' : 'down'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  )
}
