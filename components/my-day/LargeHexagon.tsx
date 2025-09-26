'use client'
import { AXES } from '@/lib/hooks/useDayData'

interface LargeHexagonProps {
  blocks: Array<{
    id: number
    axis_id: number
    minutes: number
    start_ts: string
    note?: string
    axis_name: string
    axis_color: string
    subcat_name?: string
  }>
  onAxisClick: (axis: { id: number; name: string; color: string; icon: string }) => void
}

export function LargeHexagon({ blocks, onAxisClick }: LargeHexagonProps) {
  // Calculate minutes per axis
  const minutesByAxis = AXES.map(axis => {
    const axisBlocks = blocks.filter(block => block.axis_id === axis.id)
    const totalMinutes = axisBlocks.reduce((sum, block) => sum + block.minutes, 0)
    return { ...axis, minutes: totalMinutes }
  })

  const totalMinutes = minutesByAxis.reduce((sum, axis) => sum + axis.minutes, 0)
  const axesActive = minutesByAxis.filter(axis => axis.minutes > 0).length

  return (
    <div className="glass rounded-xl p-8 flex flex-col items-center justify-center text-white">
      <h2 className="text-2xl font-semibold text-white mb-6 text-center">
        Balance Overview
      </h2>
      
      {/* Large Hexagon - 2x bigger */}
      <div className="relative mb-6">
        <svg className="w-full h-auto max-w-[600px]" viewBox="0 0 600 600">
          {/* Grid lines */}
          {[0.2, 0.4, 0.6, 0.8, 1].map((level, idx) => {
            const angles = [0, 60, 120, 180, 240, 300]
            const radius = 200 * level
            const points = AXES.map((_, i) => {
              const angle = angles[i] * Math.PI / 180
              const x = 300 + radius * Math.cos(angle)
              const y = 300 + radius * Math.sin(angle)
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
            const x2 = 300 + 200 * Math.cos(angle)
            const y2 = 300 + 200 * Math.sin(angle)
            
            return (
              <line
                key={idx}
                x1="300"
                y1="300"
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
            
            const dataPoints = minutesByAxis.map((axis, i) => {
              const value = Math.min(axis.minutes / maxMinutes, 1)
              const angle = angles[i] * Math.PI / 180
              const x = 300 + 200 * value * Math.cos(angle)
              const y = 300 + 200 * value * Math.sin(angle)
              return { x, y, value, minutes: axis.minutes, axis }
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
                    r="6"
                    fill={point.axis.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}
              </>
            )
          })()}
          
          {/* Axis labels with minutes badges */}
          {minutesByAxis.map((axis, index) => {
            const angles = [0, 60, 120, 180, 240, 300]
            const angle = angles[index] * Math.PI / 180
            const x = 300 + 250 * Math.cos(angle)
            const y = 300 + 250 * Math.sin(angle)
            
            return (
              <g key={axis.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="40"
                  fill="rgba(255,255,255,0.05)"
                  stroke={axis.color}
                  strokeWidth="3"
                  strokeOpacity="0.4"
                  className="cursor-pointer hover:fill-white/10 transition-colors"
                  onClick={() => onAxisClick(axis)}
                />
                <text
                  x={x}
                  y={y - 5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="24"
                  className="cursor-pointer"
                  onClick={() => onAxisClick(axis)}
                >
                  {axis.icon}
                </text>
                <text
                  x={x}
                  y={y + 15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="white"
                  className="font-medium"
                >
                  {axis.name}
                </text>
                {/* Minutes badge */}
                <circle
                  cx={x + 25}
                  cy={y - 25}
                  r="12"
                  fill={axis.minutes > 0 ? axis.color : 'rgba(255,255,255,0.2)'}
                  stroke="white"
                  strokeWidth="1"
                />
                <text
                  x={x + 25}
                  y={y - 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  className="font-bold"
                >
                  {axis.minutes}m
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Stats below hexagon */}
      <div className="grid grid-cols-3 gap-6 w-full max-w-[400px]">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{totalMinutes}m</div>
          <div className="text-sm text-gray-400">Total Time</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400">{blocks.length}</div>
          <div className="text-sm text-gray-400">Activities</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-400">{axesActive}/6</div>
          <div className="text-sm text-gray-400">Axes Active</div>
        </div>
      </div>
    </div>
  )
}
