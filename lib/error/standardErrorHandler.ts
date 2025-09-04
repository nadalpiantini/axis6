import { logger } from '@/lib/utils/logger';
import { logError, addBreadcrumb } from '@/lib/monitoring/sentry-config'
import { toast } from 'sonner'
/**
 * Standard error handling patterns for AXIS6 application
 * Replaces all "TODO: Replace with proper error handling" comments
 */
export interface ErrorContext {
  operation: string
  component?: string
  userId?: string
  metadata?: Record<string, any>
  showToast?: boolean
  fallbackMessage?: string
}
export interface ErrorHandlerOptions {
  /** Show toast notification to user */
  showToast?: boolean
  /** Custom message for user-facing notifications */
  userMessage?: string
  /** Severity level for logging */
  level?: 'error' | 'warning' | 'info'
  /** Additional context for debugging */
  context?: Record<string, any>
  /** Component name for better tracking */
  component?: string
  /** User ID for error attribution */
  userId?: string
  /** Operation being performed */
  operation: string
}
/**
 * Standard error handler that replaces all TODO comments
 * Logs to Sentry and optionally shows toast notification
 */
export function handleError(error: unknown, options: ErrorHandlerOptions): void {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  const {
    showToast = true,
    userMessage,
    level = 'error',
    context = {},
    component,
    userId,
    operation
  } = options
  // Add breadcrumb for debugging trail
  addBreadcrumb(
    `Error in ${operation}${component ? ` (${component})` : ''}`,
    'error',
    {
      errorMessage: errorObj.message,
      ...context
    }
  )
  // Log to Sentry with full context
  logError(errorObj, {
    level,
    tags: {
      operation,
      component: component || 'unknown'
    },
    extra: {
      originalError: errorObj.message,
      stack: errorObj.stack,
      ...context
    },
    user: userId ? { id: userId } : undefined
  })
  // Show user-friendly notification
  if (showToast) {
    const displayMessage = userMessage || getUserFriendlyMessage(operation, errorObj.message)
    if (level === 'error') {
      toast.error(displayMessage, {
        description: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
      })
    } else if (level === 'warning') {
      toast.warning(displayMessage)
    } else {
      toast.info(displayMessage)
    }
  }
  // Development console logging
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔴 Error in ${operation}`)
    logger.error('Message:', errorObj.message)
    logger.error('Stack:', errorObj.stack)
    logger.error('Context:', context)
    console.groupEnd()
  }
}
/**
 * Generate user-friendly error messages based on operation type
 */
function getUserFriendlyMessage(operation: string, originalMessage: string): string {
  const lowerOperation = operation.toLowerCase()
  // Network/API errors
  if (originalMessage.includes('fetch') || originalMessage.includes('network')) {
    return 'Unable to connect to the server. Please check your connection and try again.'
  }
  // Database errors
  if (originalMessage.includes('supabase') || originalMessage.includes('database')) {
    return 'Unable to save your data. Please try again in a moment.'
  }
  // Authentication errors
  if (lowerOperation.includes('auth') || lowerOperation.includes('login')) {
    return 'Authentication failed. Please try logging in again.'
  }
  // Profile operations
  if (lowerOperation.includes('profile')) {
    return 'Unable to update your profile. Please try again.'
  }
  // Check-in operations
  if (lowerOperation.includes('checkin') || lowerOperation.includes('activity')) {
    return 'Unable to save your check-in. Please try again.'
  }
  // Chat operations
  if (lowerOperation.includes('chat') || lowerOperation.includes('message')) {
    return 'Unable to send message. Please try again.'
  }
  // File operations
  if (lowerOperation.includes('upload') || lowerOperation.includes('file')) {
    return 'File upload failed. Please try again with a smaller file.'
  }
  // Timer operations
  if (lowerOperation.includes('timer')) {
    return 'Timer operation failed. Please try again.'
  }
  // Settings operations
  if (lowerOperation.includes('setting')) {
    return 'Unable to save settings. Please try again.'
  }
  // Generic fallback
  return 'Something went wrong. Please try again.'
}
/**
 * Async operation error handler with automatic retry capability
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions & {
    retries?: number
    retryDelay?: number
    onRetry?: (attempt: number) => void
  }
): Promise<T | null> {
  const { retries = 0, retryDelay = 1000, onRetry, ...errorOptions } = options
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      // If this is the last attempt or no retries configured
      if (attempt === retries) {
        handleError(error, {
          ...errorOptions,
          context: {
            ...errorOptions.context,
            attempts: attempt + 1,
            maxRetries: retries
          }
        })
        return null
      }
      // Notify about retry attempt
      if (onRetry) {
        onRetry(attempt + 1)
      }
      // Add breadcrumb for retry attempt
      addBreadcrumb(
        `Retrying ${options.operation} (attempt ${attempt + 1}/${retries + 1})`,
        'retry',
        { attempt: attempt + 1, maxRetries: retries + 1 }
      )
      // Wait before retry
      if (retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }
  return null
}
/**
 * Form validation error handler
 */
export function handleFormError(
  error: unknown,
  fieldErrors: Record<string, string[]> = {},
  options: Omit<ErrorHandlerOptions, 'operation'> & { formName: string }
): void {
  const { formName, ...errorOptions } = options
  handleError(error, {
    ...errorOptions,
    operation: `form_submission_${formName}`,
    context: {
      ...errorOptions.context,
      fieldErrors,
      formName
    }
  })
}
/**
 * API route error handler for consistent error responses
 */
export function handleAPIRouteError(
  error: unknown,
  context: {
    endpoint: string
    method: string
    userId?: string
    requestData?: any
  }
): {
  error: string
  message?: string
  statusCode: number
} {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  // Log the API error
  handleError(errorObj, {
    operation: `api_${context.method}_${context.endpoint}`,
    showToast: false, // API errors don't show toasts directly
    userId: context.userId,
    context: {
      endpoint: context.endpoint,
      method: context.method,
      requestData: context.requestData
    }
  })
  // Determine status code based on error type
  let statusCode = 500
  if (errorObj.message.includes('not found')) statusCode = 404
  if (errorObj.message.includes('unauthorized')) statusCode = 401
  if (errorObj.message.includes('forbidden')) statusCode = 403
  if (errorObj.message.includes('validation')) statusCode = 400
  return {
    error: 'An unexpected error occurred',
    message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
    statusCode
  }
}
/**
 * React Query mutation error handler
 */
export function handleMutationError(
  error: unknown,
  options: Omit<ErrorHandlerOptions, 'operation'> & {
    mutationName: string
    optimisticUpdate?: boolean
  }
): void {
  const { mutationName, optimisticUpdate, ...errorOptions } = options
  handleError(error, {
    ...errorOptions,
    operation: `mutation_${mutationName}`,
    context: {
      ...errorOptions.context,
      optimisticUpdate,
      mutationName
    }
  })
}
/**
 * WebSocket connection error handler
 */
export function handleWebSocketError(
  error: unknown,
  options: Omit<ErrorHandlerOptions, 'operation'> & {
    connectionType: string
    reconnectAttempt?: number
  }
): void {
  const { connectionType, reconnectAttempt, ...errorOptions } = options
  handleError(error, {
    ...errorOptions,
    operation: `websocket_${connectionType}`,
    level: reconnectAttempt ? 'warning' : 'error',
    context: {
      ...errorOptions.context,
      connectionType,
      reconnectAttempt
    }
  })
}
/**
 * File operation error handler
 */
export function handleFileError(
  error: unknown,
  options: Omit<ErrorHandlerOptions, 'operation'> & {
    fileName?: string
    fileSize?: number
    fileType?: string
    operationType: 'upload' | 'download' | 'delete' | 'process'
  }
): void {
  const { fileName, fileSize, fileType, operationType, ...errorOptions } = options
  handleError(error, {
    ...errorOptions,
    operation: `file_${operationType}`,
    context: {
      ...errorOptions.context,
      fileName,
      fileSize,
      fileType,
      operationType
    }
  })
}
/**
 * Database operation error handler with specific patterns for AXIS6
 */
export function handleDatabaseError(
  error: unknown,
  options: Omit<ErrorHandlerOptions, 'operation'> & {
    table: string
    operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
    rowId?: string
  }
): void {
  const { table, operation: dbOperation, rowId, ...errorOptions } = options
  handleError(error, {
    ...errorOptions,
    operation: `db_${dbOperation}_${table}`,
    context: {
      ...errorOptions.context,
      table,
      dbOperation,
      rowId
    }
  })
}
