import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface CheckIn {
  id: string
  user_id: string
  category_id: number
  completed_at: string
  created_at: string
}

interface CheckInInput {
  categoryId: number
  completed: boolean
}

async function fetchTodayCheckins(userId: string): Promise<CheckIn[]> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('axis6_checkins')
    .select('*')
    .eq('user_id', userId)
    .gte('completed_at', `${today}T00:00:00.000Z`)  // FIXED: Added timezone info
    .lte('completed_at', `${today}T23:59:59.999Z`)  // FIXED: Added timezone info

  if (error) throw error
  return data || []
}

async function toggleCheckIn({ categoryId, completed }: CheckInInput, userId: string) {
  const supabase = createClient()
  
  // Debug logging
  console.log('[toggleCheckIn] Starting mutation:', { categoryId, completed, userId })
  
  if (completed) {
    // Add check-in with proper timestamp
    const insertData = {
      user_id: userId,
      category_id: categoryId,
      completed_at: new Date().toISOString()  // FIXED: Use full timestamp
    }
    
    console.log('[toggleCheckIn] Inserting check-in:', insertData)
    
    const { data, error } = await supabase
      .from('axis6_checkins')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error('[toggleCheckIn] Insert error:', error)
      throw error
    }
    
    console.log('[toggleCheckIn] Insert success:', data)
    return data
  } else {
    // Remove check-in for today
    const today = new Date().toISOString().split('T')[0]
    const deleteParams = {
      user_id: userId,
      category_id: categoryId,
      start: `${today}T00:00:00.000Z`,
      end: `${today}T23:59:59.999Z`
    }
    
    console.log('[toggleCheckIn] Deleting check-in:', deleteParams)
    
    const { error } = await supabase
      .from('axis6_checkins')
      .delete()
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .gte('completed_at', deleteParams.start)  // FIXED: Added timezone info
      .lte('completed_at', deleteParams.end)  // FIXED: Added timezone info
    
    if (error) {
      console.error('[toggleCheckIn] Delete error:', error)
      throw error
    }
    
    console.log('[toggleCheckIn] Delete success')
    return null
  }
}

export function useTodayCheckins(userId: string | undefined) {
  return useQuery({
    queryKey: ['checkins', 'today', userId],
    queryFn: () => fetchTodayCheckins(userId!),
    enabled: !!userId && userId.length > 0,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
  })
}

export function useToggleCheckIn(userId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CheckInInput) => {
      if (!userId) {
        throw new Error('User ID is required for toggle check-in')
      }
      return toggleCheckIn(input, userId)
    },
    onMutate: async ({ categoryId, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['checkins', 'today', userId] })
      
      // Snapshot previous value
      const previousCheckins = queryClient.getQueryData<CheckIn[]>(['checkins', 'today', userId])
      
      // Optimistically update
      queryClient.setQueryData<CheckIn[]>(
        ['checkins', 'today', userId],
        (old = []) => {
          if (completed) {
            // Add new checkin optimistically
            const optimisticCheckin: CheckIn = {
              id: `optimistic-${Date.now()}`,
              user_id: userId!,
              category_id: categoryId,
              completed_at: new Date().toISOString(),
              created_at: new Date().toISOString()
            }
            return [...old.filter(c => c.category_id !== categoryId), optimisticCheckin]
          } else {
            // Remove checkin optimistically
            return old.filter(c => c.category_id !== categoryId)
          }
        }
      )
      
      // Return context for rollback
      return { previousCheckins }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousCheckins) {
        queryClient.setQueryData(['checkins', 'today', userId], context.previousCheckins)
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today', userId] })
      queryClient.invalidateQueries({ queryKey: ['streaks', userId] })
    }
  })
}

// New hook for batch operations
export function useBatchCheckIn(userId: string | undefined) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (updates: CheckInInput[]) => {
      if (!userId) throw new Error('User ID required')
      
      // Process all updates in parallel
      const results = await Promise.allSettled(
        updates.map(input => toggleCheckIn(input, userId))
      )
      
      // Check for any failures
      const failures = results.filter(r => r.status === 'rejected')
      if (failures.length > 0) {
        throw new Error(`${failures.length} operations failed`)
      }
      
      return results
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['checkins', 'today', userId] })
      
      // Snapshot previous value
      const previousCheckins = queryClient.getQueryData<CheckIn[]>(['checkins', 'today', userId])
      
      // Apply all optimistic updates
      queryClient.setQueryData<CheckIn[]>(
        ['checkins', 'today', userId],
        (old = []) => {
          let newCheckins = [...old]
          
          updates.forEach(({ categoryId, completed }) => {
            if (completed) {
              // Remove any existing and add new
              newCheckins = newCheckins.filter(c => c.category_id !== categoryId)
              newCheckins.push({
                id: `optimistic-${categoryId}-${Date.now()}`,
                user_id: userId!,
                category_id: categoryId,
                completed_at: new Date().toISOString(),
                created_at: new Date().toISOString()
              })
            } else {
              // Remove checkin
              newCheckins = newCheckins.filter(c => c.category_id !== categoryId)
            }
          })
          
          return newCheckins
        }
      )
      
      return { previousCheckins }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousCheckins) {
        queryClient.setQueryData(['checkins', 'today', userId], context.previousCheckins)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['checkins', 'today', userId] })
      queryClient.invalidateQueries({ queryKey: ['streaks', userId] })
    }
  })
}