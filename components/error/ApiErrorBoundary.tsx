'use client'

import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { ReactNode, useState, useEffect } from 'react'

import { reportError } from '@/lib/monitoring/error-tracking'
import { logger } from '@/lib/utils/logger'

interface ApiErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  endpoint?: string
}

export function ApiErrorBoundary({ children, fallback, endpoint }: ApiErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<Error | null>(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    if (typeof window !== 'undefined') {
      setIsOnline(window.navigator.onLine)
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }

    return undefined // Explicit return for when window is not available
  }, [])

  useEffect(() => {
    if (hasError && isOnline && retryCount < 3) {
      const timer = setTimeout(() => {
        setHasError(false)
        setRetryCount(prev => prev + 1)
      }, Math.pow(2, retryCount) * 1000) // Exponential backoff

      return () => clearTimeout(timer)
    }

    return undefined // Explicit return for when condition is not met
  }, [hasError, isOnline, retryCount])

  const handleApiError = (error: Error) => {
    setHasError(true)
    setLastError(error)

    logger.error(`API error in ${endpoint || 'unknown endpoint'}`, error)

    reportError(error, 'high', {
      component: 'ApiErrorBoundary',
      action: 'api_failure',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      metadata: {
        endpoint,
        retryCount,
        isOnline,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      },
    })
  }

  const handleRetry = () => {
    setHasError(false)
    setRetryCount(0)
    setLastError(null)
  }

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-[200px] flex items-center justify-center p-4">
        <div className="max-w-sm w-full glass rounded-2xl p-6 text-center text-white">
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-red-500/20 rounded-full flex items-center justify-center">
              {isOnline ? (
                <AlertCircle className="w-6 h-6 text-red-400" />
              ) : (
                <WifiOff className="w-6 h-6 text-red-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {isOnline ? 'Error de conexión' : 'Sin conexión'}
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              {isOnline
                ? `No pudimos conectar con ${endpoint || 'el servidor'}`
                : 'Revisa tu conexión a internet'}
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-gray-500">
                Intento {retryCount} de 3
              </p>
            )}
          </div>

          <div className="space-y-2">
            {isOnline && (
              <button
                onClick={handleRetry}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            )}

            {!isOnline && (
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                <Wifi className="w-4 h-4" />
                Esperando conexión...
              </div>
            )}
          </div>

          {process.env['NODE_ENV'] === 'development' && lastError && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-xs text-gray-400 hover:text-white">
                Error details (dev)
              </summary>
              <pre className="mt-2 text-xs bg-gray-900 p-2 rounded overflow-auto text-red-300">
                {lastError.message}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
