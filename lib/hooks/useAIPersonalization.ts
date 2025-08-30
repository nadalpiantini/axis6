import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'

import { UserBehaviorProfile, PersonalizedInsight } from '@/lib/ai/behavioral-analyzer'
import { SmartNotification } from '@/lib/ai/smart-notifications'

interface AIPersonalizationState {
  behaviorProfile: UserBehaviorProfile | null
  insights: PersonalizedInsight[]
  notifications: SmartNotification[]
  optimalTimes: Array<{ hour: number; day_of_week: number; probability: number }>
  personalizedReminders: Array<{ time: string; message: string; category_focus?: number[] }>
  isLoading: boolean
  error: string | null
}

interface AIRecommendations {
  activities: any[]
  goals: any[]
  meta: {
    generation_time_ms: number
    average_fit_score: number
    temperament_used: string
  }
}

export function useAIPersonalization() {
  const [state, setState] = useState<AIPersonalizationState>({
    behaviorProfile: null,
    insights: [],
    notifications: [],
    optimalTimes: [],
    personalizedReminders: [],
    isLoading: false,
    error: null
  })

  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch behavior analysis
  const {
    data: behaviorData,
    isLoading: behaviorLoading,
    error: behaviorError,
    refetch: refetchBehavior
  } = useQuery({
    queryKey: ['ai', 'behavior-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/ai/behavior-analysis')
      if (!response.ok) {
        throw new Error('Failed to fetch behavior analysis')
      }
      return response.json()
    },
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false
  })

  // Fetch personalized insights
  const {
    data: insightsData,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights
  } = useQuery({
    queryKey: ['ai', 'insights'],
    queryFn: async () => {
      const response = await fetch('/api/ai/behavior-analysis/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ include_profile: false })
      })
      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }
      return response.json()
    },
    staleTime: 2 * 60 * 60 * 1000, // 2 hours
    gcTime: 6 * 60 * 60 * 1000, // 6 hours
    refetchOnWindowFocus: false
  })

  // Fetch smart notifications
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ['ai', 'notifications'],
    queryFn: async () => {
      const response = await fetch('/api/ai/smart-notifications')
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchInterval: 15 * 60 * 1000 // Refetch every 15 minutes
  })

  // Fetch optimal times
  const {
    data: optimalTimesData,
    isLoading: optimalTimesLoading,
    error: optimalTimesError,
    refetch: refetchOptimalTimes
  } = useQuery({
    queryKey: ['ai', 'optimal-times'],
    queryFn: async () => {
      const response = await fetch('/api/ai/optimal-times')
      if (!response.ok) {
        throw new Error('Failed to fetch optimal times')
      }
      return response.json()
    },
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false
  })

  // Generate notifications mutation
  const generateNotificationsMutation = useMutation({
    mutationFn: async (options: {
      lookAheadHours?: number
      force_regenerate?: boolean
      context?: any
    }) => {
      const response = await fetch('/api/ai/smart-notifications/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })
      if (!response.ok) {
        throw new Error('Failed to generate notifications')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'notifications'] })
    }
  })

  // Mark notification mutation
  const markNotificationMutation = useMutation({
    mutationFn: async (params: {
      notification_id: string
      action: 'mark_read' | 'mark_delivered' | 'dismiss'
      feedback?: {
        type?: string
        rating?: number
        thumbs?: boolean
        comment?: string
        time_to_action?: number
      }
    }) => {
      const response = await fetch('/api/ai/smart-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      if (!response.ok) {
        throw new Error('Failed to update notification')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'notifications'] })
    }
  })

  // Update state when data changes
  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      behaviorProfile: behaviorData?.data?.profile || null,
      insights: insightsData?.data?.insights || [],
      notifications: notificationsData?.data?.notifications || [],
      optimalTimes: optimalTimesData?.data?.optimal_times || [],
      personalizedReminders: optimalTimesData?.data?.personalized_reminders || [],
      isLoading: behaviorLoading || insightsLoading || notificationsLoading || optimalTimesLoading,
      error: behaviorError?.message || insightsError?.message || notificationsError?.message || optimalTimesError?.message || null
    }))
  }, [
    behaviorData, insightsData, notificationsData, optimalTimesData,
    behaviorLoading, insightsLoading, notificationsLoading, optimalTimesLoading,
    behaviorError, insightsError, notificationsError, optimalTimesError
  ])

  // Generate new notifications
  const generateNotifications = useCallback((options?: {
    lookAheadHours?: number
    force_regenerate?: boolean
    context?: any
  }) => {
    return generateNotificationsMutation.mutate(options || {})
  }, [generateNotificationsMutation])

  // Mark notification as read/delivered/dismissed
  const markNotification = useCallback((
    notification_id: string,
    action: 'mark_read' | 'mark_delivered' | 'dismiss',
    feedback?: any
  ) => {
    return markNotificationMutation.mutate({
      notification_id,
      action,
      feedback
    })
  }, [markNotificationMutation])

  // Refresh all AI data
  const refreshAIData = useCallback(async () => {
    await Promise.all([
      refetchBehavior(),
      refetchInsights(),
      refetchNotifications(),
      refetchOptimalTimes()
    ])
  }, [refetchBehavior, refetchInsights, refetchNotifications, refetchOptimalTimes])

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority: 'low' | 'medium' | 'high' | 'urgent') => {
    return state.notifications.filter(n => n.priority === priority)
  }, [state.notifications])

  // Get active insights
  const getActiveInsights = useCallback(() => {
    return state.insights.filter(i => !i.expires_at || new Date(i.expires_at) > new Date())
  }, [state.insights])

  // Get insights by type
  const getInsightsByType = useCallback((type: 'daily' | 'weekly' | 'milestone' | 'recommendation' | 'coaching') => {
    return state.insights.filter(i => i.type === type)
  }, [state.insights])

  return {
    // State
    ...state,

    // Loading states
    isGeneratingNotifications: generateNotificationsMutation.isPending,
    isMarkingNotification: markNotificationMutation.isPending,

    // Actions
    generateNotifications,
    markNotification,
    refreshAIData,

    // Utilities
    getNotificationsByPriority,
    getActiveInsights,
    getInsightsByType,

    // Computed values
    hasActiveNotifications: state.notifications.some(n => !n.delivered),
    hasHighPriorityNotifications: state.notifications.some(n => n.priority === 'high' || n.priority === 'urgent'),
    behaviorAnalysisAge: behaviorData?.data?.profile?.last_analyzed
      ? Math.floor((new Date().getTime() - new Date(behaviorData.data.profile.last_analyzed).getTime()) / (1000 * 60 * 60))
      : null,
    optimalTimeScore: state.optimalTimes.length > 0
      ? state.optimalTimes.reduce((sum, t) => sum + t.probability, 0) / state.optimalTimes.length
      : 0
  }
}

export function useAIRecommendations() {
  const queryClient = useQueryClient()

  // Get activity recommendations
  const getActivityRecommendations = useMutation({
    mutationFn: async (params: {
      category_id: string
      energy_level?: 'low' | 'medium' | 'high'
      social_preference?: 'solo' | 'small_group' | 'large_group'
      time_available?: 'quick' | 'moderate' | 'extended'
      current_mood?: number
    }) => {
      const searchParams = new URLSearchParams({
        category_id: params.category_id,
        ...(params.energy_level && { energy_level: params.energy_level }),
        ...(params.social_preference && { social_preference: params.social_preference }),
        ...(params.time_available && { time_available: params.time_available }),
        ...(params.current_mood && { current_mood: params.current_mood.toString() })
      })

      const response = await fetch(`/api/ai/recommendations/activities?${searchParams}`)
      if (!response.ok) {
        throw new Error('Failed to get activity recommendations')
      }
      return response.json()
    }
  })

  // Get goal recommendations
  const getGoalRecommendations = useMutation({
    mutationFn: async (params: {
      timeframe?: 'weekly' | 'monthly'
    }) => {
      const response = await fetch('/api/ai/recommendations/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      if (!response.ok) {
        throw new Error('Failed to get goal recommendations')
      }
      return response.json()
    }
  })

  // Generate adaptive reminders
  const generateAdaptiveReminders = useMutation({
    mutationFn: async (params: {
      enable_reminders?: boolean
      preferred_hours?: number[]
      reminder_types?: string[]
    }) => {
      const response = await fetch('/api/ai/optimal-times/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      if (!response.ok) {
        throw new Error('Failed to generate adaptive reminders')
      }
      return response.json()
    }
  })

  return {
    // Mutations
    getActivityRecommendations: getActivityRecommendations.mutate,
    getGoalRecommendations: getGoalRecommendations.mutate,
    generateAdaptiveReminders: generateAdaptiveReminders.mutate,

    // Loading states
    isLoadingActivities: getActivityRecommendations.isPending,
    isLoadingGoals: getGoalRecommendations.isPending,
    isLoadingReminders: generateAdaptiveReminders.isPending,

    // Data
    activityData: getActivityRecommendations.data,
    goalData: getGoalRecommendations.data,
    reminderData: generateAdaptiveReminders.data,

    // Errors
    activityError: getActivityRecommendations.error,
    goalError: getGoalRecommendations.error,
    reminderError: generateAdaptiveReminders.error
  }
}
