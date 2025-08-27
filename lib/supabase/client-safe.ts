import { createClient, resetClientInstance } from './client'
import type { Database } from './types'

let safeClientInstance: ReturnType<typeof createClient> | null = null
let initializationError: Error | null = null

/**
 * Safe Supabase client creation with error handling
 */
export function createClientSafe() {
  // Return cached instance if available
  if (safeClientInstance) {
    return safeClientInstance
  }

  // Return cached error if initialization failed
  if (initializationError) {
    throw initializationError
  }

  try {
    // Use the main client instance to avoid multiple GoTrueClient instances
    const client = createClient()
    
    // Cache the successful instance
    safeClientInstance = client
    
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
  safeClientInstance = null
  initializationError = null
  // Also reset the main client instance
  resetClientInstance()
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
