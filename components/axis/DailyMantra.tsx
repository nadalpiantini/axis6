'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Sparkles, Heart, Brain, Users, Sun, Briefcase, Palette } from 'lucide-react'

interface MantraCategory {
  key: string
  label: string
  ritualName: string
  color: string
  bgGradient: string
  icon: React.ReactNode
  mantra: string
  microActions: string[]
  movement: string
}

const mantras: MantraCategory[] = [
  {
    key: 'physical',
    label: 'Físico',
    ritualName: 'Movimiento Vivo',
    color: '#C85729',
    bgGradient: 'from-orange-600 to-red-500',
    icon: <Heart className="w-5 h-5" />,
    mantra: 'Hoy habito mi cuerpo con ternura',
    microActions: [
      'Estirarte lentamente al despertar',
      'Caminar 10 minutos escuchando tu respiración',
      'Bailar lo que sientes',
      'Hacer 5 respiraciones profundas',
      'Automasaje consciente'
    ],
    movement: 'latido'
  },
  {
    key: 'mental',
    label: 'Mental',
    ritualName: 'Claridad Interna',
    color: '#6B7280',
    bgGradient: 'from-gray-500 to-gray-600',
    icon: <Brain className="w-5 h-5" />,
    mantra: 'Hoy hago espacio para pensar menos',
    microActions: [
      'Leer 1 página nutritiva',
      'Apagar notificaciones por 30 minutos',
      'Respirar antes de responder',
      'Anotar una idea',
      'Hacer una pausa consciente'
    ],
    movement: 'fade'
  },
  {
    key: 'art',
    label: 'Arte',
    ritualName: 'Expresión Creadora',
    color: '#A78BFA',
    bgGradient: 'from-purple-400 to-violet-500',
    icon: <Palette className="w-5 h-5" />,
    mantra: 'Hoy no creo para mostrar, creo para liberar',
    microActions: [
      'Escribir sin editar',
      'Pintar o colorear',
      'Grabar un audio personal',
      'Improvisar una melodía',
      'Compartir algo imperfecto'
    ],
    movement: 'expand'
  },
  {
    key: 'social',
    label: 'Social',
    ritualName: 'Vínculo Espejo',
    color: '#10B981',
    bgGradient: 'from-emerald-400 to-green-500',
    icon: <Users className="w-5 h-5" />,
    mantra: 'Hoy me vinculo sin desaparecer',
    microActions: [
      'Enviar mensaje auténtico',
      'Llamar a alguien solo para escuchar',
      'Poner un límite claro',
      'Compartir algo vulnerable',
      'Hacer una pregunta sincera'
    ],
    movement: 'wave'
  },
  {
    key: 'spiritual',
    label: 'Espiritual',
    ritualName: 'Presencia Elevada',
    color: '#4C1D95',
    bgGradient: 'from-purple-700 to-indigo-800',
    icon: <Sun className="w-5 h-5" />,
    mantra: 'Hoy me encuentro más allá del hacer',
    microActions: [
      'Meditar 3 minutos',
      'Leer un texto sagrado',
      'Orar o agradecer',
      'Mirar el cielo',
      'Escuchar silencio'
    ],
    movement: 'pulse'
  },
  {
    key: 'material',
    label: 'Material',
    ritualName: 'Sustento Terrenal',
    color: '#B45309',
    bgGradient: 'from-amber-600 to-yellow-700',
    icon: <Briefcase className="w-5 h-5" />,
    mantra: 'Hoy me sostengo, no me demuestro',
    microActions: [
      'Completar una tarea con presencia',
      'Revisar finanzas sin miedo',
      'Organizar tu espacio',
      'Decidir no producir más hoy',
      'Dar valor al trabajo invisible'
    ],
    movement: 'vibrate'
  }
]

const movementVariants = {
  latido: {
    scale: [1, 1.1, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  },
  fade: {
    opacity: [1, 0.5, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  expand: {
    scale: [1, 1.2, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  },
  wave: {
    x: [0, 10, -10, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  pulse: {
    boxShadow: [
      "0 0 0 0 rgba(76, 29, 149, 0)",
      "0 0 0 10px rgba(76, 29, 149, 0.2)",
      "0 0 0 20px rgba(76, 29, 149, 0)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeOut" }
  },
  vibrate: {
    x: [0, -2, 2, -2, 2, 0],
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 }
  }
}

export default function DailyMantra() {
  const [selectedMantra, setSelectedMantra] = useState(0)
  const [showMicroAction, setShowMicroAction] = useState(false)
  
  const currentMantra = mantras[selectedMantra]
  const randomAction = currentMantra.microActions[
    Math.floor(Math.random() * currentMantra.microActions.length)
  ]

  useEffect(() => {
    // Cambiar mantra cada 10 segundos
    const interval = setInterval(() => {
      setSelectedMantra((prev) => (prev + 1) % mantras.length)
      setShowMicroAction(false)
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMantra.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Tarjeta principal */}
          <motion.div
            className={`card-soft bg-gradient-to-br ${currentMantra.bgGradient} text-white relative overflow-hidden`}
            animate={movementVariants[currentMantra.movement as keyof typeof movementVariants]}
          >
            {/* Patrón de fondo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent transform rotate-45" />
            </div>

            {/* Contenido */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="p-3 bg-white/20 rounded-full backdrop-blur-sm"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {currentMantra.icon}
                </motion.div>
                <div>
                  <p className="text-sm opacity-90">{currentMantra.label}</p>
                  <h3 className="text-xl font-bold">{currentMantra.ritualName}</h3>
                </div>
              </div>

              {/* Mantra */}
              <motion.p
                className="text-2xl font-serif italic mb-6 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                "{currentMantra.mantra}"
              </motion.p>

              {/* Microacción sugerida */}
              <motion.div
                className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: showMicroAction ? 'auto' : 0, opacity: showMicroAction ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {showMicroAction && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Microacción para hoy:
                    </p>
                    <p className="text-lg">{randomAction}</p>
                  </div>
                )}
              </motion.div>

              {/* Botón de acción */}
              <motion.button
                onClick={() => setShowMicroAction(!showMicroAction)}
                className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showMicroAction ? 'Ocultar' : 'Mostrar microacción'}
              </motion.button>
            </div>
          </motion.div>

          {/* Indicadores de navegación */}
          <div className="flex justify-center gap-2 mt-6">
            {mantras.map((mantra, index) => (
              <motion.button
                key={mantra.key}
                onClick={() => {
                  setSelectedMantra(index)
                  setShowMicroAction(false)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === selectedMantra ? 'w-8' : ''
                }`}
                style={{
                  backgroundColor: index === selectedMantra ? mantra.color : `${mantra.color}40`
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}