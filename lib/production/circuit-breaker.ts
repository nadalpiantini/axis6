/**
 * Production Circuit Breaker System
 * Prevents cascading failures and provides graceful degradation
 */

interface CircuitBreakerConfig {
  failureThreshold: number
  successThreshold: number
  timeout: number
  resetTimeout: number
  monitoringWindow: number
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failures: number
  successes: number
  lastFailureTime: number
  nextAttemptTime: number
  requestCount: number
}

interface ServiceCall<T> {
  name: string
  fn: () => Promise<T>
  fallback?: () => Promise<T> | T
  timeout?: number
}

class CircuitBreaker {
  private states: Map<string, CircuitBreakerState> = new Map()
  private config: CircuitBreakerConfig
  
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5, // Open circuit after 5 failures
      successThreshold: 3, // Close circuit after 3 successes
      timeout: 10000, // 10 second timeout for requests
      resetTimeout: 60000, // 1 minute before attempting reset
      monitoringWindow: 60000, // 1 minute monitoring window
      ...config
    }
  }
  
  /**
   * Execute a service call with circuit breaker protection
   */
  async execute<T>(serviceCall: ServiceCall<T>): Promise<T> {
    const state = this.getState(serviceCall.name)
    
    // Check if circuit is open
    if (state.state === 'OPEN') {
      if (Date.now() < state.nextAttemptTime) {
        // Circuit is open, use fallback if available
        if (serviceCall.fallback) {
          return this.executeFallback(serviceCall)
        }
        throw new Error(`Circuit breaker is OPEN for ${serviceCall.name}`)
      } else {
        // Time to attempt reset
        this.transitionToHalfOpen(serviceCall.name)
      }
    }
    
    try {
      // Execute the actual service call with timeout
      const result = await this.executeWithTimeout(
        serviceCall.fn,
        serviceCall.timeout || this.config.timeout
      )
      
      // Success - record it
      this.onSuccess(serviceCall.name)
      return result
    } catch (error) {
      // Failure - record it and possibly open circuit
      this.onFailure(serviceCall.name, error as Error)
      
      // Use fallback if available
      if (serviceCall.fallback) {
        return this.executeFallback(serviceCall)
      }
      
      throw error
    }
  }
  
  /**
   * Get current state for a service
   */
  private getState(serviceName: string): CircuitBreakerState {
    if (!this.states.has(serviceName)) {
      this.states.set(serviceName, {
        state: 'CLOSED',
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        requestCount: 0
      })
    }
    
    return this.states.get(serviceName)!
  }
  
  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ])
  }
  
  /**
   * Execute fallback function
   */
  private async executeFallback<T>(serviceCall: ServiceCall<T>): Promise<T> {
    try {
      const result = serviceCall.fallback!()
      return result instanceof Promise ? await result : result
    } catch (error) {
      throw new Error(`Service ${serviceCall.name} failed and fallback also failed: ${error}`)
    }
  }
  
  /**
   * Handle successful service call
   */
  private onSuccess(serviceName: string) {
    const state = this.getState(serviceName)
    state.successes++
    state.requestCount++
    
    if (state.state === 'HALF_OPEN') {
      if (state.successes >= this.config.successThreshold) {
        this.transitionToClosed(serviceName)
      }
    } else if (state.state === 'CLOSED') {
      // Reset failure count on success
      state.failures = 0
    }
    
    this.cleanupOldRequests(serviceName)
  }
  
  /**
   * Handle failed service call
   */
  private onFailure(serviceName: string, error: Error) {
    const state = this.getState(serviceName)
    state.failures++
    state.lastFailureTime = Date.now()
    state.requestCount++
    
    // Log the failure
    this.logFailure(serviceName, error)
    
    if (state.state === 'HALF_OPEN') {
      // Go back to open on any failure in half-open state
      this.transitionToOpen(serviceName)
    } else if (state.state === 'CLOSED') {
      // Check if we should open the circuit
      if (state.failures >= this.config.failureThreshold) {
        this.transitionToOpen(serviceName)
      }
    }
    
    this.cleanupOldRequests(serviceName)
  }
  
  /**
   * Transition circuit to OPEN state
   */
  private transitionToOpen(serviceName: string) {
    const state = this.getState(serviceName)
    state.state = 'OPEN'
    state.nextAttemptTime = Date.now() + this.config.resetTimeout
    
    // Report circuit breaker open event
    this.reportCircuitBreakerEvent(serviceName, 'OPEN', {
      failures: state.failures,
      lastFailureTime: state.lastFailureTime
    })
  }
  
  /**
   * Transition circuit to HALF_OPEN state
   */
  private transitionToHalfOpen(serviceName: string) {
    const state = this.getState(serviceName)
    state.state = 'HALF_OPEN'
    state.successes = 0 // Reset success counter
    
    this.reportCircuitBreakerEvent(serviceName, 'HALF_OPEN')
  }
  
  /**
   * Transition circuit to CLOSED state
   */
  private transitionToClosed(serviceName: string) {
    const state = this.getState(serviceName)
    state.state = 'CLOSED'
    state.failures = 0
    state.successes = 0
    
    this.reportCircuitBreakerEvent(serviceName, 'CLOSED')
  }
  
  /**
   * Clean up old request counts outside monitoring window
   */
  private cleanupOldRequests(serviceName: string) {
    const state = this.getState(serviceName)
    const cutoff = Date.now() - this.config.monitoringWindow
    
    // Reset counters if outside monitoring window
    if (state.lastFailureTime < cutoff) {
      state.failures = 0
      state.requestCount = 0
    }
  }
  
  /**
   * Log circuit breaker failures
   */
  private logFailure(serviceName: string, error: Error) {
    // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error(`Circuit breaker failure for ${serviceName}:`, {
    //   error: error.message,
    //   stack: error.stack,
    //   timestamp: new Date();.toISOString()
    // })
  }
  
  /**
   * Report circuit breaker events for monitoring
   */
  private reportCircuitBreakerEvent(
    serviceName: string,
    state: string,
    data?: Record<string, any>
  ) {
    // Send to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/monitoring/circuit-breaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: serviceName,
          state,
          timestamp: Date.now(),
          ...data
        })
      }).catch(() => {
        // Ignore monitoring errors
      })
    }
  }
  
  /**
   * Get current status of all circuit breakers
   */
  getStatus() {
    const status: Record<string, any> = {}
    
    for (const [serviceName, state] of this.states) {
      status[serviceName] = {
        state: state.state,
        failures: state.failures,
        successes: state.successes,
        requestCount: state.requestCount,
        lastFailureTime: state.lastFailureTime,
        nextAttemptTime: state.nextAttemptTime,
        healthScore: this.calculateHealthScore(state)
      }
    }
    
    return status
  }
  
  /**
   * Calculate health score for a service (0-100)
   */
  private calculateHealthScore(state: CircuitBreakerState): number {
    if (state.requestCount === 0) return 100
    
    const successRate = (state.requestCount - state.failures) / state.requestCount
    const baseScore = successRate * 100
    
    // Penalty for open circuit
    if (state.state === 'OPEN') return Math.min(baseScore * 0.5, 25)
    if (state.state === 'HALF_OPEN') return Math.min(baseScore * 0.75, 50)
    
    return baseScore
  }
  
  /**
   * Reset circuit breaker for a specific service
   */
  reset(serviceName: string) {
    if (this.states.has(serviceName)) {
      this.states.delete(serviceName)
      }
  }
  
  /**
   * Force open circuit for a specific service (for maintenance)
   */
  forceOpen(serviceName: string, duration: number = 300000) { // 5 minutes default
    const state = this.getState(serviceName)
    state.state = 'OPEN'
    state.nextAttemptTime = Date.now() + duration
    
    }
}

// Create singleton instance
export const circuitBreaker = new CircuitBreaker()

/**
 * Predefined circuit breakers for common services
 */
export const protectedServices = {
  // Database operations
  database: {
    query: <T>(queryFn: () => Promise<T>, fallback?: () => T) =>
      circuitBreaker.execute({
        name: 'database',
        fn: queryFn,
        fallback: fallback ? () => Promise.resolve(fallback()) : undefined,
        timeout: 5000
      }),
    
    mutation: <T>(mutationFn: () => Promise<T>) =>
      circuitBreaker.execute({
        name: 'database_mutation',
        fn: mutationFn,
        timeout: 10000
      })
  },
  
  // Email service
  email: {
    send: (emailFn: () => Promise<any>) =>
      circuitBreaker.execute({
        name: 'email',
        fn: emailFn,
        fallback: () => {
          return { queued: true }
        },
        timeout: 15000
      })
  },
  
  // External API calls
  external: {
    api: <T>(apiFn: () => Promise<T>, fallback?: () => T) =>
      circuitBreaker.execute({
        name: 'external_api',
        fn: apiFn,
        fallback: fallback ? () => Promise.resolve(fallback()) : undefined,
        timeout: 8000
      })
  },
  
  // Redis cache
  cache: {
    get: <T>(cacheFn: () => Promise<T>) =>
      circuitBreaker.execute({
        name: 'cache_get',
        fn: cacheFn,
        fallback: () => null, // Cache miss fallback
        timeout: 2000
      }),
    
    set: (cacheFn: () => Promise<void>) =>
      circuitBreaker.execute({
        name: 'cache_set',
        fn: cacheFn,
        fallback: () => {
          },
        timeout: 3000
      })
  }
}

/**
 * React hook for circuit breaker integration
 */
export function useCircuitBreaker() {
  return {
    execute: circuitBreaker.execute.bind(circuitBreaker),
    getStatus: circuitBreaker.getStatus.bind(circuitBreaker),
    reset: circuitBreaker.reset.bind(circuitBreaker),
    protectedServices
  }
}