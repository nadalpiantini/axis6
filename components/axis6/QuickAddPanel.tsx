// Componente QuickAddPanel - Panel para agregar actividades rápidamente
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock, X } from 'lucide-react'
import { AxisIcon } from '@/components/icons'
import type { Axis, Subcategory, QuickAddActivity } from '@/types/axis6-timeline'

interface QuickAddPanelProps {
  axes: Axis[]
  subcategories: Subcategory[]
  selectedAxis?: string | null
  onAddTimeBlock: (activity: QuickAddActivity) => Promise<boolean>
  onClose?: () => void
  className?: string
}

export function QuickAddPanel({
  axes,
  subcategories,
  selectedAxis,
  onAddTimeBlock,
  onClose,
  className = ""
}: QuickAddPanelProps) {
  const [activeAxisId, setActiveAxisId] = useState<string>(selectedAxis || '')
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('')
  const [duration, setDuration] = useState<number>(30)
  const [note, setNote] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Actualizar eje activo cuando se selecciona externamente
  useEffect(() => {
    if (selectedAxis) {
      setActiveAxisId(selectedAxis)
      // Auto-seleccionar primera subcategoría default del eje
      const defaultSubcat = subcategories.find(
        s => s.axis_id === selectedAxis && s.is_default
      )
      if (defaultSubcat) {
        setSelectedSubcategoryId(defaultSubcat.id)
      }
    }
  }, [selectedAxis, subcategories])

  // Filtrar subcategorías del eje activo
  const activeSubcategories = subcategories.filter(s => s.axis_id === activeAxisId)

  // Duraciones predefinidas
  const durations = [15, 30, 45, 60, 90, 120]

  const handleAxisSelect = (axisId: string) => {
    setActiveAxisId(axisId)
    setSelectedSubcategoryId('')
    
    // Auto-seleccionar primera subcategoría default
    const defaultSubcat = subcategories.find(
      s => s.axis_id === axisId && s.is_default
    )
    if (defaultSubcat) {
      setSelectedSubcategoryId(defaultSubcat.id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!activeAxisId || !selectedSubcategoryId) return
    
    setIsSubmitting(true)
    
    try {
      const success = await onAddTimeBlock({
        axis_id: activeAxisId,
        subcategory_id: selectedSubcategoryId,
        duration_minutes: duration,
        note: note.trim() || undefined
      })
      
      if (success) {
        // Resetear form pero mantener eje seleccionado
        setSelectedSubcategoryId('')
        setNote('')
        setDuration(30)
        
        // Auto-seleccionar default subcategory del mismo eje
        const defaultSubcat = subcategories.find(
          s => s.axis_id === activeAxisId && s.is_default
        )
        if (defaultSubcat) {
          setSelectedSubcategoryId(defaultSubcat.id)
        }
      }
    } catch (error) {
      console.error('Error adding activity:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentAxis = axes.find(a => a.id === activeAxisId)

  return (
    <div className={`glass rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Agregar Actividad
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selección de Eje */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Eje
          </label>
          <div className="grid grid-cols-2 gap-2">
            {axes.map(axis => (
              <button
                key={axis.id}
                type="button"
                onClick={() => handleAxisSelect(axis.id)}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  activeAxisId === axis.id
                    ? 'bg-white/20 border-2 border-white/30'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
              >
                <AxisIcon axis={axis.icon} size={16} color={axis.color} />
                <span className="text-xs font-medium truncate">{axis.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selección de Subcategoría */}
        {activeAxisId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Actividad
            </label>
            <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
              {activeSubcategories.map(subcat => (
                <button
                  key={subcat.id}
                  type="button"
                  onClick={() => setSelectedSubcategoryId(subcat.id)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                    selectedSubcategoryId === subcat.id
                      ? 'bg-white/20 border border-white/30'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: currentAxis?.color }}
                  />
                  <span className="text-sm truncate">{subcat.name}</span>
                  {subcat.is_default && (
                    <span className="text-xs bg-white/20 px-1 rounded">★</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Duración */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Duración
          </label>
          <div className="grid grid-cols-3 gap-2">
            {durations.map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setDuration(mins)}
                className={`p-2 rounded-lg text-sm transition-all ${
                  duration === mins
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Nota opcional */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nota (opcional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Detalles adicionales..."
            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={2}
            maxLength={100}
          />
          <div className="text-xs text-gray-500 text-right mt-1">
            {note.length}/100
          </div>
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={!activeAxisId || !selectedSubcategoryId || isSubmitting}
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            !activeAxisId || !selectedSubcategoryId || isSubmitting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Agregando...
            </div>
          ) : (
            `Agregar ${duration}m de ${
              subcategories.find(s => s.id === selectedSubcategoryId)?.name || 'actividad'
            }`
          )}
        </button>
      </form>

      {/* Tips rápidos */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-gray-400 space-y-1">
          <div>💡 Tip: Los ejes balanceados mejoran tu bienestar</div>
          <div>⏰ Bloques de 15-30min son más fáciles de completar</div>
        </div>
      </div>
    </div>
  )
}