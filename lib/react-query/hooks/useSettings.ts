import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
// Types
interface UserPreferences {
  theme_preference: 'temperament_based' | 'dark' | 'light' | 'auto'
  language: 'en' | 'es'
  timezone: string
  dashboard_layout: 'hexagon' | 'grid' | 'list'
  default_landing_page: '/dashboard' | '/my-day' | '/analytics' | '/profile'
  display_density: 'compact' | 'comfortable' | 'spacious'
  accessibility_options: {
    high_contrast: boolean
    large_text: boolean
    reduced_motion: boolean
    screen_reader: boolean
  }
  quick_actions: Array<{
    action: string
    category: string
    enabled: boolean
    priority?: number
  }>
}
interface NotificationPreferences {
  [key: string]: {
    notification_type: string
    delivery_channels: string[]
    enabled: boolean
    frequency: 'high' | 'optimal' | 'low' | 'off'
    priority_filter: 'all' | 'high' | 'medium' | 'critical'
    quiet_hours: {
      enabled: boolean
      start: string
      end: string
    }
    optimal_timing: boolean
    category_focus?: number[]
    temperament_based: boolean
  }
}
interface PrivacySettings {
  profile_visibility: 'public' | 'friends' | 'private'
  stats_sharing: boolean
  achievement_sharing: boolean
  ai_analytics_enabled: boolean
  behavioral_tracking_enabled: boolean
  ai_coaching_enabled: boolean
  personalized_content: boolean
  data_retention_days: number
  export_frequency: 'never' | 'weekly' | 'monthly' | 'quarterly'
  third_party_sharing: boolean
  usage_analytics: boolean
  research_participation: boolean
}
interface SecuritySettings {
  two_factor_enabled: boolean
  two_factor_method?: 'totp' | 'sms' | 'email'
  backup_codes_generated: boolean
  session_timeout: number
  concurrent_sessions_limit: number
  trusted_devices: number
  login_notifications_enabled: boolean
  security_alerts_enabled: boolean
  security_questions_set: boolean
}
interface WellnessPreferences {
  hexagon_size: 'small' | 'medium' | 'large'
  show_community_pulse: boolean
  show_resonance: boolean
  default_view: 'hexagon' | 'list' | 'grid'
  axis_customizations: Record<string, any>
}
// User Preferences Hooks
export function useUserPreferences() {
  return useQuery<UserPreferences>({
    queryKey: ['settings', 'user-preferences'],
    queryFn: async () => {
      const response = await fetch('/api/settings/user-preferences')
      if (!response.ok) {
        throw new Error('Failed to fetch user preferences')
      }
      const data = await response.json()
      return data.preferences
    }
  })
}
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await fetch('/api/settings/user-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user preferences')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'user-preferences'] })
    }
  })
}
// Notification Preferences Hooks
export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: ['settings', 'notifications'],
    queryFn: async () => {
      const response = await fetch('/api/settings/notifications')
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences')
      }
      const data = await response.json()
      return data.preferences
    }
  })
}
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update notification preferences')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] })
    }
  })
}
// Privacy Settings Hooks
export function usePrivacySettings() {
  return useQuery<PrivacySettings>({
    queryKey: ['settings', 'privacy'],
    queryFn: async () => {
      const response = await fetch('/api/settings/privacy')
      if (!response.ok) {
        throw new Error('Failed to fetch privacy settings')
      }
      const data = await response.json()
      return data.settings
    }
  })
}
export function useUpdatePrivacySettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<PrivacySettings>) => {
      const response = await fetch('/api/settings/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update privacy settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'privacy'] })
    }
  })
}
export function usePrivacyScore() {
  return useQuery<{
    privacyScore: number
    recommendations: string[]
    factors: number
  }>({
    queryKey: ['settings', 'privacy-score'],
    queryFn: async () => {
      const response = await fetch('/api/settings/privacy', {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Failed to calculate privacy score')
      }
      return response.json()
    }
  })
}
// Security Settings Hooks
export function useSecuritySettings() {
  return useQuery<SecuritySettings>({
    queryKey: ['settings', 'security'],
    queryFn: async () => {
      const response = await fetch('/api/settings/security')
      if (!response.ok) {
        throw new Error('Failed to fetch security settings')
      }
      const data = await response.json()
      return data.settings
    }
  })
}
export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (settings: Partial<SecuritySettings>) => {
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update security settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'security'] })
    }
  })
}
export function useSecurityAudit() {
  return useQuery<{
    auditLogs: Array<any>
    securityScore: number
  }>({
    queryKey: ['settings', 'security-audit'],
    queryFn: async () => {
      const response = await fetch('/api/settings/security', {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to fetch security audit')
      }
      return response.json()
    }
  })
}
// Axis Customization Hooks
export function useAxisCustomization() {
  return useQuery<WellnessPreferences>({
    queryKey: ['settings', 'axis-customization'],
    queryFn: async () => {
      const response = await fetch('/api/settings/axis-customization')
      if (!response.ok) {
        throw new Error('Failed to fetch axis customization settings')
      }
      const data = await response.json()
      return data.preferences
    }
  })
}
export function useUpdateAxisCustomization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (preferences: Partial<WellnessPreferences>) => {
      const response = await fetch('/api/settings/axis-customization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update axis customization settings')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'axis-customization'] })
    }
  })
}
// Initialize all user settings (for new users)
export function useInitializeUserSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/settings/user-preferences', {
        method: 'POST'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to initialize user settings')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate all settings queries to refetch with new defaults
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  })
}