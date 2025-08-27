'use client'

import { useState, useEffect, useCallback } from 'react'

interface CSRFState {
  token: string | null
  isLoading: boolean
  error: string | null
}

/**
 * Custom hook for managing CSRF tokens in the client
 */
export function useCSRF() {
  const [state, setState] = useState<CSRFState>({
    token: null,
    isLoading: false,
    error: null
  })

  /**
   * Fetches a new CSRF token from the server
   */
  const fetchToken = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'include' // Important for cookies
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }
      
      const data = await response.json()
      
      setState({
        token: data.token,
        isLoading: false,
        error: null
      })
      
      // Store token in sessionStorage for easy access
      if (typeof window !== 'undefined' && data.token) {
        sessionStorage.setItem('csrf-token', data.token)
      }
      
      return data.token
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState({
        token: null,
        isLoading: false,
        error: errorMessage
      })
      return null
    }
  }, [])

  /**
   * Gets the token from sessionStorage or fetches a new one
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    // Check sessionStorage first
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('csrf-token')
      if (storedToken) {
        return storedToken
      }
    }
    
    // If no stored token, fetch a new one
    return fetchToken()
  }, [fetchToken])

  /**
   * Refreshes the CSRF token
   */
  const refreshToken = useCallback(async () => {
    // Clear existing token from sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('csrf-token')
    }
    
    // Fetch new token
    return fetchToken()
  }, [fetchToken])

  /**
   * Helper function to add CSRF token to fetch headers
   */
  const getHeaders = useCallback(async (additionalHeaders: HeadersInit = {}): Promise<HeadersInit> => {
    const token = await getToken()
    
    if (!token) {
      throw new Error('No CSRF token available')
    }
    
    return {
      ...additionalHeaders,
      'x-csrf-token': token
    }
  }, [getToken])

  /**
   * Wrapper for fetch with automatic CSRF token inclusion
   */
  const secureFetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    // Skip CSRF for GET requests
    if (!options.method || options.method.toUpperCase() === 'GET') {
      return fetch(url, options)
    }
    
    const headers = await getHeaders(options.headers || {})
    
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Always include cookies
    })
  }, [getHeaders])

  // Fetch token on mount
  useEffect(() => {
    getToken()
  }, [getToken])

  return {
    token: state.token,
    isLoading: state.isLoading,
    error: state.error,
    refreshToken,
    getHeaders,
    secureFetch
  }
}

/**
 * Example usage in a component:
 * 
 * const { secureFetch, refreshToken } = useCSRF()
 * 
 * const handleSubmit = async (data) => {
 *   try {
 *     const response = await secureFetch('/api/protected-endpoint', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(data)
 *     })
 *     
 *     if (response.status === 403) {
 *       // CSRF token might be expired, refresh and retry
 *       await refreshToken()
 *       // Retry the request...
 *     }
 *   } catch (error) {
 *     // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Request failed:', error);
 *   }
 * }
 */