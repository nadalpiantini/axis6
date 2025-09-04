/**
 * Supabase Configuration with Connection Pooling
 *
 * This module provides optimized Supabase client configuration
 * with connection pooling and performance settings.
 */
import { env } from '@/lib/env'
/**
 * Supabase client configuration
 */
export const supabaseConfig = {
  auth: {
    // Persist session in cookies for SSR
    persistSession: true,
    // Auto refresh token before expiry
    autoRefreshToken: true,
    // Detect session from URL (for OAuth)
    detectSessionInUrl: true,
    // Session storage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Flow type
    flowType: 'pkce' as const,
  },
  db: {
    // Use connection pooling for better performance
    schema: 'public',
    // Realtime configuration
    realtime: {
      // Enable multiplexing for better connection management
      params: {
        eventsPerSecond: 10,
      },
    },
  },
  global: {
    // Headers to include with every request
    headers: {
      'x-app-version': process.env['NEXT_PUBLIC_APP_VERSION'] || '1.0.0',
    },
    // Fetch configuration
    fetch: {
      // Add timeout to prevent hanging requests
      timeout: 30000, // 30 seconds
      // Retry configuration
      retries: 3,
      retryDelay: (attemptIndex: number) => 2 ** attemptIndex * 1000,
    },
  },
}
/**
 * Database connection pool configuration
 * These settings optimize connection usage and prevent exhaustion
 */
export const poolConfig = {
  // Maximum number of clients in the pool
  max: 20,
  // Minimum number of clients in the pool
  min: 2,
  // Number of milliseconds a client must sit idle before being removed
  idleTimeoutMillis: 30000,
  // Number of milliseconds to wait before timing out when connecting
  connectionTimeoutMillis: 2000,
  // Maximum number of uses for a single client
  maxUses: 7500,
  // Application name for pg_stat_activity
  application_name: 'axis6-app',
  // Statement timeout (prevents long-running queries)
  statement_timeout: '30s',
  // Query timeout
  query_timeout: 30000,
  // Connection string parameters
  connectionString: {
    // Use connection pooling mode
    sslmode: 'require',
    // Prepare statements for better performance
    prepare: true,
    // Use binary format for better performance
    binary: true,
  },
}
/**
 * Rate limiting configuration for database queries
 */
export const dbRateLimits = {
  // Maximum queries per second per user
  queriesPerSecond: 100,
  // Maximum concurrent queries per user
  maxConcurrent: 10,
  // Burst allowance
  burst: 20,
}
/**
 * Cache configuration for query results
 */
export const cacheConfig = {
  // TTL for cached results (in seconds)
  ttl: {
    // User profile data
    profile: 300, // 5 minutes
    // Categories (rarely change)
    categories: 3600, // 1 hour
    // Check-ins for today
    todayCheckins: 60, // 1 minute
    // Streak data
    streaks: 120, // 2 minutes
    // Daily stats
    dailyStats: 180, // 3 minutes
  },
  // Cache key prefixes
  keys: {
    profile: 'cache:profile:',
    categories: 'cache:categories:',
    checkins: 'cache:checkins:',
    streaks: 'cache:streaks:',
    stats: 'cache:stats:',
  },
}
/**
 * Query optimization hints
 */
export const queryHints = {
  // Use prepared statements for frequently used queries
  usePreparedStatements: true,
  // Batch size for bulk operations
  batchSize: 100,
  // Enable query plan caching
  planCacheEnabled: true,
  // Connection pooling mode
  poolingMode: 'transaction' as const,
}
/**
 * Monitoring configuration
 */
export const monitoringConfig = {
  // Log slow queries (in milliseconds)
  slowQueryThreshold: 1000,
  // Track query metrics
  enableMetrics: true,
  // Sample rate for query logging (0-1)
  querySampleRate: env.isProduction ? 0.1 : 1,
}
/**
 * Get optimized fetch options for Supabase queries
 */
export function getOptimizedFetchOptions(options: RequestInit = {}): RequestInit {
  return {
    ...options,
    // Add cache headers for GET requests
    ...(options.method === 'GET' && {
      cache: 'no-cache', // Use 'force-cache' for static data
      next: {
        revalidate: 60, // Revalidate every 60 seconds
      },
    }),
    // Add performance headers
    headers: {
      ...options.headers,
      'X-Client-Info': 'axis6-web',
      'X-Request-ID': crypto.randomUUID(),
    },
  }
}
/**
 * Connection pool health check
 */
export async function checkPoolHealth(): Promise<{
  healthy: boolean
  activeConnections: number
  idleConnections: number
  totalConnections: number
}> {
  // This would connect to your monitoring system
  // For now, return a mock response
  return {
    healthy: true,
    activeConnections: 5,
    idleConnections: 2,
    totalConnections: 7,
  }
}
