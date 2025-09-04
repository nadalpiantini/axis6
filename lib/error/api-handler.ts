import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { errorHandler } from './handler'
import type { ErrorCategory } from './handler'
// Enhanced API error response with consistent structure
export interface ApiError {
  error: string
  details?: string
  errorId?: string
  timestamp: string
  path: string
  method: string
}
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
}
// API Error classes for different types of errors
export class ApiValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ApiValidationError'
  }
}
export class ApiAuthError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'ApiAuthError'
  }
}
export class ApiNotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'ApiNotFoundError'
  }
}
export class ApiRateLimitError extends Error {
  constructor(message: string = 'Too many requests') {
    super(message)
    this.name = 'ApiRateLimitError'
  }
}
export class ApiDatabaseError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'ApiDatabaseError'
  }
}
// Enhanced API wrapper with centralized error handling
export function withErrorHandling(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  category: ErrorCategory = 'api'
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now()
    const path = new URL(req.url).pathname
    const method = req.method
    try {
      // Add performance monitoring
      const response = await handler(req, context)
      // Log successful requests in development
      if (process.env['NODE_ENV'] === 'development') {
        const duration = Date.now() - startTime
        logger.log(`✅ ${method} ${path} - ${response.status} (${duration}ms)`)
        // Warn about slow requests
        if (duration > 2000) {
          errorHandler.performanceWarn(`Slow API request detected`, { duration }, {
            url: path,
            action: 'api_request',
            component: 'api_handler'
          })
        }
      }
      return response
    } catch (error: any) {
      const duration = Date.now() - startTime
      const errorId = generateErrorId()
      // Create structured error response
      const apiError: ApiError = {
        error: getErrorMessage(error),
        details: process.env['NODE_ENV'] === 'development' ? error.stack : undefined,
        errorId,
        timestamp: new Date().toISOString(),
        path,
        method
      }
      // Log the error with appropriate level and category
      const errorCategory = getErrorCategory(error, category)
      const errorLevel = getErrorLevel(error)
      errorHandler.log(errorLevel, errorCategory, `API ${method} ${path} failed: ${error.message}`, error, {
        url: path,
        action: 'api_request',
        component: 'api_handler',
        metadata: {
          duration,
          statusCode: getStatusCode(error),
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        }
      })
      // Return appropriate HTTP response
      return NextResponse.json({
        success: false,
        error: apiError
      }, {
        status: getStatusCode(error)
      })
    }
  }
}
// Helper functions for error processing
function getErrorMessage(error: any): string {
  if (error instanceof ApiValidationError) {
    return error.field ? `Validation error for field '${error.field}': ${error.message}` : error.message
  }
  if (error instanceof ApiAuthError) {
    return 'Authentication required or invalid credentials'
  }
  if (error instanceof ApiNotFoundError) {
    return error.message
  }
  if (error instanceof ApiRateLimitError) {
    return 'Rate limit exceeded. Please try again later.'
  }
  if (error instanceof ApiDatabaseError) {
    return 'Database operation failed'
  }
  // Handle Supabase errors
  if (error.code) {
    switch (error.code) {
      case 'PGRST116':
        return 'Resource not found'
      case 'PGRST301':
        return 'Unauthorized access'
      case '23505':
        return 'Resource already exists'
      case '23503':
        return 'Referenced resource not found'
      case '23502':
        return 'Required field is missing'
      default:
        return process.env['NODE_ENV'] === 'development'
          ? `Database error: ${error.message}`
          : 'Database operation failed'
    }
  }
  return process.env['NODE_ENV'] === 'development'
    ? error.message || 'Unknown error occurred'
    : 'Internal server error'
}
function getStatusCode(error: any): number {
  if (error instanceof ApiValidationError) return 400
  if (error instanceof ApiAuthError) return 401
  if (error instanceof ApiNotFoundError) return 404
  if (error instanceof ApiRateLimitError) return 429
  if (error instanceof ApiDatabaseError) return 500
  // Handle Supabase errors
  if (error.code) {
    switch (error.code) {
      case 'PGRST116': return 404
      case 'PGRST301': return 401
      case '23505': return 409
      case '23503': return 404
      case '23502': return 400
      default: return 500
    }
  }
  return 500
}
function getErrorLevel(error: any): 'info' | 'warn' | 'error' | 'critical' {
  if (error instanceof ApiValidationError) return 'warn'
  if (error instanceof ApiAuthError) return 'info'
  if (error instanceof ApiNotFoundError) return 'info'
  if (error instanceof ApiRateLimitError) return 'warn'
  if (error instanceof ApiDatabaseError) return 'error'
  // Critical errors that need immediate attention
  if (error.message?.includes('CRITICAL') || error.code === 'ECONNREFUSED') {
    return 'critical'
  }
  return 'error'
}
function getErrorCategory(error: any, defaultCategory: ErrorCategory): ErrorCategory {
  if (error instanceof ApiAuthError) return 'auth'
  if (error instanceof ApiDatabaseError) return 'database'
  if (error instanceof ApiValidationError) return 'validation'
  if (error instanceof ApiRateLimitError) return 'network'
  return defaultCategory
}
function generateErrorId(): string {
  return `api_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
}
// Validation helpers
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ApiValidationError(`${fieldName} is required`, fieldName)
  }
}
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ApiValidationError('Invalid email format', 'email')
  }
}
export function validateUUID(uuid: string, fieldName: string = 'id'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(uuid)) {
    throw new ApiValidationError(`Invalid UUID format for ${fieldName}`, fieldName)
  }
}
export function validateNumericRange(value: number, min: number, max: number, fieldName: string): void {
  if (value < min || value > max) {
    throw new ApiValidationError(`${fieldName} must be between ${min} and ${max}`, fieldName)
  }
}
// Success response helper
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status })
}
// Async operation wrapper with timeout
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  operation: string = 'operation'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })
  return Promise.race([promise, timeoutPromise])
}
// Database operation wrapper
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string = 'database operation'
): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    throw new ApiDatabaseError(`${operationName} failed: ${error.message}`, error)
  }
}
// Rate limiting helper
export function checkRateLimit(
  _identifier: string,
  _requests: number,
  _windowMs: number
): boolean {
  // This would integrate with your rate limiting service (Redis, etc.)
  // For now, return true (no rate limiting)
  return true
}
// Request logging helper
export function logRequest(req: NextRequest, details?: any) {
  if (process.env['NODE_ENV'] === 'development') {
    const url = new URL(req.url)
    logger.log(`📨 ${req.method} ${url.pathname}${url.search}`, details ? { ...details } : '')
  }
}
