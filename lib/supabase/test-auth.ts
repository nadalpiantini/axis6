// Simple test utility to verify Supabase connection
import { createClient } from './client'

export async function testSupabaseConnection() {
  try {
    const supabase = createClient()
    
    // Test connection by checking the auth status
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Supabase connection error:', error);
      return { success: false, error: error.message }
    }
    
    return { 
      success: true, 
      authenticated: !!session,
      user: session?.user || null 
    }
  } catch (error) {
    // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Supabase test failed:', error);
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
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Auth error:', error);
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
    // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Auth test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}