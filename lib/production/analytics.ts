/**
 * Production Analytics System
 * Comprehensive user analytics, performance tracking, and business metrics
 */

import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import * as Sentry from '@sentry/nextjs'

interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  userId?: string
  sessionId?: string
  timestamp?: number
}

interface UserProperties {
  userId: string
  email?: string
  plan?: 'free' | 'premium'
  signupDate?: string
  lastActive?: string
  totalCheckins?: number
  longestStreak?: number
}

interface PerformanceMetric {
  name: string
  value: number
  url: string
  userId?: string
  timestamp: number
}

class AnalyticsManager {
  private sessionId: string
  private userId: string | null = null
  private userProperties: Partial<UserProperties> = {}
  
  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializePerformanceTracking()
  }
  
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
  
  /**
   * Initialize performance tracking
   */
  private initializePerformanceTracking() {
    if (typeof window === 'undefined') return
    
    // Track Core Web Vitals
    if ('web-vital' in window) {
      this.trackWebVitals()
    }
    
    // Track page load performance
    window.addEventListener('load', () => {
      this.trackPageLoadPerformance()
    })
    
    // Track navigation timing
    if ('navigation' in performance) {
      this.trackNavigationTiming()
    }
  }
  
  /**
   * Set user identity
   */
  identify(userId: string, properties?: Partial<UserProperties>) {
    this.userId = userId
    this.userProperties = { ...this.userProperties, ...properties, userId }
    
    // Set Sentry user context
    Sentry.setUser({
      id: userId,
      email: properties?.email
    })
    
    // Track user properties
    this.track('user_identified', {
      plan: properties?.plan || 'free',
      signupDate: properties?.signupDate,
      totalCheckins: properties?.totalCheckins,
      longestStreak: properties?.longestStreak
    })
  }
  
  /**
   * Track events
   */
  track(eventName: string, properties: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        url: typeof window !== 'undefined' ? window.location.pathname : '',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        timestamp: Date.now()
      },
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      timestamp: Date.now()
    }
    
    // Send to multiple analytics providers
    this.sendToVercel(event)
    this.sendToCustomAnalytics(event)
    
    // Track user behavior patterns
    if (this.userId) {
      this.updateUserBehavior(eventName, properties)
    }
  }
  
  /**
   * Track page views
   */
  page(pageName?: string, properties: Record<string, any> = {}) {
    const url = typeof window !== 'undefined' ? window.location.pathname : ''
    const title = typeof document !== 'undefined' ? document.title : ''
    
    this.track('page_view', {
      page: pageName || url,
      title,
      referrer: typeof document !== 'undefined' ? document.referrer : '',
      ...properties
    })
  }
  
  /**
   * Track conversion events
   */
  conversion(event: string, value?: number, currency = 'USD') {
    this.track('conversion', {
      event,
      value,
      currency,
      conversionTime: Date.now()
    })
    
    // Send to Sentry as custom metric
    Sentry.addBreadcrumb({
      category: 'conversion',
      message: event,
      level: 'info',
      data: { value, currency }
    })
  }
  
  /**
   * Track errors
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error_occurred', {
      error: error.message,
      stack: error.stack,
      ...context
    })
  }
  
  /**
   * Track performance metrics
   */
  trackPerformance(metric: Omit<PerformanceMetric, 'timestamp' | 'userId'>) {
    const performanceEvent: PerformanceMetric = {
      ...metric,
      userId: this.userId || undefined,
      timestamp: Date.now()
    }
    
    this.track('performance_metric', performanceEvent)
    
    // Send critical performance data to Sentry
    if (metric.value > 3000) { // Slow performance threshold
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `Slow ${metric.name}`,
        level: 'warning',
        data: performanceEvent
      })
    }
  }
  
  /**
   * Track Core Web Vitals
   */
  private trackWebVitals() {
    if (typeof window === 'undefined') return
    
    try {
      import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS((metric) => this.trackPerformance({
          name: 'CLS',
          value: metric.value,
          url: window.location.pathname
        }))
        
        onINP((metric) => this.trackPerformance({
          name: 'INP',
          value: metric.value,
          url: window.location.pathname
        }))
        
        onFCP((metric) => this.trackPerformance({
          name: 'FCP',
          value: metric.value,
          url: window.location.pathname
        }))
        
        onLCP((metric) => this.trackPerformance({
          name: 'LCP',
          value: metric.value,
          url: window.location.pathname
        }))
        
        onTTFB((metric) => this.trackPerformance({
          name: 'TTFB',
          value: metric.value,
          url: window.location.pathname
        }))
      })
    } catch (error) {
      }
  }
  
  /**
   * Track page load performance
   */
  private trackPageLoadPerformance() {
    if (typeof window === 'undefined') return
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      this.trackPerformance({
        name: 'page_load_time',
        value: navigation.loadEventEnd - navigation.loadEventStart,
        url: window.location.pathname
      })
      
      this.trackPerformance({
        name: 'dom_content_loaded',
        value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        url: window.location.pathname
      })
    }
  }
  
  /**
   * Track navigation timing
   */
  private trackNavigationTiming() {
    if (typeof window === 'undefined') return
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigation) {
      // DNS lookup time
      this.trackPerformance({
        name: 'dns_lookup_time',
        value: navigation.domainLookupEnd - navigation.domainLookupStart,
        url: window.location.pathname
      })
      
      // Connection time
      this.trackPerformance({
        name: 'connection_time',
        value: navigation.connectEnd - navigation.connectStart,
        url: window.location.pathname
      })
      
      // Server response time
      this.trackPerformance({
        name: 'server_response_time',
        value: navigation.responseStart - navigation.requestStart,
        url: window.location.pathname
      })
    }
  }
  
  /**
   * Send to Vercel Analytics
   */
  private sendToVercel(event: AnalyticsEvent) {
    try {
      if (typeof window !== 'undefined' && window.va) {
        window.va('event', { name: event.name, data: event.properties })
      }
    } catch (error) {
      }
  }
  
  /**
   * Send to custom analytics endpoint
   */
  private async sendToCustomAnalytics(event: AnalyticsEvent) {
    try {
      if (typeof window === 'undefined') return
      
      // Batch events and send periodically
      const events = JSON.parse(localStorage.getItem('pending_analytics') || '[]')
      events.push(event)
      localStorage.setItem('pending_analytics', JSON.stringify(events))
      
      // Send batch every 10 events or every 30 seconds
      if (events.length >= 10) {
        await this.flushAnalytics()
      }
    } catch (error) {
      }
  }
  
  /**
   * Flush pending analytics
   */
  private async flushAnalytics() {
    try {
      const events = JSON.parse(localStorage.getItem('pending_analytics') || '[]')
      
      if (events.length === 0) return
      
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events })
      })
      
      if (response.ok) {
        localStorage.removeItem('pending_analytics')
      }
    } catch (error) {
      }
  }
  
  /**
   * Update user behavior patterns
   */
  private updateUserBehavior(eventName: string, properties: Record<string, any>) {
    if (!this.userId) return
    
    // Track user engagement patterns
    const behaviorData = {
      lastEvent: eventName,
      lastEventTime: Date.now(),
      sessionLength: Date.now() - parseInt(this.sessionId.split('-')[0]),
      ...properties
    }
    
    // Store in session for behavior analysis
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_behavior', JSON.stringify(behaviorData))
    }
  }
  
  /**
   * Get session analytics
   */
  getSessionAnalytics() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userProperties: this.userProperties,
      sessionStart: parseInt(this.sessionId.split('-')[0]),
      sessionDuration: Date.now() - parseInt(this.sessionId.split('-')[0])
    }
  }
}

// Create singleton instance
export const analytics = new AnalyticsManager()

/**
 * React hook for analytics
 */
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    page: analytics.page.bind(analytics),
    identify: analytics.identify.bind(analytics),
    conversion: analytics.conversion.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    getSessionAnalytics: analytics.getSessionAnalytics.bind(analytics)
  }
}

/**
 * Predefined event tracking functions
 */
export const trackEvents = {
  // Authentication events
  userSignUp: (method: string) => analytics.track('user_signup', { method }),
  userLogin: (method: string) => analytics.track('user_login', { method }),
  userLogout: () => analytics.track('user_logout'),
  
  // Core feature events
  checkinCompleted: (category: string, mood?: number) => 
    analytics.track('checkin_completed', { category, mood }),
  streakAchieved: (category: string, streakLength: number) =>
    analytics.track('streak_achieved', { category, streakLength }),
  goalSet: (category: string, goalType: string) =>
    analytics.track('goal_set', { category, goalType }),
  
  // Engagement events
  dashboardViewed: () => analytics.track('dashboard_viewed'),
  analyticsViewed: () => analytics.track('analytics_viewed'),
  settingsChanged: (setting: string) => analytics.track('settings_changed', { setting }),
  
  // Business events
  subscriptionUpgrade: (plan: string) => analytics.conversion('subscription_upgrade', undefined, 'USD'),
  featureUsed: (feature: string) => analytics.track('feature_used', { feature }),
  
  // Performance events
  pageLoadSlow: (page: string, loadTime: number) =>
    analytics.trackPerformance({ name: 'slow_page_load', value: loadTime, url: page })
}

// Initialize analytics on page load
if (typeof window !== 'undefined') {
  // Flush analytics on page unload
  window.addEventListener('beforeunload', () => {
    analytics['flushAnalytics']()
  })
  
  // Periodic flush
  setInterval(() => {
    analytics['flushAnalytics']()
  }, 30000) // Every 30 seconds
}