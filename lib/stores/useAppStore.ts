import { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// UI State Store - for UI-related state
interface UIState {
  // Sidebar & Navigation
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  
  // Modals
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void
  
  // Loading states
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    timestamp: number
  }>
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: UIState['theme']) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Modals
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
  
  // Loading
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  
  // Notifications
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        ...notification,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now()
      }
    ]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  clearNotifications: () => set({ notifications: [] }),
  
  // Theme
  theme: 'dark',
  setTheme: (theme) => set({ theme })
}))

// User Preferences Store - persisted to localStorage
interface UserPreferences {
  locale: 'es' | 'en'
  setLocale: (locale: 'es' | 'en') => void
  
  timezone: string
  setTimezone: (timezone: string) => void
  
  notifications: {
    daily: boolean
    weekly: boolean
    achievements: boolean
  }
  setNotificationPreference: (key: keyof UserPreferences['notifications'], value: boolean) => void
  
  dashboardLayout: 'compact' | 'expanded'
  setDashboardLayout: (layout: 'compact' | 'expanded') => void
  
  showAnimations: boolean
  setShowAnimations: (show: boolean) => void
  
  // ADHD-friendly focus mode
  adhdFocusMode: boolean
  setAdhdFocusMode: (enabled: boolean) => void
  
  // Social features preferences
  showResonance: boolean
  setShowResonance: (show: boolean) => void
  
  showCommunityMetrics: boolean
  setShowCommunityMetrics: (show: boolean) => void
  
  // Mood tracking
  lastMoodSelection: string | null
  setLastMoodSelection: (date: string | null) => void
}

export const usePreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      locale: 'es',
      setLocale: (locale) => set({ locale }),
      
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      setTimezone: (timezone) => set({ timezone }),
      
      notifications: {
        daily: true,
        weekly: true,
        achievements: true
      },
      setNotificationPreference: (key, value) => set((state) => ({
        notifications: {
          ...state.notifications,
          [key]: value
        }
      })),
      
      dashboardLayout: 'compact',
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      
      showAnimations: true,
      setShowAnimations: (show) => set({ showAnimations: show }),
      
      // ADHD-friendly focus mode - disabled by default
      adhdFocusMode: false,
      setAdhdFocusMode: (enabled) => set({ adhdFocusMode: enabled }),
      
      // Social features - enabled by default for subtle social layer
      showResonance: true,
      setShowResonance: (show) => set({ showResonance: show }),
      
      showCommunityMetrics: true,
      setShowCommunityMetrics: (show) => set({ showCommunityMetrics: show }),
      
      lastMoodSelection: null,
      setLastMoodSelection: (date) => set({ lastMoodSelection: date })
    }),
    {
      name: 'axis6-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        locale: state.locale,
        timezone: state.timezone,
        notifications: state.notifications,
        dashboardLayout: state.dashboardLayout,
        showAnimations: state.showAnimations,
        adhdFocusMode: state.adhdFocusMode,
        showResonance: state.showResonance,
        showCommunityMetrics: state.showCommunityMetrics,
        lastMoodSelection: state.lastMoodSelection
      })
    }
  )
)

// Check-in State Store - for managing check-in data
interface CheckInState {
  // Today's check-ins
  todayCheckins: Set<string>
  toggleCheckin: (categoryId: string) => void
  setTodayCheckins: (checkins: string[]) => void
  
  // Optimistic updates
  pendingCheckins: Set<string>
  addPendingCheckin: (categoryId: string) => void
  removePendingCheckin: (categoryId: string) => void
  
  // Streaks
  streaks: Map<string, { current: number; longest: number }>
  setStreaks: (streaks: Array<{ categoryId: string; current: number; longest: number }>) => void
  
  // Analytics
  weeklyProgress: Map<string, number>
  setWeeklyProgress: (progress: Array<{ day: string; count: number }>) => void
  
  reset: () => void
}

export const useCheckInStore = create<CheckInState>((set) => ({
  todayCheckins: new Set(),
  toggleCheckin: (categoryId) => set((state) => {
    const newCheckins = new Set(state.todayCheckins)
    if (newCheckins.has(categoryId)) {
      newCheckins.delete(categoryId)
    } else {
      newCheckins.add(categoryId)
    }
    return { todayCheckins: newCheckins }
  }),
  setTodayCheckins: (checkins) => set({ todayCheckins: new Set(checkins) }),
  
  pendingCheckins: new Set(),
  addPendingCheckin: (categoryId) => set((state) => ({
    pendingCheckins: new Set([...state.pendingCheckins, categoryId])
  })),
  removePendingCheckin: (categoryId) => set((state) => {
    const newPending = new Set(state.pendingCheckins)
    newPending.delete(categoryId)
    return { pendingCheckins: newPending }
  }),
  
  streaks: new Map(),
  setStreaks: (streaks) => set({
    streaks: new Map(streaks.map(s => [s.categoryId, { current: s.current, longest: s.longest }]))
  }),
  
  weeklyProgress: new Map(),
  setWeeklyProgress: (progress) => set({
    weeklyProgress: new Map(progress.map(p => [p.day, p.count]))
  }),
  
  reset: () => set({
    todayCheckins: new Set(),
    pendingCheckins: new Set(),
    streaks: new Map(),
    weeklyProgress: new Map()
  })
}))

// Auth State Store - for managing authentication state
interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  
  session: any | null
  setSession: (session: any | null) => void
  
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  session: null,
  setSession: (session) => set({ session }),
  
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  signOut: () => set({ user: null, session: null })
}))