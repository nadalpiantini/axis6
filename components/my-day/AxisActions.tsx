'use client'
import { AXES } from '@/lib/hooks/useDayData'

interface AxisActionsProps {
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

export function AxisActions({ blocks, onAxisClick }: AxisActionsProps) {
  // Calculate minutes per axis
  const minutesByAxis = AXES.map(axis => {
    const axisBlocks = blocks.filter(block => block.axis_id === axis.id)
    const totalMinutes = axisBlocks.reduce((sum, block) => sum + block.minutes, 0)
    return { ...axis, minutes: totalMinutes }
  })

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
        ⚡ Axis Actions
      </h3>
      <div className="space-y-3">
        {minutesByAxis.map(axis => (
          <button
            key={axis.id}
            onClick={() => onAxisClick(axis)}
            className="w-full p-4 rounded-lg transition-all duration-200 hover:scale-105 group relative overflow-hidden"
            style={{ 
              backgroundColor: `${axis.color}20`,
              borderLeft: `4px solid ${axis.color}`,
              borderColor: `${axis.color}40`
            }}
          >
            {/* Background gradient */}
            <div 
              className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
              style={{ backgroundColor: axis.color }}
            />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{axis.icon}</div>
                <div className="text-left">
                  <div className="font-medium text-white">{axis.name}</div>
                  <div className="text-sm opacity-70" style={{ color: axis.color }}>
                    {axis.minutes > 0 ? `${axis.minutes}m today` : 'No activity yet'}
                  </div>
                </div>
              </div>
              
              {/* Minutes badge */}
              <div 
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ 
                  backgroundColor: axis.minutes > 0 ? axis.color : 'rgba(255,255,255,0.2)',
                  color: 'white'
                }}
              >
                {axis.minutes}m
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((axis.minutes / 120) * 100, 100)}%`,
                  backgroundColor: axis.color
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
