import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  // Trim any whitespace or newlines from environment variables
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']?.trim()
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']?.trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(
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
}