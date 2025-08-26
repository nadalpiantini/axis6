'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  isolate?: boolean
  level?: 'page' | 'section' | 'component'
  showDetails?: boolean
  allowRetry?: boolean
  allowReportBug?: boolean
  customMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
  lastErrorTime: number
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: NodeJS.Timeout | null = null
  private previousResetKeys: Array<string | number> = []

  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0
    }
    
    this.previousResetKeys = props.resetKeys || []
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    // Reset error boundary when resetKeys change
    if (props.resetKeys && props.resetOnPropsChange !== false) {
      const hasResetKeyChanged = props.resetKeys.some(
        (key, idx) => key !== state.errorCount ? props.resetKeys![idx] : null
      )
      
      if (hasResetKeyChanged && state.hasError) {
        return {
          hasError: false,
          error: null,
          errorInfo: null,
          errorCount: state.errorCount,
          lastErrorTime: state.lastErrorTime
        }
      }
    }
    
    return null
  }

  static getDerivedStateFromError(error: Error): State {
    const now = Date.now()
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: now
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props
    
    // Log error details
    console.error(`[ErrorBoundary ${level}]:`, error, errorInfo)
    
    // Track error metrics
    this.trackError(error, errorInfo)
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
    
    // Send error to monitoring service
    this.reportToMonitoring(error, errorInfo)
    
    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))
    
    // Auto-reset after 10 seconds if this is a transient error
    if (this.isTransientError(error)) {
      this.scheduleReset(10000)
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state
    
    // Check if resetKeys have changed
    if (resetKeys && resetOnPropsChange !== false && hasError) {
      const hasResetKeyChanged = resetKeys.some(
        (key, idx) => key !== this.previousResetKeys[idx]
      )
      
      if (hasResetKeyChanged) {
        this.resetError()
        this.previousResetKeys = resetKeys
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private isTransientError(error: Error): boolean {
    // Check if error is likely transient (network, timeout, etc)
    const transientPatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /connection/i,
      /ECONNREFUSED/,
      /ETIMEDOUT/
    ]
    
    return transientPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    )
  }

  private scheduleReset(delay: number) {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
    
    this.resetTimeoutId = setTimeout(() => {
      this.resetError()
    }, delay)
  }

  private trackError(error: Error, errorInfo: ErrorInfo) {
    // Track error for analytics
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
      errorCount: this.state.errorCount + 1
    }
    
    // Store in session storage for debugging
    if (typeof window !== 'undefined') {
      const errors = JSON.parse(
        sessionStorage.getItem('errorBoundaryErrors') || '[]'
      )
      errors.push(errorData)
      
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.shift()
      }
      
      sessionStorage.setItem('errorBoundaryErrors', JSON.stringify(errors))
    }
  }

  private reportToMonitoring(error: Error, errorInfo: ErrorInfo) {
    // Report to Sentry or other monitoring service
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: Sentry integration
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack
            }
          },
          level: 'error',
          tags: {
            component: this.props.level || 'component'
          }
        })
      }
      
      // Also report to custom monitoring endpoint
      fetch('/api/monitoring/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          level: this.props.level,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {
        // Ignore reporting errors
      })
    }
  }

  private resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
      this.resetTimeoutId = null
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  private handleRetry = () => {
    this.resetError()
  }

  private handleReportBug = () => {
    const { error, errorInfo } = this.state
    
    if (typeof window !== 'undefined') {
      // Create bug report
      const bugReport = {
        error: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }
      
      // Open bug report form or send to API
      const reportUrl = `/report-bug?data=${encodeURIComponent(JSON.stringify(bugReport))}`
      window.open(reportUrl, '_blank')
    }
  }

  private renderErrorUI() {
    const { 
      fallback, 
      level = 'component', 
      showDetails = false,
      allowRetry = true,
      allowReportBug = false,
      customMessage
    } = this.props
    const { error, errorInfo, errorCount } = this.state

    // Use custom fallback if provided
    if (fallback) {
      return <>{fallback}</>
    }

    // Determine error message based on level
    const errorMessages = {
      page: 'This page encountered an error',
      section: 'This section is temporarily unavailable',
      component: 'Something went wrong with this component'
    }

    const title = customMessage || errorMessages[level]

    return (
      <div className={`error-boundary-fallback ${level}`} role="alert" aria-live="assertive">
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="mb-4 flex justify-center">
              <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              {title}
            </h2>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {errorCount > 2 
                ? 'This error keeps occurring. Please refresh the page.'
                : 'An unexpected error occurred. Please try again.'}
            </p>

            {/* Error details (development only or when showDetails is true) */}
            {(showDetails || process.env.NODE_ENV === 'development') && error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  Error Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                  {error.message}
                  {errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              {allowRetry && (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  aria-label="Retry loading this content"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              )}
              
              {level === 'page' && (
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  aria-label="Return to homepage"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              )}
              
              {allowReportBug && (
                <button
                  onClick={this.handleReportBug}
                  className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                  aria-label="Report this bug"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Bug
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  render() {
    const { hasError } = this.state
    const { children, isolate = true } = this.props

    if (hasError) {
      // Isolate error to prevent cascading failures
      if (isolate) {
        return (
          <div className="error-boundary-container" data-error="true">
            {this.renderErrorUI()}
          </div>
        )
      }
      
      return this.renderErrorUI()
    }

    return children
  }
}

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary 
    level="page" 
    allowRetry 
    allowReportBug
    showDetails={process.env.NODE_ENV === 'development'}
  >
    {children}
  </EnhancedErrorBoundary>
)

export const SectionErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary 
    level="section" 
    allowRetry
  >
    {children}
  </EnhancedErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <EnhancedErrorBoundary 
    level="component"
    allowRetry
  >
    {children}
  </EnhancedErrorBoundary>
)