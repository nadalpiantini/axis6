/**
 * Production Monitoring API Endpoint
 * Real-time system monitoring and alerting
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { logger } from '@/lib/logger'
import { withEnhancedRateLimit } from '@/lib/middleware/enhanced-rate-limit'
import { protectedServices } from '@/lib/production/circuit-breaker'

export const dynamic = 'force-dynamic'

interface MonitoringEvent {
  type: 'performance' | 'error' | 'security' | 'business' | 'infrastructure'
  severity: 'low' | 'medium' | 'high' | 'critical'
  service: string
  message: string
  data?: Record<string, any>
  userId?: string
  timestamp: number
}

interface AlertRule {
  id: string
  type: string
  condition: string
  threshold: number
  enabled: boolean
  channels: ('email' | 'webhook' | 'slack')[]
}

/**
 * Submit monitoring events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Apply rate limiting
    const { response: rateLimitResponse } = await withEnhancedRateLimit(request, 'api')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const event: MonitoringEvent = await request.json()
    
    // Validate event
    if (!event.type || !event.service || !event.message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, service, message' },
        { status: 400 }
      )
    }
    
    // Store monitoring event
    await storeMonitoringEvent(event)
    
    // Check alert rules
    const triggeredAlerts = await checkAlertRules(event)
    
    // Send alerts if needed
    if (triggeredAlerts.length > 0) {
      await processAlerts(triggeredAlerts, event)
    }
    
    return NextResponse.json({
      success: true,
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertsTriggered: triggeredAlerts.length
    })
    
  } catch (error) {
    logger.error('Monitoring event processing error', error)
    
    return NextResponse.json(
      { error: 'Failed to process monitoring event' },
      { status: 500 }
    )
  }
}

/**
 * Get monitoring dashboard data
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication for admin endpoints
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('axis6_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '1h'
    const service = searchParams.get('service')
    const severity = searchParams.get('severity')
    
    const monitoringData = await getMonitoringData({
      timeRange,
      service,
      severity
    })
    
    return NextResponse.json(monitoringData)
    
  } catch (error) {
    logger.error('Monitoring data retrieval error', error)
    
    return NextResponse.json(
      { error: 'Failed to retrieve monitoring data' },
      { status: 500 }
    )
  }
}

/**
 * Store monitoring event in database
 */
async function storeMonitoringEvent(event: MonitoringEvent) {
  const supabase = createRouteHandlerClient({ cookies })
  
  await protectedServices.database.mutation(async () => {
    const { error } = await supabase
      .from('axis6_monitoring_events')
      .insert({
        type: event.type,
        severity: event.severity,
        service: event.service,
        message: event.message,
        data: event.data || {},
        user_id: event.userId,
        created_at: new Date(event.timestamp).toISOString()
      })
    
    if (error) throw error
  })
}

/**
 * Check alert rules against incoming event
 */
async function checkAlertRules(event: MonitoringEvent): Promise<AlertRule[]> {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: alertRules, error } = await supabase
    .from('axis6_alert_rules')
    .select('*')
    .eq('enabled', true)
    .eq('type', event.type)
  
  if (error) {
    logger.error('Error fetching alert rules', error)
    return []
  }
  
  const triggeredRules: AlertRule[] = []
  
  for (const rule of alertRules) {
    if (await evaluateAlertRule(rule, event)) {
      triggeredRules.push(rule)
    }
  }
  
  return triggeredRules
}

/**
 * Evaluate if an alert rule should trigger
 */
async function evaluateAlertRule(rule: AlertRule, event: MonitoringEvent): Promise<boolean> {
  try {
    switch (rule.condition) {
      case 'severity_gte':
        const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
        return severityLevels[event.severity] >= rule.threshold
        
      case 'error_rate':
        // Check error rate over time window
        const errorRate = await calculateErrorRate(event.service, 300) // 5 minutes
        return errorRate >= rule.threshold
        
      case 'response_time':
        // Check average response time
        const responseTime = event.data?.responseTime || 0
        return responseTime >= rule.threshold
        
      case 'memory_usage':
        const memoryUsage = event.data?.memoryUsage || 0
        return memoryUsage >= rule.threshold
        
      case 'circuit_breaker_open':
        return event.message.includes('OPENED')
        
      default:
        return false
    }
  } catch (error) {
    logger.error('Error evaluating alert rule', error)
    return false
  }
}

/**
 * Process and send alerts
 */
async function processAlerts(alertRules: AlertRule[], event: MonitoringEvent) {
  for (const rule of alertRules) {
    for (const channel of rule.channels) {
      try {
        await sendAlert(channel, rule, event)
      } catch (error) {
        logger.error(`Failed to send alert via ${channel}`, error)
      }
    }
  }
}

/**
 * Send alert through specified channel
 */
async function sendAlert(
  channel: 'email' | 'webhook' | 'slack',
  rule: AlertRule,
  event: MonitoringEvent
) {
  const alertMessage = formatAlertMessage(rule, event)
  
  switch (channel) {
    case 'email':
      await sendEmailAlert(alertMessage, event.severity)
      break
    case 'webhook':
      await sendWebhookAlert(alertMessage, event)
      break
    case 'slack':
      await sendSlackAlert(alertMessage, event.severity)
      break
  }
}

/**
 * Format alert message
 */
function formatAlertMessage(rule: AlertRule, event: MonitoringEvent): string {
  return `🚨 AXIS6 Alert: ${rule.condition}
  
Service: ${event.service}
Severity: ${event.severity.toUpperCase()}
Message: ${event.message}
Time: ${new Date(event.timestamp).toISOString()}

${event.data ? `Additional Data: ${JSON.stringify(event.data, null, 2)}` : ''}

Rule: ${rule.id}
Threshold: ${rule.threshold}`
}

/**
 * Send email alert
 */
async function sendEmailAlert(message: string, severity: string) {
  if (!process.env.RESEND_API_KEY) {
    logger.warn('Resend API key not configured for email alerts')
    return
  }
  
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  const subject = `AXIS6 ${severity.toUpperCase()} Alert`
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@axis6.app'
  
  await resend.emails.send({
    from: 'alerts@axis6.app',
    to: adminEmail,
    subject,
    text: message
  })
}

/**
 * Send webhook alert
 */
async function sendWebhookAlert(message: string, event: MonitoringEvent) {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL
  if (!webhookUrl) return
  
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message,
      severity: event.severity,
      service: event.service,
      timestamp: event.timestamp
    })
  })
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(message: string, severity: string) {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL
  if (!slackWebhook) return
  
  const color = {
    low: '#36a64f',
    medium: '#ff9500', 
    high: '#ff0000',
    critical: '#8b0000'
  }[severity] || '#808080'
  
  await fetch(slackWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: `AXIS6 ${severity.toUpperCase()} Alert`,
        text: message,
        ts: Math.floor(Date.now() / 1000)
      }]
    })
  })
}

/**
 * Calculate error rate for a service
 */
async function calculateErrorRate(service: string, timeWindowSeconds: number): Promise<number> {
  const supabase = createRouteHandlerClient({ cookies })
  const startTime = new Date(Date.now() - timeWindowSeconds * 1000).toISOString()
  
  const { data: events, error } = await supabase
    .from('axis6_monitoring_events')
    .select('type, severity')
    .eq('service', service)
    .gte('created_at', startTime)
  
  if (error || !events) return 0
  
  const totalEvents = events.length
  const errorEvents = events.filter(e => 
    e.type === 'error' || e.severity === 'high' || e.severity === 'critical'
  ).length
  
  return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0
}

/**
 * Get monitoring dashboard data
 */
async function getMonitoringData(filters: {
  timeRange: string
  service?: string | null
  severity?: string | null
}) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Calculate time range
  const timeRangeMs = parseTimeRange(filters.timeRange)
  const startTime = new Date(Date.now() - timeRangeMs).toISOString()
  
  // Build query
  let query = supabase
    .from('axis6_monitoring_events')
    .select('*')
    .gte('created_at', startTime)
    .order('created_at', { ascending: false })
    .limit(1000)
  
  if (filters.service) {
    query = query.eq('service', filters.service)
  }
  
  if (filters.severity) {
    query = query.eq('severity', filters.severity)
  }
  
  const { data: events, error } = await query
  
  if (error) throw error
  
  // Calculate metrics
  const totalEvents = events.length
  const eventsByType = groupBy(events, 'type')
  const eventsBySeverity = groupBy(events, 'severity')
  const eventsByService = groupBy(events, 'service')
  
  // Time series data
  const timeSeriesData = generateTimeSeries(events, filters.timeRange)
  
  // Error rates by service
  const errorRates = await calculateServiceErrorRates(Object.keys(eventsByService))
  
  // System health score
  const healthScore = calculateSystemHealthScore(events)
  
  return {
    summary: {
      totalEvents,
      timeRange: filters.timeRange,
      healthScore,
      criticalEvents: events.filter(e => e.severity === 'critical').length,
      servicesAffected: Object.keys(eventsByService).length
    },
    breakdown: {
      byType: eventsByType,
      bySeverity: eventsBySeverity,
      byService: eventsByService
    },
    timeSeries: timeSeriesData,
    errorRates,
    recentEvents: events.slice(0, 50),
    trends: {
      hourlyAverage: totalEvents / (timeRangeMs / (1000 * 60 * 60)),
      topServices: Object.entries(eventsByService)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 10)
    }
  }
}

/**
 * Parse time range string to milliseconds
 */
function parseTimeRange(timeRange: string): number {
  const units = {
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
    'w': 7 * 24 * 60 * 60 * 1000
  }
  
  const match = timeRange.match(/^(\d+)([mhdw])$/)
  if (!match) return 60 * 60 * 1000 // Default 1 hour
  
  const value = parseInt(match[1])
  const unit = match[2] as keyof typeof units
  
  return value * units[unit]
}

/**
 * Group array by property
 */
function groupBy<T>(array: T[], property: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = String(item[property])
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Generate time series data
 */
function generateTimeSeries(events: any[], timeRange: string) {
  const buckets: Record<string, number> = {}
  const bucketSize = getBucketSize(timeRange)
  
  events.forEach(event => {
    const timestamp = new Date(event.created_at).getTime()
    const bucket = Math.floor(timestamp / bucketSize) * bucketSize
    const bucketKey = new Date(bucket).toISOString()
    
    buckets[bucketKey] = (buckets[bucketKey] || 0) + 1
  })
  
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([time, count]) => ({ time, count }))
}

/**
 * Get bucket size for time series based on range
 */
function getBucketSize(timeRange: string): number {
  const rangeSizes = {
    '1h': 5 * 60 * 1000, // 5 minutes
    '6h': 15 * 60 * 1000, // 15 minutes
    '24h': 60 * 60 * 1000, // 1 hour
    '7d': 6 * 60 * 60 * 1000, // 6 hours
    '30d': 24 * 60 * 60 * 1000 // 1 day
  }
  
  return rangeSizes[timeRange as keyof typeof rangeSizes] || 60 * 60 * 1000
}

/**
 * Calculate error rates for services
 */
async function calculateServiceErrorRates(services: string[]) {
  const rates: Record<string, number> = {}
  
  for (const service of services) {
    rates[service] = await calculateErrorRate(service, 3600) // 1 hour
  }
  
  return rates
}

/**
 * Calculate system health score (0-100)
 */
function calculateSystemHealthScore(events: any[]): number {
  const weights = {
    critical: -10,
    high: -5,
    medium: -2,
    low: -1
  }
  
  const totalScore = events.reduce((score, event) => {
    return score + (weights[event.severity as keyof typeof weights] || 0)
  }, 100)
  
  return Math.max(0, Math.min(100, totalScore))
}