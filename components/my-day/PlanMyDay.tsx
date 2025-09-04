'use client'
import React from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Sparkles,
  Clock,
  Calendar,
  Loader2,
  ChevronRight,
  Check,
  AlertCircle
} from 'lucide-react'
import { useState } from 'react'
import { AxisIcon } from '@/components/icons'
import { useCreateTimeBlock } from '@/lib/react-query/hooks/useMyDay'
import { handleError } from '@/lib/error/standardErrorHandler'
import { getLocalizedText } from '@/lib/utils/i18n'
interface PlanMyDayProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  categories: any[]
  selectedDate: Date
  existingBlocks?: any[]
}
interface SuggestedBlock {
  category_id: number
  activity_name: string
  start_time: string
  duration_minutes: number
  notes?: string
  reason?: string
}
export function PlanMyDay({
  isOpen,
  onClose,
  userId,
  categories,
  selectedDate,
  existingBlocks = []
}: PlanMyDayProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestedPlan, setSuggestedPlan] = useState<SuggestedBlock[]>([])
  const [selectedBlocks, setSelectedBlocks] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const createTimeBlock = useCreateTimeBlock()
  // AI-powered plan generation (mock for now - would connect to actual AI service)
  const generateDayPlan = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Personal activity suggestions for a balanced day
      const personalActivities = [
        'Llamar a mamá', 'Buscar niños al colegio', 'Ir al gimnasio', 'Leer libro favorito',
        'Meditar 10 minutos', 'Revisar gastos del mes', 'Caminar 20 minutos', 'Almorzar con amigo',
        'Orar 15 minutos', 'Organizar documentos', 'Hacer yoga en casa', 'Estudiar curso online',
        'Escribir gratitudes', 'Pagar facturas', 'Pasear al perro', 'Llamar hermano/a',
        'Reflexionar sobre propósito', 'Comprar cosas necesarias', 'Jugar con hijos', 'Planificar semana'
      ];

      const suggestions: SuggestedBlock[] = [
        {
          category_id: categories.find(c => c.slug === 'social')?.id || '',
          activity_name: 'Llamar a mamá',
          start_time: '08:00',
          duration_minutes: 20,
          notes: 'Comenzar día conectando con familia'
        },
        {
          category_id: categories.find(c => c.slug === 'physical')?.id || '',
          activity_name: 'Caminar 20 minutos',
          start_time: '09:30',
          duration_minutes: 20,
          notes: 'Activación física matutina'
        },
        {
          category_id: categories.find(c => c.slug === 'mental')?.id || '',
          activity_name: 'Leer 30 páginas libro',
          start_time: '11:00',
          duration_minutes: 45,
          notes: 'Tiempo de aprendizaje concentrado'
        },
        {
          category_id: categories.find(c => c.slug === 'social')?.id || '',
          activity_name: 'Buscar niños al colegio',
          start_time: '15:30',
          duration_minutes: 30,
          notes: 'Tiempo con familia'
        },
        {
          category_id: categories.find(c => c.slug === 'emotional')?.id || '',
          activity_name: 'Escribir gratitudes',
          start_time: '18:00',
          duration_minutes: 15,
          notes: 'Reflexión sobre el día'
        },
        {
          category_id: categories.find(c => c.slug === 'material')?.id || '',
          activity_name: 'Revisar gastos del mes',
          start_time: '20:00',
          duration_minutes: 30,
          notes: 'Organización financiera'
        }
      ].filter(s => s.category_id) // Only include suggestions with valid category IDs
      // Filter out times that conflict with existing blocks
      const nonConflicting = suggestions.filter(suggestion => {
        const sugStart = parseInt(suggestion.start_time.replace(':', ''))
        const sugEnd = sugStart + Math.round(suggestion.duration_minutes / 60 * 100)
        return !existingBlocks.some(block => {
          const blockStart = parseInt(block.start_time.replace(':', ''))
          const blockEnd = parseInt(block.end_time.replace(':', ''))
          return (sugStart >= blockStart && sugStart < blockEnd) ||
                 (sugEnd > blockStart && sugEnd <= blockEnd)
        })
      })
      setSuggestedPlan(nonConflicting)
      // Auto-select all suggestions
      setSelectedBlocks(new Set(nonConflicting.map((_, i) => i)))
    } catch (err) {
                setError('Failed to generate plan. Please try again.')
          handleError(error, {
      operation: 'plan_my_day', component: 'PlanMyDay',
            userMessage: 'Failed to plan your day. Please try again.'
          })
          // Error logged via handleError
        } finally {
      setIsGenerating(false)
    }
  }
  const toggleBlockSelection = (index: number) => {
    const newSelection = new Set(selectedBlocks)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedBlocks(newSelection)
  }
  const applySelectedBlocks = async () => {
    if (selectedBlocks.size === 0) return
    try {
      const blocksToCreate = suggestedPlan.filter((_, i) => selectedBlocks.has(i))
      for (const block of blocksToCreate) {
        const endTime = calculateEndTime(block.start_time, block.duration_minutes)
        await createTimeBlock.mutateAsync({
          user_id: userId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          category_id: block.category_id.toString(), // Convert numeric ID to string
          activity_id: null,
          activity_name: block.activity_name,
          start_time: block.start_time,
          end_time: endTime,
          notes: block.notes || '',
          status: 'planned' as const
        })
      }
      onClose()
    } catch (error) {
      setError('Failed to create time blocks. Please try again.')
      handleError(error, {
      operation: 'plan_my_day', component: 'PlanMyDay',
        userMessage: 'Failed to plan your day. Please try again.'
      })
            // Error logged via handleError
    }
  }
  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + duration
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }
  const getCategoryData = (categoryId: number) => {
    return categories.find(c => c.id === categoryId)
  }
  if (!isOpen) return null
  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          {/* Modal - Perfect centering with flexbox */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50"
          >
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-yellow-900/50 to-purple-900/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Plan My Day
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              {/* Content */}
              <div className="p-4 sm:p-6">
                {!suggestedPlan.length && !isGenerating && (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Planifica tu Día Personal
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Organiza tu día con actividades personales específicas como "llamar a mamá", 
                      "buscar niños al colegio", distribuidas en el hexágono de balance.
                    </p>
                    <button
                      onClick={generateDayPlan}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all flex items-center gap-2 mx-auto"
                    >
                      <Sparkles className="w-5 h-5" />
                      Crear Mi Día Perfecto
                    </button>
                  </div>
                )}
                {isGenerating && (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Organizando tu Hexágono...
                    </h3>
                    <p className="text-gray-400">
                      Creando un horario balanceado con tus actividades personales
                    </p>
                  </div>
                )}
                {error && (
                  <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  </div>
                )}
                {suggestedPlan.length > 0 && !isGenerating && (
                  <React.Fragment>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-white mb-2">
                        Tu Horario Personal
                      </h3>
                      <p className="text-sm text-gray-400">
                        Selecciona las actividades que quieres agregar a tu hexágono del día
                      </p>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {suggestedPlan.map((block, index) => {
                        const category = getCategoryData(block.category_id)
                        const isSelected = selectedBlocks.has(index)
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => toggleBlockSelection(index)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-purple-500/20 border-purple-500/40'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg transition-all ${
                                isSelected ? 'bg-purple-500/30' : 'bg-white/10'
                              }`}>
                                {isSelected ? (
                                  <Check className="w-4 h-4 text-purple-400" />
                                ) : (
                                  <div className="w-4 h-4 border border-gray-400 rounded" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {category && (
                                    <React.Fragment>
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                      />
                                      <AxisIcon
                                        axis={category.icon}
                                        size={16}
                                        color={category.color}
                                      />
                                      <span className="text-xs text-gray-400">
                                        {getLocalizedText(category.name, 'en', category.slug)}
                                      </span>
                                    </React.Fragment>
                                  )}
                                  <span className="text-xs text-gray-500">•</span>
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-400">
                                    {block.start_time} ({block.duration_minutes}min)
                                  </span>
                                </div>
                                <h4 className="text-white font-medium mb-1">
                                  {block.activity_name}
                                </h4>
                                {block.notes && (
                                  <p className="text-sm text-gray-400 mb-1">
                                    {block.notes}
                                  </p>
                                )}
                                {block.reason && (
                                  <p className="text-xs text-purple-400 italic">
                                    <ChevronRight className="w-3 h-3 inline" />
                                    {block.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </React.Fragment>
                )}
              </div>
              {/* Footer */}
              {suggestedPlan.length > 0 && !isGenerating && (
                <div className="p-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">
                      {selectedBlocks.size} of {suggestedPlan.length} blocks selected
                    </span>
                    <button
                      onClick={() => setSelectedBlocks(new Set(suggestedPlan.map((_, i) => i)))}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSuggestedPlan([])
                        setSelectedBlocks(new Set())
                      }}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                    >
                      Regenerar Día
                    </button>
                    <button
                      onClick={applySelectedBlocks}
                      disabled={selectedBlocks.size === 0 || createTimeBlock.isPending}
                      className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      {createTimeBlock.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                      Agregar al Hexágono
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  )
}
