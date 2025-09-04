#!/usr/bin/env node

/**
 * AXIS6 Performance Baseline Assessment
 * 
 * Comprehensive performance analysis across:
 * - Bundle size analysis
 * - Core Web Vitals simulation
 * - Network performance
 * - Memory usage estimation
 * - Mobile performance metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function header(message) {
  log(`\n${COLORS.bold}${COLORS.blue}🔍 ${message}${COLORS.reset}`);
  log('='.repeat(50), 'blue');
}

class PerformanceBaseline {
  constructor() {
    this.results = {
      bundleAnalysis: {},
      estimatedMetrics: {},
      optimizationOpportunities: [],
      recommendations: [],
      baseline: {}
    };
  }

  analyzeBundleSize() {
    header('Bundle Size Analysis');
    
    try {
      // Check if client stats exist
      const clientStatsPath = '.next/analyze/client-stats.json';
      if (!fs.existsSync(clientStatsPath)) {
        log('Bundle analysis not found. Running npm run analyze...', 'yellow');
        execSync('npm run analyze > /dev/null 2>&1', { cwd: process.cwd(), stdio: 'ignore' });
      }

      if (fs.existsSync(clientStatsPath)) {
        const stats = JSON.parse(fs.readFileSync(clientStatsPath, 'utf8'));
        
        // Calculate total bundle sizes
        const totalSize = stats.assets.reduce((total, asset) => total + asset.size, 0);
        const jsSize = stats.assets
          .filter(asset => asset.name.endsWith('.js'))
          .reduce((total, asset) => total + asset.size, 0);
        const cssSize = stats.assets
          .filter(asset => asset.name.endsWith('.css'))
          .reduce((total, asset) => total + asset.size, 0);

        // Analyze main chunks
        const mainChunk = stats.chunks.find(chunk => chunk.names.includes('main'));
        const mainAppChunk = stats.chunks.find(chunk => chunk.names.includes('main-app'));
        
        this.results.bundleAnalysis = {
          totalSize: this.formatBytes(totalSize),
          totalSizeBytes: totalSize,
          jsSize: this.formatBytes(jsSize),
          jsSizeBytes: jsSize,
          cssSize: this.formatBytes(cssSize),
          cssSizeBytes: cssSize,
          mainChunkSize: mainChunk ? this.formatBytes(mainChunk.size) : 'N/A',
          mainAppChunkSize: mainAppChunk ? this.formatBytes(mainAppChunk.size) : 'N/A',
          assetCount: stats.assets.length,
          chunkCount: stats.chunks.length
        };

        log(`Total Bundle Size: ${this.results.bundleAnalysis.totalSize}`, 
            totalSize > 1024 * 1024 ? 'red' : totalSize > 512 * 1024 ? 'yellow' : 'green');
        log(`JavaScript Size: ${this.results.bundleAnalysis.jsSize}`, 
            jsSize > 512 * 1024 ? 'red' : jsSize > 256 * 1024 ? 'yellow' : 'green');
        log(`CSS Size: ${this.results.bundleAnalysis.cssSize}`, 'green');
        log(`Main Chunk: ${this.results.bundleAnalysis.mainChunkSize}`, 'cyan');
        log(`App Chunk: ${this.results.bundleAnalysis.mainAppChunkSize}`, 'cyan');
        log(`Total Assets: ${this.results.bundleAnalysis.assetCount}`, 'blue');
        log(`Total Chunks: ${this.results.bundleAnalysis.chunkCount}`, 'blue');

        // Bundle size recommendations
        if (totalSize > 1024 * 1024) {
          this.results.optimizationOpportunities.push({
            category: 'Bundle Size',
            priority: 'High',
            issue: 'Bundle size exceeds 1MB',
            recommendation: 'Implement code splitting and dynamic imports'
          });
        }

        if (jsSize > 512 * 1024) {
          this.results.optimizationOpportunities.push({
            category: 'JavaScript',
            priority: 'Medium',
            issue: 'JavaScript bundle exceeds 512KB',
            recommendation: 'Optimize third-party libraries and implement tree shaking'
          });
        }

      } else {
        log('❌ Bundle analysis failed to generate stats', 'red');
      }
    } catch (error) {
      log(`❌ Bundle analysis error: ${error.message}`, 'red');
    }
  }

  estimatePerformanceMetrics() {
    header('Estimated Performance Metrics');
    
    // Based on bundle size and typical performance characteristics
    const { jsSizeBytes = 0, cssSizeBytes = 0, totalSizeBytes = 0 } = this.results.bundleAnalysis;
    
    // Estimated metrics based on bundle size and network conditions
    const estimatedMetrics = {
      // Time to First Byte (server processing + network latency)
      ttfb: {
        fast3g: 400,      // Good server with 3G
        slow3g: 800,      // Good server with slow 3G
        wifi: 200,        // Good server with WiFi
        optimal: 100      // Optimal conditions
      },
      // First Contentful Paint (TTFB + HTML parse + critical CSS)
      fcp: {
        fast3g: Math.max(1000, 400 + (cssSizeBytes / 1024 / 5)), // ~5KB/s CSS loading on 3G
        slow3g: Math.max(2000, 800 + (cssSizeBytes / 1024 / 2)), // ~2KB/s CSS loading on slow 3G
        wifi: Math.max(600, 200 + (cssSizeBytes / 1024 / 50)),     // ~50KB/s CSS loading on WiFi
        optimal: Math.max(400, 100 + (cssSizeBytes / 1024 / 100))  // ~100KB/s optimal
      },
      // Largest Contentful Paint (FCP + main content load)
      lcp: {
        fast3g: Math.max(2500, 1000 + (jsSizeBytes / 1024 / 10)), // ~10KB/s JS loading on 3G
        slow3g: Math.max(4000, 2000 + (jsSizeBytes / 1024 / 5)),  // ~5KB/s JS loading on slow 3G
        wifi: Math.max(1200, 600 + (jsSizeBytes / 1024 / 100)),    // ~100KB/s JS loading on WiFi
        optimal: Math.max(800, 400 + (jsSizeBytes / 1024 / 200))   // ~200KB/s optimal
      }
    };

    // Cumulative Layout Shift - estimate based on component complexity
    const estimatedCLS = jsSizeBytes > 512 * 1024 ? 0.15 : jsSizeBytes > 256 * 1024 ? 0.1 : 0.05;

    this.results.estimatedMetrics = {
      ...estimatedMetrics,
      cls: estimatedCLS,
      totalBlockingTime: Math.max(100, jsSizeBytes / 1024 / 10), // Estimate TBT
      speedIndex: estimatedMetrics.fcp.wifi + 300 // Rough Speed Index estimate
    };

    log('Estimated Core Web Vitals:', 'bold');
    log(`  LCP (WiFi): ${Math.round(estimatedMetrics.lcp.wifi)}ms ${this.getVitalScore('lcp', estimatedMetrics.lcp.wifi)}`, 'cyan');
    log(`  LCP (3G): ${Math.round(estimatedMetrics.lcp.fast3g)}ms ${this.getVitalScore('lcp', estimatedMetrics.lcp.fast3g)}`, 'cyan');
    log(`  FCP (WiFi): ${Math.round(estimatedMetrics.fcp.wifi)}ms ${this.getVitalScore('fcp', estimatedMetrics.fcp.wifi)}`, 'cyan');
    log(`  FCP (3G): ${Math.round(estimatedMetrics.fcp.fast3g)}ms ${this.getVitalScore('fcp', estimatedMetrics.fcp.fast3g)}`, 'cyan');
    log(`  Estimated CLS: ${estimatedCLS} ${this.getVitalScore('cls', estimatedCLS)}`, 'cyan');
    log(`  Total Blocking Time: ${Math.round(this.results.estimatedMetrics.totalBlockingTime)}ms`, 'cyan');

    // Performance recommendations based on estimates
    if (estimatedMetrics.lcp.wifi > 2500) {
      this.results.optimizationOpportunities.push({
        category: 'Core Web Vitals',
        priority: 'Critical',
        issue: `Estimated LCP ${Math.round(estimatedMetrics.lcp.wifi)}ms exceeds 2.5s threshold`,
        recommendation: 'Optimize critical path, reduce bundle size, implement lazy loading'
      });
    }

    if (estimatedMetrics.fcp.wifi > 1800) {
      this.results.optimizationOpportunities.push({
        category: 'Core Web Vitals',
        priority: 'High',
        issue: `Estimated FCP ${Math.round(estimatedMetrics.fcp.wifi)}ms exceeds 1.8s threshold`,
        recommendation: 'Optimize critical CSS, reduce render-blocking resources'
      });
    }
  }

  analyzeNetworkRequests() {
    header('Network Performance Analysis');
    
    try {
      // Analyze the bundle structure for network optimization
      const packageJsonPath = 'package.json';
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = Object.keys(packageJson.dependencies || {});
        const devDependencies = Object.keys(packageJson.devDependencies || {});
        
        // Identify heavy dependencies
        const heavyDependencies = dependencies.filter(dep => {
          return dep.includes('recharts') || 
                 dep.includes('framer-motion') ||
                 dep.includes('@radix-ui') ||
                 dep.includes('supabase') ||
                 dep.includes('react-query');
        });

        this.results.networkAnalysis = {
          totalDependencies: dependencies.length,
          devDependencies: devDependencies.length,
          heavyDependencies,
          estimatedRequests: Math.ceil(dependencies.length / 10) + 5 // Rough estimate
        };

        log(`Total Dependencies: ${dependencies.length}`, 
            dependencies.length > 50 ? 'red' : dependencies.length > 30 ? 'yellow' : 'green');
        log(`Heavy Dependencies: ${heavyDependencies.join(', ')}`, 'yellow');
        log(`Estimated HTTP Requests: ~${this.results.networkAnalysis.estimatedRequests}`, 'cyan');

        if (dependencies.length > 50) {
          this.results.optimizationOpportunities.push({
            category: 'Dependencies',
            priority: 'Medium',
            issue: 'High number of dependencies may impact bundle size',
            recommendation: 'Audit and remove unused dependencies, consider lighter alternatives'
          });
        }
      }
    } catch (error) {
      log(`❌ Network analysis error: ${error.message}`, 'red');
    }
  }

  analyzeMobilePerformance() {
    header('Mobile Performance Assessment');
    
    const { jsSizeBytes = 0, totalSizeBytes = 0 } = this.results.bundleAnalysis;
    
    // Mobile-specific performance estimates (slower CPU, network)
    const mobileMetrics = {
      // Mobile devices have ~4x slower JS parsing
      jsParseTime: (jsSizeBytes / 1024) * 4, // ~4ms per KB on mobile
      // Mobile LCP typically 1.5x slower than desktop
      mobileLCP: (this.results.estimatedMetrics?.lcp?.wifi || 2000) * 1.5,
      // Memory pressure on mobile
      estimatedMemoryUsage: Math.max(20, totalSizeBytes / 1024 / 50), // Rough MB estimate
      // Touch target compliance
      touchTargetsScore: 85 // Estimated based on typical mobile optimization
    };

    this.results.mobileMetrics = mobileMetrics;

    log(`JS Parse Time (Mobile): ${Math.round(mobileMetrics.jsParseTime)}ms`, 
        mobileMetrics.jsParseTime > 1000 ? 'red' : mobileMetrics.jsParseTime > 500 ? 'yellow' : 'green');
    log(`Mobile LCP Estimate: ${Math.round(mobileMetrics.mobileLCP)}ms`, 
        mobileMetrics.mobileLCP > 4000 ? 'red' : mobileMetrics.mobileLCP > 2500 ? 'yellow' : 'green');
    log(`Estimated Memory Usage: ${Math.round(mobileMetrics.estimatedMemoryUsage)}MB`, 
        mobileMetrics.estimatedMemoryUsage > 50 ? 'red' : mobileMetrics.estimatedMemoryUsage > 25 ? 'yellow' : 'green');
    log(`Touch Targets Score: ${mobileMetrics.touchTargetsScore}/100`, 'cyan');

    if (mobileMetrics.jsParseTime > 1000) {
      this.results.optimizationOpportunities.push({
        category: 'Mobile Performance',
        priority: 'High',
        issue: 'High JavaScript parse time on mobile devices',
        recommendation: 'Reduce bundle size, implement code splitting, use service workers'
      });
    }

    if (mobileMetrics.mobileLCP > 4000) {
      this.results.optimizationOpportunities.push({
        category: 'Mobile Performance',
        priority: 'Critical',
        issue: 'Poor mobile LCP performance',
        recommendation: 'Implement mobile-first optimization, reduce critical path'
      });
    }
  }

  generateRecommendations() {
    header('Performance Optimization Recommendations');
    
    // Prioritize recommendations
    const critical = this.results.optimizationOpportunities.filter(op => op.priority === 'Critical');
    const high = this.results.optimizationOpportunities.filter(op => op.priority === 'High');
    const medium = this.results.optimizationOpportunities.filter(op => op.priority === 'Medium');

    log(`🚨 Critical Issues (${critical.length}):`, 'red');
    critical.forEach((issue, index) => {
      log(`  ${index + 1}. [${issue.category}] ${issue.issue}`, 'red');
      log(`     💡 ${issue.recommendation}`, 'yellow');
    });

    log(`\n⚠️  High Priority (${high.length}):`, 'yellow');
    high.forEach((issue, index) => {
      log(`  ${index + 1}. [${issue.category}] ${issue.issue}`, 'yellow');
      log(`     💡 ${issue.recommendation}`, 'cyan');
    });

    log(`\n📋 Medium Priority (${medium.length}):`, 'cyan');
    medium.forEach((issue, index) => {
      log(`  ${index + 1}. [${issue.category}] ${issue.issue}`, 'cyan');
      log(`     💡 ${issue.recommendation}`, 'blue');
    });

    // Generate comprehensive recommendations
    this.results.recommendations = [
      {
        category: 'Immediate Actions',
        items: [
          'Run database performance test with user authentication',
          'Implement lazy loading for heavy components (charts, modals)',
          'Optimize bundle size with code splitting',
          'Add performance monitoring with real user data'
        ]
      },
      {
        category: 'Short-term (1-2 weeks)',
        items: [
          'Implement service worker for caching',
          'Optimize critical CSS path',
          'Add image optimization and lazy loading',
          'Setup Core Web Vitals monitoring'
        ]
      },
      {
        category: 'Long-term (1+ months)',
        items: [
          'Implement micro-frontends for large features',
          'Add performance budget enforcement in CI/CD',
          'Optimize database queries with monitoring',
          'Implement advanced caching strategies'
        ]
      }
    ];
  }

  generateReport() {
    header('Performance Baseline Report');
    
    const report = {
      timestamp: new Date().toISOString(),
      testEnvironment: 'Local Development',
      bundleAnalysis: this.results.bundleAnalysis,
      estimatedMetrics: this.results.estimatedMetrics,
      mobileMetrics: this.results.mobileMetrics,
      networkAnalysis: this.results.networkAnalysis,
      optimizationOpportunities: this.results.optimizationOpportunities,
      recommendations: this.results.recommendations,
      performanceScore: this.calculateOverallScore()
    };

    // Save detailed report
    fs.writeFileSync(
      'performance-baseline-report.json',
      JSON.stringify(report, null, 2)
    );

    log(`\n📊 Overall Performance Score: ${report.performanceScore.score}/100`, 
        report.performanceScore.score >= 80 ? 'green' : 
        report.performanceScore.score >= 60 ? 'yellow' : 'red');
    log(`Grade: ${report.performanceScore.grade}`, 'bold');
    
    log(`\n📁 Detailed report saved to: performance-baseline-report.json`, 'blue');
    log(`📁 Bundle analysis available at: .next/analyze/client.html`, 'blue');
    
    return report;
  }

  calculateOverallScore() {
    let score = 100;
    const { totalSizeBytes = 0, jsSizeBytes = 0 } = this.results.bundleAnalysis;
    const { mobileLCP = 0, jsParseTime = 0 } = this.results.mobileMetrics || {};

    // Bundle size scoring (30% weight)
    if (totalSizeBytes > 1024 * 1024) score -= 20; // >1MB
    else if (totalSizeBytes > 512 * 1024) score -= 10; // >512KB

    if (jsSizeBytes > 512 * 1024) score -= 15; // >512KB JS
    else if (jsSizeBytes > 256 * 1024) score -= 8; // >256KB JS

    // Performance metrics scoring (40% weight)
    if (mobileLCP > 4000) score -= 25;
    else if (mobileLCP > 2500) score -= 15;

    if (jsParseTime > 1000) score -= 20;
    else if (jsParseTime > 500) score -= 10;

    // Optimization opportunities scoring (30% weight)
    const criticalIssues = this.results.optimizationOpportunities.filter(op => op.priority === 'Critical').length;
    const highIssues = this.results.optimizationOpportunities.filter(op => op.priority === 'High').length;
    
    score -= (criticalIssues * 15) + (highIssues * 8);

    score = Math.max(0, Math.min(100, score));

    const grade = score >= 90 ? 'A' : 
                  score >= 80 ? 'B' : 
                  score >= 70 ? 'C' : 
                  score >= 60 ? 'D' : 'F';

    return { score: Math.round(score), grade };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getVitalScore(metric, value) {
    switch (metric) {
      case 'lcp':
        return value <= 2500 ? '✅' : value <= 4000 ? '⚠️' : '❌';
      case 'fcp':
        return value <= 1800 ? '✅' : value <= 3000 ? '⚠️' : '❌';
      case 'cls':
        return value <= 0.1 ? '✅' : value <= 0.25 ? '⚠️' : '❌';
      default:
        return '📊';
    }
  }
}

async function runPerformanceBaseline() {
  const baseline = new PerformanceBaseline();

  log(`${COLORS.bold}${COLORS.blue}🚀 AXIS6 Performance Baseline Assessment${COLORS.reset}`, 'blue');
  log(`${COLORS.blue}${'='.repeat(60)}${COLORS.reset}`, 'blue');

  try {
    baseline.analyzeBundleSize();
    baseline.estimatePerformanceMetrics();
    baseline.analyzeNetworkRequests();
    baseline.analyzeMobilePerformance();
    baseline.generateRecommendations();
    const report = baseline.generateReport();

    log(`\n${COLORS.green}✅ Performance baseline assessment completed!${COLORS.reset}`, 'green');
    log(`${COLORS.cyan}🎯 Next steps: Run authenticated performance tests with real user data${COLORS.reset}`, 'cyan');

    return report;
  } catch (error) {
    log(`❌ Performance baseline assessment failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runPerformanceBaseline();
}

module.exports = { PerformanceBaseline, runPerformanceBaseline };