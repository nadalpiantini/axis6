import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'

export interface AxisActivity {
  id: number
  user_id: string
  category_id: number
  activity_name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateActivityInput {
  user_id: string
  category_id: number
  activity_name: string
  description?: string
}

export interface UpdateActivityInput {
  id: number
  activity_name?: string
  description?: string
  is_active?: boolean
}

// Fetch activities for a specific user and category
async function fetchActivities(userId?: string, categoryId?: number): Promise<AxisActivity[]> {
  if (!userId) return []

  const supabase = createClient()
  let query = supabase
    .from('axis6_axis_activities')
    .select('*')
    .eq('user_id', userId)
    .order('activity_name')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

// Create a new activity
async function createActivity(input: CreateActivityInput): Promise<AxisActivity> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('axis6_axis_activities')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update an existing activity
async function updateActivity(input: UpdateActivityInput): Promise<AxisActivity> {
  const { id, ...updates } = input
  const supabase = createClient()

  const { data, error } = await supabase
    .from('axis6_axis_activities')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete an activity
async function deleteActivity(id: number): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('axis6_axis_activities')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Hook to fetch activities
export function useAxisActivities(userId?: string, categoryId?: number) {
  return useQuery({
    queryKey: ['axis-activities', userId, categoryId],
    queryFn: () => fetchActivities(userId, categoryId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create an activity
export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createActivity,
    onSuccess: (data) => {
      // Invalidate and refetch activities
      queryClient.invalidateQueries({
        queryKey: ['axis-activities', data.user_id]
      })
    },
  })
}

// Hook to update an activity
export function useUpdateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateActivity,
    onSuccess: (data) => {
      // Invalidate and refetch activities
      queryClient.invalidateQueries({
        queryKey: ['axis-activities', data.user_id]
      })
    },
  })
}

// Hook to delete an activity
export function useDeleteActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      // Invalidate all activities queries since we don't have user_id here
      queryClient.invalidateQueries({
        queryKey: ['axis-activities']
      })
    },
  })
}
