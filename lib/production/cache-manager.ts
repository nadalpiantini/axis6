/**
 * Production Cache Manager
 * Multi-layer caching with Redis, in-memory, and browser cache
 */

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  tags: string[]
  hits: number
}

interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
  memoryUsage: number
}

interface CacheConfig {
  defaultTTL: number
  maxSize: number
  enableRedis: boolean
  enableMemory: boolean
  enableBrowser: boolean
  enableCompression: boolean
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry> = new Map()
  private config: CacheConfig
  private stats: CacheStats = { hits: 0, misses: 0, hitRate: 0, size: 0, memoryUsage: 0 }
  private redis: any = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 300000, // 5 minutes
      maxSize: 1000,
      enableRedis: true,
      enableMemory: true,
      enableBrowser: true,
      enableCompression: true,
      ...config
    }

    this.initializeRedis()
    this.startCleanupInterval()
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis() {
    if (!this.config.enableRedis) return

    try {
      const { Redis } = await import('@upstash/redis')
      this.redis = Redis.fromEnv()

      // Test connection
      await this.redis.ping()
      } catch (error) {
      this.redis = null
    }
  }

  /**
   * Get cached data with fallback chain
   */
  async get<T>(key: string, tags?: string[]): Promise<T | null> {
    // Try memory cache first (fastest)
    if (this.config.enableMemory) {
      const memoryResult = this.getFromMemory<T>(key)
      if (memoryResult !== null) {
        this.stats.hits++
        this.updateStats()
        return memoryResult
      }
    }

    // Try Redis cache (faster than database)
    if (this.config.enableRedis && this.redis) {
      try {
        const redisResult = await this.getFromRedis<T>(key)
        if (redisResult !== null) {
          // Store in memory for next time
          if (this.config.enableMemory) {
            this.setInMemory(key, redisResult, this.config.defaultTTL, tags)
          }
          this.stats.hits++
          this.updateStats()
          return redisResult
        }
      } catch (error) {
        }
    }

    // Try browser cache (if available)
    if (this.config.enableBrowser && typeof window !== 'undefined') {
      const browserResult = this.getFromBrowser<T>(key)
      if (browserResult !== null) {
        this.stats.hits++
        this.updateStats()
        return browserResult
      }
    }

    this.stats.misses++
    this.updateStats()
    return null
  }

  /**
   * Set data in all enabled caches
   */
  async set<T>(
    key: string,
    data: T,
    ttl: number = this.config.defaultTTL,
    tags: string[] = []
  ): Promise<void> {
    // Set in memory cache
    if (this.config.enableMemory) {
      this.setInMemory(key, data, ttl, tags)
    }

    // Set in Redis
    if (this.config.enableRedis && this.redis) {
      try {
        await this.setInRedis(key, data, ttl, tags)
      } catch (error) {
        }
    }

    // Set in browser cache
    if (this.config.enableBrowser && typeof window !== 'undefined') {
      this.setInBrowser(key, data, ttl)
    }
  }

  /**
   * Delete from all caches
   */
  async delete(key: string): Promise<void> {
    // Delete from memory
    if (this.config.enableMemory) {
      this.memoryCache.delete(key)
    }

    // Delete from Redis
    if (this.config.enableRedis && this.redis) {
      try {
        await this.redis.del(key)
      } catch (error) {
        }
    }

    // Delete from browser
    if (this.config.enableBrowser && typeof window !== 'undefined') {
      localStorage.removeItem(`cache_${key}`)
    }

    this.updateStats()
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    // Clear memory
    if (this.config.enableMemory) {
      this.memoryCache.clear()
    }

    // Clear Redis with pattern
    if (this.config.enableRedis && this.redis) {
      try {
        const keys = await this.redis.keys('axis6:*')
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } catch (error) {
        }
    }

    // Clear browser cache
    if (this.config.enableBrowser && typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'))
      keys.forEach(key => localStorage.removeItem(key))
    }

    this.resetStats()
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = []

    // Find keys with matching tags in memory
    if (this.config.enableMemory) {
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags.some(tag => tags.includes(tag))) {
          keysToDelete.push(key)
        }
      }

      keysToDelete.forEach(key => this.memoryCache.delete(key))
    }

    // Redis tag-based invalidation would require additional data structure
    // For now, we'll implement a simple pattern matching approach
    if (this.config.enableRedis && this.redis && tags.length > 0) {
      try {
        for (const tag of tags) {
          const keys = await this.redis.keys(`axis6:*:${tag}:*`)
          if (keys.length > 0) {
            await this.redis.del(...keys)
          }
        }
      } catch (error) {
        }
    }

    this.updateStats()
  }

  /**
   * Get from memory cache
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key)
      return null
    }

    entry.hits++
    return entry.data as T
  }

  /**
   * Set in memory cache
   */
  private setInMemory<T>(key: string, data: T, ttl: number, tags: string[] = []): void {
    // Cleanup if cache is full
    if (this.memoryCache.size >= this.config.maxSize) {
      this.evictMemoryCache()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
      hits: 0
    }

    this.memoryCache.set(key, entry)
    this.updateStats()
  }

  /**
   * Get from Redis
   */
  private async getFromRedis<T>(key: string): Promise<T | null> {
    const redisKey = `axis6:${key}`
    const data = await this.redis.get(redisKey)

    if (!data) return null

    try {
      const parsed = JSON.parse(data)
      return this.config.enableCompression
        ? this.decompress(parsed)
        : parsed
    } catch (error) {
      await this.redis.del(redisKey)
      return null
    }
  }

  /**
   * Set in Redis
   */
  private async setInRedis<T>(key: string, data: T, ttl: number, tags: string[] = []): Promise<void> {
    const redisKey = `axis6:${key}`
    const serializedData = this.config.enableCompression
      ? JSON.stringify(this.compress(data))
      : JSON.stringify(data)

    await this.redis.set(redisKey, serializedData, { ex: Math.floor(ttl / 1000) })

    // Store tags for invalidation (simple approach)
    if (tags.length > 0) {
      for (const tag of tags) {
        await this.redis.sadd(`axis6:tags:${tag}`, redisKey)
        await this.redis.expire(`axis6:tags:${tag}`, Math.floor(ttl / 1000))
      }
    }
  }

  /**
   * Get from browser cache
   */
  private getFromBrowser<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`cache_${key}`)
      if (!item) return null

      const parsed = JSON.parse(item)

      // Check expiration
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(`cache_${key}`)
        return null
      }

      return parsed.data as T
    } catch (error) {
      localStorage.removeItem(`cache_${key}`)
      return null
    }
  }

  /**
   * Set in browser cache
   */
  private setInBrowser<T>(key: string, data: T, ttl: number): void {
    try {
      const item = {
        data,
        expiry: Date.now() + ttl
      }

      localStorage.setItem(`cache_${key}`, JSON.stringify(item))
    } catch (error) {
      // LocalStorage quota exceeded or other error
      }
  }

  /**
   * Evict memory cache entries (LRU strategy)
   */
  private evictMemoryCache(): void {
    // Find least recently used entries
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey)
    }
  }

  /**
   * Compress data for storage
   */
  private compress(data: any): any {
    // Simple compression - in production, consider using actual compression
    if (typeof data === 'string' && data.length > 100) {
      return { __compressed: true, data: data }
    }
    return data
  }

  /**
   * Decompress data
   */
  private decompress(data: any): any {
    if (data && data.__compressed) {
      return data.data
    }
    return data
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredEntries()
    }, 60000) // Cleanup every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    if (!this.config.enableMemory) return

    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key))

    if (keysToDelete.length > 0) {
      this.updateStats()
    }
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.memoryCache.size
    this.stats.hitRate = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0

    // Estimate memory usage
    this.stats.memoryUsage = Array.from(this.memoryCache.values())
      .reduce((total, entry) => total + JSON.stringify(entry.data).length, 0)
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = { hits: 0, misses: 0, hitRate: 0, size: 0, memoryUsage: 0 }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(dataLoader: Record<string, () => Promise<any>>): Promise<void> {
    const promises = Object.entries(dataLoader).map(async ([key, loader]) => {
      try {
        const data = await loader()
        await this.set(key, data)
      } catch (error) {
        }
    })

    await Promise.allSettled(promises)
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet<T>(
    key: string,
    dataLoader: () => Promise<T>,
    ttl: number = this.config.defaultTTL,
    tags: string[] = []
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await dataLoader()
    await this.set(key, data, ttl, tags)
    return data
  }
}

// Create singleton instance
export const cacheManager = new CacheManager()

/**
 * Cache keys for different data types
 */
export const CacheKeys = {
  // User data
  userProfile: (userId: string) => `user:profile:${userId}`,
  userPreferences: (userId: string) => `user:preferences:${userId}`,
  userStats: (userId: string) => `user:stats:${userId}`,

  // Application data
  categories: 'categories:all',
  mantras: 'mantras:active',
  systemConfig: 'system:config',

  // Analytics
  dashboardData: (userId: string) => `dashboard:${userId}`,
  weeklyStats: (userId: string, week: string) => `stats:weekly:${userId}:${week}`,
  streakData: (userId: string) => `streaks:${userId}`,

  // API responses
  checkinHistory: (userId: string, days: number) => `checkins:${userId}:${days}d`,
  analyticsData: (userId: string, range: string) => `analytics:${userId}:${range}`
}

/**
 * Cache tags for invalidation
 */
export const CacheTags = {
  USER_DATA: 'user_data',
  SYSTEM_DATA: 'system_data',
  CHECKINS: 'checkins',
  STREAKS: 'streaks',
  ANALYTICS: 'analytics',
  PREFERENCES: 'preferences'
}

/**
 * React hook for cache management
 */
export function useCache() {
  return {
    get: cacheManager.get.bind(cacheManager),
    set: cacheManager.set.bind(cacheManager),
    delete: cacheManager.delete.bind(cacheManager),
    invalidateByTags: cacheManager.invalidateByTags.bind(cacheManager),
    getOrSet: cacheManager.getOrSet.bind(cacheManager),
    getStats: cacheManager.getStats.bind(cacheManager)
  }
}

/**
 * Cache warming utilities
 */
export const cacheWarmers = {
  // Warm up user-specific data
  warmUserData: async (userId: string) => {
    await cacheManager.warmUp({
      [CacheKeys.userProfile(userId)]: async () => {
        // Load user profile from database
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data } = await supabase
          .from('axis6_profiles')
          .select('*')
          .eq('id', userId)
          .single()
        return data
      },

      [CacheKeys.streakData(userId)]: async () => {
        // Load user streaks from database
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data } = await supabase
          .from('axis6_streaks')
          .select('*')
          .eq('user_id', userId)
        return data
      }
    })
  },

  // Warm up system data
  warmSystemData: async () => {
    await cacheManager.warmUp({
      [CacheKeys.categories]: async () => {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data } = await supabase
          .from('axis6_categories')
          .select('*')
          .order('name')
        return data
      },

      [CacheKeys.mantras]: async () => {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = await createClient()
        const { data } = await supabase
          .from('axis6_mantras')
          .select('*')
          .eq('is_active', true)
        return data
      }
    })
  }
}
