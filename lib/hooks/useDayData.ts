'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

export type MinutesByAxis = Record<number, number>

export interface DayData {
  minutesByAxis: MinutesByAxis
  blocks: Array<{
    id: number
    axis_id: number
    minutes: number
    start_ts: string
    note?: string
    axis_name: string
    axis_color: string
    subcat_name?: string
  }>
  reflection?: string
  totalMinutes: number
  axesActive: number
}

export function useDayData(date: Date) {
  const supabase = createClient()
  const dateISO = format(date, 'yyyy-MM-dd')

  return useQuery<DayData>({
    queryKey: ['day-summary', dateISO],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('axis6_get_day_summary', { 
        d: dateISO 
      })
      
      if (error) {
        console.error('Error fetching day summary:', error)
        throw error
      }
      
      return data || {
        minutesByAxis: {},
        blocks: [],
        reflection: null,
        totalMinutes: 0,
        axesActive: 0
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true
  })
}

export function useQuickAddBlock() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ 
      axisId, 
      minutes, 
      note 
    }: { 
      axisId: number
      minutes: number
      note?: string 
    }) => {
      const { data, error } = await supabase.rpc('axis6_quick_add_block', {
        p_axis_id: axisId,
        p_minutes: minutes,
        p_note: note || null
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate day data to refetch
      queryClient.invalidateQueries({ queryKey: ['day-summary'] })
    }
  })
}

export function useUpdateReflection() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ 
      date, 
      text 
    }: { 
      date: Date
      text: string 
    }) => {
      const dateISO = format(date, 'yyyy-MM-dd')
      
      const { error } = await supabase
        .from('axis6_reflections')
        .upsert({
          day: dateISO,
          text,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-summary'] })
    }
  })
}

// Simple axes data
export const AXES = [
  { id: 1, name: 'Physical', color: '#8BE38F', icon: '💪' },
  { id: 2, name: 'Mental', color: '#9DB2FF', icon: '🧠' },
  { id: 3, name: 'Emotional', color: '#FF9DB0', icon: '❤️' },
  { id: 4, name: 'Social', color: '#9DE1FF', icon: '👥' },
  { id: 5, name: 'Spiritual', color: '#C9A5FF', icon: '✨' },
  { id: 6, name: 'Material', color: '#FFD27A', icon: '💰' }
]