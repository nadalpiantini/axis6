#!/usr/bin/env tsx
/**
 * Redis Connection Test Script for AXIS6
 *
 * This script tests the Redis/Upstash connection and verifies
 * rate limiting functionality works correctly.
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

interface TestResult {
  name: string
  success: boolean
  message: string
  duration?: number
}

async function testRedisConnection(): Promise<TestResult> {
  const start = Date.now()

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return {
        name: 'Redis Connection',
        success: false,
        message: 'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables'
      }
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Test basic connection
    const testKey = `test:connection:${Date.now()}`
    await redis.set(testKey, 'test-value', { ex: 60 })
    const value = await redis.get(testKey)
    await redis.del(testKey)

    if (value !== 'test-value') {
      throw new Error('Failed to get expected value from Redis')
    }

    const duration = Date.now() - start
    return {
      name: 'Redis Connection',
      success: true,
      message: 'Successfully connected to Redis and performed basic operations',
      duration
    }
  } catch (error) {
    const duration = Date.now() - start
    return {
      name: 'Redis Connection',
      success: false,
      message: `Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration
    }
  }
}

async function testRateLimiting(): Promise<TestResult> {
  const start = Date.now()

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return {
        name: 'Rate Limiting',
        success: false,
        message: 'Redis credentials not configured'
      }
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Create a test rate limiter
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 s'), // 5 requests per 10 seconds
      analytics: false,
      prefix: 'ratelimit:test',
    })

    const testIdentifier = `test:${Date.now()}`

    // Test successful requests
    for (let i = 0; i < 5; i++) {
      const { success } = await ratelimit.limit(testIdentifier)
      if (!success) {
        throw new Error(`Request ${i + 1} was rate limited unexpectedly`)
      }
    }

    // Test rate limiting
    const { success: shouldBeLimited } = await ratelimit.limit(testIdentifier)
    if (shouldBeLimited) {
      throw new Error('Request should have been rate limited')
    }

    const duration = Date.now() - start
    return {
      name: 'Rate Limiting',
      success: true,
      message: 'Rate limiting is working correctly',
      duration
    }
  } catch (error) {
    const duration = Date.now() - start
    return {
      name: 'Rate Limiting',
      success: false,
      message: `Rate limiting test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration
    }
  }
}

async function testCaching(): Promise<TestResult> {
  const start = Date.now()

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return {
        name: 'Caching',
        success: false,
        message: 'Redis credentials not configured'
      }
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // Test caching operations
    const cacheKey = `cache:test:${Date.now()}`
    const testData = {
      user: 'test-user',
      data: [1, 2, 3, 4, 5],
      timestamp: new Date().toISOString()
    }

    // Set cache with expiration
    await redis.setex(cacheKey, 300, JSON.stringify(testData)) // 5 minutes

    // Get from cache
    const cachedData = await redis.get(cacheKey)
    const parsedData = JSON.parse(cachedData as string)

    if (parsedData.user !== testData.user) {
      throw new Error('Cached data does not match original data')
    }

    // Test TTL
    const ttl = await redis.ttl(cacheKey)
    if (ttl <= 0 || ttl > 300) {
      throw new Error(`Unexpected TTL: ${ttl}`)
    }

    // Clean up
    await redis.del(cacheKey)

    const duration = Date.now() - start
    return {
      name: 'Caching',
      success: true,
      message: 'Caching operations work correctly',
      duration
    }
  } catch (error) {
    const duration = Date.now() - start
    return {
      name: 'Caching',
      success: false,
      message: `Caching test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration
    }
  }
}

async function runTests(): Promise<void> {
  console.log('🔴 AXIS6 Redis Connection Tests\n')

  const tests = [
    testRedisConnection,
    testRateLimiting,
    testCaching
  ]

  const results: TestResult[] = []

  for (const test of tests) {
    console.log(`⏳ Running ${test.name}...`)
    const result = await test()
    results.push(result)

    const status = result.success ? '✅' : '❌'
    const duration = result.duration ? ` (${result.duration}ms)` : ''
    console.log(`${status} ${result.name}${duration}`)
    console.log(`   ${result.message}\n`)
  }

  // Summary
  const successful = results.filter(r => r.success).length
  const total = results.length

  console.log('📊 Test Summary:')
  console.log(`   ${successful}/${total} tests passed`)

  if (successful === total) {
    console.log('🎉 All Redis tests passed! Your Redis configuration is working correctly.')
    process.exit(0)
  } else {
    console.log('❌ Some tests failed. Please check your Redis configuration.')
    process.exit(1)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
}

export { testRedisConnection, testRateLimiting, testCaching }
