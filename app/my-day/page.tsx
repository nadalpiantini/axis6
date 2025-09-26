'use client'
import { format, addDays, subDays, isToday } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { TimelineGrid } from '@/components/my-day/TimelineGrid'
import { SimpleAxisMenu } from '@/components/my-day/SimpleAxisMenu'
import { ReflectionCard } from '@/components/my-day/ReflectionCard'
import { AxisIcon } from '@/components/icons'
import { useUser } from '@/lib/react-query/hooks'
import { useDayData, useQuickAddBlock, AXES } from '@/lib/hooks/useDayData'
import { useRouter as useNextRouter } from 'next/navigation'


export default function MyDayPage() {
  const router = useRouter()
  const { data: authUser } = useUser()
  const user = authUser
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAxisMenu, setShowAxisMenu] = useState(false)
  const [selectedAxis, setSelectedAxis] = useState<{ id: number; name: string; color: string; icon: string } | null>(null)
  
  // Fetch data for selected date
  const { data: dayData, isLoading, refetch } = useDayData(selectedDate)
  const quickAddBlock = useQuickAddBlock()
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

  const handleBlockClick = (hour: number, minutes: number) => {
    if (selectedAxis) {
      // Get the start timestamp for this time slot
      const startTime = new Date(selectedDate)
      startTime.setHours(hour, minutes, 0, 0)
      
      // Quick add 30 minutes of this axis activity
      quickAddBlock.mutate({
        axisId: selectedAxis.id,
        minutes: 30,
        note: `${selectedAxis.name} activity`
      })
    }
  }

  const handleAxisMenuSelect = async (activity: string, duration: number) => {
    if (selectedAxis) {
      try {
        await quickAddBlock.mutateAsync({
          axisId: selectedAxis.id,
          minutes: duration,
          note: activity
        })
        setShowAxisMenu(false)
        setSelectedAxis(null)
      } catch (error) {
        console.error('Error adding activity:', error)
      }
    }
  }

  const handleAxisMenuClose = () => {
    setShowAxisMenu(false)
    setSelectedAxis(null)
  }

  const totalMinutes = dayData?.totalMinutes || 0
  const axesActive = dayData?.axesActive || 0
  const blocks = dayData?.blocks || []
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
        title="AXIS6 - My Day"
        subtitle={format(selectedDate, 'EEEE, MMMM d, yyyy')}
        showBackButton={true}
        backUrl="/dashboard"
      />
      {/* Main Content */}
      <main
        className="container mx-auto px-4 py-6"
        style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))' }}
      >
        {/* Date Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between glass rounded-xl p-4 mb-6"
        >
          <button
            onClick={() => handleDateChange('prev')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
            </h1>
            <p className="text-sm text-gray-400">
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={() => handleDateChange('next')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </motion.div>

        {/* 3-Column Layout: Timeline | Hexagon | Quick Actions + Reflection */}
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr_320px] gap-6">
          
          {/* LEFT COLUMN - Timeline (5am-9pm, 15min blocks) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <TimelineGrid
              onBlockClick={handleBlockClick}
              blocks={blocks}
              selectedAxis={selectedAxis}
            />
          </motion.div>

          {/* CENTER COLUMN - Dynamic Hexagon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-xl p-6 flex flex-col items-center justify-center text-white"
          >
            <h2 className="text-xl font-semibold text-white mb-4 text-center">
              Balance Overview
            </h2>
            
            {/* Dynamic Hexagon using AXES data */}
            <div className="relative">
              <svg className="w-full h-auto max-w-[400px]" viewBox="0 0 400 400">
                {/* Grid lines */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((level, idx) => {
                  const angles = [0, 60, 120, 180, 240, 300]
                  const radius = 130 * level
                  const points = AXES.map((_, i) => {
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
                {AXES.map((_, idx) => {
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

                {/* Data polygon */}
                {(() => {
                  const maxMinutes = 120
                  const angles = [0, 60, 120, 180, 240, 300]
                  
                  const dataPoints = AXES.map((axis, i) => {
                    const axisBlocks = blocks.filter(block => block.axis_id === axis.id)
                    const minutes = axisBlocks.reduce((sum, block) => sum + block.minutes, 0)
                    const value = Math.min(minutes / maxMinutes, 1)
                    const angle = angles[i] * Math.PI / 180
                    const x = 200 + 130 * value * Math.cos(angle)
                    const y = 200 + 130 * value * Math.sin(angle)
                    return { x, y, value, minutes, axis }
                  })
                  
                  const points = dataPoints.map(p => `${p.x},${p.y}`).join(' ')
                  
                  return (
                    <>
                      <polygon
                        points={points}
                        fill="rgba(156, 163, 175, 0.2)"
                        stroke="rgba(156, 163, 175, 0.5)"
                        strokeWidth="2"
                      />
                      {dataPoints.map((point, idx) => (
                        <circle
                          key={idx}
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill={point.axis.color}
                          stroke="white"
                          strokeWidth="2"
                        />
                      ))}
                    </>
                  )
                })()}
                
                {/* Axis labels */}
                {AXES.map((axis, index) => {
                  const angles = [0, 60, 120, 180, 240, 300]
                  const angle = angles[index] * Math.PI / 180
                  const x = 200 + 160 * Math.cos(angle)
                  const y = 200 + 160 * Math.sin(angle)
                  
                  return (
                    <g key={axis.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r="30"
                        fill="rgba(255,255,255,0.05)"
                        stroke={axis.color}
                        strokeWidth="2"
                        strokeOpacity="0.3"
                        className="cursor-pointer hover:fill-white/10 transition-colors"
                        onClick={() => {
                          setSelectedAxis(axis)
                          setShowAxisMenu(true)
                        }}
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="20"
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedAxis(axis)
                          setShowAxisMenu(true)
                        }}
                      >
                        {axis.icon}
                      </text>
                      <text
                        x={x}
                        y={y + 45}
                        textAnchor="middle"
                        fontSize="12"
                        fill="white"
                        className="font-medium"
                      >
                        {axis.name}
                      </text>
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-[300px]">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalMinutes}m</div>
                <div className="text-xs text-gray-400">Total Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{blocks.length}</div>
                <div className="text-xs text-gray-400">Activities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{axesActive}/6</div>
                <div className="text-xs text-gray-400">Axes Active</div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN - Quick Actions + Reflection */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* Quick Add Buttons */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {AXES.map(axis => (
                  <button
                    key={axis.id}
                    onClick={() => {
                      setSelectedAxis(axis)
                      setShowAxisMenu(true)
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-center"
                    style={{ borderLeft: `3px solid ${axis.color}` }}
                  >
                    <div className="text-lg mb-1">{axis.icon}</div>
                    <div className="text-xs text-gray-400">{axis.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Reflection */}
            <ReflectionCard
              reflection={dayData?.reflection}
              date={selectedDate}
            />
          </motion.div>
        </div>
      </main>
      {/* Simple Axis Menu */}
      <SimpleAxisMenu
        isOpen={showAxisMenu}
        onClose={handleAxisMenuClose}
        axis={selectedAxis}
        onSelect={handleAxisMenuSelect}
      />
    </div>
  )
}
