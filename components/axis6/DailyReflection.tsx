// Componente DailyReflection - Reemplaza DailyMantraCard
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Save, Sparkles } from 'lucide-react'

interface DailyReflectionProps {
  reflection?: string
  onSave: (text: string) => Promise<boolean>
  className?: string
}

export function DailyReflection({ 
  reflection, 
  onSave, 
  className = "" 
}: DailyReflectionProps) {
  const [text, setText] = useState(reflection || '')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showPrompts, setShowPrompts] = useState(false)

  // Actualizar cuando cambie la reflection externa
  useEffect(() => {
    if (reflection !== undefined) {
      setText(reflection)
    }
  }, [reflection])

  // Auto-save después de 2 segundos de inactividad
  useEffect(() => {
    if (text === reflection) return // No cambios

    const timer = setTimeout(async () => {
      if (text.trim() && text !== reflection) {
        await handleSave()
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [text, reflection])

  const handleSave = async () => {
    if (!text.trim()) return
    
    setIsSaving(true)
    
    try {
      const success = await onSave(text.trim())
      if (success) {
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Error saving reflection:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleManualSave = async () => {
    await handleSave()
  }

  const promptSuggestions = [
    "¿Por qué agradeces hoy?",
    "¿Qué aprendiste de ti mismo?",
    "¿Cómo te sientes con tu balance de hoy?",
    "¿Qué eje necesita más atención mañana?",
    "¿Cuál fue tu momento más significativo?",
    "¿Qué mejorarías de tu día?"
  ]

  const insertPrompt = (prompt: string) => {
    setText(prev => prev ? `${prev}\n\n${prompt} ` : `${prompt} `)
    setShowPrompts(false)
  }

  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Reflexión del Día
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Indicador de estado */}
          {isSaving ? (
            <div className="flex items-center gap-1 text-xs text-yellow-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Guardando...
            </div>
          ) : lastSaved ? (
            <div className="text-xs text-green-400">
              Guardado
            </div>
          ) : text && text !== reflection ? (
            <div className="text-xs text-gray-400">
              Sin guardar
            </div>
          ) : null}
          
          {/* Botón de prompts */}
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Ideas para reflexionar"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>

      {/* Prompts sugeridos */}
      {showPrompts && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-3 space-y-1"
        >
          <div className="text-xs text-gray-400 mb-2">Ideas para reflexionar:</div>
          {promptSuggestions.map((prompt, index) => (
            <button
              key={index}
              onClick={() => insertPrompt(prompt)}
              className="block w-full text-left text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded transition-colors"
            >
              {prompt}
            </button>
          ))}
        </motion.div>
      )}

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="¿Cómo fue tu día? ¿Qué aprendiste? ¿Por qué agradeces?

Reflexiona sobre tu balance, tus logros y lo que mejorarías mañana..."
        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        rows={6}
        maxLength={500}
      />
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <span className="text-gray-500">
          {text.length}/500 caracteres
        </span>
        
        {text && text !== reflection && (
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded transition-colors"
          >
            <Save className="w-3 h-3" />
            Guardar ahora
          </button>
        )}
      </div>
      
      {/* Mensaje motivacional */}
      {!text && (
        <div className="mt-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
          <div className="text-xs text-purple-300 mb-1">💭 Reflexiona sobre tu día</div>
          <div className="text-xs text-gray-400">
            La reflexión diaria te ayuda a ser más consciente de tu crecimiento y balance personal.
          </div>
        </div>
      )}
    </div>
  )
}