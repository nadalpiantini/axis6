'use client'

import { logger } from '@/lib/utils/logger';

import React, { ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ProfileErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error, 
      errorInfo: null 
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    logger.error('Profile page error boundary caught an error:', error, errorInfo)
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    })
    
    // Report to monitoring service (if available)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      ;(window as any).gtag('event', 'exception', {
        description: error.message,
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
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen text-white flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-8 text-center"
            >
              <div className="mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Profile Page Error</h1>
                <p className="text-gray-400 mb-4">
                  Something went wrong while loading your profile. This might be a temporary issue.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-xl transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>

                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-400 mb-2">
                    Debug Information
                  </summary>
                  <div className="text-xs bg-black/20 p-4 rounded-lg overflow-auto">
                    <div className="text-red-400 font-mono mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    <pre className="text-gray-300 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <div className="mt-4">
                        <div className="text-yellow-400 font-mono mb-2">Component Stack:</div>
                        <pre className="text-gray-300 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
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