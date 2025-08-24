// Simple test utility to verify Supabase connection
import { createClient } from './client'

export async function testSupabaseConnection() {
  try {
    const supabase = createClient()
    
    // Test connection by checking the auth status
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Supabase connection error:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Supabase connection successful')
    return { 
      success: true, 
      authenticated: !!session,
      user: session?.user || null 
    }
  } catch (error) {
    console.error('Supabase test failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function testSupabaseAuth(email: string, password: string) {
  try {
    const supabase = createClient()
    
    console.log('Attempting to sign in with:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Auth error:', error)
      return { success: false, error: error.message }
    }
    
    if (data.user) {
      console.log('Authentication successful for user:', data.user.id)
      return { 
        success: true, 
        user: data.user,
        session: data.session 
      }
    }
    
    return { success: false, error: 'No user returned' }
  } catch (error) {
    console.error('Auth test failed:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}