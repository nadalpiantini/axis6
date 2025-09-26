// Componente HexagonBalance - Hexágono que crece según minutos por eje
'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AxisIcon } from '@/components/icons'
import type { Axis, AxisMinutes } from '@/types/axis6-timeline'

interface HexagonBalanceProps {
  axes: Axis[]
  axisMinutes: AxisMinutes
  onAxisClick?: (axisId: string) => void
  selectedAxis?: string | null
  maxMinutesPerAxis?: number
  className?: string
}

export const HexagonBalance = memo(({ 
  axes, 
  axisMinutes, 
  onAxisClick, 
  selectedAxis,
  maxMinutesPerAxis = 120, // 2 horas por eje como máximo
  className = ""
}: HexagonBalanceProps) => {

  // Calcular datos para visualización
  const hexagonData = useMemo(() => {
    return axes.slice(0, 6).map((axis, index) => {
      const minutes = axisMinutes[axis.id] || 0
      const percentage = Math.min((minutes / maxMinutesPerAxis) * 100, 100)
      const angle = (Math.PI / 3) * index - Math.PI / 2
      
      // Posición base del eje
      const baseRadius = 160
      const x = 200 + baseRadius * Math.cos(angle)
      const y = 200 + baseRadius * Math.sin(angle)
      
      // Radio dinámico basado en minutos (mínimo 20px, máximo 50px)
      const dynamicRadius = 20 + (percentage / 100) * 30
      
      return {
        ...axis,
        minutes,
        percentage,
        angle,
        x,
        y,
        radius: dynamicRadius,
        isActive: minutes > 0,
        isSelected: selectedAxis === axis.id
      }
    })
  }, [axes, axisMinutes, maxMinutesPerAxis, selectedAxis])

  // Calcular puntos del hexágono central basado en el balance
  const balanceHexagon = useMemo(() => {
    const points = hexagonData.map((axis, index) => {
      const angle = (Math.PI / 3) * index - Math.PI / 2
      // Radio variable basado en los minutos (0-80px desde el centro)
      const radius = 20 + (axis.percentage / 100) * 60
      const x = 200 + radius * Math.cos(angle)
      const y = 200 + radius * Math.sin(angle)
      return { x, y, color: axis.color, percentage: axis.percentage }
    })
    
    return {
      points: points.map(p => `${p.x},${p.y}`).join(' '),
      averagePercentage: points.reduce((acc, p) => acc + p.percentage, 0) / points.length
    }
  }, [hexagonData])

  const handleAxisClick = (axis: any, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onAxisClick?.(axis.id)
  }

  const totalMinutes = Object.values(axisMinutes).reduce((acc, min) => acc + min, 0)
  const balanceScore = Math.round(balanceHexagon.averagePercentage)

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Hexágono principal */}
      <div className="flex justify-center mb-4" data-testid="hexagon-balance">
        <svg 
          className="w-full h-auto max-w-[280px] sm:max-w-[350px] md:max-w-[400px]" 
          viewBox="0 0 400 400" 
          role="img" 
          aria-label="Daily balance overview"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Gradientes */}
          <defs>
            <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9B8AE6" />
              <stop offset="50%" stopColor="#6AA6FF" />
              <stop offset="100%" stopColor="#FF8B7D" />
            </linearGradient>
            
            {/* Gradientes individuales por eje */}
            {hexagonData.map(axis => (
              <radialGradient key={`gradient-${axis.id}`} id={`gradient-${axis.id}`}>
                <stop offset="0%" stopColor={axis.color} stopOpacity="0.8" />
                <stop offset="70%" stopColor={axis.color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={axis.color} stopOpacity="0.1" />
              </radialGradient>
            ))}
          </defs>
          
          {/* Hexágono base */}
          <polygon
            points="200,40 340,120 340,280 200,360 60,280 60,120"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />
          
          {/* Líneas de conexión */}
          {hexagonData.map((axis, index) => (
            <motion.line
              key={`line-${axis.id}`}
              x1="200"
              y1="200"
              x2={axis.x}
              y2={axis.y}
              stroke={axis.isActive ? axis.color : "rgba(255,255,255,0.1)"}
              strokeWidth={axis.isActive ? "2" : "1"}
              strokeOpacity={axis.isActive ? 0.6 : 0.3}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            />
          ))}
          
          {/* Hexágono del balance (dinámico) */}
          {balanceHexagon.averagePercentage > 0 && (
            <motion.polygon
              points={balanceHexagon.points}
              fill="url(#balanceGradient)"
              fillOpacity="0.2"
              stroke="url(#balanceGradient)"
              strokeWidth="2"
              strokeOpacity="0.6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          )}
          
          {/* Ejes - círculos dinámicos */}
          {hexagonData.map((axis, index) => (
            <motion.g key={axis.id}>
              {/* Área de click extendida */}
              <circle
                cx={axis.x}
                cy={axis.y}
                r="50"
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={(e) => handleAxisClick(axis, e)}
              />
              
              {/* Círculo de fondo */}
              <motion.circle
                cx={axis.x}
                cy={axis.y}
                r={axis.radius}
                fill={axis.isActive ? `url(#gradient-${axis.id})` : "rgba(255,255,255,0.05)"}
                stroke={axis.isSelected ? "#ffffff" : (axis.isActive ? axis.color : "rgba(255,255,255,0.15)")}
                strokeWidth={axis.isSelected ? "3" : "2"}
                className="transition-all duration-500 ease-out"
                initial={{ r: 20, opacity: 0 }}
                animate={{ r: axis.radius, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              />
              
              {/* Icono del eje */}
              <foreignObject 
                x={axis.x - 14} 
                y={axis.y - 14} 
                width="28" 
                height="28"
                style={{ pointerEvents: 'none' }}
              >
                <AxisIcon 
                  axis={axis.icon}
                  size={28}
                  color={axis.isActive ? "#ffffff" : "#9ca3af"}
                  custom
                />
              </foreignObject>
              
              {/* Etiqueta con minutos */}
              {axis.minutes > 0 && (
                <motion.text
                  x={axis.x}
                  y={axis.y + axis.radius + 16}
                  textAnchor="middle"
                  className="text-xs font-medium fill-white"
                  fontSize="11"
                  initial={{ opacity: 0, y: axis.y + axis.radius + 10 }}
                  animate={{ opacity: 1, y: axis.y + axis.radius + 16 }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
                >
                  {axis.minutes}m
                </motion.text>
              )}
            </motion.g>
          ))}
          
          {/* Centro - estadísticas */}
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <text 
              x="200" 
              y="190" 
              textAnchor="middle" 
              className="text-sm font-bold fill-white"
              fontSize="14"
            >
              Balance
            </text>
            <text 
              x="200" 
              y="210" 
              textAnchor="middle" 
              className="text-xl font-bold"
              fontSize="20"
              fill={balanceScore > 60 ? "#10b981" : balanceScore > 30 ? "#f59e0b" : "#ef4444"}
            >
              {balanceScore}%
            </text>
            <text 
              x="200" 
              y="225" 
              textAnchor="middle" 
              className="text-xs fill-gray-300"
              fontSize="10"
            >
              {totalMinutes}m total
            </text>
          </motion.g>
        </svg>
      </div>

      {/* Leyenda de ejes */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {hexagonData.map(axis => (
          <button
            key={axis.id}
            onClick={() => onAxisClick?.(axis.id)}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all ${
              axis.isSelected 
                ? 'bg-white/20 text-white' 
                : axis.isActive 
                  ? 'bg-white/10 text-gray-200 hover:bg-white/15' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: axis.color }}
            />
            <span className="truncate">{axis.name}</span>
            {axis.minutes > 0 && (
              <span className="text-xs opacity-75">({axis.minutes}m)</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
})

HexagonBalance.displayName = 'HexagonBalance'