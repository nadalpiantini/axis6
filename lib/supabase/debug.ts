/**
 * Supabase Debug Utilities
 * 
 * This module provides debugging tools for Supabase connection issues
 */

export interface SupabaseDebugInfo {
  environment: {
    nodeEnv: string
    hasUrl: boolean
    hasKey: boolean
    urlLength: number
    keyLength: number
  }
  browser: {
    userAgent: string
    localStorage: boolean
    sessionStorage: boolean
    cookies: boolean
  }
  connection: {
    timestamp: string
    status: 'unknown' | 'success' | 'error'
    error?: string
  }
}

/**
 * Get comprehensive debug information about Supabase setup
 */
export function getSupabaseDebugInfo(): SupabaseDebugInfo {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  
  return {
    environment: {
      nodeEnv: process.env['NODE_ENV'] || 'unknown',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0,
    },
    browser: {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      localStorage: typeof window !== 'undefined' && !!window.localStorage,
      sessionStorage: typeof window !== 'undefined' && !!window.sessionStorage,
      cookies: typeof window !== 'undefined' && !!window.document.cookie,
    },
    connection: {
      timestamp: new Date().toISOString(),
      status: 'unknown',
    }
  }
}

/**
 * Test Supabase connection and return debug info
 */
export async function testSupabaseConnection(): Promise<SupabaseDebugInfo> {
  const debugInfo = getSupabaseDebugInfo()
  
  try {
    const { createClient } = await import('./client')
    const supabase = createClient()
    
    // Test a simple query
    const { data, error } = await supabase
      .from('axis6_categories')
      .select('count')
      .limit(1)
    
    if (error) {
      debugInfo.connection.status = 'error'
      debugInfo.connection.error = error.message
    } else {
      debugInfo.connection.status = 'success'
    }
  } catch (error) {
    debugInfo.connection.status = 'error'
    debugInfo.connection.error = error instanceof Error ? error.message : 'Unknown error'
  }
  
  return debugInfo
}

/**
 * Clear all Supabase-related data from browser storage
 */
export function clearSupabaseData(): void {
  if (typeof window === 'undefined') return
  
  try {
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    )
    localStorageKeys.forEach(key => localStorage.removeItem(key))
    
    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    )
    sessionStorageKeys.forEach(key => sessionStorage.removeItem(key))
    
    // Clear cookies
    const cookies = document.cookie.split(';')
    cookies.forEach(cookie => {
      const [name] = cookie.split('=')
      if (name.trim().startsWith('sb-') || name.trim().includes('supabase')) {
        document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      }
    })
    
    } catch (error) {
    // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Error clearing Supabase data:', error);
  }
}

/**
 * Log debug information to console
 */
export function logSupabaseDebug(): void {
  console.group('🔍 Supabase Debug Information')
  
  const debugInfo = getSupabaseDebugInfo()
  
  // Check for common issues
  if (!debugInfo.environment.hasUrl) {
    // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!debugInfo.environment.hasKey) {
    // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (debugInfo.environment.keyLength < 100) {
    }
  
  console.groupEnd()
}

/**
 * Initialize debug helpers in development
 */
export function initSupabaseDebug(): void {
  if (process.env['NODE_ENV'] === 'development' && typeof window !== 'undefined') {
    // Add debug helpers to window
    // Add debug helpers to window
    (window as any).supabaseDebug = {
      getInfo: getSupabaseDebugInfo,
      testConnection: testSupabaseConnection,
      clearData: clearSupabaseData,
      log: logSupabaseDebug,
    }
    
    }
}
