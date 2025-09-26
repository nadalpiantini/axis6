// Hook para manejar el sistema timeline con fallback automático
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { 
  Axis, 
  Subcategory, 
  TimeBlock, 
  DayData, 
  DailyReflection,
  AvailableSlot,
  QuickAddActivity 
} from '@/types/axis6-timeline'

export function useTimelineSystem(userId?: string) {
  const [isTimelineAvailable, setIsTimelineAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [axes, setAxes] = useState<Axis[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dayData, setDayData] = useState<DayData>({
    date: format(new Date(), 'yyyy-MM-dd'),
    timeblocks: [],
    axis_minutes: {}
  })

  const supabase = createClient()

  // Verificar si el sistema timeline está disponible
  const checkTimelineAvailability = useCallback(async () => {
    try {
      // Intentar hacer una query simple a las nuevas tablas
      const { error: axesError } = await supabase
        .from('axis6_axes')
        .select('id')
        .limit(1)

      if (!axesError) {
        setIsTimelineAvailable(true)
        return true
      }
      
      console.log('Timeline system not available, using fallback')
      setIsTimelineAvailable(false)
      return false
    } catch (e) {
      console.log('Timeline system check failed:', e)
      setIsTimelineAvailable(false)
      return false
    }
  }, [supabase])

  // Cargar datos iniciales del sistema timeline
  const loadTimelineData = useCallback(async () => {
    if (!userId || !isTimelineAvailable) return

    try {
      setLoading(true)
      setError(null)

      // Cargar ejes
      const { data: axesData, error: axesError } = await supabase
        .from('axis6_axes')
        .select('*')
        .order('order_index')

      if (axesError) throw axesError

      // Cargar subcategorías
      const { data: subcatsData, error: subcatsError } = await supabase
        .from('axis6_subcategories')
        .select('*')
        .order('axis_id, is_default DESC, name')

      if (subcatsError) throw subcatsError

      setAxes(axesData || [])
      setSubcategories(subcatsData || [])

      // Cargar datos del día actual
      await loadDayData(format(currentDate, 'yyyy-MM-dd'))

    } catch (e) {
      console.error('Error loading timeline data:', e)
      setError('Error loading timeline data')
    } finally {
      setLoading(false)
    }
  }, [userId, isTimelineAvailable, currentDate, supabase])

  // Cargar datos de un día específico
  const loadDayData = useCallback(async (date: string) => {
    if (!userId || !isTimelineAvailable) return

    try {
      // Cargar timeblocks del día
      const { data: blocksData, error: blocksError } = await supabase
        .from('axis6_timeblocks')
        .select(`
          *,
          axis:axis6_axes(*),
          subcategory:axis6_subcategories(*)
        `)
        .eq('user_id', userId)
        .eq('date', date)
        .order('start_hour', { ascending: true })
        .order('start_quarter', { ascending: true })

      if (blocksError) throw blocksError

      // Cargar reflexión del día
      const { data: reflectionData, error: reflectionError } = await supabase
        .from('axis6_daily_reflections')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .maybeSingle()

      if (reflectionError && reflectionError.code !== 'PGRST116') {
        throw reflectionError
      }

      // Calcular minutos por eje
      const axisMinutes: Record<string, number> = {}
      if (blocksData) {
        blocksData.forEach(block => {
          if (!axisMinutes[block.axis_id]) {
            axisMinutes[block.axis_id] = 0
          }
          axisMinutes[block.axis_id] += block.duration_minutes
        })
      }

      setDayData({
        date,
        timeblocks: blocksData || [],
        reflection: reflectionData || undefined,
        axis_minutes: axisMinutes
      })

    } catch (e) {
      console.error('Error loading day data:', e)
      setError('Error loading day data')
    }
  }, [userId, isTimelineAvailable, supabase])

  // Agregar un nuevo timeblock
  const addTimeBlock = useCallback(async (activity: QuickAddActivity) => {
    if (!userId || !isTimelineAvailable) return false

    try {
      // Encontrar el próximo slot disponible
      const slot = findNextAvailableSlot(dayData.timeblocks)
      if (!slot) {
        setError('No hay más espacio disponible en el día')
        return false
      }

      const { data, error } = await supabase
        .from('axis6_timeblocks')
        .insert({
          user_id: userId,
          axis_id: activity.axis_id,
          subcategory_id: activity.subcategory_id,
          date: dayData.date,
          start_hour: slot.hour,
          start_quarter: slot.quarter,
          duration_minutes: activity.duration_minutes,
          note: activity.note
        })
        .select(`
          *,
          axis:axis6_axes(*),
          subcategory:axis6_subcategories(*)
        `)
        .single()

      if (error) throw error

      // Actualizar estado local
      const newTimeblocks = [...dayData.timeblocks, data]
      const newAxisMinutes = { ...dayData.axis_minutes }
      newAxisMinutes[activity.axis_id] = (newAxisMinutes[activity.axis_id] || 0) + activity.duration_minutes

      setDayData(prev => ({
        ...prev,
        timeblocks: newTimeblocks,
        axis_minutes: newAxisMinutes
      }))

      return true
    } catch (e) {
      console.error('Error adding timeblock:', e)
      setError('Error adding activity')
      return false
    }
  }, [userId, isTimelineAvailable, dayData, supabase])

  // Guardar reflexión diaria
  const saveReflection = useCallback(async (text: string) => {
    if (!userId || !isTimelineAvailable) return false

    try {
      const { data, error } = await supabase
        .from('axis6_daily_reflections')
        .upsert({
          user_id: userId,
          date: dayData.date,
          text
        })
        .select()
        .single()

      if (error) throw error

      setDayData(prev => ({
        ...prev,
        reflection: data
      }))

      return true
    } catch (e) {
      console.error('Error saving reflection:', e)
      setError('Error saving reflection')
      return false
    }
  }, [userId, isTimelineAvailable, dayData.date, supabase])

  // Encontrar próximo slot disponible
  const findNextAvailableSlot = useCallback((timeblocks: TimeBlock[]): AvailableSlot | null => {
    const now = new Date()
    let currentHour = Math.max(5, Math.min(22, now.getHours()))
    let currentQuarter = Math.floor(now.getMinutes() / 15) * 15 as 0 | 15 | 30 | 45

    for (let h = currentHour; h <= 22; h++) {
      const startQ = h === currentHour ? currentQuarter : 0
      for (let q = startQ; q < 60; q += 15) {
        const quarter = q as 0 | 15 | 30 | 45
        
        const isOccupied = timeblocks.some(block => {
          if (block.start_hour > h) return false
          if (block.start_hour === h && block.start_quarter > quarter) return false
          
          const blockEndMinutes = block.start_quarter + block.duration_minutes
          const blockEndHour = block.start_hour + Math.floor(blockEndMinutes / 60)
          const blockEndQuarter = blockEndMinutes % 60
          
          if (h > blockEndHour) return false
          if (h === blockEndHour && quarter >= blockEndQuarter) return false
          
          return true
        })
        
        if (!isOccupied) {
          return { hour: h, quarter }
        }
      }
    }
    
    return null
  }, [])

  // Cambiar fecha
  const changeDate = useCallback((newDate: Date) => {
    setCurrentDate(newDate)
    loadDayData(format(newDate, 'yyyy-MM-dd'))
  }, [loadDayData])

  // Inicialización
  useEffect(() => {
    const initialize = async () => {
      const available = await checkTimelineAvailability()
      if (available && userId) {
        await loadTimelineData()
      } else {
        setLoading(false)
      }
    }

    initialize()
  }, [checkTimelineAvailability, loadTimelineData, userId])

  return {
    // Estado
    isTimelineAvailable,
    loading,
    error,
    
    // Datos
    axes,
    subcategories,
    dayData,
    currentDate,
    
    // Acciones
    addTimeBlock,
    saveReflection,
    changeDate,
    loadDayData: (date: string) => loadDayData(date),
    
    // Utilidades
    findNextAvailableSlot: (timeblocks?: TimeBlock[]) => 
      findNextAvailableSlot(timeblocks || dayData.timeblocks)
  }
}