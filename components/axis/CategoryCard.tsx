'use client'

import { motion } from 'framer-motion'
import { Heart, Brain, Palette, Users, Sun, Briefcase, CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'

interface CategoryCardProps {
  category: {
    key: string
    label: string
    ritualName: string
    color: string
    softColor: string
    darkColor: string
    icon: string
    mantra: string
    microActions: string[]
    movement: string
  }
  isCompleted?: boolean
  streakCount?: number
  onToggle?: () => void
}

const iconMap = {
  heart: Heart,
  brain: Brain,
  palette: Palette,
  users: Users,
  sun: Sun,
  briefcase: Briefcase
}

const movementAnimations = {
  latido: {
    rest: { scale: 1 },
    hover: { 
      scale: [1, 1.05, 1],
      transition: { 
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  fade: {
    rest: { opacity: 1 },
    hover: { 
      opacity: [1, 0.7, 1],
      transition: { 
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  expand: {
    rest: { scale: 1 },
    hover: { 
      scale: 1.02,
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      transition: { duration: 0.3 }
    }
  },
  wave: {
    rest: { x: 0 },
    hover: { 
      x: [0, -5, 5, 0],
      transition: { 
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 0.5
      }
    }
  },
  pulse: {
    rest: { scale: 1 },
    hover: {
      scale: [1, 1.01, 1],
      boxShadow: [
        '0 0 0 0 rgba(76, 29, 149, 0)',
        '0 0 20px 10px rgba(76, 29, 149, 0.2)',
        '0 0 0 0 rgba(76, 29, 149, 0)',
      ],
      transition: { 
        duration: 1.5,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  },
  vibrate: {
    rest: { rotate: 0 },
    hover: { 
      rotate: [0, -1, 1, -1, 1, 0],
      transition: { 
        duration: 0.3,
        repeat: Infinity,
        repeatDelay: 1
      }
    }
  }
}

export default function CategoryCard({ category, isCompleted = false, streakCount = 0, onToggle }: CategoryCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [selectedAction, setSelectedAction] = useState<number | null>(null)
  
  const Icon = iconMap[category.icon as keyof typeof iconMap]
  const animation = movementAnimations[category.movement as keyof typeof movementAnimations]

  return (
    <motion.div
      className="relative group"
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      <motion.div
        className={`
          relative overflow-hidden rounded-2xl p-6
          backdrop-blur-sm border transition-all duration-300
          ${isCompleted 
            ? 'bg-gradient-to-br border-white/30 shadow-xl' 
            : 'bg-white/80 border-white/50 hover:bg-white/90'
          }
        `}
        style={{
          background: isCompleted 
            ? `linear-gradient(135deg, ${category.color}20, ${category.softColor}30)`
            : undefined
        }}
        variants={animation}
      >
        {/* Patrón de fondo decorativo */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, ${category.color}, transparent)`
            }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              className={`
                p-3 rounded-xl flex items-center justify-center
                ${isCompleted ? 'bg-white/90' : 'bg-gradient-to-br'}
              `}
              style={{
                background: !isCompleted 
                  ? `linear-gradient(135deg, ${category.color}15, ${category.softColor}25)`
                  : undefined
              }}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Icon 
                className="w-6 h-6" 
                style={{ color: category.color }}
              />
            </motion.div>
            
            <div>
              <h3 
                className="font-bold text-lg"
                style={{ color: category.darkColor }}
              >
                {category.ritualName}
              </h3>
              <p className="text-sm text-gray-600">{category.label}</p>
            </div>
          </div>

          {/* Botón de completado */}
          <motion.button
            onClick={onToggle}
            className="relative"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isCompleted ? (
              <CheckCircle2 
                className="w-8 h-8"
                style={{ color: category.color }}
              />
            ) : (
              <Circle 
                className="w-8 h-8 text-gray-400 hover:text-gray-600"
              />
            )}
          </motion.button>
        </div>

        {/* Mantra */}
        <motion.p
          className="text-sm italic text-gray-700 mb-4 font-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          "{category.mantra}"
        </motion.p>

        {/* Streak indicator */}
        {streakCount > 0 && (
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex gap-1">
              {[...Array(Math.min(streakCount, 7))].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: category.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                />
              ))}
            </div>
            <span className="text-sm font-medium" style={{ color: category.color }}>
              {streakCount} días
            </span>
          </motion.div>
        )}

        {/* Microacciones expandibles */}
        <motion.div
          className="mt-4"
          initial={false}
          animate={{ height: showActions ? 'auto' : 0 }}
          style={{ overflow: 'hidden' }}
        >
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">
              Microacciones para hoy:
            </p>
            {category.microActions.slice(0, 3).map((action, index) => (
              <motion.div
                key={index}
                className={`
                  p-2 rounded-lg text-sm cursor-pointer transition-all
                  ${selectedAction === index 
                    ? 'bg-gradient-to-r text-white' 
                    : 'bg-gray-50 hover:bg-gray-100'
                  }
                `}
                style={{
                  background: selectedAction === index 
                    ? `linear-gradient(135deg, ${category.color}, ${category.softColor})`
                    : undefined
                }}
                onClick={() => setSelectedAction(selectedAction === index ? null : index)}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                {action}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Botón expandir/colapsar */}
        <motion.button
          onClick={() => setShowActions(!showActions)}
          className="w-full mt-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{
            color: category.color,
            backgroundColor: `${category.color}10`,
          }}
          whileHover={{ 
            backgroundColor: `${category.color}20`,
          }}
          whileTap={{ scale: 0.98 }}
        >
          {showActions ? 'Ocultar acciones' : 'Ver microacciones'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}