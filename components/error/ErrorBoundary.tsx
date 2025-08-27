'use client'

import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Component, ReactNode } from 'react'

import { logger } from '@/lib/logger'
import { reportError } from '@/lib/monitoring/error-tracking'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  override componentDidCatch(error: Error, errorInfo: any) {
    // Log error using centralized logger
    logger.error('ErrorBoundary caught an error', error)
    
    // Use enhanced error tracking system
    reportError(error, 'high', {
      component: 'ErrorBoundary',
      action: 'component_error',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      metadata: {
        ...errorInfo,
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
      },
    })
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }


  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: ''
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full glass rounded-2xl p-8 text-center text-white">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">¡Oops! Algo salió mal</h1>
              <p className="text-gray-400 mb-4">
                Hemos encontrado un error inesperado. Nuestro equipo ha sido notificado.
              </p>
              <code className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                Error ID: {this.state.errorId}
              </code>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Intentar de nuevo
              </button>
              
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recargar página
              </button>

              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Volver al inicio
              </Link>
            </div>

            {process.env['NODE_ENV'] === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                  Ver detalles del error (desarrollo)
                </summary>
                <pre className="mt-2 text-xs bg-gray-900 p-4 rounded-lg overflow-auto text-red-300">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Async Error Boundary for handling async errors in components
export function AsyncErrorBoundary({ 
  children, 
  onError 
}: { 
  children: ReactNode
  onError?: (error: Error) => void 
}) {
  const handleError = (error: Error, _errorInfo: any) => {
    if (onError) {
      onError(error)
    }
  }

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}