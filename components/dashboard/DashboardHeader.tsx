import { Flame, Settings, LogOut, TrendingUp, Calendar, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { memo } from 'react'

import { AxisIcon } from '@/components/icons'

interface DashboardHeaderProps {
  currentStreak: number
  onLogout: () => void
}

export const DashboardHeader = memo<DashboardHeaderProps>(({
  currentStreak,
  onLogout
}) => {
  return (
    <header className="glass border-b border-white/10" role="banner">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AxisIcon axis="physical" size={32} className="text-purple-400" />
          <div>
            <h1 className="text-xl font-bold text-white">AXIS6</h1>
            <p className="text-sm text-gray-400">Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Current Streak Display */}
          {currentStreak > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 glass rounded-full">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-white">
                {currentStreak} day streak
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <Link
            href="/my-day"
            className="p-2 glass rounded-full hover:bg-white/20 transition-colors"
            aria-label="My Day"
          >
            <Calendar className="w-5 h-5 text-gray-300" />
          </Link>

          <Link
            href="/chat"
            className="p-2 glass rounded-full hover:bg-white/20 transition-colors relative"
            aria-label="Chat"
          >
            <MessageCircle className="w-5 h-5 text-gray-300" />
            {/* Optional: Add notification badge */}
            {/* <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span> */}
          </Link>

          <Link
            href="/dashboard/analytics"
            className="p-2 glass rounded-full hover:bg-white/20 transition-colors"
            aria-label="View analytics"
          >
            <TrendingUp className="w-5 h-5 text-gray-300" />
          </Link>

          <Link
            href="/settings"
            className="p-2 glass rounded-full hover:bg-white/20 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-300" />
          </Link>

          <button
            onClick={onLogout}
            className="p-2 glass rounded-full hover:bg-white/20 transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'
