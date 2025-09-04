// Simple test utility to verify Supabase connection
import { createClient } from './client'
import { handleError } from '@/lib/error/standardErrorHandler'
export async function testSupabaseConnection() {
  try {
    const supabase = createClient()
    // Test connection by checking the auth status
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      handleError(error, {
      operation: 'database_operation', component: 'test-auth',
        userMessage: 'Database operation failed. Please try again.'
      })
      return { success: false, error: error.message }
    }
    return {
      success: true,
      authenticated: !!session,
      user: session?.user || null
    }
  } catch (error) {
    handleError(error, {
      operation: 'database_operation', component: 'test-auth',
      userMessage: 'Database operation failed. Please try again.'
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
export async function testSupabaseAuth(email: string, password: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      handleError(error, {
      operation: 'database_operation', component: 'test-auth',
        userMessage: 'Database operation failed. Please try again.'
      })
      return { success: false, error: error.message }
    }
    if (data.user) {
      return {
        success: true,
        user: data.user,
        session: data.session
      }
    }
    return { success: false, error: 'No user returned' }
  } catch (error) {
    handleError(error, {
      operation: 'database_operation', component: 'test-auth',
      userMessage: 'Database operation failed. Please try again.'
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
