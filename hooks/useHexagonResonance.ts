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
      if (!userId) throw new Error('User ID required')
      
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Authentication required')
      }

      const dateParam = date || new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/resonance/hexagon?date=${dateParam}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch resonance data: ${response.statusText}`)
      }

      return response.json()
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000, // Refetch every minute for subtle real-time updates
  })
}