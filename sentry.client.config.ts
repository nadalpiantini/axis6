import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry in production
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    
    // Environment
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
    
    // Integrations
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception) {
        const error = hint.originalException
        
        // Ignore network errors that are expected
        if (error && error.message && error.message.includes('NetworkError')) {
          return null
        }
        
        // Ignore ResizeObserver errors (common and harmless)
        if (error && error.message && error.message.includes('ResizeObserver')) {
          return null
        }
      }
      
      return event
    },
    
    // Performance monitoring options
    tracingOptions: {
      trackComponents: true,
    },
  })
}