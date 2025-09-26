'use client'
import { format, addDays, subDays, isToday, parse, addMinutes } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Play,
  Plus,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Timer,
  Sparkles,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { ActivityTimer } from '@/components/my-day/ActivityTimer'
import { PlanMyDay } from '@/components/my-day/PlanMyDay'
import { TimeBlockScheduler } from '@/components/my-day/TimeBlockScheduler'
import { AxisActivityMenu } from '@/components/my-day/AxisActivityMenu'
import { LogoFull } from '@/components/ui/Logo'
import { AxisIcon } from '@/components/icons'
import { useUser } from '@/lib/react-query/hooks'
import { useDashboardSlice } from '@/lib/react-query/hooks/useDashboardDataOptimized'
import { useMyDayData, useTimeDistribution, useUpdateTimeBlock } from '@/lib/react-query/hooks/useMyDay'
import { getLocalizedText } from '@/lib/utils/i18n'


export default function MyDayPage() {
  const router = useRouter()
  const { data: authUser } = useUser()
  const categories = useDashboardSlice(authUser?.id, 'categories') || [] // Get categories from optimized hook
  const user = authUser // Keep user reference for compatibility
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showScheduler, setShowScheduler] = useState(false)
  const [showTimer, setShowTimer] = useState(false)
  const [showPlanMyDay, setShowPlanMyDay] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [activeTimer, setActiveTimer] = useState<any>(null)
  const [showAxisMenu, setShowAxisMenu] = useState(false)
  const [selectedAxis, setSelectedAxis] = useState<string>('')
  const [axisMenuPosition, setAxisMenuPosition] = useState({ x: 0, y: 0 })
  // Add mutation for drag updates
  const updateTimeBlock = useUpdateTimeBlock()
  // Fetch data for selected date
  const { data: myDayData, isLoading: loadingData, refetch: refetchData } = useMyDayData(
    user?.id || '',
    format(selectedDate, 'yyyy-MM-dd')
  )
  const { data: timeDistribution, refetch: refetchDistribution } = useTimeDistribution(
    user?.id || '',
    format(selectedDate, 'yyyy-MM-dd')
  )
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])
  const handleDateChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(prev => subDays(prev, 1))
    } else {
      setSelectedDate(prev => addDays(prev, 1))
    }
  }
  const handleAddTimeBlock = (category?: any) => {
    setSelectedCategory(category)
    setShowScheduler(true)
  }

  const handleAxisClick = (category: any, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    // Get button position for menu placement
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setAxisMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    })
    
    setSelectedAxis(category.slug)
    setShowAxisMenu(true)
  }
  const handleStartTimer = (category?: any) => {
    setSelectedCategory(category)
    setShowTimer(true)
  }
  const handleSchedulerClose = () => {
    setShowScheduler(false)
    setSelectedCategory(null)
    refetchData()
    refetchDistribution()
  }
  const handleTimerClose = () => {
    setShowTimer(false)
    setSelectedCategory(null)
    setActiveTimer(null)
    refetchData()
    refetchDistribution()
  }
  const handlePlanMyDayClose = () => {
    setShowPlanMyDay(false)
    refetchData()
    refetchDistribution()
  }

  const handleAxisMenuClose = () => {
    setShowAxisMenu(false)
    setSelectedAxis('')
    refetchData()
    refetchDistribution()
  }

  const totalPlannedMinutes = myDayData?.reduce((sum: number, block: any) =>
    sum + block.duration_minutes, 0) || 0
  const totalActualMinutes = timeDistribution?.reduce((sum: number, cat: any) =>
    sum + cat.actual_minutes, 0) || 0
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      {/* Header */}
      <StandardHeader
        user={user}
        variant="default"
        title="My Day"
        subtitle={format(selectedDate, 'EEEE, MMMM d, yyyy')}
        showBackButton={true}
        backUrl="/dashboard"
      />
      {/* Action Bar */}
      <div
        className="fixed left-0 right-0 z-20 glass-premium border-b border-white/10"
        style={{ top: 'calc(4rem + env(safe-area-inset-top, 0px))' }}
      >
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-end gap-1 sm:gap-2 lg:gap-4">
            <button
              onClick={() => setShowPlanMyDay(true)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 min-h-[44px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all touch-manipulation active:scale-95"
              data-testid="plan-my-day-btn"
              aria-label="Plan my day"
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm lg:text-base font-medium">Plan My Day</span>
            </button>
            <button
              onClick={handleStartTimer}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 min-h-[44px] bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors touch-manipulation active:scale-95"
              data-testid="start-timer-btn"
              aria-label="Start activity timer"
            >
              <Timer className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm lg:text-base font-medium">Start Timer</span>
            </button>
            <button
              onClick={() => handleAddTimeBlock()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 lg:px-4 py-2 min-h-[44px] bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors touch-manipulation active:scale-95"
              data-testid="add-time-block-btn"
              aria-label="Add time block"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline text-sm lg:text-base font-medium">Add Block</span>
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <main
        className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 lg:py-8"
        style={{ paddingTop: 'calc(8rem + env(safe-area-inset-top, 0px))' }}
      >
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Date Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between glass rounded-lg sm:rounded-xl p-3 sm:p-4"
          >
            <button
              onClick={() => handleDateChange('prev')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
              </h1>
              <p className="text-sm text-gray-400">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
            <button
              onClick={() => handleDateChange('next')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Planned</p>
            </div>
            <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
                {Math.floor(totalActualMinutes / 60)}h {totalActualMinutes % 60}m
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Completed</p>
            </div>
            <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-1">
                {myDayData?.length || 0}
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Blocks</p>
            </div>
            <div className="glass rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-1">
                {totalPlannedMinutes > 0
                  ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100)
                  : 0}%
              </div>
              <p className="text-xs sm:text-sm text-gray-400">Progress</p>
            </div>
          </motion.div>

          {/* Main Grid - 3 columnas optimizadas */}
          <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr_320px] gap-4 sm:gap-6 lg:gap-8">
            
            {/* COLUMNA IZQUIERDA - Timeline Schedule */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6"
            >
              <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                Schedule
              </h2>
              
              <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                {Array.from({ length: 18 }, (_, i) => i + 5).map(hour => {
                  const hourStr = hour.toString().padStart(2, '0')
                  const hourBlocks = myDayData?.filter((block: any) => 
                    block.start_time?.startsWith(hourStr + ':')
                  ) || []
                  
                  return (
                    <div key={hour} className="group hover:bg-white/5 rounded transition-colors">
                      <div className="flex items-center gap-2 p-1">
                        <span className="text-xs text-gray-500 w-14 text-right">
                          {hour <= 12 ? `${hour}:00` : `${hour - 12}:00`}
                          <span className="text-[10px] ml-1">
                            {hour < 12 ? 'AM' : 'PM'}
                          </span>
                        </span>
                        
                        <div className="flex-1 grid grid-cols-4 gap-0.5 h-8">
                          {[0, 15, 30, 45].map(min => {
                            const timeSlot = `${hourStr}:${min.toString().padStart(2, '0')}`
                            const activity = hourBlocks.find((b: any) => 
                              b.start_time === timeSlot
                            )
                            
                            // Calculate duration visual indicator
                            const duration = activity?.duration_minutes || 15
                            const heightPercent = Math.min((duration / 60) * 100, 100)
                            
                            return (
                              <div
                                key={min}
                                className={`
                                  relative border border-white/10 rounded-sm transition-all min-h-[32px] flex items-center
                                  ${activity ? 'cursor-pointer hover:shadow-lg' : 'cursor-pointer hover:bg-white/10'}
                                  ${activity ? 'shadow-sm' : ''}
                                `}
                                style={activity ? {
                                  backgroundColor: `${activity.category_color}40`,
                                  borderLeftWidth: '3px',
                                  borderLeftColor: activity.category_color,
                                  height: `${32 + (heightPercent / 100) * 16}px`
                                } : { height: '32px' }}
                                onClick={() => activity ? 
                                  handleAxisClick(categories.find(c => c.id === activity.category_id), { 
                                    target: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) } 
                                  } as any) : 
                                  handleAddTimeBlock()
                                }
                                title={activity ? 
                                  `${activity.category_name}: ${activity.activity_name} (${duration}min)` : 
                                  'Click to schedule'
                                }
                              >
                                {activity && (
                                  <div className="absolute inset-0 p-0.5 flex flex-col justify-center">
                                    <div className="text-[8px] font-medium text-white/90 truncate leading-tight">
                                      {activity.activity_name.substring(0, 8)}
                                    </div>
                                    {duration > 15 && (
                                      <div className="text-[7px] text-white/70">
                                        {duration}m
                                      </div>
                                    )}
                                  </div>
                                )}
                                {!activity && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Footer info */}
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-[10px] text-gray-500">
                <span>Each block = 15 min</span>
                <span>{myDayData?.length || 0} activities</span>
              </div>
            </motion.div>

            {/* COLUMNA CENTRO - Hexagon Balance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 flex flex-col items-center justify-center text-white"
            >
              <h2 className="text-sm sm:text-base lg:text-xl font-semibold text-white mb-4 text-center">
                Balance Overview
              </h2>
              
              {/* Hexágono con líneas de progreso (estilo HexagonChart) */}
              <div className="relative">
                <svg 
                  className="w-full h-auto max-w-[350px]" 
                  viewBox="0 0 400 400"
                >
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#65D39A" />
                      <stop offset="33%" stopColor="#9B8AE6" />
                      <stop offset="66%" stopColor="#4ECDC4" />
                      <stop offset="100%" stopColor="#FF8B7D" />
                    </linearGradient>
                    <linearGradient id="hexGradientStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#65D39A" stopOpacity="0.8" />
                      <stop offset="33%" stopColor="#9B8AE6" stopOpacity="0.8" />
                      <stop offset="66%" stopColor="#4ECDC4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#FF8B7D" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines (concentric hexagons) */}
                  {[0.2, 0.4, 0.6, 0.8, 1].map((level, idx) => {
                    const categoryOrder = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material']
                    const angles = [0, 60, 120, 180, 240, 300]
                    const radius = 130 * level
                    const points = categoryOrder.map((cat, i) => {
                      const angle = angles[i] * Math.PI / 180
                      const x = 200 + radius * Math.cos(angle)
                      const y = 200 + radius * Math.sin(angle)
                      return `${x},${y}`
                    }).join(' ')
                    
                    return (
                      <polygon
                        key={idx}
                        points={points}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                      />
                    )
                  })}

                  {/* Axis lines */}
                  {['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'].map((cat, idx) => {
                    const angles = [0, 60, 120, 180, 240, 300]
                    const angle = angles[idx] * Math.PI / 180
                    const x2 = 200 + 130 * Math.cos(angle)
                    const y2 = 200 + 130 * Math.sin(angle)
                    
                    return (
                      <line
                        key={idx}
                        x1="200"
                        y1="200"
                        x2={x2}
                        y2={y2}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="1"
                      />
                    )
                  })}

                  {/* Main hexagon outline */}
                  {(() => {
                    const categoryOrder = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material']
                    const angles = [0, 60, 120, 180, 240, 300]
                    const points = categoryOrder.map((cat, i) => {
                      const angle = angles[i] * Math.PI / 180
                      const x = 200 + 130 * Math.cos(angle)
                      const y = 200 + 130 * Math.sin(angle)
                      return `${x},${y}`
                    }).join(' ')
                    
                    return (
                      <polygon
                        points={points}
                        fill="none"
                        stroke="rgba(255, 255, 255, 0.3)"
                        strokeWidth="2"
                      />
                    )
                  })()}
                  
                  {/* Data polygon - líneas de progreso dinámicas usando timeDistribution */}
                  {(() => {
                    // Usar datos optimizados de timeDistribution en lugar de cálculo manual
                    const categoryMinutes: Record<string, number> = {}
                    
                    if (timeDistribution && Array.isArray(timeDistribution)) {
                      timeDistribution.forEach((dist: any) => {
                        const category = categories.find(c => c.id === dist.category_id)
                        if (category) {
                          // Usar actual_minutes del timeDistribution optimizado
                          categoryMinutes[category.slug] = dist.actual_minutes || 0
                        }
                      })
                    }
                    
                    // Generar puntos del polígono de progreso
                    const maxMinutes = 120 // Máximo para visualización
                    const categoryOrder = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material']
                    const angles = [0, 60, 120, 180, 240, 300]
                    
                    const dataPoints = categoryOrder.map((cat, i) => {
                      const minutes = categoryMinutes[cat] || 0
                      const value = Math.min(minutes / maxMinutes, 1)
                      const angle = angles[i] * Math.PI / 180
                      const x = 200 + 130 * value * Math.cos(angle)
                      const y = 200 + 130 * value * Math.sin(angle)
                      return { x, y, value, minutes, category: cat }
                    })
                    
                    const points = dataPoints.map(p => `${p.x},${p.y}`).join(' ')
                    
                    return (
                      <>
                        {/* Progress polygon */}
                        <polygon
                          points={points}
                          fill="url(#hexGradient)"
                          fillOpacity="0.25"
                          stroke="url(#hexGradientStroke)"
                          strokeWidth="2"
                        />
                        {/* Data points with improved visualization */}
                        {dataPoints.map((point, idx) => {
                          const category = categories[idx]
                          if (!category) return null
                          
                          return (
                            <g key={idx}>
                              <circle
                                cx={point.x}
                                cy={point.y}
                                r="5"
                                fill={category.color || '#9B8AE6'}
                                stroke="white"
                                strokeWidth="2"
                                opacity={point.value > 0 ? 1 : 0.3}
                              />
                              {/* Show minutes as text when > 0 */}
                              {point.minutes > 0 && (
                                <text
                                  x={point.x}
                                  y={point.y - 12}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="white"
                                  className="font-medium"
                                >
                                  {point.minutes}m
                                </text>
                              )}
                            </g>
                          )
                        })}
                      </>
                    )
                  })()}
                  
                  {/* Labels de categorías */}
                  {categories.slice(0, 6).map((category, index) => {
                    const angles = [0, 60, 120, 180, 240, 300]
                    const angle = angles[index] * Math.PI / 180
                    const x = 200 + 150 * Math.cos(angle)
                    const y = 200 + 150 * Math.sin(angle)
                    
                    return (
                      <g key={category.id}>
                        <circle
                          cx={x}
                          cy={y}
                          r="25"
                          fill="rgba(255,255,255,0.05)"
                          stroke={category.color}
                          strokeWidth="1"
                          strokeOpacity="0.3"
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => handleAxisClick(category, e)}
                        />
                        <foreignObject x={x - 12} y={y - 12} width="24" height="24">
                          <AxisIcon 
                            axis={category.icon}
                            size={24}
                            color={category.color}
                            custom
                          />
                        </foreignObject>
                      </g>
                    )
                  })}
                </svg>
              </div>
              
              {/* Mini stats de balance usando timeDistribution */}
              <div className="grid grid-cols-3 gap-2 mt-4 w-full max-w-[300px]">
                {categories.slice(0, 6).map(cat => {
                  // Usar timeDistribution para datos optimizados
                  const distData = timeDistribution?.find((d: any) => d.category_id === cat.id)
                  const actualMinutes = distData?.actual_minutes || 0
                  const plannedMinutes = distData?.planned_minutes || 0
                  const percentage = distData?.percentage || 0
                  
                  return (
                    <div 
                      key={cat.id}
                      className="text-center p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={(e) => handleAxisClick(cat, e)}
                      title={`${cat.name}: ${actualMinutes}/${plannedMinutes} min (${percentage.toFixed(0)}%)`}
                    >
                      <div 
                        className="w-2 h-2 rounded-full mx-auto mb-1"
                        style={{ backgroundColor: cat.color || '#9B8AE6' }}
                      />
                      <div className="text-xs text-gray-400">
                        {getLocalizedText(cat.name, 'en', cat.slug).substring(0, 4)}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {actualMinutes}m
                      </div>
                      {/* Progress bar */}
                      {plannedMinutes > 0 && (
                        <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                          <div 
                            className="h-1 rounded-full transition-all"
                            style={{ 
                              backgroundColor: cat.color || '#9B8AE6',
                              width: `${Math.min((actualMinutes / plannedMinutes) * 100, 100)}%`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* COLUMNA DERECHA - Stats & Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              {/* Daily Stats using timeDistribution */}
              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 text-white">Today's Progress</h3>
                {(() => {
                  // Calculate stats from timeDistribution
                  const totalActual = timeDistribution?.reduce((sum: number, d: any) => sum + (d.actual_minutes || 0), 0) || 0
                  const totalPlanned = timeDistribution?.reduce((sum: number, d: any) => sum + (d.planned_minutes || 0), 0) || 0
                  const activeAxes = timeDistribution?.filter((d: any) => (d.actual_minutes || 0) > 0).length || 0
                  const efficiency = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0
                  const topCategory = timeDistribution?.reduce((max: any, d: any) => 
                    (d.actual_minutes || 0) > (max?.actual_minutes || 0) ? d : max, null
                  )
                  const topCategoryName = topCategory ? categories.find(c => c.id === topCategory.category_id)?.name : null
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Active Time</span>
                        <span className="text-lg font-bold text-green-400">
                          {Math.floor(totalActual / 60)}h {totalActual % 60}m
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Planned</span>
                        <span className="text-sm text-white">
                          {Math.floor(totalPlanned / 60)}h {totalPlanned % 60}m
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Efficiency</span>
                        <span className={`text-sm font-semibold ${efficiency >= 80 ? 'text-green-400' : efficiency >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {efficiency}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Axes Active</span>
                        <span className="text-sm text-white">
                          {activeAxes}/6
                        </span>
                      </div>
                      {topCategoryName && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Top Focus</span>
                          <span className="text-sm text-blue-400">
                            {getLocalizedText(topCategoryName, 'en', topCategory.category_id)}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Quick Actions */}
              <div className="glass rounded-xl p-4 space-y-2">
                <button
                  onClick={() => handleAddTimeBlock()}
                  className="w-full py-3 bg-purple-500/20 hover:bg-purple-500/30 
                             text-purple-300 rounded-lg transition-colors flex items-center 
                             justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Quick Add Activity</span>
                </button>
                
                <button
                  onClick={() => setShowTimer(true)}
                  className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 
                             text-green-300 rounded-lg transition-colors flex items-center 
                             justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Start Focus Timer</span>
                </button>
              </div>

              {/* Daily Reflection */}
              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-2 text-white">Daily Reflection</h3>
                <textarea 
                  className="w-full h-20 bg-white/5 rounded-lg p-2 text-xs text-white 
                             placeholder-gray-500 resize-none border border-white/10"
                  placeholder="What are you grateful for today?"
                />
                <button className="mt-2 text-xs text-purple-400 hover:text-purple-300">
                  Save reflection
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      {/* Modals */}
      <AnimatePresence>
        {showScheduler && (
          <TimeBlockScheduler
            isOpen={showScheduler}
            onClose={handleSchedulerClose}
            userId={user?.id || ''}
            categories={categories}
            selectedCategory={selectedCategory}
            selectedDate={selectedDate}
          />
        )}
        {showTimer && (
          <ActivityTimer
            isOpen={showTimer}
            onClose={handleTimerClose}
            userId={user?.id || ''}
            categories={categories}
            selectedCategory={selectedCategory}
            timeBlock={activeTimer}
          />
        )}
        {showPlanMyDay && (
          <PlanMyDay
            isOpen={showPlanMyDay}
            onClose={handlePlanMyDayClose}
            userId={user?.id || ''}
            categories={categories}
            selectedDate={selectedDate}
            existingBlocks={myDayData}
          />
        )}
        {showAxisMenu && (
          <AxisActivityMenu
            isOpen={showAxisMenu}
            onClose={handleAxisMenuClose}
            selectedAxis={selectedAxis}
            position={axisMenuPosition}
            onSuccess={() => {
              refetchData()
              refetchDistribution()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
