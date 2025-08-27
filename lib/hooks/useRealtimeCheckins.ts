import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'


interface RealtimeState {
  isConnected: boolean
  error: string | null
  retryCount: number
}

export function useRealtimeCheckins(userId: string | undefined) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [realtimeState, setRealtimeState] = useState<RealtimeState>({
    isConnected: false,
    error: null,
    retryCount: 0
  })
  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 3
  const retryDelays = [1000, 3000, 5000] // Progressive backoff

  useEffect(() => {
    if (!userId) {
      setRealtimeState({ isConnected: false, error: null, retryCount: 0 })
      return
    }

    const setupRealtime = async (attemptNumber = 0) => {
      try {
        // Wait for authentication to be fully established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`)
        }
        
        if (!session?.access_token) {
          // If no session, wait a bit and retry (user might be logging in)
          if (attemptNumber < maxRetries) {
            const delay = retryDelays[attemptNumber] || 5000
            retryTimeoutRef.current = setTimeout(() => {
              setRealtimeState(prev => ({ ...prev, retryCount: attemptNumber + 1 }))
              setupRealtime(attemptNumber + 1)
            }, delay)
          } else {
            setRealtimeState({ 
              isConnected: false, 
              error: 'No authenticated session available', 
              retryCount: attemptNumber 
            })
          }
          return
        }

        // Clean up any existing channel
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }

        // Create channel with authenticated session
        const channel = supabase
          .channel(`checkins:${userId}`, {
            config: {
              presence: {
                key: userId,
              },
            },
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'axis6_checkins',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              // Invalidate and refetch checkins data
              queryClient.invalidateQueries({ queryKey: ['checkins', 'today', userId] })
              
              // Also invalidate streaks as they depend on checkins
              queryClient.invalidateQueries({ queryKey: ['streaks', userId] })
              
              // Log successful realtime update for debugging
              console.log('Realtime checkins update received:', payload.eventType)
            }
          )
          .subscribe((status, error) => {
            if (status === 'SUBSCRIBED') {
              setRealtimeState({ 
                isConnected: true, 
                error: null, 
                retryCount: 0 
              })
              console.log('Realtime checkins subscription active')
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              setRealtimeState({ 
                isConnected: false, 
                error: error?.message || `Connection ${status.toLowerCase()}`, 
                retryCount: attemptNumber 
              })
              
              // Attempt retry with backoff
              if (attemptNumber < maxRetries) {
                const delay = retryDelays[attemptNumber] || 5000
                retryTimeoutRef.current = setTimeout(() => {
                  console.log(`Retrying realtime connection (attempt ${attemptNumber + 1}/${maxRetries})`)
                  setupRealtime(attemptNumber + 1)
                }, delay)
              } else {
                console.warn('Max realtime retry attempts reached, falling back to polling')
              }
            }
          })

        channelRef.current = channel

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown realtime error'
        setRealtimeState({ 
          isConnected: false, 
          error: errorMessage, 
          retryCount: attemptNumber 
        })
        
        console.warn('Realtime setup error:', errorMessage)
        
        // Don't retry on auth errors
        if (errorMessage.includes('Session error') && attemptNumber < maxRetries) {
          const delay = retryDelays[attemptNumber] || 5000
          retryTimeoutRef.current = setTimeout(() => {
            setupRealtime(attemptNumber + 1)
          }, delay)
        }
      }
    }

    setupRealtime()

    // Cleanup function
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      setRealtimeState({ isConnected: false, error: null, retryCount: 0 })
    }
  }, [userId, queryClient, supabase])

  return realtimeState
}

// Hook for realtime streak updates
export function useRealtimeStreaks(userId: string | undefined) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [realtimeState, setRealtimeState] = useState<RealtimeState>({
    isConnected: false,
    error: null,
    retryCount: 0
  })
  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 3
  const retryDelays = [1000, 3000, 5000]

  useEffect(() => {
    if (!userId) {
      setRealtimeState({ isConnected: false, error: null, retryCount: 0 })
      return
    }

    const setupRealtime = async (attemptNumber = 0) => {
      try {
        // Wait for authentication to be fully established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw new Error(`Session error: ${sessionError.message}`)
        }
        
        if (!session?.access_token) {
          if (attemptNumber < maxRetries) {
            const delay = retryDelays[attemptNumber] || 5000
            retryTimeoutRef.current = setTimeout(() => {
              setRealtimeState(prev => ({ ...prev, retryCount: attemptNumber + 1 }))
              setupRealtime(attemptNumber + 1)
            }, delay)
          } else {
            setRealtimeState({ 
              isConnected: false, 
              error: 'No authenticated session available', 
              retryCount: attemptNumber 
            })
          }
          return
        }

        // Clean up any existing channel
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current)
          channelRef.current = null
        }

        // Create channel with authenticated session
        const channel = supabase
          .channel(`streaks:${userId}`, {
            config: {
              presence: {
                key: userId,
              },
            },
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'axis6_streaks',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              // Invalidate and refetch streaks data
              queryClient.invalidateQueries({ queryKey: ['streaks', userId] })
              
              // Show achievement notification for milestone streaks
              if (payload.eventType === 'UPDATE' && payload.new) {
                const newStreak = payload.new as any
                if (newStreak.current_streak % 7 === 0 && newStreak.current_streak > 0) {
                  console.log(`Weekly milestone reached: ${newStreak.current_streak} days!`)
                }
              }
            }
          )
          .subscribe((status, error) => {
            if (status === 'SUBSCRIBED') {
              setRealtimeState({ 
                isConnected: true, 
                error: null, 
                retryCount: 0 
              })
              console.log('Realtime streaks subscription active')
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              setRealtimeState({ 
                isConnected: false, 
                error: error?.message || `Connection ${status.toLowerCase()}`, 
                retryCount: attemptNumber 
              })
              
              // Attempt retry with backoff
              if (attemptNumber < maxRetries) {
                const delay = retryDelays[attemptNumber] || 5000
                retryTimeoutRef.current = setTimeout(() => {
                  setupRealtime(attemptNumber + 1)
                }, delay)
              }
            }
          })

        channelRef.current = channel

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown realtime error'
        setRealtimeState({ 
          isConnected: false, 
          error: errorMessage, 
          retryCount: attemptNumber 
        })
        
        console.warn('Realtime streaks setup error:', errorMessage)
      }
    }

    setupRealtime()

    // Cleanup function
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      
      setRealtimeState({ isConnected: false, error: null, retryCount: 0 })
    }
  }, [userId, queryClient, supabase])

  return realtimeState
}

// Combined hook for all realtime updates
export function useRealtimeDashboard(userId: string | undefined) {
  const checkinsState = useRealtimeCheckins(userId)
  const streaksState = useRealtimeStreaks(userId)
  
  // Return combined state for monitoring
  return {
    checkins: checkinsState,
    streaks: streaksState,
    isAnyConnected: checkinsState.isConnected || streaksState.isConnected,
    hasErrors: checkinsState.error !== null || streaksState.error !== null,
    errors: [checkinsState.error, streaksState.error].filter(Boolean)
  }
}