'use client'

import { motion } from 'framer-motion'
import { Database, RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import React, { ErrorInfo, ReactNode } from 'react'

import { logger } from '@/lib/utils/logger';

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class DatabaseErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Database error boundary caught an error:', error)

    this.setState({
      error,
      errorInfo
    })

    // Report database errors
    if (typeof window !== 'undefined' && 'gtag' in window) {
      ;(window as any).gtag('event', 'exception', {
        description: `Database Error: ${error.message}`,
        fatal: false,
      })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
    // Force a page refresh to retry database connections
    window.location.reload()
  }

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 text-center"
            >
              <div className="mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Database className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-lg font-bold mb-2">Connection Issue</h2>
                <p className="text-gray-400 text-sm">
                  We're having trouble connecting to our database. This might be temporary.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-lg transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-xs text-gray-400 mb-2">
                    Debug Info
                  </summary>
                  <div className="text-xs bg-black/20 p-3 rounded-lg overflow-auto max-h-40">
                    <div className="text-red-400 font-mono mb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    <pre className="text-gray-300 whitespace-pre-wrap text-xs">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}
            </motion.div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Lightweight fallback component for inline errors
export function DatabaseErrorFallback({ error, retry }: { error?: string, retry?: () => void }) {
  return (
    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
      <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
      <p className="text-sm text-red-400 mb-3">
        {error || 'Unable to load data'}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}
