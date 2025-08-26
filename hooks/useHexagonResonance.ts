import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface HexagonResonanceData {
  axisSlug: string
  resonanceCount: number
  userCompleted: boolean
  hasResonance: boolean
}

export interface HexagonResonanceResponse {
  success: boolean
  date: string
  resonance: HexagonResonanceData[]
  totalResonance: number
}

// Custom hook to fetch hexagon resonance data
export function useHexagonResonance(userId?: string, date?: string) {
  return useQuery<HexagonResonanceResponse>({
    queryKey: ['hexagon-resonance', userId, date],
    queryFn: async () => {
      if (!userId || userId === '') {
        return {
          success: true,
          date: date || new Date().toISOString().split('T')[0],
          resonance: [],
          totalResonance: 0
        }
      }
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        return {
          success: true,
          date: date || new Date().toISOString().split('T')[0],
          resonance: [],
          totalResonance: 0
        }
      }

      const dateParam = date || new Date().toISOString().split('T')[0]
      
      try {
        const response = await fetch(`/api/resonance/hexagon?date=${dateParam}`, {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.warn(`Hexagon resonance API returned ${response.status}: ${response.statusText}`)
          return {
            success: true,
            date: dateParam,
            resonance: [],
            totalResonance: 0
          }
        }

        return response.json()
      } catch (error) {
        console.warn('Failed to fetch hexagon resonance:', error)
        return {
          success: true,
          date: dateParam,
          resonance: [],
          totalResonance: 0
        }
      }
    },
    enabled: !!userId && userId !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000, // Refetch every minute for subtle real-time updates
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (authentication issues)
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        return false
      }
      return failureCount < 2
    }
  })
}