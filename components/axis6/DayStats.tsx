// Componente DayStats - Estadísticas del día
'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock, Target, TrendingUp, Award } from 'lucide-react'
import type { TimeBlock, AxisMinutes } from '@/types/axis6-timeline'

interface DayStatsProps {
  axisMinutes: AxisMinutes
  totalAxes: number
  timeblocks?: TimeBlock[]
  className?: string
}

export function DayStats({ 
  axisMinutes, 
  totalAxes, 
  timeblocks = [],
  className = "" 
}: DayStatsProps) {
  
  const stats = useMemo(() => {
    const totalMinutes = Object.values(axisMinutes).reduce((acc, min) => acc + min, 0)
    const activeAxes = Object.values(axisMinutes).filter(min => min > 0).length
    const balanceScore = totalAxes > 0 ? Math.round((activeAxes / totalAxes) * 100) : 0
    
    // Eje más usado
    const topAxisEntry = Object.entries(axisMinutes).reduce(
      (max, [axisId, minutes]) => minutes > max.minutes ? { axisId, minutes } : max,
      { axisId: '', minutes: 0 }
    )
    
    // Promedio por eje activo
    const averagePerAxis = activeAxes > 0 ? Math.round(totalMinutes / activeAxes) : 0
    
    return {
      totalMinutes,
      activeAxes,
      balanceScore,
      topAxis: topAxisEntry.minutes > 0 ? topAxisEntry : null,
      averagePerAxis,
      totalBlocks: timeblocks.length
    }
  }, [axisMinutes, totalAxes, timeblocks])

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getBalanceColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getBalanceMessage = (score: number) => {
    if (score >= 80) return 'Excelente balance'
    if (score >= 60) return 'Buen balance'
    if (score >= 40) return 'Balance moderado'
    if (score > 0) return 'Necesita más balance'
    return 'Comienza tu día'
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Estadística principal - Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-4 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-300">Balance del Día</span>
        </div>
        
        <div className={`text-2xl font-bold ${getBalanceColor(stats.balanceScore)}`}>
          {stats.balanceScore}%
        </div>
        
        <div className="text-xs text-gray-400 mt-1">
          {getBalanceMessage(stats.balanceScore)}
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          {stats.activeAxes} de {totalAxes} ejes activos
        </div>
      </motion.div>

      {/* Grid de estadísticas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Tiempo total */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-lg p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-gray-400">Tiempo Total</span>
          </div>
          <div className="text-lg font-bold text-white">
            {formatTime(stats.totalMinutes)}
          </div>
          <div className="text-xs text-gray-500">
            {stats.totalBlocks} actividades
          </div>
        </motion.div>

        {/* Promedio por eje */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-lg p-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-xs text-gray-400">Promedio</span>
          </div>
          <div className="text-lg font-bold text-white">
            {stats.averagePerAxis > 0 ? `${stats.averagePerAxis}m` : '-'}
          </div>
          <div className="text-xs text-gray-500">
            por eje activo
          </div>
        </motion.div>
      </div>

      {/* Eje destacado */}
      {stats.topAxis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-lg p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-gray-400">Eje Destacado</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">
                {stats.topAxis.axisId}
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(stats.topAxis.minutes)}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {Math.round((stats.topAxis.minutes / stats.totalMinutes) * 100)}%
              </div>
              <div className="text-xs text-gray-500">
                del día
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mensaje motivacional */}
      {stats.totalMinutes === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-lg p-3 border border-purple-500/20"
        >
          <div className="text-center">
            <div className="text-purple-400 mb-1">🌟</div>
            <div className="text-xs text-purple-300 font-medium">
              ¡Comienza tu día!
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Agrega tu primera actividad para ver tu progreso
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Progreso hacia balance perfecto */}
      {stats.totalMinutes > 0 && stats.balanceScore < 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-lg p-3 border border-blue-500/20"
        >
          <div className="text-center">
            <div className="text-blue-400 mb-1">🎯</div>
            <div className="text-xs text-blue-300 font-medium">
              Siguiente Meta
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {totalAxes - stats.activeAxes > 0 
                ? `Activar ${totalAxes - stats.activeAxes} eje${totalAxes - stats.activeAxes > 1 ? 's' : ''} más`
                : 'Mantener el balance actual'
              }
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}