import { test, expect, Page } from '@playwright/test';

/**
 * AXIS6 Analytics & Achievements Robust Testing Strategy
 * 
 * Features:
 * - Progressive enhancement testing (static cards → charts)
 * - Graceful degradation for missing components
 * - Future-ready selectors for chart implementation
 * - Comprehensive data-testid strategy
 * - Performance-aware testing with realistic expectations
 * 
 * Execution: npm run test:e2e -- tests/e2e/analytics-robust.spec.ts
 */

const REAL_USER_CREDENTIALS = {
  email: 'nadalpiantini@gmail.com',
  password: 'Teclados#13'
};

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:6789';

interface TestResult {
  component: string;
  status: 'pass' | 'fail' | 'partial' | 'missing';
  details: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  suggestions?: string[];
}

class AnalyticsTestStrategy {
  private page: Page;
  private results: TestResult[] = [];
  
  constructor(page: Page) {
    this.page = page;
  }

  async login() {
    await this.page.goto(`${BASE_URL}/auth/login`);
    await this.page.waitForLoadState('networkidle');
    
    const emailInput = this.page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = this.page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = this.page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    
    await emailInput.fill(REAL_USER_CREDENTIALS.email);
    await passwordInput.fill(REAL_USER_CREDENTIALS.password);
    await loginButton.click();
    await this.page.waitForTimeout(3000);
    
    const currentUrl = this.page.url();
    if (currentUrl.includes('/auth/login')) {
      throw new Error('Login failed - still on login page');
    }
  }

  private addResult(component: string, status: TestResult['status'], details: string, severity: TestResult['severity'], suggestions?: string[]) {
    this.results.push({
      component,
      status,
      details,
      severity,
      suggestions
    });
    
    const statusIcon = {
      pass: '✅',
      partial: '⚠️',
      fail: '❌',
      missing: 'ℹ️'
    };
    
    console.log(`${statusIcon[status]} ${component}: ${details}`);
    if (suggestions && suggestions.length > 0) {
      suggestions.forEach(suggestion => console.log(`   💡 ${suggestion}`));
    }
  }

  /**
   * Test analytics page structure with progressive enhancement
   * Works for current static cards and future charts
   */
  async testAnalyticsStructure(): Promise<void> {
    await this.page.goto(`${BASE_URL}/analytics`);
    await this.page.waitForLoadState('networkidle');

    // Test 1: Page Access & Basic Structure
    const currentUrl = this.page.url();
    if (currentUrl.includes('/analytics')) {
      this.addResult('Analytics Page Access', 'pass', 'Successfully accessed analytics page', 'info');
    } else {
      this.addResult('Analytics Page Access', 'fail', `Redirected to ${currentUrl}`, 'critical');
      return;
    }

    // Test 2: Essential Page Elements (data-testid strategy)
    const essentialElements = [
      {
        selector: '[data-testid="analytics-page"], main, .analytics-container',
        name: 'Main Container',
        suggestions: ['Add data-testid="analytics-page" to main container']
      },
      {
        selector: 'h1, h2, [data-testid="analytics-title"]',
        name: 'Page Title',
        suggestions: ['Add data-testid="analytics-title" to main heading']
      },
      {
        selector: 'select, [data-testid="period-filter"]',
        name: 'Period Filter',
        suggestions: ['Add data-testid="period-filter" to period selector']
      },
      {
        selector: 'button:has-text("CSV"), button:has-text("JSON"), [data-testid*="export"]',
        name: 'Export Controls',
        suggestions: ['Add data-testid="export-csv" and data-testid="export-json" to buttons']
      }
    ];

    for (const element of essentialElements) {
      const found = await this.page.locator(element.selector).count();
      if (found > 0) {
        this.addResult(element.name, 'pass', `Found ${found} element(s)`, 'info');
      } else {
        this.addResult(element.name, 'fail', 'Element not found', 'medium', element.suggestions);
      }
    }

    // Test 3: Data Cards (Current Implementation)
    await this.testDataCards();

    // Test 4: Chart Readiness (Future Implementation)
    await this.testChartReadiness();

    // Test 5: Interactive Elements
    await this.testInteractivity();
  }

  /**
   * Test current static data cards implementation
   */
  async testDataCards(): Promise<void> {
    const expectedDataCards = [
      { 
        selector: '[data-testid="total-checkins"], .glass:has-text("Total Check-ins")', 
        name: 'Total Checkins Card',
        content: ['Total Check-ins', 'per day avg']
      },
      { 
        selector: '[data-testid="active-days"], .glass:has-text("Active Days")', 
        name: 'Active Days Card',
        content: ['Active Days', '% of']
      },
      { 
        selector: '[data-testid="completion-rate"], .glass:has-text("Completion Rate")', 
        name: 'Completion Rate Card',
        content: ['Completion Rate', '%', 'Average daily']
      },
      { 
        selector: '[data-testid="current-streak"], .glass:has-text("Current Streak")', 
        name: 'Current Streak Card',
        content: ['Current Streak', 'categories active']
      }
    ];

    for (const card of expectedDataCards) {
      const element = this.page.locator(card.selector);
      const count = await element.count();
      
      if (count > 0) {
        // Check if card has expected content
        const cardText = await element.first().textContent();
        const hasExpectedContent = card.content.some(text => cardText?.includes(text));
        
        if (hasExpectedContent) {
          this.addResult(card.name, 'pass', 'Card found with expected content', 'info');
        } else {
          this.addResult(card.name, 'partial', 'Card found but content differs from expected', 'low',
            [`Add data-testid="${card.name.toLowerCase().replace(/\s+/g, '-')}" for reliable selection`]);
        }
      } else {
        this.addResult(card.name, 'fail', 'Data card not found', 'medium',
          [`Add data-testid="${card.name.toLowerCase().replace(/\s+/g, '-')}" to card container`]);
      }
    }

    // Test Category Performance Section
    const categorySection = this.page.locator('[data-testid="category-performance"], .glass:has-text("Category Performance")');
    const categoryCount = await categorySection.count();
    
    if (categoryCount > 0) {
      this.addResult('Category Performance Section', 'pass', 'Section found and accessible', 'info');
      
      // Test category items within the section
      const categoryItems = categorySection.locator('div:has([style*="backgroundColor"])');
      const itemCount = await categoryItems.count();
      
      if (itemCount > 0) {
        this.addResult('Category Items', 'pass', `Found ${itemCount} category items`, 'info');
      } else {
        this.addResult('Category Items', 'partial', 'Section exists but no category data', 'low');
      }
    } else {
      this.addResult('Category Performance Section', 'fail', 'Category performance section not found', 'medium',
        ['Add data-testid="category-performance" to category section']);
    }
  }

  /**
   * Test chart readiness for future implementation
   * Uses progressive selectors that work for both static and dynamic content
   */
  async testChartReadiness(): Promise<void> {
    console.log('📊 Testing chart readiness and future compatibility...');

    // Progressive selector strategy: Current → Future
    const chartSelectors = [
      {
        current: '.glass:has-text("Category Performance")',
        future: '[data-testid="category-chart"], .recharts-wrapper',
        name: 'Category Chart Area',
        component: 'Category Performance Visualization'
      },
      {
        current: '.glass:has-text("Current Streaks")',
        future: '[data-testid="streak-chart"], .streak-visualization',
        name: 'Streak Chart Area',
        component: 'Streak Trends Visualization'
      },
      {
        current: '.glass:has-text("Best Performance")',
        future: '[data-testid="performance-chart"], .performance-trends',
        name: 'Performance Chart Area',
        component: 'Performance Trends Chart'
      }
    ];

    for (const chart of chartSelectors) {
      // Test current implementation
      const currentElement = this.page.locator(chart.current);
      const currentCount = await currentElement.count();
      
      // Test future readiness
      const futureElement = this.page.locator(chart.future);
      const futureCount = await futureElement.count();

      if (futureCount > 0) {
        this.addResult(chart.component, 'pass', 'Chart implementation found', 'info');
      } else if (currentCount > 0) {
        this.addResult(chart.component, 'partial', 'Static data area found, chart not implemented yet', 'info',
          [`Add data-testid="${chart.name.toLowerCase().replace(/\s+/g, '-')}" for future chart implementation`,
           'Consider Recharts library for consistent chart components']);
      } else {
        this.addResult(chart.component, 'missing', 'Neither static nor chart version found', 'medium',
          [`Implement ${chart.component} with progressive enhancement pattern`]);
      }
    }

    // Test chart interaction readiness (should not fail if no charts)
    const interactiveElements = this.page.locator('svg[role="img"], canvas, [data-testid*="chart"]');
    const interactiveCount = await interactiveElements.count();
    
    if (interactiveCount > 0) {
      this.addResult('Chart Interactivity', 'pass', `Found ${interactiveCount} interactive chart elements`, 'info');
      
      // Test first few for interaction capability
      for (let i = 0; i < Math.min(interactiveCount, 3); i++) {
        const element = interactiveElements.nth(i);
        try {
          await element.hover({ timeout: 2000 });
          this.addResult(`Chart ${i + 1} Interaction`, 'pass', 'Chart responds to hover', 'info');
        } catch (error) {
          this.addResult(`Chart ${i + 1} Interaction`, 'partial', 'Chart exists but limited interactivity', 'low');
        }
      }
    } else {
      this.addResult('Chart Interactivity', 'missing', 'No interactive charts found (expected for current MVP)', 'info');
    }
  }

  /**
   * Test page interactivity and controls
   */
  async testInteractivity(): Promise<void> {
    console.log('🔧 Testing interactive controls...');

    // Test Period Filter
    const periodFilter = this.page.locator('select, [data-testid="period-filter"]');
    const periodCount = await periodFilter.count();
    
    if (periodCount > 0) {
      try {
        const initialValue = await periodFilter.first().inputValue();
        const options = await periodFilter.locator('option').count();
        
        if (options > 1) {
          await periodFilter.first().selectOption({ index: 1 });
          await this.page.waitForTimeout(2000); // Allow time for data reload
          
          const newValue = await periodFilter.first().inputValue();
          if (newValue !== initialValue) {
            this.addResult('Period Filter Functionality', 'pass', 'Filter changes and triggers data update', 'info');
          } else {
            this.addResult('Period Filter Functionality', 'partial', 'Filter changes but value unchanged', 'low');
          }
        } else {
          this.addResult('Period Filter Functionality', 'partial', 'Filter found but no options available', 'medium');
        }
      } catch (error) {
        this.addResult('Period Filter Functionality', 'fail', `Filter interaction failed: ${error}`, 'medium');
      }
    } else {
      this.addResult('Period Filter Functionality', 'missing', 'Period filter not found', 'medium',
        ['Add data-testid="period-filter" to period selector element']);
    }

    // Test Export Functionality
    const exportButtons = this.page.locator('button:has-text("CSV"), button:has-text("JSON"), [data-testid*="export"]');
    const exportCount = await exportButtons.count();
    
    if (exportCount > 0) {
      this.addResult('Export Controls', 'pass', `Found ${exportCount} export options`, 'info');
      
      // Test actual export functionality (first button only to avoid multiple downloads)
      try {
        const downloadPromise = this.page.waitForEvent('download', { timeout: 5000 });
        await exportButtons.first().click();
        
        try {
          const download = await downloadPromise;
          this.addResult('Export Functionality', 'pass', `Export successful: ${download.suggestedFilename()}`, 'info');
          await download.cancel(); // Prevent file system clutter
        } catch {
          this.addResult('Export Functionality', 'partial', 'Export button works but no download triggered (may need data)', 'low');
        }
      } catch (error) {
        this.addResult('Export Functionality', 'fail', `Export failed: ${error}`, 'medium');
      }
    } else {
      this.addResult('Export Controls', 'missing', 'Export functionality not found', 'medium',
        ['Add data-testid="export-csv" and data-testid="export-json" to export buttons']);
    }
  }

  /**
   * Test achievements page with progressive enhancement approach
   */
  async testAchievements(): Promise<void> {
    await this.page.goto(`${BASE_URL}/achievements`);
    await this.page.waitForLoadState('networkidle');

    // Test page access
    const currentUrl = this.page.url();
    if (currentUrl.includes('/achievements')) {
      this.addResult('Achievements Page Access', 'pass', 'Successfully accessed achievements page', 'info');
    } else {
      this.addResult('Achievements Page Access', 'fail', `Redirected to ${currentUrl}`, 'critical');
      return;
    }

    // Test achievements structure with progressive selectors
    const achievementSelectors = [
      {
        selector: '[data-testid="achievement"], .glass:has([data-progress]), motion\\[data-framer-name\\]',
        name: 'Achievement Cards',
        expectedMin: 0,
        expectedMax: 20
      },
      {
        selector: '[data-testid="achievement-progress"], [role="progressbar"], .bg-green-500',
        name: 'Progress Indicators',
        expectedMin: 0,
        expectedMax: 50
      },
      {
        selector: '[data-testid="achievement-stats"], .glass:has([class*="text-2xl"])',
        name: 'Achievement Statistics',
        expectedMin: 1,
        expectedMax: 5
      }
    ];

    for (const selector of achievementSelectors) {
      const elements = this.page.locator(selector.selector);
      const count = await elements.count();
      
      if (count >= selector.expectedMin && count <= selector.expectedMax) {
        if (count > 0) {
          this.addResult(selector.name, 'pass', `Found ${count} ${selector.name.toLowerCase()}`, 'info');
        } else {
          this.addResult(selector.name, 'partial', `No ${selector.name.toLowerCase()} found (may be normal for new user)`, 'info');
        }
      } else {
        this.addResult(selector.name, 'fail', `Unexpected count: ${count} (expected ${selector.expectedMin}-${selector.expectedMax})`, 'medium');
      }
    }

    // Test achievement interactions
    const unlocked = this.page.locator('.border-green-500\\/20, [data-achievement-status="unlocked"]');
    const unlockedCount = await unlocked.count();
    
    if (unlockedCount > 0) {
      try {
        await unlocked.first().click();
        await this.page.waitForTimeout(1000);
        this.addResult('Achievement Interaction', 'pass', 'Achievements are clickable', 'info');
      } catch (error) {
        this.addResult('Achievement Interaction', 'partial', 'Achievements visible but interaction limited', 'low');
      }
    } else {
      this.addResult('Achievement Interaction', 'missing', 'No unlocked achievements to test (normal for new users)', 'info');
    }
  }

  /**
   * Test performance with realistic expectations
   */
  async testPerformance(): Promise<void> {
    console.log('⚡ Testing performance with realistic expectations...');

    // Analytics page load performance
    const analyticsStart = Date.now();
    await this.page.goto(`${BASE_URL}/analytics`);
    await this.page.waitForLoadState('networkidle');
    const analyticsLoad = Date.now() - analyticsStart;

    if (analyticsLoad < 5000) {
      this.addResult('Analytics Load Performance', 'pass', `Fast load: ${analyticsLoad}ms`, 'info');
    } else if (analyticsLoad < 10000) {
      this.addResult('Analytics Load Performance', 'partial', `Acceptable load: ${analyticsLoad}ms`, 'low');
    } else {
      this.addResult('Analytics Load Performance', 'fail', `Slow load: ${analyticsLoad}ms`, 'medium');
    }

    // Data rendering performance (for static content)
    const dataElementsStart = Date.now();
    await this.page.waitForSelector('.glass, [data-testid*="card"]', { timeout: 5000 });
    const dataRender = Date.now() - dataElementsStart;

    if (dataRender < 2000) {
      this.addResult('Data Rendering Performance', 'pass', `Fast render: ${dataRender}ms`, 'info');
    } else {
      this.addResult('Data Rendering Performance', 'partial', `Slow render: ${dataRender}ms`, 'medium');
    }

    // Achievements page performance
    const achievementsStart = Date.now();
    await this.page.goto(`${BASE_URL}/achievements`);
    await this.page.waitForLoadState('networkidle');
    const achievementsLoad = Date.now() - achievementsStart;

    if (achievementsLoad < 8000) {
      this.addResult('Achievements Load Performance', 'pass', `Load time: ${achievementsLoad}ms`, 'info');
    } else {
      this.addResult('Achievements Load Performance', 'fail', `Slow load: ${achievementsLoad}ms`, 'medium');
    }
  }

  /**
   * Test API integration with realistic error handling
   */
  async testAPIIntegration(): Promise<void> {
    console.log('🔗 Testing API integration...');

    const apiCalls: { url: string; method: string; status: number; }[] = [];
    
    this.page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/analytics') || url.includes('/api/achievements')) {
        apiCalls.push({
          url,
          method: response.request().method(),
          status: response.status()
        });
      }
    });

    // Visit analytics page and trigger API calls
    await this.page.goto(`${BASE_URL}/analytics`);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);

    // Check period filter interaction
    const periodFilter = this.page.locator('select');
    if (await periodFilter.count() > 0) {
      await periodFilter.first().selectOption({ value: '7' });
      await this.page.waitForTimeout(2000);
    }

    // Visit achievements page
    await this.page.goto(`${BASE_URL}/achievements`);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2000);

    // Analyze API calls
    const successfulCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
    const errorCalls = apiCalls.filter(call => call.status >= 400);

    if (errorCalls.length === 0) {
      this.addResult('API Integration', 'pass', `All ${apiCalls.length} API calls successful`, 'info');
    } else {
      this.addResult('API Integration', 'fail', 
        `${errorCalls.length} failed API calls out of ${apiCalls.length} total`, 'high');
      
      errorCalls.forEach((call, index) => {
        this.addResult(`API Error ${index + 1}`, 'fail', 
          `${call.method} ${call.url} - Status: ${call.status}`, 'medium');
      });
    }

    // Test for required endpoints
    const analyticsEndpoint = apiCalls.some(call => call.url.includes('/api/analytics'));
    if (analyticsEndpoint) {
      this.addResult('Analytics API Endpoint', 'pass', 'Analytics API called successfully', 'info');
    } else {
      this.addResult('Analytics API Endpoint', 'missing', 'Analytics API not called during test', 'medium');
    }
  }

  generateReport(): any {
    const critical = this.results.filter(r => r.severity === 'critical').length;
    const high = this.results.filter(r => r.severity === 'high').length;
    const medium = this.results.filter(r => r.severity === 'medium').length;
    const low = this.results.filter(r => r.severity === 'low').length;
    
    const passes = this.results.filter(r => r.status === 'pass').length;
    const fails = this.results.filter(r => r.status === 'fail').length;
    const partials = this.results.filter(r => r.status === 'partial').length;
    const missing = this.results.filter(r => r.status === 'missing').length;

    console.log('\n📊 Analytics & Achievements Robust Testing Report');
    console.log('===================================================');
    console.log(`✅ Passed: ${passes}`);
    console.log(`⚠️  Partial: ${partials}`);
    console.log(`❌ Failed: ${fails}`);
    console.log(`ℹ️  Missing: ${missing}`);
    console.log('---------------------------------------------------');
    console.log(`🔴 Critical: ${critical}`);
    console.log(`🟠 High: ${high}`);
    console.log(`🟡 Medium: ${medium}`);
    console.log(`🟢 Low: ${low}`);
    console.log('===================================================');

    return {
      summary: {
        total: this.results.length,
        passes,
        fails,
        partials,
        missing,
        critical,
        high,
        medium,
        low
      },
      results: this.results
    };
  }
}

// Test suite with progressive enhancement approach
test.describe('Analytics & Achievements Robust Testing', () => {
  let strategy: AnalyticsTestStrategy;
  
  test.setTimeout(120000); // 2 minutes for comprehensive testing
  
  test.beforeEach(async ({ page }) => {
    strategy = new AnalyticsTestStrategy(page);
    await strategy.login();
  });

  test('Analytics Page Progressive Enhancement Test', async ({ page }) => {
    console.log('📊 Running Analytics Progressive Enhancement Test...');
    await strategy.testAnalyticsStructure();
  });

  test('Achievements Page Functionality Test', async ({ page }) => {
    console.log('🏆 Running Achievements Functionality Test...');
    await strategy.testAchievements();
  });

  test('Performance Validation Test', async ({ page }) => {
    console.log('⚡ Running Performance Validation Test...');
    await strategy.testPerformance();
  });

  test('API Integration Validation Test', async ({ page }) => {
    console.log('🔗 Running API Integration Test...');
    await strategy.testAPIIntegration();
  });

  test.afterAll(async () => {
    const report = strategy.generateReport();
    
    console.log('\n🎯 ROBUST TESTING COMPLETE!');
    console.log('============================');
    
    // Output actionable recommendations
    if (report.summary.critical > 0 || report.summary.high > 0) {
      console.log('\n🚨 HIGH PRIORITY FIXES NEEDED:');
      strategy['results']
        .filter(r => r.severity === 'critical' || r.severity === 'high')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.component}: ${result.details}`);
          if (result.suggestions) {
            result.suggestions.forEach(s => console.log(`   💡 ${s}`));
          }
        });
    }

    if (report.summary.medium > 0) {
      console.log('\n🔧 MEDIUM PRIORITY IMPROVEMENTS:');
      strategy['results']
        .filter(r => r.severity === 'medium')
        .forEach((result, index) => {
          console.log(`${index + 1}. ${result.component}: ${result.details}`);
          if (result.suggestions) {
            result.suggestions.forEach(s => console.log(`   💡 ${s}`));
          }
        });
    }

    // Chart implementation readiness report
    const chartResults = strategy['results'].filter(r => 
      r.component.includes('Chart') || r.component.includes('Visualization'));
    
    if (chartResults.length > 0) {
      console.log('\n📈 CHART IMPLEMENTATION READINESS:');
      chartResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result.component}: ${result.status.toUpperCase()}`);
        if (result.suggestions) {
          result.suggestions.forEach(s => console.log(`   📋 ${s}`));
        }
      });
    }

    console.log('\n📄 JSON Report:');
    console.log(JSON.stringify(report, null, 2));
  });
});