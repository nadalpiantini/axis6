import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
export interface Streak {
  id: string
  user_id: string
  category_id: string
  current_streak: number
  longest_streak: number
  last_completed_at: string | null
  created_at: string
  updated_at: string
}
async function fetchStreaks(userId: string): Promise<Streak[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('axis6_streaks')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data || []
}
export function useStreaks(userId: string | undefined) {
  return useQuery({
    queryKey: ['streaks', userId],
    queryFn: () => fetchStreaks(userId!),
    enabled: !!userId && userId.length > 0,
    staleTime: 60 * 1000, // 1 minute
  })
}
