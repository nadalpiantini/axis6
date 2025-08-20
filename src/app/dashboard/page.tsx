'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import HexagonChart from '@/components/axis/HexagonChart'
import StreakCounter from '@/components/axis/StreakCounter'
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

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [completedToday, setCompletedToday] = useState<Set<number>>(new Set())
  const router = useRouter()
  const supabase = createClient()
  const { streaks, loading: streaksLoading, refreshStreaks } = useStreaks(user?.id)

  useEffect(() => {
    checkUser()
    loadCategories()
    loadTodayCheckins()
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

  const getCategoryName = (name: any) => {
    if (typeof name === 'object') {
      return name.es || name.en || 'Sin nombre'
    }
    return name || 'Sin nombre'
  }

  const getHexagonData = () => {
    const categoryMap: Record<string, number> = {
      physical: 0,
      mental: 0,
      emotional: 0,
      social: 0,
      spiritual: 0,
      material: 0
    }

    categories.forEach(cat => {
      if (completedToday.has(cat.id)) {
        categoryMap[cat.slug] = 100
      }
    })

    return categoryMap
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-950 to-navy-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 to-navy-900">
      {/* Header */}
      <header className="bg-navy-900/50 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-physical to-spiritual bg-clip-text text-transparent">
                AXIS6
              </h1>
              <p className="text-gray-400 text-sm">Hola, {user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Today's Progress with Hexagon */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Progreso de Hoy</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Hexagon Chart */}
            <div className="flex justify-center">
              <HexagonChart 
                data={getHexagonData() as any}
                size={350}
                animate={true}
              />
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="bg-navy-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Estadísticas del Día</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Ejes Completados</span>
                    <span className="text-xl font-bold text-white">{completedToday.size}/{categories.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Progreso Total</span>
                    <span className="text-xl font-bold text-physical">{getCompletionPercentage()}%</span>
                  </div>
                </div>
              </div>

              {getCompletionPercentage() === 100 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-physical/20 to-spiritual/20 rounded-2xl border border-physical/30 p-4 text-center"
                >
                  <h3 className="text-lg font-bold text-white mb-1">¡Día Completo! 🎉</h3>
                  <p className="text-sm text-gray-300">
                    Has mantenido el equilibrio perfecto hoy
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Streaks Section */}
        <div className="mb-12">
          <StreakCounter streaks={streaks} loading={streaksLoading} />
        </div>

        {/* Categories Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-6">Check-in Diario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggleCategory(category.id)}
              className={`
                relative overflow-hidden rounded-2xl border cursor-pointer transition-all
                ${completedToday.has(category.id)
                  ? 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-600'
                  : 'bg-navy-900/50 border-white/10 hover:border-white/20'
                }
              `}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <span style={{ color: category.color }} className="text-2xl">
                      {category.icon === 'activity' && '💪'}
                      {category.icon === 'brain' && '🧠'}
                      {category.icon === 'heart' && '❤️'}
                      {category.icon === 'users' && '👥'}
                      {category.icon === 'sparkles' && '✨'}
                      {category.icon === 'briefcase' && '💼'}
                    </span>
                  </div>
                  <div className={`
                    w-6 h-6 rounded-full border-2 transition-all
                    ${completedToday.has(category.id)
                      ? 'bg-physical border-physical'
                      : 'border-gray-600'
                    }
                  `}>
                    {completedToday.has(category.id) && (
                      <svg className="w-full h-full text-navy-950" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {getCategoryName(category.name)}
                </h3>
                <p className="text-gray-400 text-sm">
                  {getCategoryName(category.description)}
                </p>
              </div>
              {completedToday.has(category.id) && (
                <div className="absolute inset-0 bg-gradient-to-t from-physical/20 to-transparent pointer-events-none" />
              )}
            </motion.div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}