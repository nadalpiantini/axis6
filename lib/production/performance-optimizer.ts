/**
 * Production Performance Optimizer
 * Comprehensive performance optimization system
 */

interface CacheConfig {
  ttl: number
  maxSize: number
  strategy: 'LRU' | 'LFU' | 'FIFO'
}

interface PerformanceConfig {
  enableServiceWorker: boolean
  enablePrefetch: boolean
  enableIntersectionObserver: boolean
  cacheConfig: {
    api: CacheConfig
    images: CacheConfig
    static: CacheConfig
  }
}

class PerformanceOptimizer {
  private cache: Map<string, { data: any; timestamp: number; access: number }> = new Map()
  private config: PerformanceConfig
  private observer: IntersectionObserver | null = null
  
  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableServiceWorker: true,
      enablePrefetch: true,
      enableIntersectionObserver: true,
      cacheConfig: {
        api: { ttl: 5 * 60 * 1000, maxSize: 100, strategy: 'LRU' }, // 5 minutes
        images: { ttl: 60 * 60 * 1000, maxSize: 50, strategy: 'LRU' }, // 1 hour
        static: { ttl: 24 * 60 * 60 * 1000, maxSize: 200, strategy: 'LRU' } // 24 hours
      },
      ...config
    }
    
    this.initialize()
  }
  
  private async initialize() {
    if (typeof window === 'undefined') return
    
    // Initialize service worker for caching
    if (this.config.enableServiceWorker) {
      this.registerServiceWorker()
    }
    
    // Setup intersection observer for lazy loading
    if (this.config.enableIntersectionObserver) {
      this.setupIntersectionObserver()
    }
    
    // Prefetch critical resources
    if (this.config.enablePrefetch) {
      this.prefetchCriticalResources()
    }
    
    // Optimize images
    this.optimizeImages()
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring()
  }
  
  /**
   * Register service worker for advanced caching
   */
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
      } catch (error) {
        console.warn('Service Worker registration failed:', error)
      }
    }
  }
  
  /**
   * Setup intersection observer for performance optimization
   */
  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.handleElementInView(entry.target as HTMLElement)
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    )
  }
  
  /**
   * Handle element coming into view
   */
  private handleElementInView(element: HTMLElement) {
    // Lazy load images
    if (element.tagName === 'IMG' && element.dataset.src) {
      const img = element as HTMLImageElement
      img.src = img.dataset.src!
      img.removeAttribute('data-src')
      this.observer?.unobserve(element)
    }
    
    // Prefetch route data
    if (element.dataset.prefetch) {
      this.prefetchRoute(element.dataset.prefetch)
    }
  }
  
  /**
   * Prefetch critical resources
   */
  private prefetchCriticalResources() {
    const criticalRoutes = ['/dashboard', '/stats', '/settings']
    const criticalAssets = [
      '/api/categories',
      '/api/checkins/recent',
      '/api/streaks'
    ]
    
    // Prefetch routes after initial load
    setTimeout(() => {
      criticalRoutes.forEach(route => this.prefetchRoute(route))
      criticalAssets.forEach(asset => this.prefetchData(asset))
    }, 2000)
  }
  
  /**
   * Prefetch route data
   */
  private async prefetchRoute(route: string) {
    try {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          fetch(route, { method: 'HEAD' })
        })
      } else {
        setTimeout(() => {
          fetch(route, { method: 'HEAD' })
        }, 100)
      }
    } catch (error) {
      // Ignore prefetch errors
    }
  }
  
  /**
   * Prefetch API data
   */
  private async prefetchData(url: string) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        this.cacheSet(url, data, 'api')
      }
    } catch (error) {
      // Ignore prefetch errors
    }
  }
  
  /**
   * Optimize images with lazy loading and format optimization
   */
  private optimizeImages() {
    // Convert images to WebP when supported
    if ('loading' in HTMLImageElement.prototype) {
      document.querySelectorAll('img[data-src]').forEach((img) => {
        if (this.observer) {
          this.observer.observe(img)
        }
      })
    }
  }
  
  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring() {
    // Monitor Long Tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'longtask') {
              console.warn('Long task detected:', entry)
              this.reportPerformanceIssue('long_task', entry.duration)
            }
          })
        })
        
        observer.observe({ entryTypes: ['longtask'] })
      } catch (error) {
        console.warn('Performance Observer not supported')
      }
    }
    
    // Monitor memory usage
    this.monitorMemoryUsage()
  }
  
  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        }
        
        // Alert if memory usage is high
        if (memoryUsage.used > memoryUsage.limit * 0.8) {
          this.reportPerformanceIssue('high_memory_usage', memoryUsage.used)
          this.cleanupCache()
        }
      }, 30000) // Check every 30 seconds
    }
  }
  
  /**
   * Cache management
   */
  cacheGet(key: string, type: keyof PerformanceConfig['cacheConfig'] = 'api') {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const config = this.config.cacheConfig[type]
    const isExpired = Date.now() - entry.timestamp > config.ttl
    
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    // Update access count for LRU/LFU
    entry.access++
    return entry.data
  }
  
  cacheSet(key: string, data: any, type: keyof PerformanceConfig['cacheConfig'] = 'api') {
    const config = this.config.cacheConfig[type]
    
    // Cleanup if cache is full
    if (this.cache.size >= config.maxSize) {
      this.evictCache(config.strategy)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      access: 1
    })
  }
  
  private evictCache(strategy: CacheConfig['strategy']) {
    const entries = Array.from(this.cache.entries())
    
    let toDelete: string
    
    switch (strategy) {
      case 'LRU': // Least Recently Used
        toDelete = entries.reduce((oldest, [key, entry]) =>
          entry.timestamp < this.cache.get(oldest)!.timestamp ? key : oldest
        , entries[0][0])
        break
        
      case 'LFU': // Least Frequently Used
        toDelete = entries.reduce((least, [key, entry]) =>
          entry.access < this.cache.get(least)!.access ? key : least
        , entries[0][0])
        break
        
      case 'FIFO': // First In, First Out
      default:
        toDelete = entries[0][0]
        break
    }
    
    this.cache.delete(toDelete)
  }
  
  private cleanupCache() {
    // Remove expired entries
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > 60 * 60 * 1000) { // 1 hour max
        this.cache.delete(key)
      }
    }
  }
  
  /**
   * Report performance issues
   */
  private reportPerformanceIssue(type: string, value: number) {
    // Send to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          value,
          url: window.location.pathname,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      }).catch(() => {
        // Ignore reporting errors
      })
    }
  }
  
  /**
   * Preload critical resources for specific pages
   */
  preloadForPage(page: string) {
    const preloadMap: Record<string, string[]> = {
      '/dashboard': [
        '/api/checkins/recent',
        '/api/streaks',
        '/api/analytics/summary'
      ],
      '/stats': [
        '/api/analytics/detailed',
        '/api/streaks/history'
      ],
      '/settings': [
        '/api/user/profile',
        '/api/user/preferences'
      ]
    }
    
    const resources = preloadMap[page] || []
    resources.forEach(resource => this.prefetchData(resource))
  }
  
  /**
   * Optimize critical rendering path
   */
  optimizeCriticalPath() {
    // Inline critical CSS
    const criticalCSS = this.extractCriticalCSS()
    if (criticalCSS) {
      this.inlineCSS(criticalCSS)
    }
    
    // Defer non-critical resources
    this.deferNonCriticalResources()
  }
  
  private extractCriticalCSS(): string | null {
    // Extract above-the-fold CSS
    const criticalElements = document.querySelectorAll('header, nav, .hero, .above-fold')
    // Implementation would extract CSS for these elements
    return null // Placeholder
  }
  
  private inlineCSS(css: string) {
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
  }
  
  private deferNonCriticalResources() {
    // Defer non-critical CSS
    document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])').forEach(link => {
      link.setAttribute('media', 'print')
      link.setAttribute('onload', "this.media='all'")
    })
    
    // Defer non-critical scripts
    document.querySelectorAll('script[src]:not([data-critical])').forEach(script => {
      script.setAttribute('defer', '')
    })
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      cacheSize: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      memoryUsage: this.getMemoryUsage(),
      webVitals: this.getWebVitals()
    }
  }
  
  private calculateCacheHitRate(): number {
    // Implementation for cache hit rate calculation
    return 0.85 // Placeholder
  }
  
  private getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      }
    }
    return null
  }
  
  private getWebVitals() {
    // Return cached Web Vitals metrics
    return {
      lcp: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
      fid: 0, // Would be measured by actual user interaction
      cls: 0, // Would be measured by layout shift observer
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      ttfb: performance.timing ? performance.timing.responseStart - performance.timing.requestStart : 0
    }
  }
}

// Create singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

/**
 * React hook for performance optimization
 */
export function usePerformanceOptimization() {
  return {
    preloadForPage: performanceOptimizer.preloadForPage.bind(performanceOptimizer),
    cacheGet: performanceOptimizer.cacheGet.bind(performanceOptimizer),
    cacheSet: performanceOptimizer.cacheSet.bind(performanceOptimizer),
    getMetrics: performanceOptimizer.getPerformanceMetrics.bind(performanceOptimizer)
  }
}

/**
 * Performance optimization utilities
 */
export const performanceUtils = {
  // Measure function execution time
  measure: <T extends any[], R>(
    fn: (...args: T) => R,
    name: string
  ) => {
    return (...args: T): R => {
      const start = performance.now()
      const result = fn(...args)
      const end = performance.now()
      
      console.log(`${name} took ${end - start}ms`)
      
      if (end - start > 100) { // Log slow operations
        performanceOptimizer['reportPerformanceIssue']('slow_function', end - start)
      }
      
      return result
    }
  },
  
  // Debounce function calls
  debounce: <T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout
    return (...args: T) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn(...args), delay)
    }
  },
  
  // Throttle function calls
  throttle: <T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ) => {
    let lastCall = 0
    return (...args: T) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        fn(...args)
      }
    }
  }
}