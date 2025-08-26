'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a Supabase-related error
    const isSupabaseError = 
      error.message.includes('supabase') ||
      error.message.includes('Supabase') ||
      error.message.includes('auth') ||
      error.message.includes('database') ||
      error.stack?.includes('supabase') ||
      error.name === 'SupabaseError'

    if (isSupabaseError) {
      return { hasError: true, error }
    }
    
    // Let other error boundaries handle non-Supabase errors
    return { hasError: false }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Supabase Error Boundary caught an error:', error, errorInfo)
    
    // Log to external service if available
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      ;(window as any).Sentry.captureException(error, {
        contexts: {
          errorBoundary: {
            name: 'SupabaseErrorBoundary',
            errorInfo: errorInfo.componentStack
          }
        }
      })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleClearAuth = async () => {
    try {
      // Clear any Supabase auth data
      if (typeof window !== 'undefined') {
        const keysToRemove = Object.keys(localStorage).filter(key => 
          key.startsWith('sb-') || key.includes('supabase')
        )
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Clear session storage as well
        const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
          key.startsWith('sb-') || key.includes('supabase')
        )
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key))
      }
      
      // Reload the page to reset the state
      window.location.reload()
    } catch (error) {
      console.error('Error clearing auth data:', error)
      this.handleRetry()
    }
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              Connection Error
            </h2>
            
            <p className="text-gray-600 text-center mb-6">
              We're having trouble connecting to our services. This might be a temporary issue.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleClearAuth}
                className="w-full"
                variant="outline"
              >
                Clear Data & Reload
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
