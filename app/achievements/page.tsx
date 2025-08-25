'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Trophy, Target, Star, Calendar, Flame, Award, Crown, Medal, Zap, TrendingUp } from 'lucide-react'

interface Streak {
  id: string
  category_id: string
  current_streak: number
  longest_streak: number
  axis6_categories: {
    name: { en: string }
    slug: string
    color: string
    icon: string
  }
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: JSX.Element
  category: 'streak' | 'completion' | 'milestone' | 'special'
  requirement: number
  current: number
  unlocked: boolean
  unlockedAt?: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

const rarityColors = {
  common: 'bg-gray-100 text-gray-800 border-gray-200',
  rare: 'bg-blue-100 text-blue-800 border-blue-200',
  epic: 'bg-purple-100 text-purple-800 border-purple-200',
  legendary: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export default function AchievementsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [totalDaysActive, setTotalDaysActive] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  async function fetchUserData() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('Error getting user:', userError)
        return
      }

      setUser(user)

      // Fetch streaks
      const { data: streaksData } = await supabase
        .from('axis6_streaks')
        .select(`
          *,
          axis6_categories (
            name,
            slug,
            color,
            icon
          )
        `)
        .eq('user_id', user.id)

      // Fetch total checkins
      const { count: checkinsCount } = await supabase
        .from('axis6_checkins')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Fetch unique active days
      const { data: uniqueDays } = await supabase
        .from('axis6_checkins')
        .select('completed_at')
        .eq('user_id', user.id)

      const uniqueDaysCount = new Set(uniqueDays?.map(d => d.completed_at) || []).size

      setStreaks(streaksData || [])
      setTotalCheckins(checkinsCount || 0)
      setTotalDaysActive(uniqueDaysCount)

      // Generate achievements based on data
      generateAchievements(streaksData || [], checkinsCount || 0, uniqueDaysCount)

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  function generateAchievements(streaksData: Streak[], checkins: number, activeDays: number) {
    const maxStreak = Math.max(...streaksData.map(s => s.longest_streak), 0)
    const currentStreakSum = streaksData.reduce((sum, s) => sum + s.current_streak, 0)
    const activeStreaks = streaksData.filter(s => s.current_streak > 0).length

    const achievementsList: Achievement[] = [
      // Streak Achievements
      {
        id: 'first-streak',
        title: 'Primera Racha',
        description: 'Completa tu primera racha de 1 día',
        icon: <Flame className="h-5 w-5" />,
        category: 'streak',
        requirement: 1,
        current: maxStreak,
        unlocked: maxStreak >= 1,
        rarity: 'common'
      },
      {
        id: 'week-warrior',
        title: 'Guerrero Semanal',
        description: 'Mantén una racha de 7 días',
        icon: <Target className="h-5 w-5" />,
        category: 'streak',
        requirement: 7,
        current: maxStreak,
        unlocked: maxStreak >= 7,
        rarity: 'rare'
      },
      {
        id: 'monthly-master',
        title: 'Maestro Mensual',
        description: 'Mantén una racha de 30 días',
        icon: <Crown className="h-5 w-5" />,
        category: 'streak',
        requirement: 30,
        current: maxStreak,
        unlocked: maxStreak >= 30,
        rarity: 'epic'
      },
      {
        id: 'centurion',
        title: 'Centurión',
        description: 'Mantén una racha de 100 días',
        icon: <Medal className="h-5 w-5" />,
        category: 'streak',
        requirement: 100,
        current: maxStreak,
        unlocked: maxStreak >= 100,
        rarity: 'legendary'
      },

      // Completion Achievements
      {
        id: 'first-checkin',
        title: 'Primer Paso',
        description: 'Completa tu primer check-in',
        icon: <Star className="h-5 w-5" />,
        category: 'completion',
        requirement: 1,
        current: checkins,
        unlocked: checkins >= 1,
        rarity: 'common'
      },
      {
        id: 'dedicated',
        title: 'Dedicado',
        description: 'Completa 50 check-ins',
        icon: <Zap className="h-5 w-5" />,
        category: 'completion',
        requirement: 50,
        current: checkins,
        unlocked: checkins >= 50,
        rarity: 'rare'
      },
      {
        id: 'committed',
        title: 'Comprometido',
        description: 'Completa 200 check-ins',
        icon: <Trophy className="h-5 w-5" />,
        category: 'completion',
        requirement: 200,
        current: checkins,
        unlocked: checkins >= 200,
        rarity: 'epic'
      },
      {
        id: 'axis-master',
        title: 'Maestro del AXIS',
        description: 'Completa 500 check-ins',
        icon: <Award className="h-5 w-5" />,
        category: 'completion',
        requirement: 500,
        current: checkins,
        unlocked: checkins >= 500,
        rarity: 'legendary'
      },

      // Milestone Achievements
      {
        id: 'balanced-life',
        title: 'Vida Equilibrada',
        description: 'Mantén rachas activas en todas las categorías',
        icon: <Target className="h-5 w-5" />,
        category: 'milestone',
        requirement: 6,
        current: activeStreaks,
        unlocked: activeStreaks >= 6,
        rarity: 'epic'
      },
      {
        id: 'consistency-king',
        title: 'Rey de la Consistencia',
        description: 'Mantén rachas combinadas de 50+ días',
        icon: <Crown className="h-5 w-5" />,
        category: 'milestone',
        requirement: 50,
        current: currentStreakSum,
        unlocked: currentStreakSum >= 50,
        rarity: 'rare'
      },
      {
        id: 'active-month',
        title: 'Mes Activo',
        description: 'Mantente activo por 30 días diferentes',
        icon: <Calendar className="h-5 w-5" />,
        category: 'milestone',
        requirement: 30,
        current: activeDays,
        unlocked: activeDays >= 30,
        rarity: 'rare'
      },
      {
        id: 'perfectionist',
        title: 'Perfeccionista',
        description: 'Completa todas las categorías en un solo día',
        icon: <Star className="h-5 w-5" />,
        category: 'special',
        requirement: 1,
        current: 0, // Would need daily stats to calculate
        unlocked: false,
        rarity: 'epic'
      }
    ]

    // Add unlock dates for unlocked achievements
    const achievementsWithDates = achievementsList.map(achievement => ({
      ...achievement,
      unlockedAt: achievement.unlocked ? new Date().toISOString() : undefined
    }))

    setAchievements(achievementsWithDates)
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)
  const completionRate = Math.round((unlockedAchievements.length / achievements.length) * 100)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-bold">Logros</h1>
          </div>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Celebra tu progreso y descubre nuevos objetivos por alcanzar
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{unlockedAchievements.length}</p>
                <p className="text-sm text-slate-400">Logros Desbloqueados</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{completionRate}%</p>
                <p className="text-sm text-slate-400">Completado</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-white">{Math.max(...streaks.map(s => s.longest_streak), 0)}</p>
                <p className="text-sm text-slate-400">Racha Más Larga</p>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{totalCheckins}</p>
                <p className="text-sm text-slate-400">Total Check-ins</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Progreso General</h2>
            <span className="text-lg font-bold">{completionRate}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            {unlockedAchievements.length} de {achievements.length} logros desbloqueados
          </p>
        </Card>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-400" />
              Logros Desbloqueados
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlockedAchievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className="bg-gradient-to-br from-slate-800 to-slate-700 border-yellow-500/30 shadow-lg shadow-yellow-500/10"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
                          {achievement.icon}
                        </div>
                        <Badge className={`${rarityColors[achievement.rarity]} text-xs`}>
                          {achievement.rarity.toUpperCase()}
                        </Badge>
                      </div>
                      <Trophy className="h-5 w-5 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-slate-300 mb-3">
                      {achievement.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-400 font-medium">
                        ¡Completado!
                      </span>
                      <span className="text-xs text-slate-400">
                        {achievement.current}/{achievement.requirement}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-slate-400" />
              Por Desbloquear
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedAchievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className="bg-slate-800/30 border-slate-600 opacity-75 hover:opacity-90 transition-opacity"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700 rounded-lg text-slate-500">
                          {achievement.icon}
                        </div>
                        <Badge className={`${rarityColors[achievement.rarity]} text-xs opacity-60`}>
                          {achievement.rarity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3">
                      {achievement.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          Progreso
                        </span>
                        <span className="text-sm text-slate-400">
                          {achievement.current}/{achievement.requirement}
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-slate-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min((achievement.current / achievement.requirement) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No achievements yet */}
        {achievements.length === 0 && (
          <Card className="bg-slate-800/50 border-slate-700 p-12 text-center">
            <Trophy className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              ¡Comienza tu viaje!
            </h3>
            <p className="text-slate-500 mb-6">
              Completa tu primer check-in para comenzar a desbloquear logros
            </p>
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ir al Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}