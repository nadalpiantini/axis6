import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { ErrorReport, PerformanceReport } from '@/lib/monitoring/error-tracker'

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()
    
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing type or data' },
        { status: 400 }
      )
    }
    
    // Log the monitoring data
    if (type === 'error') {
      const errorData = data as ErrorReport
      logger.error(`Client Error: ${errorData.message}`, errorData)
    } else if (type === 'performance') {
      const perfData = data as PerformanceReport
      logger.info(`Performance Metric: ${perfData.metric}`, {
        value: perfData.value,
        type: perfData.type,
        url: perfData.url,
        timestamp: perfData.timestamp
      })
    }
    
    // In production, you could send this to external services like:
    // - Sentry: Sentry.captureException(data)
    // - LogRocket: LogRocket.captureException(data)
    // - DataDog: dd.addError(data)
    // - New Relic: newrelic.recordCustomEvent(type, data)
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    logger.error('Error processing monitoring report:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}