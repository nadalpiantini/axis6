import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCSRF } from '@/lib/hooks/useCSRF'

// Fetch my day data (time blocks)
export function useMyDayData(userId: string, date: string) {
  const { secureFetch } = useCSRF()
  
  return useQuery({
    queryKey: ['my-day', userId, date],
    queryFn: async () => {
      const response = await secureFetch(`/api/time-blocks?date=${date}`)
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
  const { secureFetch } = useCSRF()
  
  return useQuery({
    queryKey: ['time-distribution', userId, date],
    queryFn: async () => {
      const response = await secureFetch(`/api/my-day/stats?date=${date}`)
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
  const { secureFetch } = useCSRF()
  
  return useMutation({
    mutationFn: async (data: {
      user_id: string
      date: string
      category_id: string  // Changed from number to string (UUID)
      activity_id: number | null
      activity_name: string
      start_time: string
      end_time: string
      notes?: string
      status?: string
    }) => {
      const response = await secureFetch('/api/time-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to create time block (${response.status})`
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        ;(error as any).details = errorData
        throw error
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-day', variables.user_id, variables.date] })
      queryClient.invalidateQueries({ queryKey: ['time-distribution', variables.user_id, variables.date] })
    }
  })
}

// Update time block
export function useUpdateTimeBlock() {
  const queryClient = useQueryClient()
  const { secureFetch } = useCSRF()
  
  return useMutation({
    mutationFn: async (data: {
      id: number
      category_id?: string  // Changed from number to string (UUID)
      activity_id?: number | null
      activity_name?: string
      start_time?: string
      end_time?: string
      notes?: string
      status?: string
    }) => {
      const response = await secureFetch('/api/time-blocks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to update time block (${response.status})`
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        ;(error as any).details = errorData
        throw error
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
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to delete time block (${response.status})`
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        ;(error as any).details = errorData
        throw error
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
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to start timer (${response.status})`
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        ;(error as any).details = errorData
        throw error
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
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to stop timer (${response.status})`
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        ;(error as any).details = errorData
        throw error
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
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to fetch active timer (${response.status})`
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        ;(error as any).details = errorData
        throw error
      }
      return response.json()
    },
    enabled: !!userId,
    refetchInterval: 30000 // Refresh every 30 seconds
  })
}
