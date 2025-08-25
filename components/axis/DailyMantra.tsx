'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Sparkles, Heart, Brain, Users, Sun, Briefcase, Palette, Check, Loader2 } from 'lucide-react'

interface Mantra {
  id: number
  category_id: number
  content: { es?: string; en?: string }
  author: string
  category_name: { es?: string; en?: string }
  category_color: string
  is_completed: boolean
}

// Icon mapping for categories
const categoryIcons: Record<number, React.ReactNode> = {
  1: <Heart className="w-5 h-5" />,     // Physical
  2: <Brain className="w-5 h-5" />,     // Mental
  3: <Palette className="w-5 h-5" />,   // Emotional
  4: <Users className="w-5 h-5" />,     // Social
  5: <Sun className="w-5 h-5" />,       // Spiritual
  6: <Briefcase className="w-5 h-5" />  // Material
}

// Gradient mapping for categories
const categoryGradients: Record<number, string> = {
  1: 'from-physical/80 to-physical/40',
  2: 'from-mental/80 to-mental/40',
  3: 'from-emotional/80 to-emotional/40',
  4: 'from-social/80 to-social/40',
  5: 'from-spiritual/80 to-spiritual/40',
  6: 'from-material/80 to-material/40'
}

// Ritual names for categories
const ritualNames: Record<number, { es: string; en: string }> = {
  1: { es: 'Movimiento Vivo', en: 'Living Movement' },
  2: { es: 'Claridad Interna', en: 'Inner Clarity' },
  3: { es: 'Expresión Emocional', en: 'Emotional Expression' },
  4: { es: 'Vínculo Espejo', en: 'Mirror Connection' },
  5: { es: 'Presencia Elevada', en: 'Elevated Presence' },
  6: { es: 'Sustento Terrenal', en: 'Earthly Sustenance' }
}

// Micro-actions for each category
const microActions: Record<number, string[]> = {
  1: [
    'Stretch slowly upon waking',
    'Walk 10 minutes listening to your breath',
    'Dance what you feel',
    'Take 5 deep breaths',
    'Conscious self-massage'
  ],
  2: [
    'Read 1 nourishing page',
    'Turn off notifications for 30 minutes',
    'Breathe before responding',
    'Write down an idea',
    'Take a conscious pause'
  ],
  3: [
    'Write your emotions without editing',
    'Listen to music that moves you',
    'Express gratitude to someone',
    'Cry if you need to',
    'Hug someone or yourself'
  ],
  4: [
    'Send an authentic message',
    'Call someone just to listen',
    'Set a clear boundary',
    'Share something vulnerable',
    'Ask a sincere question'
  ],
  5: [
    'Meditate for 3 minutes',
    'Read a sacred text',
    'Pray or give thanks',
    'Look at the sky',
    'Listen to silence'
  ],
  6: [
    'Complete a task with presence',
    'Review finances without fear',
    'Organize your space',
    'Decide not to produce more today',
    'Value invisible work'
  ]
}

// Movement animations for different categories
const movementVariants: Record<number, any> = {
  1: { // Physical - heartbeat
    scale: [1, 1.1, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  },
  2: { // Mental - fade
    opacity: [1, 0.7, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  3: { // Emotional - expand
    scale: [1, 1.05, 1],
    opacity: [0.9, 1, 0.9],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  },
  4: { // Social - wave
    x: [0, 5, -5, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  5: { // Spiritual - pulse
    boxShadow: [
      "0 0 0 0 rgba(76, 29, 149, 0)",
      "0 0 0 10px rgba(76, 29, 149, 0.1)",
      "0 0 0 20px rgba(76, 29, 149, 0)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeOut" }
  },
  6: { // Material - vibrate
    x: [0, -1, 1, -1, 1, 0],
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
  }
}

export default function DailyMantra() {
  const [mantra, setMantra] = useState<Mantra | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showMicroAction, setShowMicroAction] = useState(false)
  const [showReflection, setShowReflection] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDailyMantra()
  }, [])

  const fetchDailyMantra = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/mantras')
      
      if (!response.ok) {
        throw new Error('Failed to fetch mantra')
      }

      const data = await response.json()
      if (data.mantra) {
        setMantra(data.mantra)
      }
    } catch (err) {
      // Log error in development only
      if (process.env['NODE_ENV'] === 'development') {
        console.error('Error fetching mantra:', err)
      }
      setError('No se pudo cargar el mantra del día')
    } finally {
      setLoading(false)
    }
  }

  const completeMantra = async () => {
    if (!mantra || mantra.is_completed) return

    try {
      setCompleting(true)
      const response = await fetch('/api/mantras', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to complete mantra')
      }

      // Update local state
      setMantra({ ...mantra, is_completed: true })
      setShowReflection(true)
      
      // Hide reflection after 3 seconds
      setTimeout(() => {
        setShowReflection(false)
      }, 3000)
    } catch (err) {
      // Log error in development only
      if (process.env['NODE_ENV'] === 'development') {
        console.error('Error completing mantra:', err)
      }
    } finally {
      setCompleting(false)
    }
  }

  const getMantraText = (content: { es?: string; en?: string }) => {
    return content.es || content.en || ''
  }

  const getCategoryName = (name: { es?: string; en?: string }) => {
    return name.es || name.en || 'Equilibrio'
  }

  const getRitualName = (categoryId: number) => {
    return ritualNames[categoryId]?.es || 'Ritual Diario'
  }

  const getRandomAction = (categoryId: number) => {
    const actions = microActions[categoryId] || []
    return actions[Math.floor(Math.random() * actions.length)]
  }

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="card-soft bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-textSecondary" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !mantra) {
    return null // Silently fail if no mantra available
  }

  const randomAction = getRandomAction(mantra.category_id)

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Tarjeta principal */}
        <motion.div
          className={`card-soft text-white relative overflow-hidden ${categoryGradients[mantra.category_id] || 'from-gray-600 to-gray-700'}`}
          style={{
            background: `linear-gradient(135deg, ${mantra.category_color}80, ${mantra.category_color}40)`
          }}
          animate={movementVariants[mantra.category_id] || {}}
        >
          {/* Patrón de fondo */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent transform rotate-45" />
          </div>

          {/* Contenido */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-3 bg-white/20 rounded-full backdrop-blur-sm"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {categoryIcons[mantra.category_id] || <Sparkles className="w-5 h-5" />}
                </motion.div>
                <div>
                  <p className="text-sm opacity-90">{getCategoryName(mantra.category_name)}</p>
                  <h3 className="text-xl font-bold">{getRitualName(mantra.category_id)}</h3>
                </div>
              </div>
              
              {/* Status Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  mantra.is_completed 
                    ? 'bg-green-500/30 text-green-100'
                    : 'bg-white/20 text-white/80'
                }`}
              >
                {mantra.is_completed ? '✓ Completado' : 'Pendiente'}
              </motion.div>
            </div>

            {/* Mantra */}
            <motion.p
              className="text-2xl font-serif italic mb-6 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              &ldquo;{getMantraText(mantra.content)}&rdquo;
            </motion.p>

            {mantra.author && (
              <p className="text-sm opacity-80 mb-4">— {mantra.author}</p>
            )}

            {/* Microacción sugerida */}
            <AnimatePresence>
              {showMicroAction && (
                <motion.div
                  className="mb-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Microacción para hoy:
                  </p>
                  <p className="text-lg">{randomAction}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <motion.button
                onClick={() => setShowMicroAction(!showMicroAction)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showMicroAction ? 'Ocultar acción' : 'Ver microacción'}
              </motion.button>

              {!mantra.is_completed && (
                <motion.button
                  onClick={completeMantra}
                  disabled={completing}
                  className="flex-1 px-4 py-2 bg-white/30 hover:bg-white/40 rounded-full backdrop-blur-sm transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {completing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Reflexionando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      He reflexionado sobre esto
                    </span>
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Reflection Overlay */}
          <AnimatePresence>
            {showReflection && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-md
                           rounded-2xl flex items-center justify-center z-20"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center text-gray-800 p-6"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1 }}
                    className="w-16 h-16 mx-auto mb-3"
                    style={{ color: mantra.category_color }}
                  >
                    <Sparkles className="w-full h-full" />
                  </motion.div>
                  <h3 className="text-lg font-serif font-bold mb-1">
                    ¡Excelente!
                  </h3>
                  <p className="text-sm opacity-90">
                    La reflexión nutre tu crecimiento
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  )
}