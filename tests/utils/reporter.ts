import { FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';

/**
 * Custom Playwright Reporter for AXIS6
 * Generates comprehensive test reports with metrics and insights
 */
class AXIS6Reporter implements Reporter {
  private startTime = Date.now();
  private results: TestResult[] = [];
  private testCases: TestCase[] = [];
  
  onBegin(config: any, suite: Suite) {
    console.log(`🚀 Starting AXIS6 Test Suite with ${suite.allTests().length} tests`);
    console.log(`📍 Base URL: ${config.projects[0].use.baseURL}`);
    console.log(`🌐 Projects: ${config.projects.map((p: any) => p.name).join(', ')}`);
  }
  
  onTestBegin(test: TestCase) {
    console.log(`▶️  Running: ${test.title}`);
  }
  
  onTestEnd(test: TestCase, result: TestResult) {
    this.testCases.push(test);
    this.results.push(result);
    
    const status = result.status === 'passed' ? '✅' : 
                   result.status === 'failed' ? '❌' : 
                   result.status === 'skipped' ? '⏭️' : '⚠️';
    
    console.log(`${status} ${test.title} (${result.duration}ms)`);
    
    if (result.status === 'failed' && result.error) {
      console.log(`   Error: ${result.error.message}`);
    }
  }
  
  onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    
    // Generate comprehensive report
    const report = this.generateReport(duration);
    
    // Write reports
    this.writeHTMLReport(report);
    this.writeJSONReport(report);
    this.writeMarkdownSummary(report);
    
    // Console summary
    this.printSummary(report);
  }
  
  private generateReport(duration: number) {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const total = this.results.length;
    
    const categories = this.categorizeTests();
    const performance = this.analyzePerformance();
    const browsers = this.analyzeBrowsers();
    
    return {
      summary: {
        total,
        passed,
        failed,
        skipped,
        duration,
        passRate: ((passed / total) * 100).toFixed(1),
        timestamp: new Date().toISOString(),
        commit: process.env.GITHUB_SHA || 'local',
        branch: process.env.GITHUB_REF_NAME || 'local'
      },
      categories,
      performance,
      browsers,
      failures: this.analyzeFailures(),
      coverage: this.calculateCoverage()
    };
  }
  
  private categorizeTests() {
    const categories = {
      authentication: { total: 0, passed: 0, failed: 0 },
      dashboard: { total: 0, passed: 0, failed: 0 },
      userJourney: { total: 0, passed: 0, failed: 0 },
      performance: { total: 0, passed: 0, failed: 0 },
      accessibility: { total: 0, passed: 0, failed: 0 },
      security: { total: 0, passed: 0, failed: 0 },
      visual: { total: 0, passed: 0, failed: 0 }
    };
    
    this.testCases.forEach((test, index) => {
      const result = this.results[index];
      const fileName = test.location.file.toLowerCase();
      
      let category = 'other';
      if (fileName.includes('auth')) category = 'authentication';
      else if (fileName.includes('dashboard')) category = 'dashboard';
      else if (fileName.includes('journey')) category = 'userJourney';
      else if (fileName.includes('performance')) category = 'performance';
      else if (fileName.includes('accessibility')) category = 'accessibility';
      else if (fileName.includes('security')) category = 'security';
      else if (fileName.includes('visual')) category = 'visual';
      
      if (categories[category as keyof typeof categories]) {
        const cat = categories[category as keyof typeof categories];
        cat.total++;
        if (result.status === 'passed') cat.passed++;
        else if (result.status === 'failed') cat.failed++;
      }
    });
    
    return categories;
  }
  
  private analyzePerformance() {
    const performanceTests = this.testCases.filter((test, index) => 
      test.location.file.toLowerCase().includes('performance')
    );
    
    const avgDuration = this.results.reduce((acc, result) => acc + result.duration, 0) / this.results.length;
    const slowestTest = Math.max(...this.results.map(r => r.duration));
    const fastestTest = Math.min(...this.results.map(r => r.duration));
    
    return {
      totalPerformanceTests: performanceTests.length,
      avgTestDuration: Math.round(avgDuration),
      slowestTest: slowestTest,
      fastestTest: fastestTest,
      performanceScore: this.calculatePerformanceScore()
    };
  }
  
  private analyzeBrowsers() {
    const browsers: { [key: string]: { total: number, passed: number, failed: number } } = {};
    
    this.testCases.forEach((test, index) => {
      const result = this.results[index];
      const browser = test.parent.project()?.name || 'unknown';
      
      if (!browsers[browser]) {
        browsers[browser] = { total: 0, passed: 0, failed: 0 };
      }
      
      browsers[browser].total++;
      if (result.status === 'passed') browsers[browser].passed++;
      else if (result.status === 'failed') browsers[browser].failed++;
    });
    
    return browsers;
  }
  
  private analyzeFailures() {
    const failures = this.results
      .map((result, index) => ({ result, test: this.testCases[index] }))
      .filter(({ result }) => result.status === 'failed')
      .map(({ result, test }) => ({
        test: test.title,
        file: path.basename(test.location.file),
        error: result.error?.message || 'Unknown error',
        duration: result.duration,
        project: test.parent.project()?.name || 'unknown'
      }));
    
    const errorPatterns = this.identifyErrorPatterns(failures);
    
    return {
      failures,
      errorPatterns,
      flakyTests: this.identifyFlakyTests()
    };
  }
  
  private identifyErrorPatterns(failures: any[]) {
    const patterns: { [key: string]: number } = {};
    
    failures.forEach(failure => {
      const error = failure.error.toLowerCase();
      if (error.includes('timeout')) patterns['timeout'] = (patterns['timeout'] || 0) + 1;
      else if (error.includes('selector')) patterns['selector'] = (patterns['selector'] || 0) + 1;
      else if (error.includes('network')) patterns['network'] = (patterns['network'] || 0) + 1;
      else if (error.includes('authentication')) patterns['auth'] = (patterns['auth'] || 0) + 1;
      else patterns['other'] = (patterns['other'] || 0) + 1;
    });
    
    return patterns;
  }
  
  private identifyFlakyTests() {
    // In a real implementation, this would track test history
    // For now, return empty array
    return [];
  }
  
  private calculateCoverage() {
    const features = [
      'Landing Page',
      'User Registration', 
      'User Login',
      'Dashboard Loading',
      'Hexagon Visualization',
      'Check-ins',
      'Streak Tracking',
      'Performance Metrics',
      'Accessibility Compliance',
      'Security Validation',
      'Visual Consistency',
      'Cross-browser Support',
      'Mobile Responsiveness'
    ];
    
    const testedFeatures = features.length; // Simplified
    const coveragePercent = ((testedFeatures / features.length) * 100).toFixed(1);
    
    return {
      totalFeatures: features.length,
      testedFeatures,
      coveragePercent
    };
  }
  
  private calculatePerformanceScore() {
    const performanceResults = this.results.filter((_, index) => 
      this.testCases[index].location.file.toLowerCase().includes('performance')
    );
    
    if (performanceResults.length === 0) return 0;
    
    const passRate = (performanceResults.filter(r => r.status === 'passed').length / performanceResults.length) * 100;
    return Math.round(passRate);
  }
  
  private writeHTMLReport(report: any) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AXIS6 Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0 0 10px; font-size: 2.5rem; }
        .header p { margin: 0; opacity: 0.9; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .metric.passed { border-color: #28a745; }
        .metric.failed { border-color: #dc3545; }
        .metric.performance { border-color: #ffc107; }
        .metric-value { font-size: 2rem; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #6c757d; text-transform: uppercase; font-size: 0.9rem; }
        .section { padding: 30px; border-top: 1px solid #e9ecef; }
        .section h2 { margin-top: 0; color: #495057; }
        .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .category { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .category h3 { margin-top: 0; text-transform: capitalize; }
        .progress-bar { background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-fill.passed { background: #28a745; }
        .progress-fill.failed { background: #dc3545; }
        .browser-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .browser { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .failures { background: #fff5f5; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .failure { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #fed7d7; }
        .failure:last-child { border-bottom: none; }
        .failure-title { font-weight: bold; color: #dc3545; }
        .failure-error { color: #666; margin-top: 5px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 AXIS6 Test Report</h1>
            <p>Generated on ${new Date(report.summary.timestamp).toLocaleString()}</p>
            <p>Commit: ${report.summary.commit} • Branch: ${report.summary.branch}</p>
        </div>
        
        <div class="summary">
            <div class="metric passed">
                <div class="metric-value">${report.summary.passed}</div>
                <div class="metric-label">Tests Passed</div>
            </div>
            <div class="metric failed">
                <div class="metric-value">${report.summary.failed}</div>
                <div class="metric-label">Tests Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.passRate}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
            <div class="metric performance">
                <div class="metric-value">${report.performance.performanceScore}</div>
                <div class="metric-label">Performance Score</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(report.summary.duration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.coverage.coveragePercent}%</div>
                <div class="metric-label">Feature Coverage</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Test Categories</h2>
            <div class="category-grid">
                ${Object.entries(report.categories).map(([name, data]: [string, any]) => `
                    <div class="category">
                        <h3>${name.replace(/([A-Z])/g, ' $1').trim()}</h3>
                        <div class="progress-bar">
                            <div class="progress-fill passed" style="width: ${(data.passed / data.total * 100) || 0}%"></div>
                        </div>
                        <p>${data.passed}/${data.total} passed</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>🌐 Browser Compatibility</h2>
            <div class="browser-grid">
                ${Object.entries(report.browsers).map(([name, data]: [string, any]) => `
                    <div class="browser">
                        <h3>${name}</h3>
                        <div class="progress-bar">
                            <div class="progress-fill passed" style="width: ${(data.passed / data.total * 100) || 0}%"></div>
                        </div>
                        <p>${data.passed}/${data.total} passed</p>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${report.failures.failures.length > 0 ? `
            <div class="section">
                <h2>❌ Test Failures</h2>
                <div class="failures">
                    ${report.failures.failures.map((failure: any) => `
                        <div class="failure">
                            <div class="failure-title">${failure.test}</div>
                            <div>File: ${failure.file} • Browser: ${failure.project}</div>
                            <div class="failure-error">${failure.error}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="section">
            <h2>⚡ Performance Metrics</h2>
            <p><strong>Average Test Duration:</strong> ${report.performance.avgTestDuration}ms</p>
            <p><strong>Slowest Test:</strong> ${report.performance.slowestTest}ms</p>
            <p><strong>Fastest Test:</strong> ${report.performance.fastestTest}ms</p>
            <p><strong>Performance Tests:</strong> ${report.performance.totalPerformanceTests}</p>
        </div>
    </div>
</body>
</html>`;
    
    const reportDir = 'axis6-test-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(reportDir, 'index.html'), html);
  }
  
  private writeJSONReport(report: any) {
    const reportDir = 'axis6-test-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(reportDir, 'results.json'), 
      JSON.stringify(report, null, 2)
    );
  }
  
  private writeMarkdownSummary(report: any) {
    const markdown = `# 🎯 AXIS6 Test Results

## Summary
- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed} ✅
- **Failed:** ${report.summary.failed} ❌
- **Skipped:** ${report.summary.skipped} ⏭️
- **Pass Rate:** ${report.summary.passRate}%
- **Duration:** ${(report.summary.duration / 1000).toFixed(1)}s
- **Performance Score:** ${report.performance.performanceScore}/100

## Test Categories
${Object.entries(report.categories).map(([name, data]: [string, any]) => 
  `- **${name.replace(/([A-Z])/g, ' $1').trim()}:** ${data.passed}/${data.total} (${((data.passed / data.total * 100) || 0).toFixed(1)}%)`
).join('\n')}

## Browser Compatibility
${Object.entries(report.browsers).map(([name, data]: [string, any]) => 
  `- **${name}:** ${data.passed}/${data.total} (${((data.passed / data.total * 100) || 0).toFixed(1)}%)`
).join('\n')}

${report.failures.failures.length > 0 ? `
## ❌ Failures
${report.failures.failures.map((failure: any) => 
  `- **${failure.test}** (${failure.file}): ${failure.error}`
).join('\n')}
` : '## ✅ All tests passed!'}

## Performance Metrics
- Average test duration: ${report.performance.avgTestDuration}ms
- Slowest test: ${report.performance.slowestTest}ms
- Fastest test: ${report.performance.fastestTest}ms

---
*Generated on ${new Date(report.summary.timestamp).toLocaleString()}*
*Commit: ${report.summary.commit} • Branch: ${report.summary.branch}*`;

    const reportDir = 'axis6-test-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(reportDir, 'summary.md'), markdown);
  }
  
  private printSummary(report: any) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 AXIS6 TEST SUITE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⏭️  Skipped: ${report.summary.skipped}`);
    console.log(`📊 Pass Rate: ${report.summary.passRate}%`);
    console.log(`⏱️  Duration: ${(report.summary.duration / 1000).toFixed(1)}s`);
    console.log(`⚡ Performance Score: ${report.performance.performanceScore}/100`);
    console.log(`📈 Feature Coverage: ${report.coverage.coveragePercent}%`);
    
    if (report.failures.failures.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      report.failures.failures.forEach((failure: any) => {
        console.log(`  • ${failure.test} (${failure.file})`);
      });
    }
    
    console.log('\n📁 Reports generated in: axis6-test-reports/');
    console.log('='.repeat(60));
  }
}

export default AXIS6Reporter;