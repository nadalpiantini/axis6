'use client'

import { logger } from '@/lib/utils/logger';

import { ReactNode } from 'react'
import { QueryErrorResetBoundary, useQueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from './ErrorBoundary'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface QueryErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

export function QueryErrorBoundary({ children, fallback }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            // Log error in development only
            if (process.env['NODE_ENV'] === 'development') {
              logger.error('Query Error Boundary:', error)
            }
          }}
          fallback={
            fallback ? (
              fallback(new Error('Query error occurred'), reset)
            ) : (
              <DefaultQueryErrorFallback onReset={reset} />
            )
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}

function DefaultQueryErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2 text-white">
          Error cargando datos
        </h3>
        <p className="text-gray-400 mb-4">
          No pudimos cargar la información. Revisa tu conexión e intenta de nuevo.
        </p>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    </div>
  )
}

// Hook for resetting queries manually
export function useQueryErrorReset() {
  const { reset } = useQueryErrorResetBoundary()
  return reset
}