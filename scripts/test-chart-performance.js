#!/usr/bin/env node

/**
 * Chart Performance Testing Script
 * 
 * Tests the performance of the optimized charts implementation
 * and provides detailed performance metrics.
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const COLORS = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

class ChartPerformanceTester {
  constructor() {
    this.browser = null
    this.page = null
    this.baseUrl = 'http://localhost:3000'
    this.results = {
      pageLoad: {},
      chartRendering: {},
      memoryUsage: {},
      networkRequests: []
    }
  }

  async initialize() {
    log('🚀 Initializing browser for performance testing...', 'blue')
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-gpu',
        '--enable-gpu-rasterization'
      ]
    })
    
    this.page = await this.browser.newPage()
    
    // Set viewport for consistent testing
    await this.page.setViewport({ width: 1280, height: 720 })
    
    // Enable performance monitoring
    await this.page.setCacheEnabled(false)
    await this.page.tracing.start({ 
      path: 'chart-performance-trace.json',
      categories: ['devtools.timeline']
    })
    
    // Monitor network requests
    this.page.on('request', (request) => {
      this.results.networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      })
    })
  }

  async testPageLoadPerformance() {
    log('\n📊 Testing page load performance...', 'yellow')
    
    const startTime = Date.now()
    
    // Navigate to analytics page
    const response = await this.page.goto(`${this.baseUrl}/analytics`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    const loadTime = Date.now() - startTime
    
    // Get Web Vitals
    const vitals = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals = {}
          
          for (const entry of entries) {
            if (entry.entryType === 'navigation') {
              vitals.domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
              vitals.load = entry.loadEventEnd - entry.loadEventStart
            }
            
            if (entry.entryType === 'paint') {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime
              }
              if (entry.name === 'largest-contentful-paint') {
                vitals.lcp = entry.startTime
              }
            }
          }
          
          resolve(vitals)
        }).observe({ entryTypes: ['navigation', 'paint'] })
        
        // Fallback timeout
        setTimeout(() => resolve({}), 2000)
      })
    })
    
    this.results.pageLoad = {
      totalLoadTime: loadTime,
      responseStatus: response.status(),
      ...vitals
    }
    
    log(`✓ Page loaded in ${loadTime}ms`, loadTime < 1500 ? 'green' : 'red')
    log(`✓ FCP: ${vitals.fcp || 'N/A'}ms`, 'reset')
    log(`✓ LCP: ${vitals.lcp || 'N/A'}ms`, 'reset')
  }

  async testChartRenderingPerformance() {
    log('\n🎯 Testing chart rendering performance...', 'yellow')
    
    // Wait for charts to load
    await this.page.waitForSelector('[data-testid="analytics-page"]', { timeout: 10000 })
    
    // Test individual chart performance
    const chartTests = [
      { testId: 'chart-5', name: 'Completion Rate Chart' },
      { testId: 'chart-7', name: 'Category Performance Chart' },
      { testId: 'chart-10', name: 'Daily Activity Chart' },
      { testId: 'chart-11', name: 'Mood Trend Chart' },
      { testId: 'chart-12', name: 'Weekly Progress Chart' }
    ]
    
    for (const chart of chartTests) {
      const startTime = Date.now()
      
      try {
        // Wait for chart to be visible
        await this.page.waitForSelector(`[data-testid="${chart.testId}"]`, { 
          visible: true, 
          timeout: 5000 
        })
        
        // Check for Recharts elements
        const hasRechartsContent = await this.page.evaluate((testId) => {
          const chartElement = document.querySelector(`[data-testid="${testId}"]`)
          if (!chartElement) return false
          
          return !!(
            chartElement.querySelector('svg') ||
            chartElement.querySelector('.recharts-wrapper') ||
            chartElement.querySelector('.chart-container')
          )
        }, chart.testId)
        
        const renderTime = Date.now() - startTime
        
        this.results.chartRendering[chart.testId] = {
          name: chart.name,
          renderTime,
          hasContent: hasRechartsContent,
          status: hasRechartsContent ? 'success' : 'no-content'
        }
        
        const statusColor = hasRechartsContent ? 'green' : 'yellow'
        log(`  ${chart.name}: ${renderTime}ms ${hasRechartsContent ? '✓' : '⚠️'}`, statusColor)
        
      } catch (error) {
        this.results.chartRendering[chart.testId] = {
          name: chart.name,
          renderTime: Date.now() - startTime,
          hasContent: false,
          status: 'error',
          error: error.message
        }
        
        log(`  ${chart.name}: Error - ${error.message}`, 'red')
      }
    }
  }

  async testMemoryUsage() {
    log('\n🧠 Testing memory usage...', 'yellow')
    
    // Get memory metrics
    const memoryMetrics = await this.page.metrics()
    
    // Force garbage collection if available
    if (this.page.coverage) {
      await this.page.evaluate(() => {
        if (window.gc) {
          window.gc()
        }
      })
    }
    
    this.results.memoryUsage = {
      jsHeapUsedSize: Math.round(memoryMetrics.JSHeapUsedSize / 1048576), // MB
      jsHeapTotalSize: Math.round(memoryMetrics.JSHeapTotalSize / 1048576), // MB
      domNodes: memoryMetrics.Nodes,
      domListeners: memoryMetrics.JSEventListeners
    }
    
    log(`  JS Heap Used: ${this.results.memoryUsage.jsHeapUsedSize}MB`, 'reset')
    log(`  JS Heap Total: ${this.results.memoryUsage.jsHeapTotalSize}MB`, 'reset')
    log(`  DOM Nodes: ${this.results.memoryUsage.domNodes}`, 'reset')
    log(`  Event Listeners: ${this.results.memoryUsage.domListeners}`, 'reset')
  }

  async testMobilePerformance() {
    log('\n📱 Testing mobile performance...', 'yellow')
    
    // Switch to mobile viewport
    await this.page.setViewport({ width: 375, height: 667 })
    
    const startTime = Date.now()
    await this.page.reload({ waitUntil: 'networkidle0' })
    const mobileLoadTime = Date.now() - startTime
    
    // Test chart visibility on mobile
    const chartsVisible = await this.page.evaluate(() => {
      const chartElements = document.querySelectorAll('[data-testid*="chart"]')
      return Array.from(chartElements).every(chart => {
        const rect = chart.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })
    })
    
    this.results.mobilePerformance = {
      loadTime: mobileLoadTime,
      chartsVisible,
      viewport: { width: 375, height: 667 }
    }
    
    log(`  Mobile load time: ${mobileLoadTime}ms`, mobileLoadTime < 2000 ? 'green' : 'red')
    log(`  Charts visible: ${chartsVisible ? '✓' : '✗'}`, chartsVisible ? 'green' : 'red')
  }

  async generateReport() {
    log('\n📋 Generating performance report...', 'blue')
    
    const report = {
      timestamp: new Date().toISOString(),
      testEnvironment: {
        baseUrl: this.baseUrl,
        viewport: { width: 1280, height: 720 }
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    }
    
    // Save detailed report
    fs.writeFileSync(
      'chart-performance-report.json', 
      JSON.stringify(report, null, 2)
    )
    
    // Print summary
    this.printSummary()
    
    return report
  }

  generateRecommendations() {
    const recommendations = []
    
    // Page load recommendations
    if (this.results.pageLoad.totalLoadTime > 1500) {
      recommendations.push('Page load time exceeds 1.5s target - consider further optimization')
    }
    
    // Chart rendering recommendations
    const chartRenderTimes = Object.values(this.results.chartRendering)
    const totalRenderTime = chartRenderTimes.reduce((sum, chart) => sum + chart.renderTime, 0)
    
    if (totalRenderTime > 100) {
      recommendations.push('Total chart rendering time exceeds 100ms - implement lazy loading')
    }
    
    // Memory usage recommendations
    if (this.results.memoryUsage.jsHeapUsedSize > 50) {
      recommendations.push('Memory usage is high - check for memory leaks')
    }
    
    // Mobile performance recommendations
    if (this.results.mobilePerformance?.loadTime > 2000) {
      recommendations.push('Mobile performance needs improvement - optimize for mobile')
    }
    
    return recommendations
  }

  printSummary() {
    log('\n📊 Performance Test Summary', 'blue')
    log('============================', 'blue')
    
    // Page Load Results
    log('\n🚀 Page Load Performance:', 'yellow')
    const loadTime = this.results.pageLoad.totalLoadTime
    log(`  Total Load Time: ${loadTime}ms ${loadTime < 1500 ? '✅' : '❌'}`, 'reset')
    
    // Chart Rendering Results
    log('\n🎯 Chart Rendering Performance:', 'yellow')
    let totalChartTime = 0
    let successfulCharts = 0
    
    Object.entries(this.results.chartRendering).forEach(([id, data]) => {
      totalChartTime += data.renderTime
      if (data.hasContent) successfulCharts++
      
      const status = data.hasContent ? '✅' : '❌'
      log(`  ${data.name}: ${data.renderTime}ms ${status}`, 'reset')
    })
    
    log(`  Total Chart Render Time: ${totalChartTime}ms ${totalChartTime < 100 ? '✅' : '❌'}`, 'reset')
    log(`  Charts Successfully Rendered: ${successfulCharts}/5 ${successfulCharts === 5 ? '✅' : '❌'}`, 'reset')
    
    // Memory Usage Results
    log('\n🧠 Memory Usage:', 'yellow')
    const memUsage = this.results.memoryUsage.jsHeapUsedSize
    log(`  JS Heap Used: ${memUsage}MB ${memUsage < 50 ? '✅' : '❌'}`, 'reset')
    
    // Overall Assessment
    log('\n🏆 Overall Performance Assessment:', 'blue')
    const passedTests = [
      loadTime < 1500,
      totalChartTime < 100,
      successfulCharts === 5,
      memUsage < 50
    ].filter(Boolean).length
    
    const grade = passedTests === 4 ? 'EXCELLENT' : 
                  passedTests === 3 ? 'GOOD' : 
                  passedTests === 2 ? 'FAIR' : 'NEEDS IMPROVEMENT'
    
    const gradeColor = passedTests >= 3 ? 'green' : passedTests >= 2 ? 'yellow' : 'red'
    log(`  Grade: ${grade} (${passedTests}/4 tests passed)`, gradeColor)
    
    log('\n📁 Detailed report saved to: chart-performance-report.json', 'blue')
  }

  async cleanup() {
    if (this.page) {
      await this.page.tracing.stop()
    }
    
    if (this.browser) {
      await this.browser.close()
    }
  }
}

async function runPerformanceTests() {
  const tester = new ChartPerformanceTester()
  
  try {
    await tester.initialize()
    await tester.testPageLoadPerformance()
    await tester.testChartRenderingPerformance()
    await tester.testMemoryUsage()
    await tester.testMobilePerformance()
    await tester.generateReport()
    
  } catch (error) {
    log(`❌ Performance testing failed: ${error.message}`, 'red')
    console.error(error)
  } finally {
    await tester.cleanup()
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2]
  
  if (command === 'help' || command === '--help' || command === '-h') {
    log('🧪 Chart Performance Testing Script', 'blue')
    log('\nUsage:')
    log('  node scripts/test-chart-performance.js        # Run performance tests')
    log('  node scripts/test-chart-performance.js help   # Show this help')
    log('\nPrerequisites:')
    log('  1. Start development server: npm run dev')
    log('  2. Navigate to analytics page once to authenticate')
    log('  3. Run this test script')
  } else {
    runPerformanceTests()
  }
}

module.exports = { ChartPerformanceTester }