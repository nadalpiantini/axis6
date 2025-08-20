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
        ease: "easeInOut" as const
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
        ease: "easeInOut" as const
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
        ease: "easeOut" as const
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
          ritual-card relative overflow-hidden p-6
          transition-all duration-500 group-hover:shadow-2xl
          ${isCompleted 
            ? 'border-2 border-white/40 shadow-2xl' 
            : 'border border-white/30 hover:border-white/50'
          }
        `}
        style={{
          background: isCompleted 
            ? `linear-gradient(135deg, ${category.color}25, ${category.softColor}35, rgba(255,255,255,0.9))`
            : undefined
        }}
        variants={animation}
      >
        {/* THE RITUAL OS - Organic background pattern */}
        <div className="absolute inset-0 concentric-organic opacity-20" />
        <div className="absolute top-0 right-0 w-24 h-24 organic-blob opacity-10"
             style={{
               background: `radial-gradient(ellipse 80% 120% at 30% 70%, ${category.color}40, transparent 70%)`
             }} />
        
        {/* Flowing accent */}
        <div className="absolute bottom-0 left-0 w-full h-2 organic-wave opacity-30"
             style={{ backgroundColor: `${category.color}20` }} />

        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <motion.div
              className={`
                p-3 rounded-2xl flex items-center justify-center backdrop-blur-sm
                ${isCompleted 
                  ? 'bg-white/95 shadow-lg' 
                  : 'bg-gradient-to-br from-white/60 to-white/40 border border-white/30'
                }
              `}
              style={{
                background: !isCompleted 
                  ? `linear-gradient(135deg, ${category.softColor}60, rgba(255,255,255,0.8))`
                  : undefined,
                boxShadow: isCompleted 
                  ? `0 4px 20px ${category.color}20`
                  : undefined
              }}
              whileHover={{ 
                rotate: 360,
                scale: 1.05,
                boxShadow: `0 8px 25px ${category.color}30`
              }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            >
              <Icon 
                className={`w-6 h-6 ritual-icon ${isCompleted ? 'ritual-pulse' : ''}`}
                style={{ color: isCompleted ? category.color : category.darkColor }}
              />
            </motion.div>
            
            <div>
              <h3 
                className="font-serif font-bold text-lg leading-tight"
                style={{ color: category.darkColor }}
              >
                {category.ritualName}
              </h3>
              <p className="text-sm text-gray-600/80 font-medium">{category.label}</p>
            </div>
          </div>

          {/* Botón de completado - THE RITUAL OS style */}
          <motion.button
            onClick={onToggle}
            className={`
              relative p-2 rounded-2xl backdrop-blur-sm transition-all duration-300
              ${isCompleted 
                ? 'bg-white/90 shadow-lg' 
                : 'bg-white/40 hover:bg-white/60 border border-white/30'
              }
            `}
            whileHover={{ 
              scale: 1.1,
              rotate: isCompleted ? 0 : 15,
              boxShadow: `0 4px 20px ${category.color}30`
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: isCompleted 
                ? `0 4px 15px ${category.color}25`
                : undefined
            }}
          >
            {isCompleted ? (
              <CheckCircle2 
                className="w-6 h-6 ritual-pulse"
                style={{ color: category.color }}
              />
            ) : (
              <Circle 
                className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
              />
            )}
          </motion.button>
        </div>

        {/* Mantra - THE RITUAL OS style */}
        <motion.p
          className="text-sm italic text-gray-700/90 mb-5 font-serif leading-relaxed relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <span className="text-2xl font-serif" style={{ color: `${category.color}60` }}>&ldquo;</span>
          {category.mantra}
          <span className="text-2xl font-serif" style={{ color: `${category.color}60` }}>&rdquo;</span>
        </motion.p>

        {/* Streak indicator - THE RITUAL OS style */}
        {streakCount > 0 && (
          <motion.div
            className="flex items-center gap-3 mb-4 relative z-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex gap-1.5">
              {[...Array(Math.min(streakCount, 7))].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ 
                    background: `linear-gradient(135deg, ${category.color}, ${category.darkColor})`,
                    boxShadow: `0 2px 4px ${category.color}30`
                  }}
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  transition={{ 
                    delay: 0.4 + i * 0.1, 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 200
                  }}
                />
              ))}
            </div>
            <motion.span 
              className="text-sm font-semibold px-2 py-1 rounded-full bg-white/60 backdrop-blur-sm"
              style={{ color: category.darkColor }}
              whileHover={{ scale: 1.05 }}
            >
              {streakCount} días
            </motion.span>
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

        {/* Botón expandir/colapsar - THE RITUAL OS style */}
        <motion.button
          onClick={() => setShowActions(!showActions)}
          className="w-full mt-4 py-3 text-sm font-semibold rounded-2xl backdrop-blur-sm border border-white/20 transition-all duration-300 relative z-10"
          style={{
            color: category.darkColor,
            background: `linear-gradient(135deg, ${category.softColor}40, rgba(255,255,255,0.6))`,
          }}
          whileHover={{ 
            scale: 1.02,
            background: `linear-gradient(135deg, ${category.softColor}60, rgba(255,255,255,0.8))`,
            boxShadow: `0 4px 15px ${category.color}20`
          }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: showActions ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              ↓
            </motion.span>
            {showActions ? 'Ocultar acciones' : 'Ver microacciones'}
          </span>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}