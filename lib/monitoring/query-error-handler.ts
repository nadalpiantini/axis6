/**
 * React Query error handler with enhanced error tracking
 */

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { reportError, categorizeError, type ErrorContext } from './error-tracking'
import { logger } from '@/lib/utils/logger'

export interface QueryError extends Error {
  status?: number
  statusText?: string
  data?: any
}

export function createQueryErrorHandler() {
  return (error: unknown, query?: any) => {
    const queryError = error as QueryError
    const queryKey = query?.queryKey || ['unknown']
    
    logger.error(`Query error for ${JSON.stringify(queryKey)}`, queryError)
    
    // Enhanced context for query errors
    const context: ErrorContext = {
      component: 'ReactQuery',
      action: 'query_error',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      metadata: {
        queryKey: JSON.stringify(queryKey),
        status: queryError.status,
        statusText: queryError.statusText,
        queryHash: query?.queryHash,
        retryCount: query?.state?.fetchFailureCount || 0,
        isStale: query?.state?.isStale,
        timestamp: new Date().toISOString(),
      },
    }
    
    // Determine severity based on error type and status
    let severity: 'low' | 'normal' | 'high' | 'critical' = 'normal'
    
    if (queryError.status) {
      if (queryError.status >= 500) {
        severity = 'high' // Server errors
      } else if (queryError.status === 401 || queryError.status === 403) {
        severity = 'high' // Auth errors
      } else if (queryError.status >= 400) {
        severity = 'normal' // Client errors
      }
    }
    
    // Network errors should be critical
    if (queryError.message?.includes('NetworkError') || queryError.message?.includes('fetch')) {
      severity = 'critical'
    }
    
    reportError(queryError, severity, context)
  }
}

export function createEnhancedQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          const queryError = error as QueryError
          
          // Don't retry on auth errors
          if (queryError.status === 401 || queryError.status === 403) {
            return false
          }
          
          // Don't retry on client errors (4xx)
          if (queryError.status && queryError.status >= 400 && queryError.status < 500) {
            return false
          }
          
          // Retry up to 3 times for network/server errors
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      },
      mutations: {
        retry: (failureCount, error) => {
          const mutationError = error as QueryError
          
          // Never retry mutations on client errors
          if (mutationError.status && mutationError.status >= 400 && mutationError.status < 500) {
            return false
          }
          
          // Retry once for network/server errors
          return failureCount < 1
        },
        retryDelay: 2000,
        onError: createQueryErrorHandler(),
      },
    },
    queryCache: new QueryCache({
      onError: createQueryErrorHandler(),
    }),
    mutationCache: new MutationCache({
      onError: createQueryErrorHandler(),
    }),
  })
}