import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'
import { initSupabaseDebug } from './debug'

export function createClient() {
  // Use consistent bracket notation for environment variables
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseAnonKey) {
    // TODO: Replace with proper error handling
    // console.error('Missing Supabase environment variables:', {
      url: supabaseUrl ? 'present' : 'missing',
      key: supabaseAnonKey ? 'present' : 'missing'
    });
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
          reconnectAfterMs: () => Math.random() * 5000 // Random backoff
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
      
      // Override console.error to catch Supabase errors
      const originalConsoleError = console.error
      console.error = (...args) => {
        const errorMessage = args.join(' ')
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