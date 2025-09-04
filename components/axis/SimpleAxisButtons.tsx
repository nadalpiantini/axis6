'use client'

import { Target } from 'lucide-react'
import { memo } from 'react'

interface SimpleAxisButtonsProps {
  axes: Array<{
    id: string | number
    name: string
    color: string
    icon: string
    completed: boolean
  }>
  onToggleAxis: (id: string | number) => void
  isToggling: boolean
}

export const SimpleAxisButtons = memo(function SimpleAxisButtons({
  axes,
  onToggleAxis,
  isToggling
}: SimpleAxisButtonsProps) {
  // Calculate completion percentage
  const completedCount = axes.filter(axis => axis.completed).length
  const completionPercentage = Math.round((completedCount / 6) * 100)

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Simple centered buttons - exactly like the image */}
      <div className="flex flex-wrap justify-center gap-3 max-w-md">
        {axes.map((axis) => (
          <button
            key={axis.id}
            onClick={() => onToggleAxis(axis.id)}
            disabled={isToggling}
            className={`
              flex flex-col items-center justify-center 
              w-20 h-20 rounded-lg transition-all duration-200
              ${axis.completed 
                ? 'bg-green-600 text-white shadow-lg transform scale-105' 
                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600'
              }
              ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}
            `}
            aria-pressed={axis.completed}
            data-testid={`axis-button-${axis.name.toLowerCase()}`}
            title={axis.name}
          >
            <Target 
              className={`w-5 h-5 ${axis.completed ? 'text-white' : 'text-gray-400'}`} 
            />
            <span className="text-xs font-medium mt-1 text-center">
              {axis.name.slice(0, 4)}
            </span>
          </button>
        ))}
      </div>

      {/* Simple completion indicator below */}
      <div className="text-center mt-6">
        <div className="text-2xl font-bold text-white">
          {completionPercentage}%
        </div>
        <div className="text-gray-400 text-xs">
          {completedCount} of 6 completed
        </div>
      </div>
    </div>
  )
})