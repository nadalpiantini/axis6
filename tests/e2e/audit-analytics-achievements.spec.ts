import { test, expect, Page } from '@playwright/test';

/**
 * SUB-AGENTE 5: Analytics & Achievements Comprehensive Audit
 *
 * Specializes in:
 * - Analytics page (/analytics) complete functionality
 * - Achievements page (/achievements) gamification features
 * - Data visualization testing (charts, graphs)
 * - Export functionality and downloads
 * - Progress tracking and insights features
 * - Filtering and date range selections
 *
 * Execution: PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-analytics-achievements.spec.ts --reporter=line
 */

const REAL_USER_CREDENTIALS = {
  email: 'nadalpiantini@gmail.com',
  password: 'Teclados#13'
};

const BASE_URL = 'https://axis6.app';

interface BugReport {
  agent: string;
  page: string;
  element: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  screenshot?: string;
  networkLogs?: string[];
  consoleErrors?: string[];
  timestamp: string;
  chartType?: string;
  achievementType?: string;
}

class AnalyticsAchievementsAuditor {
  private page: Page;
  private bugs: BugReport[] = [];
  private networkLogs: string[] = [];
  private consoleErrors: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // Monitor network requests
    this.page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('supabase.co') ||
          url.includes('analytics') || url.includes('achievements') ||
          url.includes('stats') || url.includes('export') ||
          url.includes('chart') || url.includes('data')) {
        this.networkLogs.push(`${request.method()} ${url}`);
      }
    });

    // Monitor network responses for errors
    this.page.on('response', response => {
      const url = response.url();
      if ((url.includes('/api/') || url.includes('supabase.co') ||
           url.includes('analytics') || url.includes('achievements')) &&
          response.status() >= 400) {
        this.networkLogs.push(`❌ ${response.status()} ${response.url()}`);
      }
    });

    // Monitor JavaScript errors
    this.page.on('pageerror', error => {
      this.consoleErrors.push(`Page Error: ${error.message}`);
    });

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(`Console Error: ${msg.text()}`);
      }
    });
  }

  async login() {
    console.log('🔐 Logging in for Analytics & Achievements testing...');
    await this.page.goto(`${BASE_URL}/auth/login`);
    await this.page.waitForLoadState('networkidle');

    const emailInput = this.page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = this.page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = this.page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();

    if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
      await emailInput.fill(REAL_USER_CREDENTIALS.email);
      await passwordInput.fill(REAL_USER_CREDENTIALS.password);
      await loginButton.click();
      await this.page.waitForTimeout(5000);

      const currentUrl = this.page.url();
      if (currentUrl.includes('/auth/login')) {
        throw new Error('Login failed - still on login page');
      }
    } else {
      throw new Error('Cannot find login form elements');
    }
  }

  async reportBug(page: string, element: string, issue: string, severity: BugReport['severity'] = 'medium', chartType?: string, achievementType?: string) {
    const bugId = this.bugs.length + 1;
    const screenshot = `analytics-achievements-bug-${bugId}-${page.replace('/', '_')}.png`;

    try {
      await this.page.screenshot({
        path: `test-results/${screenshot}`,
        fullPage: true
      });
    } catch (e) {
      console.log(`⚠️ Could not capture screenshot: ${e}`);
    }

    this.bugs.push({
      agent: 'analytics-achievements',
      page,
      element,
      issue,
      severity,
      screenshot,
      networkLogs: [...this.networkLogs],
      consoleErrors: [...this.consoleErrors],
      timestamp: new Date().toISOString(),
      chartType,
      achievementType
    });

    const typeText = chartType ? ` [${chartType}]` : achievementType ? ` [${achievementType}]` : '';
    console.log(`🐛 [SUB-AGENT 5] BUG FOUND [${severity.toUpperCase()}]${typeText} on ${page}: ${issue}`);

    // Clear logs for next test
    this.networkLogs = [];
    this.consoleErrors = [];
  }

  async testDataVisualization(chartSelector: string, chartName: string, currentPage: string) {
    console.log(`📊 Testing data visualization: ${chartName}`);

    const chartElements = this.page.locator(chartSelector);
    const chartCount = await chartElements.count();

    if (chartCount === 0) {
      await this.reportBug(currentPage, chartName,
        `Chart not found: ${chartSelector}`, 'medium', chartName);
      return false;
    }

    for (let i = 0; i < chartCount; i++) {
      const chart = chartElements.nth(i);

      // Test visibility
      const isVisible = await chart.isVisible();
      if (!isVisible) {
        await this.reportBug(currentPage, chartName,
          `Chart ${i + 1} not visible`, 'medium', chartName);
        continue;
      }

      // Test chart content
      const hasContent = await chart.innerHTML() !== '';
      if (!hasContent) {
        await this.reportBug(currentPage, chartName,
          `Chart ${i + 1} appears to be empty`, 'medium', chartName);
      }

      // Test interactivity
      try {
        await chart.hover();
        await this.page.waitForTimeout(500);

        // Check for tooltips or hover effects
        const tooltips = this.page.locator('[role="tooltip"], .tooltip, [data-testid*="tooltip"]');
        const tooltipCount = await tooltips.count();

        if (tooltipCount > 0) {
          console.log(`✅ Chart ${i + 1} has interactive tooltips`);
        }

        // Try clicking on chart
        await chart.click();
        await this.page.waitForTimeout(500);

        console.log(`✅ Chart ${i + 1} is interactive`);

      } catch (error) {
        console.log(`ℹ️ Chart ${i + 1} interaction limited: ${error}`);
      }
    }

    return true;
  }

  async testFilterControls(currentPage: string) {
    console.log('🔍 Testing filter controls...');

    const filterSelectors = [
      'select[name*="filter"], select[name*="period"], select[name*="range"]',
      'input[type="date"]',
      'button:has-text("Filter"), button:has-text("Apply")',
      '[data-testid*="filter"], [data-testid*="date"]',
      '.date-picker, .filter-control'
    ];

    let filtersFound = 0;

    for (const selector of filterSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        filtersFound += count;
        console.log(`✅ Found ${count} filter controls: ${selector}`);

        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);

          if (await element.isVisible() && await element.isEnabled()) {
            try {
              const tagName = await element.evaluate(el => el.tagName);

              if (tagName === 'SELECT') {
                const options = await element.locator('option').count();
                if (options > 1) {
                  const initialNetworkCount = this.networkLogs.length;
                  await element.selectOption({ index: 1 });
                  await this.page.waitForTimeout(2000);

                  const finalNetworkCount = this.networkLogs.length;
                  if (finalNetworkCount > initialNetworkCount) {
                    console.log(`✅ Filter triggered ${finalNetworkCount - initialNetworkCount} API calls`);
                  }
                }
              } else if (tagName === 'INPUT') {
                const inputType = await element.getAttribute('type');
                if (inputType === 'date') {
                  await element.fill('2024-01-01');
                  await this.page.waitForTimeout(1000);
                }
              } else if (tagName === 'BUTTON') {
                await element.click();
                await this.page.waitForTimeout(1000);
              }

              console.log(`✅ Successfully tested filter control ${i + 1}`);

            } catch (error) {
              await this.reportBug(currentPage, 'Filter Control',
                `Failed to interact with filter: ${error}`, 'medium');
            }
          }
        }
      }
    }

    if (filtersFound === 0) {
      console.log(`ℹ️ No filter controls found (this may be normal)`);
    }

    return filtersFound > 0;
  }

  async testExportFunctionality(currentPage: string) {
    console.log('📥 Testing export functionality...');

    const exportSelectors = [
      'button:has-text("Export"), button:has-text("Download")',
      'a:has-text("Export"), a:has-text("Download")',
      '[data-testid*="export"], [data-testid*="download"]',
      'button[aria-label*="export"], button[aria-label*="download"]'
    ];

    let exportElementsFound = 0;

    for (const selector of exportSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        exportElementsFound += count;
        console.log(`✅ Found ${count} export elements: ${selector}`);

        for (let i = 0; i < Math.min(count, 2); i++) {
          const element = elements.nth(i);
          const elementText = await element.textContent();

          if (await element.isVisible() && await element.isEnabled()) {
            try {
              // Set up download monitoring
              const downloadPromise = this.page.waitForEvent('download', { timeout: 5000 });

              await element.click();

              try {
                const download = await downloadPromise;
                console.log(`✅ Export "${elementText}" triggered download: ${download.suggestedFilename()}`);

                // Cancel download to avoid file system clutter
                await download.cancel();

              } catch (downloadError) {
                console.log(`ℹ️ Export "${elementText}" clicked but no download triggered (may require data)`);
              }

            } catch (error) {
              await this.reportBug(currentPage, 'Export Function',
                `Export "${elementText}" failed: ${error}`, 'medium');
            }
          }
        }
      }
    }

    if (exportElementsFound === 0) {
      console.log(`ℹ️ No export functionality found (this may be normal)`);
    }

    return exportElementsFound > 0;
  }

  async testAchievementElements(currentPage: string) {
    console.log('🏆 Testing achievement elements...');

    const achievementSelectors = [
      '[data-testid*="achievement"]',
      '.achievement, .badge, .trophy',
      '[class*="achievement"], [class*="badge"]',
      'li:has-text("Achievement"), div:has-text("Badge")',
      '[aria-label*="achievement"], [aria-label*="badge"]'
    ];

    let achievementsFound = 0;

    for (const selector of achievementSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        achievementsFound += count;
        console.log(`✅ Found ${count} achievement elements: ${selector}`);

        for (let i = 0; i < Math.min(count, 5); i++) {
          const element = elements.nth(i);

          if (await element.isVisible()) {
            try {
              const achievementText = await element.textContent();
              const hasImage = await element.locator('img, svg').count() > 0;

              console.log(`✅ Achievement ${i + 1}: "${achievementText?.slice(0, 50)}..." (Has Image: ${hasImage})`);

              // Test click interaction
              await element.click();
              await this.page.waitForTimeout(1000);

              // Check if modal or details appeared
              const modal = this.page.locator('[role="dialog"], .modal, [data-testid*="modal"]');
              if (await modal.count() > 0) {
                console.log(`✅ Achievement ${i + 1} opened details modal`);

                // Close modal
                const closeButton = modal.locator('button:has-text("Close"), [aria-label*="close"], .close');
                if (await closeButton.count() > 0) {
                  await closeButton.first().click();
                  await this.page.waitForTimeout(500);
                }
              }

            } catch (error) {
              await this.reportBug(currentPage, 'Achievement Element',
                `Achievement ${i + 1} interaction failed: ${error}`, 'low', undefined, `achievement-${i + 1}`);
            }
          }
        }
      }
    }

    console.log(`📊 Total achievements found: ${achievementsFound}`);

    return achievementsFound;
  }

  getBugReport() {
    return {
      agent: 'analytics-achievements',
      totalBugs: this.bugs.length,
      critical: this.bugs.filter(b => b.severity === 'critical').length,
      high: this.bugs.filter(b => b.severity === 'high').length,
      medium: this.bugs.filter(b => b.severity === 'medium').length,
      low: this.bugs.filter(b => b.severity === 'low').length,
      bugs: this.bugs,
      completedAt: new Date().toISOString()
    };
  }
}

test.describe('SUB-AGENT 5: Analytics & Achievements Audit', () => {
  let auditor: AnalyticsAchievementsAuditor;

  test.setTimeout(180000); // 3 minutes timeout

  test.beforeEach(async ({ page }) => {
    auditor = new AnalyticsAchievementsAuditor(page);
    await auditor.login();
  });

  test('Analytics Page Structure and Access Audit', async ({ page }) => {
    console.log('📊 [SUB-AGENT 5] Starting Analytics Page Structure Audit...');

    // Navigate to analytics page
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    // Verify we're on the analytics page
    const currentUrl = page.url();
    if (!currentUrl.includes('/analytics')) {
      await auditor.reportBug('/analytics', 'Page Access',
        `Failed to access analytics page, redirected to: ${currentUrl}`, 'critical');
    }

    // Check for basic analytics structure
    const analyticsElements = [
      { selector: 'main, [data-testid="analytics"]', name: 'Main Analytics Container' },
      { selector: 'h1, h2, [data-testid*="title"]', name: 'Analytics Page Title' },
      { selector: 'svg, canvas, [data-testid*="chart"]', name: 'Chart Elements' },
      { selector: '.chart, .graph, [class*="visualization"]', name: 'Visualization Components' }
    ];

    for (const element of analyticsElements) {
      const found = await page.locator(element.selector).count() > 0;
      if (!found) {
        await auditor.reportBug('/analytics', element.name,
          `${element.name} not found`, 'medium');
      } else {
        console.log(`✅ Found ${element.name}`);
      }
    }

    console.log('✅ Analytics Page Structure Audit Complete');
  });

  test('Data Visualization Charts Comprehensive Test', async ({ page }) => {
    console.log('📈 [SUB-AGENT 5] Starting Data Visualization Test...');

    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    // Test different types of charts
    const chartTypes = [
      { selector: 'svg', name: 'SVG Charts' },
      { selector: 'canvas', name: 'Canvas Charts' },
      { selector: '[data-testid*="chart"]', name: 'Chart Components' },
      { selector: '.recharts-wrapper, .chart-container', name: 'Recharts Components' },
      { selector: '[class*="line"], [class*="bar"], [class*="pie"]', name: 'Chart Elements' }
    ];

    let chartsTestedSuccessfully = 0;

    for (const chartType of chartTypes) {
      const success = await auditor.testDataVisualization(chartType.selector, chartType.name, '/analytics');
      if (success) {
        chartsTestedSuccessfully++;
      }
    }

    console.log(`📊 Successfully tested ${chartsTestedSuccessfully}/${chartTypes.length} chart types`);

    // Test chart responsiveness
    console.log('📱 Testing chart responsiveness...');

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    const chartsAfterResize = page.locator('svg, canvas, [data-testid*="chart"]');
    const chartCount = await chartsAfterResize.count();

    for (let i = 0; i < Math.min(chartCount, 3); i++) {
      const chart = chartsAfterResize.nth(i);
      const isVisible = await chart.isVisible();

      if (!isVisible) {
        await auditor.reportBug('/analytics', 'Chart Responsiveness',
          `Chart ${i + 1} not visible on tablet viewport`, 'medium');
      }
    }

    // Reset viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log('✅ Data Visualization Test Complete');
  });

  test('Analytics Filters and Controls Audit', async ({ page }) => {
    console.log('🔍 [SUB-AGENT 5] Starting Analytics Filters Audit...');

    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    // Test filter controls
    const filtersFound = await auditor.testFilterControls('/analytics');

    if (filtersFound) {
      // Test filter combinations
      console.log('🔄 Testing filter combinations...');

      const dateInputs = page.locator('input[type="date"]');
      const selectFilters = page.locator('select');

      // Test date range filtering
      if (await dateInputs.count() >= 2) {
        try {
          await dateInputs.first().fill('2024-01-01');
          await dateInputs.nth(1).fill('2024-12-31');
          await page.waitForTimeout(2000);
          console.log('✅ Date range filter tested');
        } catch (error) {
          await auditor.reportBug('/analytics', 'Date Range Filter',
            `Date range filtering failed: ${error}`, 'medium');
        }
      }

      // Test category filtering
      if (await selectFilters.count() > 0) {
        for (let i = 0; i < Math.min(await selectFilters.count(), 2); i++) {
          const select = selectFilters.nth(i);
          const options = await select.locator('option').count();

          if (options > 2) {
            try {
              await select.selectOption({ index: 2 });
              await page.waitForTimeout(2000);
              console.log(`✅ Category filter ${i + 1} tested`);
            } catch (error) {
              await auditor.reportBug('/analytics', 'Category Filter',
                `Category filter ${i + 1} failed: ${error}`, 'medium');
            }
          }
        }
      }
    }

    console.log('✅ Analytics Filters Audit Complete');
  });

  test('Export and Download Functionality Audit', async ({ page }) => {
    console.log('📥 [SUB-AGENT 5] Starting Export Functionality Audit...');

    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');

    const exportFound = await auditor.testExportFunctionality('/analytics');

    if (exportFound) {
      // Test different export formats
      const exportFormats = ['CSV', 'PDF', 'PNG', 'JSON'];

      for (const format of exportFormats) {
        const formatButton = page.locator(`button:has-text("${format}"), a:has-text("${format}")`);

        if (await formatButton.count() > 0) {
          console.log(`✅ Found export option for ${format}`);

          try {
            const downloadPromise = page.waitForEvent('download', { timeout: 3000 });
            await formatButton.first().click();

            try {
              const download = await downloadPromise;
              console.log(`✅ ${format} export works: ${download.suggestedFilename()}`);
              await download.cancel();
            } catch {
              console.log(`ℹ️ ${format} export may require data or different trigger`);
            }

          } catch (error) {
            console.log(`⚠️ ${format} export button issue: ${error}`);
          }
        }
      }
    }

    console.log('✅ Export Functionality Audit Complete');
  });

  test('Achievements Page Complete Audit', async ({ page }) => {
    console.log('🏆 [SUB-AGENT 5] Starting Achievements Page Audit...');

    // Navigate to achievements page
    await page.goto(`${BASE_URL}/achievements`);
    await page.waitForLoadState('networkidle');

    // Verify we're on the achievements page
    const currentUrl = page.url();
    if (!currentUrl.includes('/achievements')) {
      await auditor.reportBug('/achievements', 'Page Access',
        `Failed to access achievements page, redirected to: ${currentUrl}`, 'critical');
      return;
    }

    // Check for basic achievements structure
    const achievementsElements = [
      { selector: 'main, [data-testid="achievements"]', name: 'Main Achievements Container' },
      { selector: 'h1, h2, [data-testid*="title"]', name: 'Achievements Page Title' }
    ];

    for (const element of achievementsElements) {
      const found = await page.locator(element.selector).count() > 0;
      if (!found) {
        await auditor.reportBug('/achievements', element.name,
          `${element.name} not found`, 'medium');
      } else {
        console.log(`✅ Found ${element.name}`);
      }
    }

    // Test achievement elements
    const achievementsFound = await auditor.testAchievementElements('/achievements');

    if (achievementsFound > 0) {
      // Test achievement categories if present
      const categoryTabs = page.locator('[role="tab"], .tab, [data-testid*="category"]');
      const categoryCount = await categoryTabs.count();

      if (categoryCount > 0) {
        console.log(`✅ Found ${categoryCount} achievement categories`);

        for (let i = 0; i < Math.min(categoryCount, 3); i++) {
          const category = categoryTabs.nth(i);
          const categoryText = await category.textContent();

          try {
            await category.click();
            await page.waitForTimeout(1500);
            console.log(`✅ Achievement category "${categoryText}" is clickable`);
          } catch (error) {
            await auditor.reportBug('/achievements', 'Achievement Category',
              `Category "${categoryText}" click failed: ${error}`, 'medium');
          }
        }
      }

      // Test achievement progress indicators
      const progressBars = page.locator('[role="progressbar"], .progress, [data-testid*="progress"]');
      const progressCount = await progressBars.count();

      if (progressCount > 0) {
        console.log(`✅ Found ${progressCount} progress indicators`);
      }

    } else {
      console.log(`ℹ️ No achievements found (this may be normal for a new user)`);
    }

    console.log('✅ Achievements Page Audit Complete');
  });

  test('Analytics & Achievements API Integration Audit', async ({ page }) => {
    console.log('🔗 [SUB-AGENT 5] Starting Analytics & Achievements API Audit...');

    const apiCalls: { url: string; method: string; status: number; }[] = [];

    // Monitor all API calls
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('supabase.co')) {
        apiCalls.push({
          url,
          method: response.request().method(),
          status: response.status()
        });
      }
    });

    // Test analytics page API calls
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Interact with filters
    await auditor.testFilterControls('/analytics');
    await page.waitForTimeout(2000);

    // Test achievements page API calls
    await page.goto(`${BASE_URL}/achievements`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Analyze API calls
    console.log(`📊 Analytics & Achievements API Analysis (Total calls: ${apiCalls.length})`);

    const errorCalls = apiCalls.filter(call => call.status >= 400);
    const successCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);

    console.log(`✅ Successful API calls: ${successCalls.length}`);
    console.log(`❌ Failed API calls: ${errorCalls.length}`);

    if (errorCalls.length > 0) {
      errorCalls.forEach(call => {
        console.log(`🚨 API Error: ${call.method} ${call.url} - Status: ${call.status}`);
      });

      await auditor.reportBug('/analytics', 'API Integration',
        `${errorCalls.length} API calls failed during analytics/achievements interactions`, 'high');
    }

    // Check for expected API endpoints
    const expectedEndpoints = ['analytics', 'achievements', 'stats', 'streaks', 'progress'];
    const calledEndpoints = apiCalls.map(call => {
      const url = new URL(call.url);
      return url.pathname;
    });

    for (const expectedEndpoint of expectedEndpoints) {
      const endpointCalled = calledEndpoints.some(path => path.includes(expectedEndpoint));
      if (endpointCalled) {
        console.log(`✅ API endpoint '${expectedEndpoint}' was called`);
      } else {
        console.log(`ℹ️ API endpoint '${expectedEndpoint}' was not called`);
      }
    }

    console.log('✅ Analytics & Achievements API Audit Complete');
  });

  test('Data Loading and Performance Audit', async ({ page }) => {
    console.log('⚡ [SUB-AGENT 5] Starting Data Loading Performance Audit...');

    // Measure analytics page load time
    const analyticsStartTime = Date.now();
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');
    const analyticsLoadTime = Date.now() - analyticsStartTime;

    console.log(`📊 Analytics page load time: ${analyticsLoadTime}ms`);

    if (analyticsLoadTime > 10000) {
      await auditor.reportBug('/analytics', 'Page Performance',
        `Analytics page load time too slow: ${analyticsLoadTime}ms`, 'medium');
    }

    // Test chart rendering time
    const chartStartTime = Date.now();
    await page.waitForSelector('svg, canvas, [data-testid*="chart"]', { timeout: 10000 });
    const chartRenderTime = Date.now() - chartStartTime;

    console.log(`📈 Chart rendering time: ${chartRenderTime}ms`);

    if (chartRenderTime > 5000) {
      await auditor.reportBug('/analytics', 'Chart Performance',
        `Chart rendering time too slow: ${chartRenderTime}ms`, 'medium');
    }

    // Measure achievements page load time
    const achievementsStartTime = Date.now();
    await page.goto(`${BASE_URL}/achievements`);
    await page.waitForLoadState('networkidle');
    const achievementsLoadTime = Date.now() - achievementsStartTime;

    console.log(`🏆 Achievements page load time: ${achievementsLoadTime}ms`);

    if (achievementsLoadTime > 8000) {
      await auditor.reportBug('/achievements', 'Page Performance',
        `Achievements page load time too slow: ${achievementsLoadTime}ms`, 'medium');
    }

    // Test data freshness
    const dataElements = page.locator('[data-testid*="last-updated"], .last-updated, [class*="timestamp"]');
    const dataTimestampCount = await dataElements.count();

    if (dataTimestampCount > 0) {
      console.log(`✅ Found ${dataTimestampCount} data freshness indicators`);
    } else {
      console.log(`ℹ️ No data freshness indicators found (may be by design)`);
    }

    console.log('✅ Data Loading Performance Audit Complete');
  });

  test.afterAll(async () => {
    const report = auditor.getBugReport();

    console.log('\n🎯 [SUB-AGENT 5] ANALYTICS & ACHIEVEMENTS AUDIT COMPLETE!');
    console.log('=====================================');
    console.log(`📊 Total Issues Found: ${report.totalBugs}`);
    console.log(`🔴 Critical: ${report.critical}`);
    console.log(`🟠 High: ${report.high}`);
    console.log(`🟡 Medium: ${report.medium}`);
    console.log(`🟢 Low: ${report.low}`);
    console.log('=====================================');

    // Output JSON report for orchestrator
    console.log('\n📄 JSON REPORT FOR ORCHESTRATOR:');
    console.log(JSON.stringify(report, null, 2));

    if (report.bugs.length > 0) {
      console.log('\n🐛 DETAILED BUG REPORT:');
      report.bugs.forEach((bug, index) => {
        const typeText = bug.chartType ? ` [${bug.chartType}]` : bug.achievementType ? ` [${bug.achievementType}]` : '';
        console.log(`\n${index + 1}. [${bug.severity.toUpperCase()}]${typeText} ${bug.page}`);
        console.log(`   Element: ${bug.element}`);
        console.log(`   Issue: ${bug.issue}`);
        console.log(`   Screenshot: ${bug.screenshot}`);
        if (bug.consoleErrors && bug.consoleErrors.length > 0) {
          console.log(`   Console Errors: ${bug.consoleErrors.join(', ')}`);
        }
      });
    } else {
      console.log('\n🎉 NO BUGS FOUND IN ANALYTICS & ACHIEVEMENTS!');
    }

    console.log('\n✅ Sub-Agent 5 reporting complete to orchestrator');
  });
});
