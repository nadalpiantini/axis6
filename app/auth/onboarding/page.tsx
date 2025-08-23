'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Brain, Heart, Users, Target, Briefcase, ChevronRight, Check } from 'lucide-react'
import { motion } from 'framer-motion'

const availableAxes = [
  { id: 'spiritual', name: 'Espiritual', icon: Sparkles, color: 'from-purple-400 to-purple-600', description: 'Meditación, gratitud y propósito de vida' },
  { id: 'mental', name: 'Mental', icon: Brain, color: 'from-blue-400 to-blue-600', description: 'Aprendizaje, enfoque y productividad' },
  { id: 'emotional', name: 'Emocional', icon: Heart, color: 'from-red-400 to-red-600', description: 'Gestión emocional y bienestar psicológico' },
  { id: 'social', name: 'Social', icon: Users, color: 'from-green-400 to-green-600', description: 'Relaciones, familia y conexiones' },
  { id: 'physical', name: 'Físico', icon: Target, color: 'from-orange-400 to-orange-600', description: 'Ejercicio, nutrición y salud' },
  { id: 'material', name: 'Material', icon: Briefcase, color: 'from-yellow-400 to-yellow-600', description: 'Finanzas, carrera y recursos' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selectedAxes, setSelectedAxes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleAxis = (axisId: string) => {
    if (selectedAxes.includes(axisId)) {
      setSelectedAxes(selectedAxes.filter(id => id !== axisId))
    } else if (selectedAxes.length < 6) {
      setSelectedAxes([...selectedAxes, axisId])
    }
  }

  const handleSubmit = async () => {
    if (selectedAxes.length !== 6) return
    
    setLoading(true)
    // TODO: Save selected axes to Supabase
    setTimeout(() => {
      router.push('/dashboard')
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Personaliza tu AXIS6
          </h1>
          <p className="text-gray-400">
            Selecciona las 6 dimensiones que quieres equilibrar en tu vida
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-white">{selectedAxes.length}</span>
            <span className="text-gray-400">/ 6 seleccionadas</span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {availableAxes.map((axis, index) => {
            const Icon = axis.icon
            const isSelected = selectedAxes.includes(axis.id)
            
            return (
              <motion.div
                key={axis.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => toggleAxis(axis.id)}
                className={`relative glass rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'ring-2 ring-purple-400 bg-white/20' 
                    : 'hover:bg-white/10'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${axis.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-1">{axis.name}</h3>
                <p className="text-sm text-gray-400">{axis.description}</p>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center"
        >
          <button
            onClick={handleSubmit}
            disabled={selectedAxes.length !== 6 || loading}
            className={`px-8 py-4 rounded-xl font-semibold text-white flex items-center gap-2 transition-all duration-300 ${
              selectedAxes.length === 6
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50'
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? 'Configurando...' : 'Comenzar mi viaje'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {selectedAxes.length === 6 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-4 text-green-400"
          >
            ¡Perfecto! Has seleccionado tus 6 dimensiones
          </motion.p>
        )}
      </div>
    </div>
  )
}