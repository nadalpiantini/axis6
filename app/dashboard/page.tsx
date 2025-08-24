'use client'

import { memo, useMemo, useCallback, lazy, Suspense } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Flame, Settings, LogOut, TrendingUp, Trophy } from 'lucide-react'

// React Query hooks
import { 
  useUser, 
  useCategories, 
  useTodayCheckins, 
  useToggleCheckIn, 
  useStreaks 
} from '@/lib/react-query/hooks'

// Realtime hooks
import { useRealtimeDashboard } from '@/lib/hooks/useRealtimeCheckins'

// Zustand stores
import { 
  useUIStore, 
  usePreferencesStore, 
  useCheckInStore 
} from '@/lib/stores/useAppStore'

// Components
import { AxisIcon } from '@/components/icons'
import { LogoIcon } from '@/components/ui/Logo'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import { QueryErrorBoundary } from '@/components/error/QueryErrorBoundary'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

// Lazy loaded components for better performance
const HexagonChart = lazy(() => import('@/components/axis/HexagonChart'))
const CategoryCard = lazy(() => import('@/components/axis/CategoryCard'))
const DailyMantra = lazy(() => import('@/components/axis/DailyMantra'))

// Memoized header component
const DashboardHeader = memo(({ 
  currentStreak, 
  onLogout 
}: { 
  currentStreak: number
  onLogout: () => void 
}) => {
  return (
    <header className="glass border-b border-white/10" role="banner">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LogoIcon size="md" className="w-10 h-10" />
          <div className="flex items-center gap-2 text-sm" data-testid="streak-counter">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-gray-300">Racha: {currentStreak} días</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4" data-testid="user-menu">
          <Link 
            href="/settings" 
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition"
            aria-label="Ir a configuración"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </Link>
          <button 
            onClick={onLogout} 
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition"
            aria-label="Cerrar sesión"
            type="button"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
})

DashboardHeader.displayName = 'DashboardHeader'

// Memoized hexagon visualization
const HexagonVisualization = memo(({ 
  axes, 
  onToggleAxis,
  isToggling 
}: {
  axes: Array<{
    id: number
    name: string
    color: string
    icon: string
    completed: boolean
  }>
  onToggleAxis: (id: number) => void
  isToggling: boolean
}) => {
  const showAnimations = usePreferencesStore(state => state.showAnimations)
  
  const createHexagonPath = useCallback((size: number, centerX: number, centerY: number) => {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const x = centerX + size * Math.cos(angle)
      const y = centerY + size * Math.sin(angle)
      points.push(`${x},${y}`)
    }
    return points.join(' ')
  }, [])

  const completionPercentage = useMemo(
    () => (axes.filter(a => a.completed).length / axes.length) * 100,
    [axes]
  )

  return (
    <div className="flex justify-center mb-8" data-testid="hexagon-chart">
      <svg width="300" height="300" viewBox="0 0 300 300" role="img" aria-label={`Progreso hexagonal: ${axes.filter(a => a.completed).length} de 6 ejes completados`}>
        {/* Background hexagon */}
        <polygon
          points={createHexagonPath(120, 150, 150)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        
        {/* Progress hexagon */}
        <AnimatePresence>
          {completionPercentage > 0 && (
            <motion.polygon
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: completionPercentage / 100, 
                opacity: 0.3 
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: showAnimations ? 0.5 : 0,
                ease: "easeInOut" 
              }}
              points={createHexagonPath(120, 150, 150)}
              fill="url(#gradient)"
              stroke="url(#gradient)"
              strokeWidth="2"
            />
          )}
        </AnimatePresence>
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B8AE6" />
            <stop offset="100%" stopColor="#FF8B7D" />
          </linearGradient>
        </defs>
        
        {/* Axis points */}
        {axes.map((axis, index) => {
          const angle = (Math.PI / 3) * index - Math.PI / 2
          const x = 150 + 120 * Math.cos(angle)
          const y = 150 + 120 * Math.sin(angle)
          
          return (
            <g key={axis.id}>
              <motion.circle
                cx={x}
                cy={y}
                r="25"
                fill={axis.completed ? axis.color : 'rgba(255,255,255,0.1)'}
                fillOpacity={axis.completed ? 0.8 : 1}
                className="cursor-pointer transition-all"
                onClick={() => !isToggling && onToggleAxis(axis.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                role="button"
                aria-label={`${axis.name}: ${axis.completed ? 'completado' : 'no completado'}`}
                data-testid={`category-${axis.name.toLowerCase()}`}
                data-category={axis.name.toLowerCase()}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggleAxis(axis.id)
                  }
                }}
              />
              <foreignObject 
                x={x - 12} 
                y={y - 12} 
                width="24" 
                height="24"
                pointerEvents="none"
              >
                <AxisIcon 
                  axis={axis.icon}
                  size={24}
                  color={axis.completed ? 'white' : '#9ca3af'}
                  custom
                  animated={showAnimations && axis.completed}
                />
              </foreignObject>
            </g>
          )
        })}
      </svg>
    </div>
  )
})

HexagonVisualization.displayName = 'HexagonVisualization'

// Memoized category card
const MemoizedCategoryCard = memo(({ 
  axis, 
  onToggle,
  isToggling 
}: {
  axis: {
    id: number
    name: string
    color: string
    icon: string
    completed: boolean
  }
  onToggle: () => void
  isToggling: boolean
}) => {
  const showAnimations = usePreferencesStore(state => state.showAnimations)
  
  return (
    <motion.button
      whileHover={showAnimations ? { scale: 1.02 } : undefined}
      whileTap={showAnimations ? { scale: 0.98 } : undefined}
      onClick={onToggle}
      disabled={isToggling}
      className={`p-4 rounded-xl transition-all min-h-[56px] ${
        axis.completed 
          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' 
          : 'bg-white/5 hover:bg-white/10 border-white/10'
      } border`}
      aria-pressed={axis.completed}
      data-testid={`category-card-${axis.name.toLowerCase()}`}
      data-checked={axis.completed}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${axis.completed ? 'bg-white/10' : 'bg-white/5'}`}>
          <AxisIcon 
            axis={axis.icon}
            size={20}
            color={axis.color}
            custom
            animated={showAnimations && axis.completed}
          />
        </div>
        <span className={`font-medium ${axis.completed ? 'text-white' : 'text-gray-300'}`}>
          {axis.name}
        </span>
      </div>
    </motion.button>
  )
})

MemoizedCategoryCard.displayName = 'MemoizedCategoryCard'

// Main Dashboard Component
export default function DashboardPageV2() {
  const router = useRouter()
  const { addNotification } = useUIStore()
  const { locale } = usePreferencesStore()
  
  // Fetch all data in parallel with React Query
  const { data: user, isLoading: userLoading } = useUser()
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: checkins = [], isLoading: checkinsLoading } = useTodayCheckins(user?.id)
  const { data: streaks = [], isLoading: streaksLoading } = useStreaks(user?.id)
  const toggleCheckIn = useToggleCheckIn(user?.id)
  
  // Enable realtime updates for this user
  useRealtimeDashboard(user?.id)

  // Calculate derived state with memoization
  const completedCategoryIds = useMemo(
    () => new Set(checkins.map(c => Number(c.category_id))),
    [checkins]
  )
  
  const axes = useMemo(
    () => categories.map(cat => ({
      id: cat.id,
      name: locale === 'es' ? (cat.name?.es || cat.name?.en || cat.slug) : (cat.name?.en || cat.name?.es || cat.slug),
      color: cat.color,
      icon: cat.icon,
      completed: completedCategoryIds.has(cat.id)
    })),
    [categories, completedCategoryIds, locale]
  )

  const currentStreak = useMemo(
    () => Math.max(...streaks.map(s => s.current_streak), 0),
    [streaks]
  )

  const longestStreak = useMemo(
    () => Math.max(...streaks.map(s => s.longest_streak), 0),
    [streaks]
  )

  // Handlers with useCallback for optimization
  const handleToggleAxis = useCallback((axisId: number) => {
    const axis = axes.find(a => a.id === axisId)
    if (axis) {
      toggleCheckIn.mutate(
        {
          categoryId: axisId,
          completed: !axis.completed
        },
        {
          onSuccess: () => {
            addNotification({
              type: 'success',
              message: axis.completed 
                ? `${axis.name} desmarcado` 
                : `¡${axis.name} completado!`
            })
          },
          onError: () => {
            addNotification({
              type: 'error',
              message: 'Error al actualizar. Intenta de nuevo.'
            })
          }
        }
      )
    }
  }, [axes, toggleCheckIn, addNotification])

  const handleLogout = useCallback(async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }, [router])

  // Show loading state
  if (userLoading || categoriesLoading) {
    return (
      <div className="min-h-screen text-white">
        <DashboardHeader currentStreak={0} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <SkeletonDashboard />
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login')
    return null
  }

  const completedCount = axes.filter(a => a.completed).length

  return (
    <QueryErrorBoundary>
      <div className="min-h-screen text-white">
        <DashboardHeader currentStreak={currentStreak} onLogout={handleLogout} />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Section */}
          <main className="mb-8" role="main">
            <h1 className="text-3xl font-bold mb-2">
              ¡Hola, {user.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-gray-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </main>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8" role="region" aria-label="Panel de control principal">
            {/* Hexagon Section */}
            <div className="lg:col-span-2">
              <div className="glass rounded-2xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Tu Progreso de Hoy</h3>
                  <span className="text-sm text-gray-400">
                    {completedCount}/6 completados
                  </span>
                </div>

                <HexagonVisualization 
                  axes={axes}
                  onToggleAxis={handleToggleAxis}
                  isToggling={toggleCheckIn.isPending}
                />

                {/* Axes List */}
                <div className="grid grid-cols-2 gap-4" data-testid="category-cards">
                  {axes.map((axis) => (
                    <MemoizedCategoryCard
                      key={axis.id}
                      axis={axis}
                      onToggle={() => handleToggleAxis(axis.id)}
                      isToggling={toggleCheckIn.isPending}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Racha actual</span>
                    <span className="text-xl font-bold text-orange-400">
                      {currentStreak} días
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Mejor racha</span>
                    <span className="text-xl font-bold text-purple-400">
                      {longestStreak} días
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Completado hoy</span>
                    <span className="text-xl font-bold">{completedCount}/6</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Link 
                  href="/analytics"
                  className="glass rounded-xl p-4 min-h-[56px] flex items-center justify-between hover:bg-white/5 transition"
                  aria-label="Ver análisis completo de tu progreso"
                >
                  <span>Ver Análisis Completo</span>
                  <TrendingUp className="w-5 h-5 text-purple-400" aria-hidden="true" />
                </Link>
                <Link 
                  href="/achievements"
                  className="glass rounded-xl p-4 min-h-[56px] flex items-center justify-between hover:bg-white/5 transition"
                  aria-label="Ver tus logros y reconocimientos"
                >
                  <span>Logros</span>
                  <Trophy className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryErrorBoundary>
  )
}