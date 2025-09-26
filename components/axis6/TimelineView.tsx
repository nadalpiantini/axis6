// Componente Timeline - Vista vertical de bloques de tiempo
'use client'

import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Plus } from 'lucide-react'
import type { TimeBlock } from '@/types/axis6-timeline'

interface TimelineViewProps {
  timeblocks: TimeBlock[]
  currentDate: string
  onBlockClick?: (block: TimeBlock) => void
  onSlotClick?: (hour: number, quarter: 0 | 15 | 30 | 45) => void
  className?: string
}

export const TimelineView = memo(({ 
  timeblocks, 
  currentDate, 
  onBlockClick, 
  onSlotClick,
  className = ""
}: TimelineViewProps) => {
  
  // Generar horas de 5am a 10pm
  const hours = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => i + 5)
  }, [])

  // Agrupar timeblocks por hora
  const blocksByHour = useMemo(() => {
    const grouped: Record<number, TimeBlock[]> = {}
    
    timeblocks.forEach(block => {
      if (!grouped[block.start_hour]) {
        grouped[block.start_hour] = []
      }
      grouped[block.start_hour].push(block)
    })
    
    return grouped
  }, [timeblocks])

  // Formatear hora para display
  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM'
    if (hour < 12) return `${hour}:00 AM`
    if (hour === 12) return '12:00 PM'
    return `${hour - 12}:00 PM`
  }

  // Verificar si un slot está ocupado
  const isSlotOccupied = (hour: number, quarter: 0 | 15 | 30 | 45) => {
    const blocks = blocksByHour[hour] || []
    return blocks.some(block => {
      const blockEndMinutes = block.start_quarter + block.duration_minutes
      const blockEndHour = block.start_hour + Math.floor(blockEndMinutes / 60)
      const blockEndQuarter = blockEndMinutes % 60
      
      if (hour > blockEndHour) return false
      if (hour === blockEndHour && quarter >= blockEndQuarter) return false
      if (hour < block.start_hour) return false
      if (hour === block.start_hour && quarter < block.start_quarter) return false
      
      return true
    })
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-950/80 backdrop-blur-sm z-10 py-2">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timeline
        </h3>
        <span className="text-xs text-gray-400">15 min/bloque</span>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        {hours.map(hour => {
          const hourBlocks = blocksByHour[hour] || []
          
          return (
            <div key={hour} className="relative">
              {/* Etiqueta de hora */}
              <div className="text-xs text-gray-500 mb-1 font-medium">
                {formatHour(hour)}
              </div>
              
              {/* Contenedor de la hora (60 minutos) */}
              <div className="relative h-20 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                
                {/* Líneas divisorias de cuartos de hora */}
                {[15, 30, 45].map(quarter => (
                  <div
                    key={quarter}
                    className="absolute w-full border-t border-white/5"
                    style={{ top: `${(quarter / 60) * 100}%` }}
                  />
                ))}
                
                {/* Slots clickeables para agregar actividades */}
                {[0, 15, 30, 45].map(quarter => {
                  const q = quarter as 0 | 15 | 30 | 45
                  const isOccupied = isSlotOccupied(hour, q)
                  
                  return !isOccupied ? (
                    <button
                      key={quarter}
                      onClick={() => onSlotClick?.(hour, q)}
                      className="absolute left-0 right-0 h-5 hover:bg-white/10 transition-colors group"
                      style={{ top: `${(quarter / 60) * 100}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-full">
                        <Plus className="w-3 h-3 text-gray-400" />
                      </div>
                    </button>
                  ) : null
                })}
                
                {/* Timeblocks */}
                <AnimatePresence>
                  {hourBlocks.map(block => {
                    const topPosition = (block.start_quarter / 60) * 100
                    const height = Math.min((block.duration_minutes / 60) * 100, 100 - topPosition)
                    
                    return (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-1 right-1 cursor-pointer hover:z-10 group"
                        style={{
                          top: `${topPosition}%`,
                          height: `${height}%`,
                          minHeight: '16px'
                        }}
                        onClick={() => onBlockClick?.(block)}
                      >
                        <div
                          className="h-full rounded px-2 py-1 border-l-4 transition-all duration-200 group-hover:shadow-lg"
                          style={{
                            backgroundColor: `${block.axis?.color}20`,
                            borderColor: block.axis?.color,
                            backdropFilter: 'blur(8px)'
                          }}
                        >
                          <div className="flex flex-col justify-center h-full">
                            <div className="text-xs text-white font-medium truncate">
                              {block.subcategory?.name}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-300">
                                {block.duration_minutes}m
                              </span>
                              
                              {block.axis?.icon && (
                                <span className="text-xs opacity-60">
                                  {block.axis.icon}
                                </span>
                              )}
                            </div>
                            
                            {block.note && (
                              <div className="text-xs text-gray-400 truncate mt-1">
                                {block.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer con estadísticas */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-gray-400 text-center">
          Total: {timeblocks.reduce((acc, block) => acc + block.duration_minutes, 0)} minutos
        </div>
      </div>
    </div>
  )
})

TimelineView.displayName = 'TimelineView'