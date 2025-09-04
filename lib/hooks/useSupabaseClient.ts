import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getClientSafe } from '@/lib/supabase/client-safe'
import { handleError } from '@/lib/error/standardErrorHandler'
interface UseSupabaseClientReturn {
  client: ReturnType<typeof createClient> | null
  error: Error | null
  isLoading: boolean
  retry: () => void
}
/**
 * Hook for safely accessing the Supabase client with error handling
 */
export function useSupabaseClient(): UseSupabaseClientReturn {
  const [client, setClient] = useState<ReturnType<typeof createClient> | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const initializeClient = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Try the safe client first
      const safeClient = getClientSafe()
      if (safeClient) {
        setClient(safeClient)
        setIsLoading(false)
        return
      }
      // Fallback to regular client
      const regularClient = createClient()
      setClient(regularClient)
      setIsLoading(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize Supabase client')
      setError(error)
      setIsLoading(false)
      // Log error for debugging
      handleError(error, {
        operation: 'unknown_operation',
        component: 'useSupabaseClient',
        userMessage: 'Something went wrong. Please try again.'
      })
    // // Handled by standardErrorHandler;
    }
  }, [])
  const retry = useCallback(() => {
    initializeClient()
  }, [initializeClient])
  useEffect(() => {
    initializeClient()
  }, [initializeClient])
  return {
    client,
    error,
    isLoading,
    retry
  }
}
/**
 * Hook for getting a Supabase client with automatic retry on error
 */
export function useSupabaseClientWithRetry(maxRetries = 3): UseSupabaseClientReturn {
  const [retryCount, setRetryCount] = useState(0)
  const { client, error, isLoading, retry } = useSupabaseClient()
  const retryWithBackoff = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      setTimeout(() => {
        retry()
      }, Math.pow(2, retryCount) * 1000) // Exponential backoff
    } else {
      retry()
    }
  }, [retry, retryCount, maxRetries])
  useEffect(() => {
    if (error && retryCount < maxRetries) {
      retryWithBackoff()
    }
  }, [error, retryCount, maxRetries, retryWithBackoff])
  return {
    client,
    error: retryCount >= maxRetries ? error : null,
    isLoading,
    retry: retryWithBackoff
  }
}
