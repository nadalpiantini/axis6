'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import Header from '@/components/layout/Header'
import CompactDashboard from '@/components/ui/CompactDashboard'
import FloatingNav from '@/components/ui/FloatingNav'
import MoodSelector from '@/components/ui/MoodSelector'
import DailyMantra from '@/components/axis/DailyMantra'
import { useStreaks } from '@/lib/hooks/useStreaks'

interface Category {
  id: number
  slug: string
  name: { es?: string; en?: string } | string
  description: { es?: string; en?: string } | string
  color: string
  icon: string
  position: number
  isCompleted?: boolean
}

// Daily motivational quotes
const dailyQuotes = [
  { text: "El equilibrio no es algo que encuentras, es algo que creas", author: "Jana Kingsford" },
  { text: "Cuida tu cuerpo. Es el único lugar que tienes para vivir", author: "Jim Rohn" },
  { text: "La paz viene de adentro. No la busques afuera", author: "Buddha" },
  { text: "Tu mejor inversión eres tú mismo", author: "Warren Buffett" },
  { text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día", author: "Robert Collier" },
]

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [completedToday, setCompletedToday] = useState<Set<number>>(new Set())
  const [selectedMood, setSelectedMood] = useState<string>('')
  const [showMoodModal, setShowMoodModal] = useState(false)
  const [dailyQuote, setDailyQuote] = useState(dailyQuotes[0])
  const router = useRouter()
  const supabase = createClient()
  const { streaks, loading: streaksLoading, refreshStreaks } = useStreaks(user?.id)

  useEffect(() => {
    checkUser()
    loadCategories()
    loadTodayCheckins()
    // Select random daily quote
    const randomQuote = dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)]
    setDailyQuote(randomQuote)
    // Show mood selector on first load
    const hasSelectedMood = localStorage.getItem('mood_selected_today')
    const today = new Date().toDateString()
    if (hasSelectedMood !== today) {
      setShowMoodModal(true)
    }
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
  }

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('axis6_categories')
      .select('*')
      .order('position')

    if (data) {
      setCategories(data)
    }
    setLoading(false)
  }

  const loadTodayCheckins = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('axis6_checkins')
      .select('category_id')
      .eq('user_id', user.id)
      .eq('completed_at', today)

    if (data) {
      setCompletedToday(new Set(data.map(d => d.category_id)))
    }
  }

  const toggleCategory = async (categoryId: number) => {
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const isCompleted = completedToday.has(categoryId)

    if (isCompleted) {
      // Eliminar check-in
      const { error } = await supabase
        .from('axis6_checkins')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .eq('completed_at', today)

      if (!error) {
        const newSet = new Set(completedToday)
        newSet.delete(categoryId)
        setCompletedToday(newSet)
      }
    } else {
      // Crear check-in
      const { error } = await supabase
        .from('axis6_checkins')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          completed_at: today
        })

      if (!error) {
        setCompletedToday(new Set([...completedToday, categoryId]))
        // Trigger streak calculation
        await supabase.rpc('axis6_calculate_streak', {
          p_user_id: user.id,
          p_category_id: categoryId
        })
        // Refresh streaks
        refreshStreaks()
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getCompletionPercentage = () => {
    if (categories.length === 0) return 0
    return Math.round((completedToday.size / categories.length) * 100)
  }

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood)
    localStorage.setItem('mood_selected_today', new Date().toDateString())
    setTimeout(() => setShowMoodModal(false), 1500)
  }

  const handleQuickAdd = () => {
    setShowMoodModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bgPrimary via-marfil to-arena flex items-center justify-center">
        <div className="text-textPrimary font-serif">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bgPrimary via-marfil to-arena texture-noise">
      {/* Floating Header with Progress */}
      <Header 
        user={user} 
        onLogout={handleLogout} 
        completionPercentage={getCompletionPercentage()}
      />

      {/* Main Content - More Compact */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-20 md:pb-4">
        {/* Mood Selector Modal */}
        {showMoodModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-textPrimary/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowMoodModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="glass-premium rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <MoodSelector 
                selectedMood={selectedMood}
                onMoodSelect={handleMoodSelect}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Daily Mantra - New Ritualized System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <DailyMantra />
        </motion.div>

        {/* Daily Quote - Compact Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className="glass-premium rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-physical/20 to-emotional/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">✨</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-textPrimary/90 italic font-serif">
                  &ldquo;{dailyQuote.text}&rdquo;
                </p>
                <p className="text-xs text-textSecondary mt-1">— {dailyQuote.author}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Compact Dashboard Component */}
        <CompactDashboard
          categories={categories}
          completedToday={completedToday}
          onToggleCategory={toggleCategory}
          streaks={streaks}
          user={user}
        />

        {/* Achievement Notification */}
        {getCompletionPercentage() === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="glass-premium rounded-2xl px-6 py-3 text-center">
              <h3 className="text-sm font-serif font-bold text-textPrimary mb-1">¡Día Perfecto! 🎉</h3>
              <p className="text-xs text-textSecondary">
                Has mantenido el equilibrio perfecto hoy
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Floating Navigation */}
      <FloatingNav onQuickAdd={handleQuickAdd} />
    </div>
  )
}