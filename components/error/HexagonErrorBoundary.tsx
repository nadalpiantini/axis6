'use client'

import React from 'react'

interface HexagonErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface HexagonErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

// Default fallback component for hexagon visualization errors
const DefaultHexagonFallback = ({ error, resetError }: { error?: Error; resetError: () => void }) => (
  <div className="w-full max-w-[260px] xs:max-w-[300px] sm:max-w-[350px] lg:max-w-[400px] mx-auto">
    <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center p-4 border-2 border-orange-200">
      <div className="text-4xl mb-3">🔧</div>
      <h3 className="text-lg font-semibold text-orange-800 mb-2 text-center">
        Hexagon Temporarily Unavailable
      </h3>
      <p className="text-sm text-orange-600 mb-4 text-center">
        We're working on restoring your balance visualization.
      </p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors min-h-[44px] min-w-[88px] touch-manipulation"
        aria-label="Try to reload hexagon visualization"
      >
        Try Again
      </button>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-4 max-w-full">
          <summary className="text-xs text-orange-500 cursor-pointer">Debug Info</summary>
          <pre className="text-xs text-orange-600 mt-2 overflow-x-auto whitespace-pre-wrap">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  </div>
)

export class HexagonErrorBoundary extends React.Component<
  HexagonErrorBoundaryProps,
  HexagonErrorBoundaryState
> {
  constructor(props: HexagonErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): HexagonErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for monitoring
    console.error('HexagonErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      hasError: true,
      error,
      errorInfo,
    })

    // Report to error monitoring service in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Check for React Error #310 specifically
      const isReactError310 = error.message && (
        error.message.includes('Too many re-renders') ||
        error.message.includes('#310') ||
        error.stack?.includes('useMemo') ||
        error.stack?.includes('HexagonChartWithResonance')
      )

      if (isReactError310) {
        console.error('🚨 React Error #310 detected in Hexagon component:', {
          error: error.message,
          component: 'HexagonChartWithResonance',
          stack: error.stack,
          timestamp: new Date().toISOString()
        })
      }

      // Report to Sentry or other monitoring service
      if (window.Sentry) {
        window.Sentry.captureException(error, {
          tags: {
            component: 'HexagonErrorBoundary',
            errorType: isReactError310 ? 'React310InfiniteLoop' : 'Unknown',
          },
          extra: {
            errorInfo,
            componentStack: errorInfo.componentStack,
          },
        })
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultHexagonFallback
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// HOC for easy wrapping of hexagon components
export function withHexagonErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
) {
  const WithErrorBoundary = (props: P) => (
    <HexagonErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </HexagonErrorBoundary>
  )

  WithErrorBoundary.displayName = `withHexagonErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithErrorBoundary
}

export default HexagonErrorBoundary