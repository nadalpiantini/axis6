'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface MoodSelectorProps {
  onMoodSelect?: (mood: string) => void
  selectedMood?: string
}

const moods = [
  { id: 'terrible', emoji: '😢', label: 'Terrible', color: '#EF4444' },
  { id: 'bad', emoji: '😔', label: 'Mal', color: '#F97316' },
  { id: 'okay', emoji: '😐', label: 'Regular', color: '#EAB308' },
  { id: 'good', emoji: '😊', label: 'Bien', color: '#22C55E' },
  { id: 'great', emoji: '😄', label: 'Excelente', color: '#10B981' }
]

export default function MoodSelector({ onMoodSelect, selectedMood }: MoodSelectorProps) {
  const [hoveredMood, setHoveredMood] = useState<string | null>(null)
  const [selected, setSelected] = useState(selectedMood || '')

  const handleMoodSelect = (moodId: string) => {
    setSelected(moodId)
    onMoodSelect?.(moodId)
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          ¿Cómo te sientes hoy?
        </h3>
        <p className="text-sm text-gray-400">
          Tu estado de ánimo es importante para tu bienestar
        </p>
      </div>

      <div className="flex justify-center items-center gap-4">
        {moods.map((mood, index) => {
          const isSelected = selected === mood.id
          const isHovered = hoveredMood === mood.id

          return (
            <motion.div
              key={mood.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleMoodSelect(mood.id)}
                onMouseEnter={() => setHoveredMood(mood.id)}
                onMouseLeave={() => setHoveredMood(null)}
                className={`
                  relative text-4xl sm:text-5xl p-3 sm:p-4 rounded-2xl transition-all duration-300
                  ${isSelected
                    ? 'bg-white/20 shadow-lg shadow-white/10'
                    : 'bg-white/5 hover:bg-white/10'
                  }
                `}
                style={{
                  boxShadow: isSelected ? `0 0 30px ${mood.color}40` : undefined
                }}
              >
                <span className="block transform transition-transform">
                  {mood.emoji}
                </span>

                {/* Glow effect */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: `radial-gradient(circle at center, ${mood.color}20, transparent)`,
                      filter: 'blur(20px)'
                    }}
                  />
                )}

                {/* Pulse animation for selected */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2"
                    style={{ borderColor: mood.color }}
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.button>

              {/* Label */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isSelected || isHovered ? 1 : 0.5,
                  scale: isSelected ? 1.1 : 1
                }}
                className="text-xs font-medium transition-all"
                style={{
                  color: isSelected ? mood.color : 'rgba(255, 255, 255, 0.6)'
                }}
              >
                {mood.label}
              </motion.span>
            </motion.div>
          )
        })}
      </div>

      {/* Mood message */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-300">
            {selected === 'terrible' && '💙 Recuerda que está bien no estar bien. Mañana será un mejor día.'}
            {selected === 'bad' && '🤗 Los días difíciles nos hacen más fuertes. ¡Ánimo!'}
            {selected === 'okay' && '✨ Un día regular también es un buen día. Sigue adelante.'}
            {selected === 'good' && '🎉 ¡Qué bueno que te sientes bien! Mantén esa energía.'}
            {selected === 'great' && '🌟 ¡Excelente! Tu energía positiva es contagiosa.'}
          </p>
        </motion.div>
      )}
    </div>
  )
}
