/**
 * Sentry Client Configuration for AXIS6
 * 
 * This file configures Sentry for browser-side error tracking
 * and performance monitoring.
 */

import * as Sentry from '@sentry/nextjs'
import { initializeErrorTracking } from '@/lib/monitoring/error-tracking'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Performance monitoring
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture 100% of the transactions for replay sampling
  replaysSessionSampleRate: 0.1,
  
  // Capture 100% of the transactions with errors for replay sampling
  replaysOnErrorSampleRate: 1.0,
  
  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Additional context
  initialScope: {
    tags: {
      component: 'client'
    },
    contexts: {
      app: {
        name: 'AXIS6',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
      }
    }
  },
  
  // Configure error filtering
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry event:', event)
    }
    
    // Don't send events for certain error types
    if (event.exception) {
      const error = hint.originalException
      
      // Filter out network errors
      if (error && typeof error === 'object' && 'name' in error && error.name === 'NetworkError') {
        return null
      }
      
      // Filter out cancelled requests
      if (error && typeof error === 'object' && 'message' in error && 
          typeof error.message === 'string' && error.message.includes('cancelled')) {
        return null
      }
    }
    
    return event
  },
  
  // Configure which URLs to ignore
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    'Can\'t find variable: ZiteReader',
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'http://loading.retry.widdit.com/',
    'atomicFindClose',
    // Network errors
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    // Canceled requests
    'AbortError',
  ],
  
  // Configure which URLs to capture
  allowUrls: [
    'axis6.app',
    'axis6.sujeto10.com',
    'localhost:6789'
  ],
  
  // Integrations
  integrations: [
    // Temporarily disabled for compatibility
    // new Sentry.BrowserTracing({
    //   // Set up automatic route change tracking for Next.js
    //   routingInstrumentation: Sentry.nextRouterInstrumentation()
    // }),
    // new Sentry.Replay({
    //   // Capture 10% of all sessions
    //   sessionSampleRate: 0.1,
    //   // Capture 100% of sessions with an error
    //   errorSampleRate: 1.0,
    //   maskAllText: false,
    //   maskAllInputs: false,
    //   blockAllMedia: true,
    // }),
  ],
  
  // Configure beforeBreadcrumb to filter out noisy breadcrumbs
  beforeBreadcrumb(breadcrumb, hint) {
    // Don't capture console.log breadcrumbs in production
    if (breadcrumb.category === 'console' && process.env.NODE_ENV === 'production') {
      return null
    }
    
    // Filter out Redux actions that might contain sensitive data
    if (breadcrumb.category === 'redux.action') {
      if (breadcrumb.message?.includes('password') || breadcrumb.message?.includes('token')) {
        return null
      }
    }
    
    return breadcrumb
  },
})

// Add additional client-side context
Sentry.setContext('client', {
  userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
  url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  timestamp: new Date().toISOString(),
})

// Initialize enhanced error tracking system
initializeErrorTracking()