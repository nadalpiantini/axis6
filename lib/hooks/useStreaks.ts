import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface StreakData {
  category: string
  currentStreak: number
  longestStreak: number
  lastCheckin: string | null
  color: string
  icon: string
}

export function useStreaks(userId: string | undefined) {
  const [streaks, setStreaks] = useState<StreakData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchStreaks = async () => {
      await loadStreaks()
    }
    
    fetchStreaks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const loadStreaks = async () => {
    try {
      // First get all categories
      const { data: categories } = await supabase
        .from('axis6_categories')
        .select('*')
        .order('position')

      if (!categories) {
        setLoading(false)
        return
      }

      // Then get user's streaks
      const { data: userStreaks } = await supabase
        .from('axis6_streaks')
        .select('*')
        .eq('user_id', userId)

      // Map categories with their streak data
      const streakMap = new Map(
        userStreaks?.map(s => [s.category_id, s]) || []
      )

      const formattedStreaks: StreakData[] = categories.map(cat => {
        const streak = streakMap.get(cat.id)
        const name = typeof cat.name === 'object' 
          ? ((cat.name as Record<string, string>).es || (cat.name as Record<string, string>).en || cat.slug)
          : cat.name

        return {
          category: name,
          currentStreak: streak?.current_streak || 0,
          longestStreak: streak?.longest_streak || 0,
          lastCheckin: streak?.last_checkin || null,
          color: cat.color,
          icon: cat.icon
        }
      })

      setStreaks(formattedStreaks)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const refreshStreaks = async () => {
    setLoading(true)
    await loadStreaks()
  }

  return { streaks, loading, refreshStreaks }
}