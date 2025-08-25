import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch my day data (time blocks)
export function useMyDayData(userId: string, date: string) {
  return useQuery({
    queryKey: ['my-day', userId, date],
    queryFn: async () => {
      const response = await fetch(`/api/time-blocks?date=${date}`)
      if (!response.ok) {
        throw new Error('Failed to fetch my day data')
      }
      return response.json()
    },
    enabled: !!userId && !!date
  })
}

// Fetch time distribution for hexagon
export function useTimeDistribution(userId: string, date: string) {
  return useQuery({
    queryKey: ['time-distribution', userId, date],
    queryFn: async () => {
      const response = await fetch(`/api/my-day/stats?date=${date}`)
      if (!response.ok) {
        throw new Error('Failed to fetch time distribution')
      }
      return response.json()
    },
    enabled: !!userId && !!date
  })
}

// Create time block
export function useCreateTimeBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      user_id: string
      date: string
      category_id: number
      activity_id: number | null
      activity_name: string
      start_time: string
      end_time: string
      notes?: string
      status?: string
    }) => {
      const response = await fetch('/api/time-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create time block')
      }
      
      return response.json()
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-day', variables.user_id, variables.date] })
      queryClient.invalidateQueries({ queryKey: ['time-distribution', variables.user_id, variables.date] })
    }
  })
}

// Update time block
export function useUpdateTimeBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      id: number
      category_id?: number
      activity_id?: number | null
      activity_name?: string
      start_time?: string
      end_time?: string
      notes?: string
      status?: string
    }) => {
      const response = await fetch('/api/time-blocks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update time block')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-day'] })
      queryClient.invalidateQueries({ queryKey: ['time-distribution'] })
    }
  })
}

// Delete time block
export function useDeleteTimeBlock() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/time-blocks?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete time block')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-day'] })
      queryClient.invalidateQueries({ queryKey: ['time-distribution'] })
    }
  })
}

// Start activity timer
export function useStartTimer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      user_id: string
      activity_id: number | null
      category_id: number
      activity_name: string
      time_block_id?: number
    }) => {
      const response = await fetch('/api/activity-timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'start',
          ...data
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to start timer')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timer'] })
      queryClient.invalidateQueries({ queryKey: ['my-day'] })
    }
  })
}

// Stop activity timer
export function useStopTimer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: {
      user_id: string
      log_id: number
    }) => {
      const response = await fetch('/api/activity-timer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'stop',
          ...data
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to stop timer')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-timer'] })
      queryClient.invalidateQueries({ queryKey: ['my-day'] })
      queryClient.invalidateQueries({ queryKey: ['time-distribution'] })
    }
  })
}

// Get active timer
export function useActiveTimer(userId: string) {
  return useQuery({
    queryKey: ['active-timer', userId],
    queryFn: async () => {
      const response = await fetch('/api/activity-timer')
      if (!response.ok) {
        throw new Error('Failed to fetch active timer')
      }
      return response.json()
    },
    enabled: !!userId,
    refetchInterval: 30000 // Refresh every 30 seconds
  })
}