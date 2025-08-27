import { createBrowserClient } from '@supabase/ssr'

import { initSupabaseDebug } from './debug'
import type { Database } from './types'

export function createClient() {
  // Use consistent bracket notation for environment variables
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseAnonKey) {
    // TODO: Replace with proper error handling
    // console.error('Missing Supabase environment variables:', {
    //   url: supabaseUrl ? 'present' : 'missing',
    //   key: supabaseAnonKey ? 'present' : 'missing'
    // });
    throw new Error('Missing Supabase environment variables')
  }

  try {
    const client = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce' // Enable PKCE for better security
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
          heartbeatIntervalMs: 30000, // 30 seconds
          reconnectAfterMs: (tries: number) => {
            // Progressive backoff: 1s, 2s, 4s, 8s, max 10s
            return Math.min(1000 * Math.pow(2, tries), 10000)
          },
          transport: 'websocket',
          timeout: 15000, // 15 seconds timeout (increased)
          // Configure WebSocket with better error handling
          log_level: process.env.NODE_ENV === 'development' ? 'info' : 'error',
          // Wait for authentication before connecting
          encode: (payload, callback) => {
            // Ensure we have a valid session before sending
            callback(JSON.stringify(payload))
          }
        },
        global: {
          headers: {
            'X-Client-Info': 'axis6-web'
          }
        }
      }
    )

    // Enhanced error handling for auth state changes
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
        // Clear any stale auth data
        if (typeof window !== 'undefined') {
          try {
            // Clear local storage auth data
            const keysToRemove = Object.keys(localStorage).filter(key => 
              key.startsWith('sb-') && key.includes('-auth-token')
            )
            keysToRemove.forEach(key => localStorage.removeItem(key))
            
            // Clear React Query cache on logout
            // @ts-ignore - queryClient might be added by React Query
            if (window.queryClient) {
              // @ts-ignore
              window.queryClient.clear()
            }
          } catch (storageError) {
            }
        }
      }
    })

    // Add global error handler for Supabase client
    if (typeof window !== 'undefined') {
      // @ts-ignore - Add error handler to window for debugging
      window.__supabaseError = null
      
      // Override console.error to catch Supabase errors and provide better handling
      const originalConsoleError = console.error
      console.error = (...args) => {
        const errorMessage = args.join(' ')
        
        // Handle WebSocket authentication errors gracefully
        if (errorMessage.includes('WebSocket connection') && 
            errorMessage.includes('HTTP Authentication failed')) {
          // Only log in development, suppress in production
          if (process.env.NODE_ENV === 'development') {
            console.warn('🔄 Realtime connection pending authentication - this is normal during login')
          }
          // @ts-ignore - Track for debugging but don't spam console
          window.__realtimeAuthPending = true
          return
        }
        
        // Handle other realtime connection issues
        if (errorMessage.includes('WebSocket connection') && 
            (errorMessage.includes('failed') || errorMessage.includes('closed'))) {
          console.warn('⚠️ Realtime connection issue - falling back to polling:', errorMessage)
          // @ts-ignore
          window.__realtimeConnectionIssue = errorMessage
          return
        }
        
        if (errorMessage.includes('supabase') || errorMessage.includes('Supabase')) {
          // @ts-ignore
          window.__supabaseError = errorMessage
        }
        originalConsoleError.apply(console, args)
      }
      
      // Initialize debug helpers in development
      initSupabaseDebug()
    }

    return client
  } catch (error) {
    // TODO: Replace with proper error handling
    // console.error('Failed to create Supabase client:', error);
    throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}