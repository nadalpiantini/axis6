import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface ConstellationPoint {
  axisSlug: string
  completionCount: number
  resonanceIntensity: number
  color: string
  name: any // JSONB from database
  position: {
    x: number
    y: number
    angle: number
  }
}

export interface ConstellationMetrics {
  totalCompletions: number
  averageIntensity: number
  activeAxes: number
  mood: 'quiet' | 'peaceful' | 'active' | 'vibrant' | 'energetic'
}

export interface ConstellationData {
  points: ConstellationPoint[]
  metrics: ConstellationMetrics
  visualHints: {
    centerPoint: { x: number; y: number }
    baseRadius: number
    maxRadius: number
    recommendedSize: number
  }
}

export interface ConstellationResponse {
  success: boolean
  date: string
  constellation: ConstellationData
}

// Hook to fetch constellation data for community visualization
export function useConstellation(date?: string) {
  return useQuery<ConstellationResponse>({
    queryKey: ['constellation', date],
    queryFn: async () => {
      const supabase = createClient()
      
      const dateParam = date || new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/constellation?date=${dateParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch constellation data: ${response.statusText}`)
      }

      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  })
}