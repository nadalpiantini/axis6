import { Trophy, Target, Calendar, TrendingUp } from 'lucide-react'
import { memo } from 'react'

interface DashboardStatsProps {
  completedToday: number
  totalCategories: number
  currentStreak: number
  longestStreak: number
  weeklyProgress: Array<{
    date: string
    completion_rate: number
    categories_completed: number
  }>
}

const StatCard = memo<{
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}>(({ icon, label, value, subtitle, trend }) => (
  <div className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
))

StatCard.displayName = 'StatCard'

export const DashboardStats = memo<DashboardStatsProps>(({ 
  completedToday, 
  totalCategories, 
  currentStreak, 
  longestStreak,
  weeklyProgress 
}) => {
  // Calculate completion rate
  const completionRate = totalCategories > 0 
    ? Math.round((completedToday / totalCategories) * 100) 
    : 0

  // Calculate weekly average
  const weeklyAvg = weeklyProgress.length > 0
    ? Math.round(weeklyProgress.reduce((sum, day) => sum + day.completion_rate, 0) / weeklyProgress.length)
    : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={<Target className="w-5 h-5 text-purple-400" />}
        label="Today's Progress"
        value={`${completionRate}%`}
        subtitle={`${completedToday}/${totalCategories} completed`}
        trend={completionRate > 50 ? 'up' : 'neutral'}
      />
      
      <StatCard
        icon={<Trophy className="w-5 h-5 text-orange-400" />}
        label="Current Streak"
        value={currentStreak}
        subtitle="days in a row"
        trend={currentStreak > 0 ? 'up' : 'neutral'}
      />
      
      <StatCard
        icon={<Calendar className="w-5 h-5 text-green-400" />}
        label="Best Streak"
        value={longestStreak}
        subtitle="personal record"
      />
      
      <StatCard
        icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
        label="Weekly Average"
        value={`${weeklyAvg}%`}
        subtitle="last 7 days"
        trend={weeklyAvg > completionRate ? 'up' : 'neutral'}
      />
    </div>
  )
})

DashboardStats.displayName = 'DashboardStats'