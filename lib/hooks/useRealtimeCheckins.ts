import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeCheckins(userId: string | undefined) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    let channel: RealtimeChannel

    const setupRealtime = async () => {
      // Check authentication before setting up realtime
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.warn('⚠️ Realtime setup failed: Authentication error', authError.message)
        return
      }
      
      if (!user) {
        console.warn('⚠️ Realtime setup skipped: No authenticated user')
        return
      }
      
      // Subscribe to changes in checkins table for this user
      channel = supabase
        .channel(`checkins:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'axis6_checkins',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('✅ Realtime checkins update:', payload)
            
            // Invalidate and refetch checkins data
            queryClient.invalidateQueries({ queryKey: ['checkins', 'today', userId] })
            
            // Also invalidate streaks as they depend on checkins
            queryClient.invalidateQueries({ queryKey: ['streaks', userId] })
            
            // Optionally, show a notification for the update
            if (payload.eventType === 'INSERT') {
              console.log('🎉 New check-in added')
            } else if (payload.eventType === 'DELETE') {
              console.log('❌ Check-in removed')
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime checkins subscription status:', status)
        })
    }

    setupRealtime()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, queryClient, supabase])
}

// Hook for realtime streak updates
export function useRealtimeStreaks(userId: string | undefined) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    let channel: RealtimeChannel

    const setupRealtime = async () => {
      // Check authentication before setting up realtime
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.warn('⚠️ Realtime streaks setup failed: Authentication error', authError.message)
        return
      }
      
      if (!user) {
        console.warn('⚠️ Realtime streaks setup skipped: No authenticated user')
        return
      }
      
      // Subscribe to changes in streaks table for this user
      channel = supabase
        .channel(`streaks:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'axis6_streaks',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('✅ Realtime streaks update:', payload)
            
            // Invalidate and refetch streaks data
            queryClient.invalidateQueries({ queryKey: ['streaks', userId] })
            
            // Show achievement notification for milestone streaks
            if (payload.eventType === 'UPDATE' && payload.new) {
              const newStreak = payload.new as any
              if (newStreak.current_streak % 7 === 0 && newStreak.current_streak > 0) {
                // Weekly milestone reached
                console.log(`🎉 ${newStreak.current_streak} day streak achieved!`)
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime streaks subscription status:', status)
        })
    }

    setupRealtime()

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, queryClient, supabase])
}

// Combined hook for all realtime updates
export function useRealtimeDashboard(userId: string | undefined) {
  useRealtimeCheckins(userId)
  useRealtimeStreaks(userId)
}