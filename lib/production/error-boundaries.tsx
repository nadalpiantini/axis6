/**
 * Production-grade Error Boundary System
 * Comprehensive error handling with fallback UI and monitoring
 */

'use client'

import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import React, { Component, ReactNode } from 'react'

import { Button } from '@/components/ui/Button'


interface ErrorInfo {
  componentStack: string
  errorBoundary?: string
  errorInfo?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  eventId: string | null
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'feature'
  maxRetries?: number
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
  retryCount: number
  level: string
  eventId: string | null
}

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  retryCount,
  level,
  eventId
}: ErrorFallbackProps) {
  const isPageLevel = level === 'page'
  
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 text-center ${
      isPageLevel ? 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100' : 'bg-red-50 rounded-lg border border-red-200'
    }`}>
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isPageLevel ? 'Something went wrong' : 'Component Error'}
        </h2>
        
        <p className="text-gray-600 mb-6">
          {isPageLevel 
            ? "We're experiencing technical difficulties. Our team has been notified."
            : 'This feature is temporarily unavailable.'
          }
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left mb-6 p-4 bg-gray-100 rounded text-sm">
            <summary className="font-semibold cursor-pointer">Error Details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-all text-xs">
              {error.toString()}
              {errorInfo?.componentStack && (
                <>
                  \n\nComponent Stack:
                  {errorInfo.componentStack}
                </>
              )}
            </pre>
          </details>
        )}
        
        <div className="flex gap-3 justify-center">
          {retryCount < 3 && (
            <Button 
              onClick={resetError}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
          
          {isPageLevel && (
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          )}
        </div>
        
        {eventId && (
          <p className="text-xs text-gray-500 mt-4">
            Error ID: {eventId}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Production Error Boundary with monitoring and recovery
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack || '',
      errorBoundary: this.constructor.name,
      errorInfo: errorInfo.componentStack || ''
    }

    // Report to Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        }
      },
      tags: {
        errorBoundary: this.constructor.name,
        level: this.props.level || 'component'
      },
      extra: {
        retryCount: this.state.retryCount,
        props: this.props.resetKeys
      }
    })

    this.setState({
      errorInfo: enhancedErrorInfo,
      eventId
    })

    // Call custom error handler
    this.props.onError?.(error, enhancedErrorInfo)

    // Auto-retry for non-page level errors
    if (this.props.level !== 'page' && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.handleReset()
      }, 5000) // Auto-retry after 5 seconds
    }
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        this.handleReset()
      }
    }
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.handleReset}
          retryCount={this.state.retryCount}
          level={this.props.level || 'component'}
          eventId={this.state.eventId}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook for error boundary integration
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    Sentry.captureException(error, {
      extra: errorInfo
    })
  }
}

/**
 * Specific error boundaries for different app sections
 */
export const PageErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level="page" maxRetries={1} />
)

export const FeatureErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level="feature" maxRetries={3} />
)

export const ComponentErrorBoundary = (props: Omit<ErrorBoundaryProps, 'level'>) => (
  <ErrorBoundary {...props} level="component" maxRetries={3} />
)