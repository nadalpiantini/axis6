import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface AxisActivity {
  id: number
  user_id: string
  category_id: number // INTEGER from axis6_categories
  activity_name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateActivityInput {
  user_id: string
  category_id: number // INTEGER from axis6_categories
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
  
  try {
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
    
    if (error) {
      console.error('Error fetching activities:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        userId,
        categoryId
      })
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in fetchActivities:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      categoryId,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Create a new activity
async function createActivity(input: CreateActivityInput): Promise<AxisActivity> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('axis6_axis_activities')
      .insert(input)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating activity:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        input
      })
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in createActivity:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Update an existing activity
async function updateActivity(input: UpdateActivityInput): Promise<AxisActivity> {
  try {
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
    
    if (error) {
      console.error('Error updating activity:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        input
      })
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in updateActivity:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Delete an activity
async function deleteActivity(id: number): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('axis6_axis_activities')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting activity:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        id
      })
      throw error
    }
  } catch (error) {
    console.error('Exception in deleteActivity:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      id,
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

// Hook to fetch activities
export function useAxisActivities(userId: string, categoryId: string) {  // Changed from number to string (UUID)
  return useQuery({
    queryKey: ['axis-activities', userId, categoryId],
    queryFn: async () => {
      if (!userId || !categoryId) return []
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('axis6_axis_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('category_id', categoryId)  // Changed from number to string (UUID)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!userId && !!categoryId
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
