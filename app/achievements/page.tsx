'use client'

import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Trophy,
  Star,
  Flame,
  Target,
  Calendar,
  Activity,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { StandardHeader } from '@/components/layout/StandardHeader'
import { LogoIcon } from '@/components/ui/Logo'
import { useUser, useStreaks, useTodayCheckins } from '@/lib/react-query/hooks/index'
import { createClient } from '@/lib/supabase/client'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: string
  unlocked: boolean
  unlockedAt?: string
  progress: number
  maxProgress: number
}

export default function AchievementsPage() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: streaks = [] } = useStreaks(user?.id || '')
  const { data: checkins = [] } = useTodayCheckins(user?.id || '')
  
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || userLoading) return

    const generateAchievements = () => {
      const currentStreak = streaks && Array.isArray(streaks) && streaks.length > 0 
        ? Math.max(...streaks.map(s => s?.current_streak || 0))
        : 0
        
      const longestStreak = streaks && Array.isArray(streaks) && streaks.length > 0
        ? Math.max(...streaks.map(s => s?.longest_streak || 0))
        : 0
        
      const totalCheckins = checkins && Array.isArray(checkins) ? checkins.length : 0

      const achievementsList: Achievement[] = [
        // Streak Achievements
        {
          id: 'first-streak',
          title: 'First Steps',
          description: 'Complete your first 3-day streak',
          icon: 'flame',
          category: 'streak',
          unlocked: currentStreak >= 3,
          progress: Math.min(currentStreak, 3),
          maxProgress: 3
        },
        {
          id: 'week-warrior',
          title: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: 'flame',
          category: 'streak',
          unlocked: currentStreak >= 7,
          progress: Math.min(currentStreak, 7),
          maxProgress: 7
        },
        {
          id: 'month-master',
          title: 'Month Master',
          description: 'Achieve a 30-day streak',
          icon: 'flame',
          category: 'streak',
          unlocked: longestStreak >= 30,
          progress: Math.min(longestStreak, 30),
          maxProgress: 30
        },
        // Check-in Achievements
        {
          id: 'first-checkin',
          title: 'Getting Started',
          description: 'Complete your first check-in',
          icon: 'activity',
          category: 'checkin',
          unlocked: totalCheckins >= 1,
          progress: Math.min(totalCheckins, 1),
          maxProgress: 1
        },
        {
          id: 'checkin-10',
          title: 'Consistent',
          description: 'Complete 10 check-ins',
          icon: 'activity',
          category: 'checkin',
          unlocked: totalCheckins >= 10,
          progress: Math.min(totalCheckins, 10),
          maxProgress: 10
        },
        {
          id: 'checkin-50',
          title: 'Dedicated',
          description: 'Complete 50 check-ins',
          icon: 'activity',
          category: 'checkin',
          unlocked: totalCheckins >= 50,
          progress: Math.min(totalCheckins, 50),
          maxProgress: 50
        }
      ]

      setAchievements(achievementsList)
      setLoading(false)
    }

    generateAchievements()
  }, [user, userLoading, streaks, checkins])

  // Handle loading state
  if (userLoading || loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading achievements...</p>
        </div>
      </div>
    )
  }

  // Only redirect after all loading is complete and we know there's no user
  if (!user) {
    // Use setTimeout to avoid navigation during render
    setTimeout(() => {
      router.push('/auth/login')
    }, 0)
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)
  const completionRate = achievements.length > 0 ? Math.round((unlockedAchievements.length / achievements.length) * 100) : 0

  return (
    <div data-testid="achievements-page" className="min-h-screen text-white">
      {/* Header */}
      <StandardHeader
        user={user}
        variant="default"
        title="Logros"
        subtitle="Tu progreso y reconocimientos"
        showBackButton={true}
        backUrl="/dashboard"
        currentStreak={streaks && Array.isArray(streaks) && streaks.length > 0 ? Math.max(...streaks.map(s => s?.current_streak || 0)) : 0}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 data-testid="achievements-title" className="text-3xl font-bold mb-2">Achievements</h1>
          <p className="text-gray-400">Track your progress and unlock rewards</p>
        </div>

        {/* Stats Overview */}
        <div data-testid="achievements-stats" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div data-testid="unlocked-count-card" className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <p data-testid="unlocked-count" className="text-2xl font-bold text-white">{unlockedAchievements.length}</p>
                <p className="text-sm text-gray-400">Unlocked Achievements</p>
              </div>
            </div>
          </div>

          <div data-testid="completion-rate-card" className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-purple-400" />
              <div>
                <p data-testid="completion-rate" className="text-2xl font-bold text-white">{completionRate}%</p>
                <p className="text-sm text-gray-400">Completion Rate</p>
              </div>
            </div>
          </div>

          <div data-testid="total-count-card" className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-8 h-8 text-blue-400" />
              <div>
                <p data-testid="total-count" className="text-2xl font-bold text-white">{achievements.length}</p>
                <p className="text-sm text-gray-400">Total Achievements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div data-testid="overall-progress" className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Overall Progress</h2>
            <span className="text-sm text-gray-400">
              {unlockedAchievements.length} of {achievements.length} achievements unlocked
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              data-testid="progress-bar"
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Achievements Grid */}
        <div data-testid="achievements-grid" className="space-y-6">
          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div data-testid="unlocked-achievements-section">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Unlocked Achievements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    data-testid="achievement-card"
                    data-achievement-status="unlocked"
                    data-achievement-category={achievement.category}
                    data-achievement-id={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-6 border border-green-500/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {achievement.icon === 'flame' && <Flame data-testid="achievement-icon" className="w-6 h-6 text-orange-400" />}
                      {achievement.icon === 'activity' && <Activity data-testid="achievement-icon" className="w-6 h-6 text-green-400" />}
                      <h3 data-testid="achievement-title" className="font-semibold text-white">{achievement.title}</h3>
                    </div>
                    <p data-testid="achievement-description" className="text-sm text-gray-300 mb-3">{achievement.description}</p>
                    <div data-testid="achievement-progress" className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <span className="text-xs text-green-400">✓</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <div data-testid="locked-achievements-section">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-gray-400" />
                Locked Achievements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lockedAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    data-testid="achievement-card"
                    data-achievement-status="locked"
                    data-achievement-category={achievement.category}
                    data-achievement-id={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-xl p-6 border border-gray-500/20 opacity-60"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {achievement.icon === 'flame' && <Flame data-testid="achievement-icon" className="w-6 h-6 text-gray-400" />}
                      {achievement.icon === 'activity' && <Activity data-testid="achievement-icon" className="w-6 h-6 text-gray-400" />}
                      <h3 data-testid="achievement-title" className="font-semibold text-gray-400">{achievement.title}</h3>
                    </div>
                    <p data-testid="achievement-description" className="text-sm text-gray-500 mb-3">{achievement.description}</p>
                    <div data-testid="achievement-progress" className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gray-500 h-2 rounded-full"
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No achievements yet */}
          {achievements.length === 0 && (
            <div data-testid="no-achievements" className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Achievements Yet</h3>
              <p className="text-gray-500 mb-6">
                Start completing your daily check-ins to unlock achievements!
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-semibold transition-colors"
              >
                <Activity className="w-4 h-4" />
                Start Check-ins
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
