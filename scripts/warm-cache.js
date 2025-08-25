#!/usr/bin/env node

/**
 * Cache Warming Script for AXIS6
 * Pre-populate caches with critical data for optimal performance
 */

const https = require('https')
const http = require('http')

class CacheWarmer {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axis6.app'
    this.warmedUrls = []
    this.errors = []
    this.concurrency = 5
  }

  async warmAll() {
    console.log('🔥 AXIS6 Cache Warming')
    console.log('=====================\n')
    console.log(`Target: ${this.baseUrl}`)
    console.log(`Concurrency: ${this.concurrency}`)
    console.log('')

    const urlGroups = [
      {
        name: 'Critical Pages',
        urls: [
          '/',
          '/dashboard',
          '/auth/login',
          '/auth/register',
          '/stats',
          '/settings'
        ],
        priority: 'high'
      },
      {
        name: 'API Endpoints',
        urls: [
          '/api/health',
          '/api/categories',
          '/api/mantras',
          '/api/analytics?period=7',
          '/api/checkins?days=7'
        ],
        priority: 'high'
      },
      {
        name: 'Static Assets',
        urls: [
          '/favicon.ico',
          '/manifest.json',
          '/_next/static/css/',
          '/_next/static/js/',
          '/sitemap.xml',
          '/robots.txt'
        ],
        priority: 'medium'
      },
      {
        name: 'Feature Pages',
        urls: [
          '/auth/onboarding',
          '/auth/forgot-password',
          '/achievements',
          '/profile',
          '/analytics'
        ],
        priority: 'low'
      }
    ]

    for (const group of urlGroups) {
      console.log(`🔥 Warming ${group.name} (${group.priority} priority)...`)
      
      const results = await this.warmUrlsConcurrently(group.urls, this.concurrency)
      
      const successful = results.filter(r => r.status === 'success').length
      const failed = results.filter(r => r.status === 'error').length
      
      console.log(`   ✅ Success: ${successful}`)
      if (failed > 0) {
        console.log(`   ❌ Failed: ${failed}`)
      }
      console.log('')
    }

    await this.warmServiceWorkerCache()
    await this.warmRedisCache()
    
    this.displaySummary()
  }

  async warmUrlsConcurrently(urls, concurrency) {
    const results = []
    
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency)
      const batchPromises = batch.map(url => this.warmUrl(url))
      const batchResults = await Promise.allSettled(batchPromises)
      
      batchResults.forEach((result, index) => {
        const url = batch[index]
        if (result.status === 'fulfilled') {
          results.push({ url, status: 'success', ...result.value })
          this.warmedUrls.push({ url, ...result.value })
        } else {
          results.push({ url, status: 'error', error: result.reason.message })
          this.errors.push({ url, error: result.reason.message })
        }
      })
      
      // Small delay between batches to avoid overwhelming the server
      if (i + concurrency < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    return results
  }

  async warmUrl(path) {
    const startTime = Date.now()
    
    try {
      const response = await this.makeRequest(path)
      const responseTime = Date.now() - startTime
      
      return {
        statusCode: response.statusCode,
        responseTime,
        size: response.body ? response.body.length : 0,
        cached: response.headers['x-cache'] || response.headers['cf-cache-status'] || 'unknown'
      }
      
    } catch (error) {
      throw new Error(`${error.message} (${Date.now() - startTime}ms)`)
    }
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl)
      const isHttps = url.protocol === 'https:'
      const requestModule = isHttps ? https : http
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'User-Agent': 'AXIS6-Cache-Warmer/1.0',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
        }
      }

      const req = requestModule.request(options, (res) => {
        let body = ''
        
        res.on('data', (chunk) => {
          body += chunk
        })
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body
          })
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.setTimeout(30000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.end()
    })
  }

  async warmServiceWorkerCache() {
    console.log('🔧 Warming Service Worker Cache...')
    
    try {
      // Try to trigger service worker cache warming
      const swWarmingUrls = [
        '/?sw-cache-warm=true',
        '/dashboard?sw-cache-warm=true'
      ]
      
      for (const url of swWarmingUrls) {
        try {
          await this.warmUrl(url)
        } catch (error) {
          // Ignore SW warming errors
        }
      }
      
      console.log('   ✅ Service Worker cache warming completed')
      
    } catch (error) {
      console.log('   ⚠️  Service Worker cache warming skipped')
    }
    
    console.log('')
  }

  async warmRedisCache() {
    console.log('⚡ Warming Redis Cache...')
    
    const redisCacheUrls = [
      '/api/categories',
      '/api/mantras',
      '/api/health?service=redis'
    ]
    
    try {
      const results = await this.warmUrlsConcurrently(redisCacheUrls, 3)
      const successful = results.filter(r => r.status === 'success').length
      
      console.log(`   ✅ Redis cache entries: ${successful}`)
      
    } catch (error) {
      console.log('   ⚠️  Redis cache warming failed')
    }
    
    console.log('')
  }

  displaySummary() {
    console.log('🔥 CACHE WARMING SUMMARY')
    console.log('========================')
    
    const totalUrls = this.warmedUrls.length + this.errors.length
    const successRate = Math.round((this.warmedUrls.length / totalUrls) * 100)
    
    console.log(`Total URLs: ${totalUrls}`)
    console.log(`Successfully Warmed: ${this.warmedUrls.length}`)
    console.log(`Failed: ${this.errors.length}`)
    console.log(`Success Rate: ${successRate}%`)
    console.log('')

    if (this.warmedUrls.length > 0) {
      const avgResponseTime = Math.round(
        this.warmedUrls.reduce((sum, url) => sum + url.responseTime, 0) / this.warmedUrls.length
      )
      
      const totalSize = this.warmedUrls.reduce((sum, url) => sum + (url.size || 0), 0)
      const totalSizeKB = Math.round(totalSize / 1024)
      
      console.log('📊 Performance Metrics:')
      console.log(`   Average Response Time: ${avgResponseTime}ms`)
      console.log(`   Total Data Cached: ${totalSizeKB}KB`)
      console.log(`   Fastest Response: ${Math.min(...this.warmedUrls.map(u => u.responseTime))}ms`)
      console.log(`   Slowest Response: ${Math.max(...this.warmedUrls.map(u => u.responseTime))}ms`)
      console.log('')
    }

    if (this.errors.length > 0) {
      console.log('❌ Failed URLs:')
      this.errors.forEach(error => {
        console.log(`   ${error.url}: ${error.error}`)
      })
      console.log('')
    }

    // Cache effectiveness analysis
    const cachedResponses = this.warmedUrls.filter(url => 
      url.cached && !['unknown', 'MISS'].includes(url.cached)
    ).length
    
    if (cachedResponses > 0) {
      console.log(`🎯 Cache Effectiveness: ${Math.round((cachedResponses / this.warmedUrls.length) * 100)}% of responses cached`)
    }

    console.log('')
    
    if (successRate >= 90) {
      console.log('🔥 Cache warming completed successfully!')
      console.log('✅ Application is ready for optimal performance')
    } else if (successRate >= 70) {
      console.log('⚠️  Cache warming partially successful')
      console.log('🔧 Some optimizations may be needed')
    } else {
      console.log('❌ Cache warming had significant issues')
      console.log('🚨 Review errors and retry')
      process.exit(1)
    }

    // Save warming report
    this.saveWarmingReport()
  }

  async saveWarmingReport() {
    const fs = require('fs').promises
    
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        totalUrls: this.warmedUrls.length + this.errors.length,
        successful: this.warmedUrls.length,
        failed: this.errors.length,
        successRate: Math.round((this.warmedUrls.length / (this.warmedUrls.length + this.errors.length)) * 100)
      },
      warmedUrls: this.warmedUrls,
      errors: this.errors,
      performance: {
        avgResponseTime: this.warmedUrls.length > 0 
          ? Math.round(this.warmedUrls.reduce((sum, url) => sum + url.responseTime, 0) / this.warmedUrls.length)
          : 0,
        totalDataCached: this.warmedUrls.reduce((sum, url) => sum + (url.size || 0), 0)
      }
    }

    try {
      await fs.writeFile('cache-warming-report.json', JSON.stringify(report, null, 2))
      console.log('📄 Cache warming report saved to: cache-warming-report.json')
    } catch (error) {
      console.warn('Failed to save warming report:', error.message)
    }
  }
}

// Advanced warming strategies
class AdvancedCacheWarmer extends CacheWarmer {
  constructor() {
    super()
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ]
  }

  async warmWithUserVariations() {
    console.log('🎭 Warming with User Agent Variations...')
    
    const criticalUrls = ['/', '/dashboard', '/auth/login']
    
    for (const url of criticalUrls) {
      for (const userAgent of this.userAgents) {
        try {
          await this.makeRequestWithUserAgent(url, userAgent)
        } catch (error) {
          // Ignore individual failures
        }
      }
    }
    
    console.log('   ✅ User agent variation warming completed\n')
  }

  async makeRequestWithUserAgent(path, userAgent) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl)
      const isHttps = url.protocol === 'https:'
      const requestModule = isHttps ? https : http
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        }
      }

      const req = requestModule.request(options, (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => resolve({ statusCode: res.statusCode, body }))
      })

      req.on('error', reject)
      req.setTimeout(10000, () => {
        req.destroy()
        reject(new Error('Timeout'))
      })
      req.end()
    })
  }
}

// Run cache warming if called directly
if (require.main === module) {
  const useAdvanced = process.argv.includes('--advanced')
  const warmer = useAdvanced ? new AdvancedCacheWarmer() : new CacheWarmer()
  
  warmer.warmAll().then(() => {
    if (useAdvanced) {
      return warmer.warmWithUserVariations()
    }
  }).catch(error => {
    console.error('Cache warming failed:', error)
    process.exit(1)
  })
}

module.exports = { CacheWarmer, AdvancedCacheWarmer }