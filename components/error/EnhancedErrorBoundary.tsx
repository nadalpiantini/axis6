'use client'

import { AlertTriangle, RefreshCw, RotateCcw, Bug, Wifi, WifiOff } from 'lucide-react'
import React, { Component, ErrorInfo, ReactNode, useState, useEffect, useCallback } from 'react'

import { logger } from '@/lib/utils/logger'

// Error severity levels
type ErrorLevel = 'page' | 'section' | 'component' | 'critical'

// Error types for better categorization
type ErrorType =
  | 'network'
  | 'database'
  | 'rendering'
  | 'permission'
  | 'validation'
  | 'unknown'

// Enhanced error context
interface ErrorContext {
  component?: string
  page?: string
  userId?: string
  timestamp?: string
  userAgent?: string
  url?: string
  previousError?: string
  retryCount?: number
}

interface ErrorInfo {
  error: Error
  errorInfo: ErrorInfo
  errorType: ErrorType
  level: ErrorLevel
  context: ErrorContext
  timestamp: string
}

interface EnhancedErrorBoundaryProps {
  children: ReactNode
  level?: ErrorLevel
  context?: ErrorContext
  fallback?: (error: Error, retry: () => void, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => void
  maxRetries?: number
  retryDelay?: number
  showDetails?: boolean
}

interface EnhancedErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorType: ErrorType
  retryCount: number
  isRetrying: boolean
  lastErrorTime: number
  errorId: string
}

// Error classification utility
function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase()
  const name = error.name.toLowerCase()

  // Network errors
  if (message.includes('fetch') || message.includes('network') ||
      message.includes('timeout') || name.includes('networkerror')) {
    return 'network'
  }

  // Database/API errors
  if (message.includes('supabase') || message.includes('database') ||
      message.includes('sql') || message.includes('rpc')) {
    return 'database'
  }

  // Permission errors
  if (message.includes('unauthorized') || message.includes('forbidden') ||
      message.includes('permission') || message.includes('access')) {
    return 'permission'
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') ||
      message.includes('required') || name.includes('validationerror')) {
    return 'validation'
  }

  // Rendering errors
  if (name.includes('typeerror') || name.includes('referenceerror') ||
      message.includes('undefined') || message.includes('null')) {
    return 'rendering'
  }

  return 'unknown'
}

// Generate unique error ID for tracking
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Network status hook
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

// Enhanced Error Fallback Components
function NetworkErrorFallback({
  error,
  retry,
  reset,
  level,
  isOnline
}: {
  error: Error
  retry: () => void
  reset: () => void
  level: ErrorLevel
  isOnline: boolean
}) {
  return (
    <div className={`flex items-center justify-center p-4 ${
      level === 'page' ? 'min-h-screen' : level === 'section' ? 'min-h-[200px]' : 'min-h-[100px]'
    }`}>
      <div className="text-center max-w-md">
        <div className="w-12 h-12 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
          {isOnline ? <Wifi className="w-6 h-6 text-orange-400" /> : <WifiOff className="w-6 h-6 text-red-400" />}
        </div>
        <h3 className="text-lg font-semibold mb-2 text-white">
          {isOnline ? 'Connection Issue' : 'No Internet Connection'}
        </h3>
        <p className="text-gray-400 mb-4 text-sm">
          {isOnline
            ? 'Unable to connect to our servers. Please check your connection and try again.'
            : 'Please check your internet connection and try again.'
          }
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          {level !== 'component' && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DatabaseErrorFallback({
  error,
  retry,
  reset,
  level
}: {
  error: Error
  retry: () => void
  reset: () => void
  level: ErrorLevel
}) {
  return (
    <div className={`flex items-center justify-center p-4 ${
      level === 'page' ? 'min-h-screen' : level === 'section' ? 'min-h-[200px]' : 'min-h-[100px]'
    }`}>
      <div className="text-center max-w-md">
        <div className="w-12 h-12 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-white">
          Data Loading Error
        </h3>
        <p className="text-gray-400 mb-4 text-sm">
          We're having trouble loading your data. This usually resolves quickly.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}

function RenderingErrorFallback({
  error,
  retry,
  reset,
  level,
  showDetails,
  errorId
}: {
  error: Error
  retry: () => void
  reset: () => void
  level: ErrorLevel
  showDetails: boolean
  errorId: string
}) {
  const [showErrorDetails, setShowErrorDetails] = useState(false)

  return (
    <div className={`flex items-center justify-center p-4 ${
      level === 'page' ? 'min-h-screen' : level === 'section' ? 'min-h-[200px]' : 'min-h-[100px]'
    }`}>
      <div className="text-center max-w-md">
        <div className="w-12 h-12 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
          <Bug className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-white">
          Something went wrong
        </h3>
        <p className="text-gray-400 mb-4 text-sm">
          {level === 'component'
            ? 'This component failed to load properly.'
            : 'An unexpected error occurred. Our team has been notified.'
          }
        </p>

        {showDetails && (
          <div className="mb-4">
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="text-xs text-gray-500 hover:text-gray-400 mb-2"
            >
              {showErrorDetails ? 'Hide' : 'Show'} Details
            </button>

            {showErrorDetails && (
              <div className="bg-gray-800/50 rounded-lg p-3 text-left max-h-32 overflow-y-auto">
                <div className="text-xs font-mono text-gray-300 mb-2">
                  Error ID: {errorId}
                </div>
                <div className="text-xs font-mono text-red-300 break-all">
                  {error.name}: {error.message}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          {level !== 'component' && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Enhanced Error Boundary Class Component
export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false,
      lastErrorTime: 0,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorType: classifyError(error),
      errorId: generateErrorId(),
      lastErrorTime: Date.now()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = 'section', context = {}, onError, maxRetries = 3 } = this.props
    const { retryCount } = this.state

    // Enhanced error context
    const enhancedContext: ErrorContext = {
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      previousError: this.state.error?.message,
      retryCount
    }

    // Log error based on severity
    const errorType = classifyError(error)
    const errorData = {
      error,
      errorInfo,
      errorType,
      level,
      context: enhancedContext,
      timestamp: new Date().toISOString()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.error(`Enhanced Error Boundary [${level}]:`, errorData)
    }

    // Report to external error tracking in production
    if (process.env.NODE_ENV === 'production' && level === 'page') {
      // Send to Sentry, LogRocket, etc.
      try {
        // Example: Sentry.captureException(error, { contexts: { errorBoundary: enhancedContext }})
      } catch (reportingError) {
        logger.error('Failed to report error:', reportingError)
      }
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorData, enhancedContext)
    }

    // Update state with error info
    this.setState({
      errorInfo,
      errorType
    })
  }

  componentDidUpdate(prevProps: EnhancedErrorBoundaryProps, prevState: EnhancedErrorBoundaryState) {
    // Reset error boundary if children change (navigation)
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.handleReset()
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  handleRetry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      return
    }

    this.setState({
      isRetrying: true
    })

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorType: 'unknown',
        retryCount: retryCount + 1,
        isRetrying: false
      })
    }, retryDelay)
  }

  handleReset = () => {
    // Clear retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    // Reset state completely
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
      isRetrying: false,
      lastErrorTime: 0,
      errorId: ''
    })
  }

  render() {
    const { children, level = 'section', fallback, maxRetries = 3, showDetails = false } = this.props
    const { hasError, error, errorType, retryCount, isRetrying } = this.state

    // Show loading state during retry
    if (isRetrying) {
      return (
        <div className={`flex items-center justify-center p-4 ${
          level === 'page' ? 'min-h-screen' : 'min-h-[100px]'
        }`}>
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Retrying...</p>
          </div>
        </div>
      )
    }

    if (hasError && error) {
      // Custom fallback
      if (fallback) {
        return fallback(error, this.handleRetry, this.handleReset)
      }

      // Check if max retries exceeded
      if (retryCount >= maxRetries) {
        return (
          <div className={`flex items-center justify-center p-4 ${
            level === 'page' ? 'min-h-screen' : 'min-h-[100px]'
          }`}>
            <div className="text-center max-w-md">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">
                Multiple Failures
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                This component has failed multiple times. Please refresh the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            </div>
          </div>
        )
      }

      // Render appropriate error UI based on error type
      switch (errorType) {
        case 'network':
          return (
            <NetworkErrorWrapper
              error={error}
              retry={this.handleRetry}
              reset={this.handleReset}
              level={level}
            />
          )
        case 'database':
          return (
            <DatabaseErrorFallback
              error={error}
              retry={this.handleRetry}
              reset={this.handleReset}
              level={level}
            />
          )
        default:
          return (
            <RenderingErrorFallback
              error={error}
              retry={this.handleRetry}
              reset={this.handleReset}
              level={level}
              showDetails={showDetails}
              errorId={this.state.errorId}
            />
          )
      }
    }

    return children
  }
}

// Network error wrapper with network status
function NetworkErrorWrapper({
  error,
  retry,
  reset,
  level
}: {
  error: Error
  retry: () => void
  reset: () => void
  level: ErrorLevel
}) {
  const isOnline = useNetworkStatus()

  return (
    <NetworkErrorFallback
      error={error}
      retry={retry}
      reset={reset}
      level={level}
      isOnline={isOnline}
    />
  )
}

// Hook for manually triggering error boundaries
export function useErrorHandler() {
  return useCallback((error: Error, context?: ErrorContext) => {
    // This will be caught by the nearest error boundary
    throw error
  }, [])
}

// HOC for adding error boundary to any component
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<EnhancedErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <EnhancedErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

export default EnhancedErrorBoundary
