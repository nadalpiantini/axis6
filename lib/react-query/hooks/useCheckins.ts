import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface CheckIn {
  id: string
  user_id: string
  category_id: string
  completed_at: string
  created_at: string
}

interface CheckInInput {
  categoryId: string
  completed: boolean
}

async function fetchTodayCheckins(userId: string): Promise<CheckIn[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('axis6_checkins')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_at', `${today}T00:00:00`)
    .lte('completed_at', `${today}T23:59:59`)

  if (error) throw error
  return data || []
}

async function toggleCheckIn({ categoryId, completed }: CheckInInput, userId: string) {
  const supabase = createClient()
  
  if (completed) {
    // Add check-in
    const { data, error } = await supabase
      .from('axis6_checkins')
      .insert({
        user_id: userId,
        category_id: categoryId,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } else {
    // Remove check-in for today
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('axis6_checkins')
      .delete()
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`)
    
    if (error) throw error
    return null
  }
}

export function useTodayCheckins(userId: string | undefined) {
  return useQuery({
    queryKey: ['checkins', 'today', userId],
    queryFn: () => fetchTodayCheckins(userId!),
    enabled: !!userId,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
  })
}

export function useToggleCheckIn(userId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CheckInInput) => toggleCheckIn(input, userId!),
    onMutate: async ({ categoryId, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['checkins', 'today', userId] })
      
      // Snapshot previous value
      const previousCheckins = queryClient.getQueryData<CheckIn[]>(['checkins', 'today', userId])
      
      // Optimistically update
      queryClient.setQueryData<CheckIn[]>(['checkins', 'today', userId], (old = []) => {
        if (completed) {
          return [...old, {
            id: `temp-${Date.now()}`,
            user_id: userId!,
            category_id: categoryId,
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }]
        } else {
          return old.filter(c => c.category_id !== categoryId)
        }
      })
      
      return { previousCheckins }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousCheckins) {
        queryClient.setQueryData(['checkins', 'today', userId], context.previousCheckins)
      }
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today', userId] })
      queryClient.invalidateQueries({ queryKey: ['streaks', userId] })
    }
  })
}