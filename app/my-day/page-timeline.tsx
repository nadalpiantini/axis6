// My Day page con sistema Timeline y fallback automático
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/lib/react-query/hooks'
import { useTimelineSystem } from '@/lib/hooks/useTimelineSystem'
import { format, addDays, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Target } from 'lucide-react'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { motion } from 'framer-motion'

// Componentes del nuevo sistema
import { TimelineView } from '@/components/axis6/TimelineView'
import { HexagonBalance } from '@/components/axis6/HexagonBalance'
import { QuickAddPanel } from '@/components/axis6/QuickAddPanel'
import { DailyReflection } from '@/components/axis6/DailyReflection'
import { DayStats } from '@/components/axis6/DayStats'

// Fallback al sistema actual
import MyDayPageCurrent from './page'

export default function MyDayPageTimeline() {
  const { data: user } = useUser()
  const {
    isTimelineAvailable,
    loading,
    error,
    axes,
    subcategories,
    dayData,
    currentDate,
    addTimeBlock,
    saveReflection,
    changeDate
  } = useTimelineSystem(user?.id)

  const [selectedAxis, setSelectedAxis] = useState<string | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  // Si el sistema timeline no está disponible, usar el actual
  if (!loading && !isTimelineAvailable) {
    return <MyDayPageCurrent />
  }

  // Loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950 flex items-center justify-center"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)'
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando tu día...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950">
        <StandardHeader user={user} variant="my-day" />
        <div className="max-w-4xl mx-auto p-4">
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-red-400 mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Error al cargar</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    changeDate(newDate)
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

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  const isFuture = currentDate > new Date()

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
      {/* Header */}
      <StandardHeader
        user={user}
        variant="my-day"
        title="Mi Día"
        subtitle="Timeline"
        showBackButton={true}
        backUrl="/dashboard"
      />

      {/* Navegación de fecha */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => handleDateChange('prev')}
            className="p-2 glass rounded-lg hover:bg-white/10 transition touch-manipulation"
            aria-label="Día anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold">
              {format(currentDate, 'EEEE, d MMMM')}
            </h1>
            <p className="text-sm text-gray-400">
              {isToday ? 'Hoy' : isFuture ? 'Futuro' : 'Pasado'}
            </p>
          </div>
          
          <button
            onClick={() => handleDateChange('next')}
            className="p-2 glass rounded-lg hover:bg-white/10 transition touch-manipulation"
            aria-label="Día siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-6">
          
          {/* Timeline (Izquierda) */}
          <div className="glass rounded-2xl p-4 h-[calc(100vh-200px)] overflow-y-auto">
            <TimelineView
              timeblocks={dayData.timeblocks}
              currentDate={dayData.date}
              onSlotClick={(hour, quarter) => {
                console.log('Slot clicked:', hour, quarter)
                setShowQuickAdd(true)
              }}
            />
          </div>

          {/* Centro - Hexágono y estadísticas */}
          <div className="flex flex-col items-center justify-center space-y-6">
            
            {/* Hexágono principal */}
            <HexagonBalance
              axes={axes}
              axisMinutes={dayData.axis_minutes}
              onAxisClick={handleAxisClick}
              selectedAxis={selectedAxis}
              maxMinutesPerAxis={120}
            />
            
            {/* Estadísticas del día */}
            <DayStats
              axisMinutes={dayData.axis_minutes}
              totalAxes={axes.length}
              timeblocks={dayData.timeblocks}
            />

            {/* Botón principal de agregar */}
            <motion.button
              onClick={() => setShowQuickAdd(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2 touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              Agregar Actividad
            </motion.button>
          </div>

          {/* Panel derecho */}
          <div className="space-y-4">
            
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
            
            {/* Reflexión diaria */}
            <DailyReflection
              reflection={dayData.reflection?.text}
              onSave={saveReflection}
            />
          </div>
        </div>
      </div>

      {/* Beta badge */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-purple-500 text-white px-2 py-1 rounded text-xs">
          Timeline Beta
        </div>
      )}
    </div>
  )
}