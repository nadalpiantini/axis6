import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null
let initializationError: Error | null = null

/**
 * Safe Supabase client creation with error handling
 */
export function createClientSafe() {
  // Return cached instance if available
  if (clientInstance) {
    return clientInstance
  }

  // Return cached error if initialization failed
  if (initializationError) {
    throw initializationError
  }

  try {
    // Use consistent bracket notation for environment variables
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    if (!supabaseUrl || !supabaseAnonKey) {
      const error = new Error('Missing Supabase environment variables')
      initializationError = error
      throw error
    }

    // Validate URL format
    try {
      new URL(supabaseUrl)
    } catch (urlError) {
      const error = new Error(`Invalid Supabase URL: ${supabaseUrl}`)
      initializationError = error
      throw error
    }

    // Create client with minimal configuration to avoid issues
    const client = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        },
        global: {
          headers: {
            'X-Client-Info': 'axis6-web'
          }
        }
      }
    )

    // Cache the successful instance
    clientInstance = client

    // Add error handler for auth state changes
    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
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
            console.warn('Error clearing auth data:', storageError)
          }
        }
      }
    })

    return client
  } catch (error) {
    // Cache the error to prevent repeated failed initializations
    initializationError = error instanceof Error ? error : new Error('Unknown Supabase initialization error')
    throw initializationError
  }
}

/**
 * Reset the client instance (useful for testing or error recovery)
 */
export function resetClient() {
  clientInstance = null
  initializationError = null
}

/**
 * Get client instance without throwing (returns null if not available)
 */
export function getClientSafe() {
  try {
    return createClientSafe()
  } catch {
    return null
  }
}
