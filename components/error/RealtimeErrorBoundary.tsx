'use client'

import { logger } from '@/lib/utils/logger';

import { Wifi, WifiOff, RotateCcw } from 'lucide-react'
import { Component, ReactNode } from 'react'

interface RealtimeErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: any
  retryCount: number
}

interface RealtimeErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
  maxRetries?: number
}

export class RealtimeErrorBoundary extends Component<
  RealtimeErrorBoundaryProps,
  RealtimeErrorBoundaryState
> {
  private retryTimeout: NodeJS.Timeout | null = null

  constructor(props: RealtimeErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<RealtimeErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.warn('Realtime Error Boundary caught error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Auto-retry for realtime-related errors
    if (this.isRealtimeError(error) && this.state.retryCount < (this.props.maxRetries || 3)) {
      this.scheduleRetry()
    }
  }

  private isRealtimeError(error: Error): boolean {
    const message = error.message.toLowerCase()
    return (
      message.includes('websocket') ||
      message.includes('realtime') ||
      message.includes('subscription') ||
      message.includes('channel')
    )
  }

  private scheduleRetry = () => {
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)

    this.retryTimeout = setTimeout(() => {
      logger.log(`Retrying realtime connection (attempt ${this.state.retryCount + 1})`)
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    }, retryDelay)
  }

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default realtime error UI
      return (
        <div className="glass rounded-xl p-4 sm:p-6 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <WifiOff className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-400 mb-1">
                Connection Issue
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                {this.isRealtimeError(this.state.error!)
                  ? 'Real-time updates temporarily unavailable. Data will refresh automatically.'
                  : 'Something went wrong. Please try refreshing the page.'
                }
              </p>

              {this.state.retryCount < (this.props.maxRetries || 3) && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
                  <span>Reconnecting... (attempt {this.state.retryCount + 1})</span>
                </div>
              )}

              {this.state.retryCount >= (this.props.maxRetries || 3) && (
                <button
                  onClick={this.handleManualRetry}
                  className="flex items-center gap-2 px-3 py-1 text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Try Again
                </button>
              )}
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-3 text-xs">
              <summary className="text-gray-500 cursor-pointer hover:text-gray-400">
                Debug Info
              </summary>
              <pre className="mt-2 p-2 bg-gray-900/50 rounded text-red-400 overflow-auto">
                {this.state.error.message}
                {this.state.errorInfo && `\n${  this.state.errorInfo.componentStack}`}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for easy wrapping of realtime components
export function withRealtimeErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode
    onError?: (error: Error, errorInfo: any) => void
    maxRetries?: number
  }
) {
  const WrappedComponent = (props: P) => (
    <RealtimeErrorBoundary
      fallback={options?.fallback}
      onError={options?.onError}
      maxRetries={options?.maxRetries}
    >
      <Component {...props} />
    </RealtimeErrorBoundary>
  )

  WrappedComponent.displayName = `withRealtimeErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
