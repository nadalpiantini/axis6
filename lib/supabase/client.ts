import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  // Use consistent bracket notation for environment variables
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  )

  // Add refresh token error handling
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully')
    }
    
    if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' && !session)) {
      // Clear any stale auth data
      if (typeof window !== 'undefined') {
        // Clear local storage auth data
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') && key.includes('-auth-token')
        )
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
    }
  })

  return client
}