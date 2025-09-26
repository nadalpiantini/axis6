// Dashboard con detección automática de sistema Timeline
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/react-query/hooks'
import { useTimelineSystem } from '@/lib/hooks/useTimelineSystem'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { Clock, Target, Plus } from 'lucide-react'

// Componentes del nuevo sistema
import { TimelineView } from '@/components/axis6/TimelineView'
import { HexagonBalance } from '@/components/axis6/HexagonBalance'
import { QuickAddPanel } from '@/components/axis6/QuickAddPanel'
import { DailyReflection } from '@/components/axis6/DailyReflection'
import { DayStats } from '@/components/axis6/DayStats'

// Componente del sistema actual
import DashboardCurrent from '../../app/dashboard/page'

export default function DashboardWithFallback() {
  const { data: user } = useUser()
  const {
    isTimelineAvailable,
    loading,
    error,
    axes,
    subcategories,
    dayData,
    addTimeBlock,
    saveReflection
  } = useTimelineSystem(user?.id)

  const [selectedAxis, setSelectedAxis] = useState<string | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  // Si el sistema timeline no está disponible, usar el actual
  if (!loading && !isTimelineAvailable) {
    return <DashboardCurrent />
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state - fallback al sistema actual
  if (error) {
    console.log('Timeline error, falling back to current system:', error)
    return <DashboardCurrent />
  }

  const handleAxisClick = (axisId: string) => {
    setSelectedAxis(axisId)
    setShowQuickAdd(true)
  }

  const handleAddActivity = async (activity: any) => {
    const success = await addTimeBlock(activity)
    if (success) {
      setShowQuickAdd(false)
      setSelectedAxis(null)
    }
    return success
  }

  const totalMinutes = Object.values(dayData.axis_minutes).reduce((acc, min) => acc + min, 0)

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950 text-white"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      {/* Header simplificado para dashboard */}
      <div className="p-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {totalMinutes > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Tiempo total</div>
                <div className="font-semibold">
                  {totalMinutes < 60 ? `${totalMinutes}m` : `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
                </div>
              </div>
            )}
            
            <motion.button
              onClick={() => setShowQuickAdd(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Agregar</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6">
          
          {/* Timeline compacto (Izquierda) */}
          <div className="order-2 lg:order-1">
            <div className="glass rounded-2xl p-4 h-[500px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold">Hoy</h3>
              </div>
              
              <TimelineView
                timeblocks={dayData.timeblocks}
                currentDate={dayData.date}
                onSlotClick={(hour, quarter) => {
                  console.log('Slot clicked:', hour, quarter)
                  setShowQuickAdd(true)
                }}
              />
            </div>
          </div>

          {/* Centro - Hexágono */}
          <div className="order-1 lg:order-2 flex flex-col items-center justify-center space-y-6">
            
            {/* Hexágono principal */}
            <HexagonBalance
              axes={axes}
              axisMinutes={dayData.axis_minutes}
              onAxisClick={handleAxisClick}
              selectedAxis={selectedAxis}
              maxMinutesPerAxis={120}
            />
            
            {/* Estadísticas compactas */}
            <div className="w-full max-w-sm">
              <DayStats
                axisMinutes={dayData.axis_minutes}
                totalAxes={axes.length}
                timeblocks={dayData.timeblocks}
              />
            </div>
          </div>

          {/* Panel derecho */}
          <div className="order-3 space-y-4">
            
            {/* Panel de agregar actividades */}
            {showQuickAdd && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <QuickAddPanel
                  axes={axes}
                  subcategories={subcategories}
                  selectedAxis={selectedAxis}
                  onAddTimeBlock={handleAddActivity}
                  onClose={() => {
                    setShowQuickAdd(false)
                    setSelectedAxis(null)
                  }}
                />
              </motion.div>
            )}
            
            {/* Reflexión diaria compacta */}
            <DailyReflection
              reflection={dayData.reflection?.text}
              onSave={saveReflection}
            />
            
            {/* Quick actions */}
            <div className="glass rounded-2xl p-4">
              <h3 className="font-semibold mb-3 text-sm">Acciones Rápidas</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => window.location.href = '/my-day'}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  📅 Ver Timeline Completo
                </button>
                <button 
                  onClick={() => window.location.href = '/analytics'}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  📊 Ver Analytics
                </button>
                <button 
                  onClick={() => setShowQuickAdd(true)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  ⚡ Actividad Rápida
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beta badge */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-green-500 text-white px-2 py-1 rounded text-xs">
          Timeline System Active
        </div>
      )}
    </div>
  )
}