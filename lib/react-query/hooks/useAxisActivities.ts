import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { logger } from '@/lib/logger'

type Activity = Database['public']['Tables']['axis6_checkins']['Row']
type NewActivity = Database['public']['Tables']['axis6_checkins']['Insert']
type UpdateActivity = Database['public']['Tables']['axis6_checkins']['Update']

const supabase = createClient()

/**
 * Fetch activities for a specific user and category
 */
async function fetchActivities(userId: string, categoryId?: string): Promise<Activity[]> {
  let query = supabase
    .from('axis6_checkins')
    .select(`
      *,
      axis6_categories:category_id (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    // TODO: Replace with proper error handling
    // Error details available for debugging
    throw error
  }

  return data || []
}

/**
 * Hook to fetch user activities
 */
export function useAxisActivities(userId: string, categoryId?: string) {
  return useQuery({
    queryKey: ['activities', userId, categoryId],
    queryFn: () => fetchActivities(userId, categoryId),
    enabled: !!userId,
    staleTime: 30000, // Consider data stale after 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  })
}

/**
 * Create a new activity
 */
async function createActivity(activity: NewActivity): Promise<Activity> {
  const { data, error } = await supabase
    .from('axis6_checkins')
    .insert([activity])
    .select()
    .single()

  if (error) {
    logger.error('Failed to create activity:', { error: error.message, activity })
    throw error
  }

  return data
}

/**
 * Update an existing activity
 */
async function updateActivity(id: string, updates: UpdateActivity): Promise<Activity> {
  const { data, error } = await supabase
    .from('axis6_checkins')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update activity:', { error: error.message, id, updates })
    throw error
  }

  return data
}

/**
 * Delete an activity
 */
async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase
    .from('axis6_checkins')
    .delete()
    .eq('id', id)

  if (error) {
    logger.error('Failed to delete activity:', { error: error.message, id })
    throw error
  }
}

/**
 * Hook to create new activities
 */
export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createActivity,
    onSuccess: (data) => {
      // Invalidate and refetch activities
      queryClient.invalidateQueries({ queryKey: ['activities', data.user_id] })
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard', data.user_id] })
      // Invalidate streaks data
      queryClient.invalidateQueries({ queryKey: ['streaks', data.user_id] })
    },
    onError: (error) => {
      logger.error('Activity creation failed:', error)
    }
  })
}

/**
 * Hook to update activities
 */
export function useUpdateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateActivity }) =>
      updateActivity(id, updates),
    onSuccess: (data) => {
      // Invalidate and refetch activities
      queryClient.invalidateQueries({ queryKey: ['activities', data.user_id] })
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: ['dashboard', data.user_id] })
    },
    onError: (error) => {
      logger.error('Activity update failed:', error)
    }
  })
}

/**
 * Hook to delete activities
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: (_, id) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      logger.info('Activity deleted successfully:', { id })
    },
    onError: (error) => {
      logger.error('Activity deletion failed:', error)
    }
  })
}