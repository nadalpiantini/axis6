import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, rateLimitConfigs } from '@/lib/security/rateLimit'
import { logger } from '@/lib/utils/logger'

interface ErrorReport {
  errorId: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  url: string
  userAgent: string
  userId?: string
}

export async function POST(request: NextRequest) {
  // Apply strict rate limiting for error reporting
  const rateLimitResponse = await withRateLimit(request, {
    ...rateLimitConfigs.api,
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // Max 5 error reports per minute per IP
  })
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const errorData: ErrorReport = await request.json()
    
    // Validate required fields
    if (!errorData.errorId || !errorData.message || !errorData.timestamp) {
      return NextResponse.json(
        { error: 'Campos requeridos: errorId, message, timestamp' },
        { status: 400 }
      )
    }

    // Sanitize error data
    const sanitizedError = {
      errorId: errorData.errorId,
      message: errorData.message.substring(0, 1000), // Limit message length
      stack: errorData.stack?.substring(0, 5000), // Limit stack trace
      componentStack: errorData.componentStack?.substring(0, 2000),
      timestamp: errorData.timestamp,
      url: errorData.url?.substring(0, 500),
      userAgent: errorData.userAgent?.substring(0, 500),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
          request.headers.get('x-real-ip') || 
          'unknown',
      severity: 'error',
      source: 'client'
    }

    // Log structured error
    console.error('Client Error Report', undefined, {
      metadata: sanitizedError
    })

    // In production, you would send this to your monitoring service:
    // - Sentry: Sentry.captureException()
    // - LogRocket: LogRocket.captureException()
    // - Custom logging service
    
    // For now, we'll store it in console and could extend to database
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external monitoring service
      // await sendToMonitoringService(sanitizedError)
    }

    return NextResponse.json(
      { success: true, errorId: sanitizedError.errorId },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('Error processing error report', error)
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    )
  }
}

// Utility function to send to external monitoring service
async function sendToMonitoringService(errorData: any) {
  // Example implementation for Sentry or other services
  try {
    // Implementation depends on your monitoring service
    // Example for webhook-based services:
    /*
    await fetch(process.env.MONITORING_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
      },
      body: JSON.stringify(errorData)
    })
    */
  } catch (monitoringError) {
    console.error('Failed to send to monitoring service', monitoringError)
    // Don't throw here - we don't want to fail the error reporting
  }
}