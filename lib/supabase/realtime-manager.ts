import { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from './client'

interface RealtimeConnectionState {
  isConnected: boolean
  lastConnected: Date | null
  consecutiveFailures: number
  shouldUsePolling: boolean
}

class RealtimeConnectionManager {
  private state: RealtimeConnectionState = {
    isConnected: false,
    lastConnected: null,
    consecutiveFailures: 0,
    shouldUsePolling: false
  }
  
  private supabase: SupabaseClient
  private maxFailures = 3
  private pollingFallbackDelay = 30000 // 30 seconds
  
  constructor() {
    this.supabase = createClient()
  }
  
  /**
   * Check if realtime should be used or if we should fall back to polling
   */
  shouldUseRealtime(): boolean {
    return !this.state.shouldUsePolling && this.state.consecutiveFailures < this.maxFailures
  }
  
  /**
   * Record a successful connection
   */
  onConnectionSuccess() {
    this.state.isConnected = true
    this.state.lastConnected = new Date()
    this.state.consecutiveFailures = 0
    this.state.shouldUsePolling = false
  }
  
  /**
   * Record a connection failure
   */
  onConnectionFailure() {
    this.state.isConnected = false
    this.state.consecutiveFailures += 1
    
    if (this.state.consecutiveFailures >= this.maxFailures) {
      this.state.shouldUsePolling = true
      console.warn(`Realtime connection failed ${this.maxFailures} times, falling back to polling`)
      
      // Auto-retry realtime after fallback delay
      setTimeout(() => {
        this.resetFailureCount()
      }, this.pollingFallbackDelay)
    }
  }
  
  /**
   * Reset failure count to allow realtime retry
   */
  resetFailureCount() {
    this.state.consecutiveFailures = 0
    this.state.shouldUsePolling = false
    console.log('Realtime connection retry enabled')
  }
  
  /**
   * Get current connection state for debugging
   */
  getState(): RealtimeConnectionState {
    return { ...this.state }
  }
  
  /**
   * Check if user is authenticated for realtime
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return !!(session?.access_token)
    } catch (error) {
      console.warn('Authentication check failed:', error)
      return false
    }
  }
  
  /**
   * Wait for authentication with timeout
   */
  async waitForAuth(timeoutMs = 10000): Promise<boolean> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeoutMs) {
      if (await this.isAuthenticated()) {
        return true
      }
      
      // Wait 500ms before checking again
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return false
  }
}

// Global instance
export const realtimeManager = new RealtimeConnectionManager()

/**
 * Enhanced hook for graceful realtime connections
 */
export function useRealtimeConnection() {
  return {
    shouldUseRealtime: () => realtimeManager.shouldUseRealtime(),
    onConnectionSuccess: () => realtimeManager.onConnectionSuccess(),
    onConnectionFailure: () => realtimeManager.onConnectionFailure(),
    getState: () => realtimeManager.getState(),
    waitForAuth: (timeout?: number) => realtimeManager.waitForAuth(timeout)
  }
}

/**
 * Utility to create a robust channel with auth handling
 */
export async function createAuthenticatedChannel(
  channelName: string,
  userId: string,
  onConnectionChange?: (connected: boolean) => void
) {
  const supabase = createClient()
  
  // Wait for authentication
  const isAuthenticated = await realtimeManager.waitForAuth()
  if (!isAuthenticated) {
    throw new Error('Cannot create realtime channel: No authentication')
  }
  
  const channel = supabase.channel(channelName, {
    config: {
      presence: { key: userId }
    }
  })
  
  // Enhanced subscription with connection monitoring
  const subscribe = (callback: Parameters<typeof channel.subscribe>[0]) => {
    return channel.subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        realtimeManager.onConnectionSuccess()
        onConnectionChange?.(true)
        console.log(`✅ Realtime channel '${channelName}' connected`)
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        realtimeManager.onConnectionFailure()
        onConnectionChange?.(false)
        console.warn(`❌ Realtime channel '${channelName}' disconnected: ${status}`)
      }
      
      callback(status, error)
    })
  }
  
  return {
    channel,
    subscribe,
    unsubscribe: () => supabase.removeChannel(channel)
  }
}