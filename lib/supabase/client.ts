import { createBrowserClient } from '@supabase/ssr'

import { initSupabaseDebug } from './debug'
import type { Database } from './types'

// Singleton instance to prevent multiple GoTrueClient instances
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

// Clean corrupted cookies before initializing client
function cleanCorruptedAuthData() {
  if (typeof window === 'undefined') return
  
  try {
    // Clean corrupted cookies
    const cookies = document.cookie.split(';')
    cookies.forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      // Check for corrupted base64 cookies that cause JSON parse errors
      if (name && name.includes('sb-') && value) {
        // Try to decode the value to check if it's corrupted
        try {
          // If it starts with "base64-" but can't be parsed, it's corrupted
          if (value.startsWith('base64-') && !value.startsWith('base64-eyJ')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
            }
        } catch {
          // Remove if we can't process it
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
      }
    })
    
    // Clean corrupted localStorage items
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.includes('sb-') && key.includes('-auth-token')) {
        try {
          const value = localStorage.getItem(key)
          // Check for malformed base64 strings
          if (value && value.startsWith('base64-') && !value.startsWith('base64-eyJ')) {
            keysToRemove.push(key)
          }
        } catch {
          keysToRemove.push(key!)
        }
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
      })
  } catch (error) {
    }
}

export function createClient() {
  // Return cached instance if available to prevent multiple GoTrueClient instances
  if (clientInstance) {
    return clientInstance
  }
  
  // Clean up any malformed cookies before initializing the client
  if (typeof window !== 'undefined') {
    try {
      // Clear any malformed Supabase session cookies
      const keysToRemove = Object.keys(localStorage).filter(key => {
        if (!key.includes('supabase') && !key.startsWith('sb-')) return false
        
        try {
          const item = localStorage.getItem(key)
          if (!item) return false
          
          // Check if it's a malformed base64 cookie that can't be parsed
          if (item.startsWith('base64-')) {
            try {
              const decoded = atob(item.substring(7))
              JSON.parse(decoded)
              return false // It's valid, keep it
            } catch {
              return true // It's malformed, remove it
            }
          }
          
          // Try to parse as JSON to check if it's valid
          JSON.parse(item)
          return false // It's valid, keep it
        } catch {
          return true // It's malformed, remove it
        }
      })
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  // Clean any corrupted auth data first
  cleanCorruptedAuthData()
  
  // Use consistent bracket notation for environment variables
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseAnonKey) {
    // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
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
          flowType: 'pkce', // Enable PKCE for better security
          // Fix cookie parsing issues with better error handling
          storage: {
            getItem: (key: string) => {
              if (typeof window === 'undefined') return null
              try {
                const item = localStorage.getItem(key)
                if (!item) return null
                
                // Handle corrupted base64 encoded session data
                if (item.startsWith('base64-')) {
                  // Check if it's a valid base64 JSON string (should start with eyJ)
                  if (!item.startsWith('base64-eyJ')) {
                    localStorage.removeItem(key)
                    return null
                  }
                  
                  try {
                    const decoded = atob(item.substring(7))
                    return JSON.parse(decoded)
                  } catch (e) {
                    // Remove corrupted data
                    localStorage.removeItem(key)
                    return null
                  }
                }
                
                // Try to parse as JSON if it looks like JSON
                if (item.startsWith('{') || item.startsWith('[')) {
                  try {
                    return JSON.parse(item)
                  } catch {
                    // Not JSON, return as string
                    return item
                  }
                }
                
                return item
              } catch (error) {
                return null
              }
            },
            setItem: (key: string, value: string) => {
              if (typeof window === 'undefined') return
              try {
                localStorage.setItem(key, value)
              } catch {
                // Ignore storage errors
              }
            },
            removeItem: (key: string) => {
              if (typeof window === 'undefined') return
              try {
                localStorage.removeItem(key)
              } catch {
                // Ignore storage errors
              }
            }
          }
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
            // Check if React Query is available
            if ((window as any).queryClient) {
              (window as any).queryClient.clear()
            }
          } catch (storageError) {
            }
        }
      }
    })

    // Add global error handler for Supabase client
    if (typeof window !== 'undefined') {
      // Add error handler to window for debugging
      (window as any).__supabaseError = null
      
      // Override console.error to catch Supabase errors and provide better handling
      const originalConsoleError = console.error
      console.error = (...args) => {
        const errorMessage = args.join(' ')
        
        // Handle WebSocket authentication errors gracefully
        if (errorMessage.includes('WebSocket connection') && 
            errorMessage.includes('HTTP Authentication failed')) {
          // Only log in development, suppress in production
          if (process.env.NODE_ENV === 'development') {
            }
          // Track for debugging but don't spam console
          (window as any).__realtimeAuthPending = true
          return
        }
        
        // Handle other realtime connection issues
        if (errorMessage.includes('WebSocket connection') && 
            (errorMessage.includes('failed') || errorMessage.includes('closed'))) {
          // Track connection issues
          (window as any).__realtimeConnectionIssue = errorMessage
          return
        }
        
        if (errorMessage.includes('supabase') || errorMessage.includes('Supabase')) {
          // Store error for debugging
          (window as any).__supabaseError = errorMessage
        }
        originalConsoleError.apply(console, args)
      }
      
      // Initialize debug helpers in development
      initSupabaseDebug()
    }

    // Cache the client instance to prevent multiple GoTrueClient instances
    clientInstance = client
    return client
  } catch (error) {
    // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Failed to create Supabase client:', error);
    throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Reset the client instance (useful for testing or error recovery)
 */
export function resetClientInstance() {
  clientInstance = null
}

/**
 * Cleanup malformed cookies that might cause parsing errors
 */
export function cleanupMalformedCookies() {
  if (typeof window === 'undefined') return

  try {
    // Clear any malformed Supabase session cookies
    const keysToRemove = Object.keys(localStorage).filter(key => {
      if (!key.includes('supabase') && !key.startsWith('sb-')) return false
      
      try {
        const item = localStorage.getItem(key)
        if (!item) return false
        
        // Check if it's a malformed base64 cookie that can't be parsed
        if (item.startsWith('base64-')) {
          try {
            const decoded = atob(item.substring(7))
            JSON.parse(decoded)
            return false // It's valid, keep it
          } catch {
            return true // It's malformed, remove it
          }
        }
        
        // Try to parse as JSON to check if it's valid
        JSON.parse(item)
        return false // It's valid, keep it
      } catch {
        return true // It's malformed, remove it
      }
    })
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // Also clear any HTTP-only cookies by setting them to expire
    const cookiesToClear = [
      'sb-auth-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase.auth.token'
    ]
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
    
    } catch (error) {
    }
}