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
      // Early return for missing userId
      if (!userId || userId === '') {
        return {
          success: true,
          date: date || new Date().toISOString().split('T')[0],
          resonance: [],
          totalResonance: 0
        }
      }
      
      const supabase = createClient()
      const dateParam = date || new Date().toISOString().split('T')[0]
      
      try {
        // Check session before making request
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          console.info('No valid session found for hexagon resonance, returning empty data')
          return {
            success: true,
            date: dateParam,
            resonance: [],
            totalResonance: 0
          }
        }

        // Make API request with credentials (cookies will be sent automatically)
        const response = await fetch(`/api/resonance/hexagon?date=${dateParam}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.warn(`Hexagon resonance API returned ${response.status}: ${response.statusText}`)
          
          // Return empty data for any error to prevent UI issues
          return {
            success: true,
            date: dateParam,
            resonance: [],
            totalResonance: 0
          }
        }

        const data = await response.json()
        return data
        
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
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: false,
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: 'always',
    retry: (failureCount, error: any) => {
      // Don't retry auth errors
      if (error && typeof error === 'object' && 'status' in error && (error.status === 401 || error.status === 403)) {
        return false
      }
      
      // Retry other errors up to 2 times
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s
  })
}