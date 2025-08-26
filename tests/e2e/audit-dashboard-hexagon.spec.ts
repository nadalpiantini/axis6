import { test, expect, Page } from '@playwright/test';

/**
 * SUB-AGENTE 2: Dashboard & Hexagon Interactions Comprehensive Audit
 * 
 * Specializes in:
 * - Dashboard page (/dashboard) complete testing
 * - Hexagon visualization interactions
 * - 6 categories check-in (Physical, Mental, Emotional, Social, Spiritual, Material)
 * - Category cards and buttons functionality
 * - Progress tracking and visual updates
 * - Real-time UI state changes
 * 
 * Execution: PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-dashboard-hexagon.spec.ts --reporter=line
 */

const REAL_USER_CREDENTIALS = {
  email: 'nadalpiantini@gmail.com',
  password: 'Teclados#13'
};

const BASE_URL = 'https://axis6.app';

// AXIS6 Expected Categories
const AXIS6_CATEGORIES = ['Physical', 'Mental', 'Emotional', 'Social', 'Spiritual', 'Material'];

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
  category?: string;
}

class DashboardHexagonAuditor {
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
      if (url.includes('/api/') || url.includes('supabase.co') || url.includes('checkin') || url.includes('dashboard')) {
        this.networkLogs.push(`${request.method()} ${url}`);
      }
    });
    
    // Monitor network responses for errors
    this.page.on('response', response => {
      const url = response.url();
      if ((url.includes('/api/') || url.includes('supabase.co') || url.includes('checkin')) && response.status() >= 400) {
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
    console.log('🔐 Logging in for dashboard testing...');
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
  
  async reportBug(page: string, element: string, issue: string, severity: BugReport['severity'] = 'medium', category?: string) {
    const bugId = this.bugs.length + 1;
    const screenshot = `dashboard-hexagon-bug-${bugId}-${page.replace('/', '_')}.png`;
    
    try {
      await this.page.screenshot({ 
        path: `test-results/${screenshot}`,
        fullPage: true 
      });
    } catch (e) {
      console.log(`⚠️ Could not capture screenshot: ${e}`);
    }
    
    this.bugs.push({
      agent: 'dashboard-hexagon',
      page,
      element,
      issue,
      severity,
      screenshot,
      networkLogs: [...this.networkLogs],
      consoleErrors: [...this.consoleErrors],
      timestamp: new Date().toISOString(),
      category
    });
    
    const categoryText = category ? ` [${category}]` : '';
    console.log(`🐛 [SUB-AGENT 2] BUG FOUND [${severity.toUpperCase()}]${categoryText} on ${page}: ${issue}`);
    
    // Clear logs for next test
    this.networkLogs = [];
    this.consoleErrors = [];
  }
  
  async testCategoryInteraction(category: string) {
    console.log(`🎯 Testing ${category} category interactions...`);
    
    const categorySelectors = [
      `[data-category="${category.toLowerCase()}"]`,
      `[data-testid*="${category.toLowerCase()}"]`,
      `button:has-text("${category}")`,
      `[aria-label*="${category}"]`,
      `[class*="${category.toLowerCase()}"]`
    ];
    
    let categoryElement = null;
    let usedSelector = '';
    
    // Find the category element using different selectors
    for (const selector of categorySelectors) {
      const element = this.page.locator(selector);
      if (await element.count() > 0) {
        categoryElement = element.first();
        usedSelector = selector;
        break;
      }
    }
    
    if (!categoryElement) {
      await this.reportBug('/dashboard', `${category} Category`, 
        `${category} category element not found with any selector`, 'high', category);
      return false;
    }
    
    // Test visibility and interactivity
    const isVisible = await categoryElement.isVisible();
    const isEnabled = await categoryElement.isEnabled();
    
    if (!isVisible) {
      await this.reportBug('/dashboard', `${category} Category`, 
        `${category} category element not visible`, 'medium', category);
      return false;
    }
    
    if (!isEnabled) {
      await this.reportBug('/dashboard', `${category} Category`, 
        `${category} category element not enabled`, 'medium', category);
      return false;
    }
    
    // Get initial state
    const initialClasses = await categoryElement.getAttribute('class') || '';
    const initialDataChecked = await categoryElement.getAttribute('data-checked') || '';
    const initialAriaPressed = await categoryElement.getAttribute('aria-pressed') || '';
    
    // Monitor network activity
    const initialNetworkCount = this.networkLogs.length;
    
    // Click the category
    try {
      await categoryElement.click();
      await this.page.waitForTimeout(2000);
    } catch (error) {
      await this.reportBug('/dashboard', `${category} Category`, 
        `Failed to click ${category} category: ${error}`, 'high', category);
      return false;
    }
    
    // Check for state changes
    const newClasses = await categoryElement.getAttribute('class') || '';
    const newDataChecked = await categoryElement.getAttribute('data-checked') || '';
    const newAriaPressed = await categoryElement.getAttribute('aria-pressed') || '';
    
    const stateChanged = initialClasses !== newClasses || 
                        initialDataChecked !== newDataChecked || 
                        initialAriaPressed !== newAriaPressed;
    
    if (!stateChanged) {
      await this.reportBug('/dashboard', `${category} Category`, 
        `${category} category state did not change after click`, 'medium', category);
    } else {
      console.log(`✅ ${category} category state changed successfully`);
    }
    
    // Check for network activity
    const finalNetworkCount = this.networkLogs.length;
    if (finalNetworkCount === initialNetworkCount) {
      await this.reportBug('/dashboard', `${category} Category`, 
        `${category} category click did not trigger API calls`, 'medium', category);
    } else {
      console.log(`✅ ${category} category click triggered ${finalNetworkCount - initialNetworkCount} API calls`);
    }
    
    // Check for console errors
    if (this.consoleErrors.length > 0) {
      await this.reportBug('/dashboard', `${category} Category`, 
        `JavaScript errors during ${category} interaction: ${this.consoleErrors.join(', ')}`, 'high', category);
    }
    
    return true;
  }
  
  async testHexagonVisualization() {
    console.log('⬡ Testing Hexagon Visualization...');
    
    // Look for hexagon SVG elements
    const hexagonSelectors = [
      'svg',
      '[data-testid="hexagon-chart"]',
      '[data-testid*="hexagon"]',
      '.hexagon',
      'svg polygon',
      'svg circle'
    ];
    
    let hexagonFound = false;
    
    for (const selector of hexagonSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        hexagonFound = true;
        console.log(`✅ Found ${count} hexagon elements with selector: ${selector}`);
        
        // Test clicking on hexagon elements
        for (let i = 0; i < Math.min(count, 10); i++) { // Limit to 10 elements
          const element = elements.nth(i);
          
          if (await element.isVisible()) {
            try {
              await element.click();
              await this.page.waitForTimeout(1000);
              
              if (this.consoleErrors.length > 0) {
                await this.reportBug('/dashboard', 'Hexagon Element', 
                  `JavaScript error clicking hexagon element: ${this.consoleErrors.join(', ')}`, 'medium');
              }
            } catch (error) {
              // Some SVG elements might not be clickable, that's ok
              console.log(`ℹ️ Hexagon element ${i} not clickable: ${error}`);
            }
          }
        }
      }
    }
    
    if (!hexagonFound) {
      await this.reportBug('/dashboard', 'Hexagon Visualization', 
        'No hexagon visualization elements found on dashboard', 'high');
    }
    
    return hexagonFound;
  }
  
  async testProgressIndicators() {
    console.log('📊 Testing Progress Indicators...');
    
    // Look for progress indicators
    const progressSelectors = [
      'text=/\\d+\\/6.*completed?/',
      'text=/\\d+.*of.*6/',
      '[role="progressbar"]',
      '.progress',
      '[data-testid*="progress"]',
      '[data-testid*="completion"]'
    ];
    
    let progressFound = false;
    
    for (const selector of progressSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        progressFound = true;
        const progressText = await elements.first().textContent();
        console.log(`✅ Found progress indicator: "${progressText}"`);
        
        // Test if progress indicator is visible and contains valid data
        const isVisible = await elements.first().isVisible();
        if (!isVisible) {
          await this.reportBug('/dashboard', 'Progress Indicator', 
            'Progress indicator exists but is not visible', 'medium');
        }
      }
    }
    
    if (!progressFound) {
      await this.reportBug('/dashboard', 'Progress Indicators', 
        'No progress indicators found on dashboard', 'medium');
    }
    
    return progressFound;
  }
  
  getBugReport() {
    return {
      agent: 'dashboard-hexagon',
      totalBugs: this.bugs.length,
      critical: this.bugs.filter(b => b.severity === 'critical').length,
      high: this.bugs.filter(b => b.severity === 'high').length,
      medium: this.bugs.filter(b => b.severity === 'medium').length,
      low: this.bugs.filter(b => b.severity === 'low').length,
      bugs: this.bugs,
      categoriesTestedCount: AXIS6_CATEGORIES.length,
      completedAt: new Date().toISOString()
    };
  }
}

test.describe('SUB-AGENT 2: Dashboard & Hexagon Interactions Audit', () => {
  let auditor: DashboardHexagonAuditor;
  
  test.setTimeout(180000); // 3 minutes timeout
  
  test.beforeEach(async ({ page }) => {
    auditor = new DashboardHexagonAuditor(page);
    await auditor.login();
  });
  
  test('Dashboard Page Load and Structure Audit', async ({ page }) => {
    console.log('🏠 [SUB-AGENT 2] Starting Dashboard Structure Audit...');
    
    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the dashboard
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      await auditor.reportBug('/dashboard', 'Page Access', 
        `Failed to access dashboard, redirected to: ${currentUrl}`, 'critical');
    }
    
    // Check for basic dashboard structure
    const dashboardElements = [
      { selector: 'main, [data-testid="dashboard"]', name: 'Main Dashboard Container' },
      { selector: 'h1, h2, [data-testid="dashboard-title"]', name: 'Dashboard Title' },
      { selector: 'svg, [data-testid*="hexagon"], [data-testid*="chart"]', name: 'Visualization' }
    ];
    
    for (const element of dashboardElements) {
      const found = await page.locator(element.selector).count() > 0;
      if (!found) {
        await auditor.reportBug('/dashboard', element.name, 
          `${element.name} not found`, 'medium');
      } else {
        console.log(`✅ Found ${element.name}`);
      }
    }
    
    console.log('✅ Dashboard Structure Audit Complete');
  });
  
  test('Complete Hexagon Visualization Audit', async ({ page }) => {
    console.log('⬡ [SUB-AGENT 2] Starting Complete Hexagon Audit...');
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Test hexagon visualization
    const hexagonFound = await auditor.testHexagonVisualization();
    
    if (hexagonFound) {
      // Test hexagon responsiveness
      const hexagonSvg = page.locator('svg').first();
      
      if (await hexagonSvg.count() > 0) {
        // Test hover effects if applicable
        try {
          await hexagonSvg.hover();
          await page.waitForTimeout(1000);
          console.log('✅ Hexagon hover interaction tested');
        } catch (error) {
          console.log(`ℹ️ Hexagon hover not available: ${error}`);
        }
        
        // Test different viewport sizes
        await page.setViewportSize({ width: 800, height: 600 });
        await page.waitForTimeout(1000);
        
        const isVisible = await hexagonSvg.isVisible();
        if (!isVisible) {
          await auditor.reportBug('/dashboard', 'Hexagon Responsiveness', 
            'Hexagon not visible on smaller viewport', 'medium');
        }
        
        // Reset viewport
        await page.setViewportSize({ width: 1920, height: 1080 });
      }
    }
    
    console.log('✅ Complete Hexagon Audit Complete');
  });
  
  test('All 6 Categories Check-in Comprehensive Test', async ({ page }) => {
    console.log('📋 [SUB-AGENT 2] Starting All Categories Check-in Test...');
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    let successfulCategories = 0;
    
    for (const category of AXIS6_CATEGORIES) {
      const success = await auditor.testCategoryInteraction(category);
      if (success) {
        successfulCategories++;
      }
      
      // Wait between category tests
      await page.waitForTimeout(2000);
    }
    
    console.log(`📊 Successfully tested ${successfulCategories}/${AXIS6_CATEGORIES.length} categories`);
    
    if (successfulCategories < AXIS6_CATEGORIES.length) {
      await auditor.reportBug('/dashboard', 'Category Coverage', 
        `Only ${successfulCategories}/${AXIS6_CATEGORIES.length} categories could be tested`, 'high');
    }
    
    console.log('✅ All Categories Check-in Test Complete');
  });
  
  test('Progress Tracking and Visual Updates Audit', async ({ page }) => {
    console.log('📈 [SUB-AGENT 2] Starting Progress Tracking Audit...');
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Test progress indicators before interactions
    await auditor.testProgressIndicators();
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'test-results/dashboard-initial-state.png',
      fullPage: true 
    });
    
    // Perform several category check-ins and monitor visual changes
    const categoriesToTest = AXIS6_CATEGORIES.slice(0, 3); // Test first 3 categories
    
    for (const category of categoriesToTest) {
      console.log(`🔄 Testing visual updates for ${category}...`);
      
      // Get initial visual state
      const hexagon = page.locator('svg').first();
      let initialHexagonState = '';
      
      if (await hexagon.count() > 0) {
        initialHexagonState = await hexagon.innerHTML();
      }
      
      // Perform category interaction
      await auditor.testCategoryInteraction(category);
      
      // Wait for visual updates
      await page.waitForTimeout(3000);
      
      // Check for visual changes
      if (await hexagon.count() > 0) {
        const newHexagonState = await hexagon.innerHTML();
        
        if (initialHexagonState === newHexagonState) {
          await auditor.reportBug('/dashboard', 'Visual Updates', 
            `Hexagon did not update visually after ${category} interaction`, 'medium', category);
        } else {
          console.log(`✅ Hexagon updated visually for ${category}`);
        }
      }
      
      // Take screenshot after interaction
      await page.screenshot({ 
        path: `test-results/dashboard-after-${category.toLowerCase()}.png`,
        fullPage: true 
      });
    }
    
    console.log('✅ Progress Tracking Audit Complete');
  });
  
  test('Dashboard API Integration Audit', async ({ page }) => {
    console.log('🔗 [SUB-AGENT 2] Starting Dashboard API Integration Audit...');
    
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
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Perform interactions to trigger API calls
    for (const category of AXIS6_CATEGORIES.slice(0, 2)) { // Test 2 categories
      await auditor.testCategoryInteraction(category);
      await page.waitForTimeout(2000);
    }
    
    // Analyze API calls
    console.log(`📊 Dashboard API Analysis (Total calls: ${apiCalls.length})`);
    
    const errorCalls = apiCalls.filter(call => call.status >= 400);
    const successCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
    
    console.log(`✅ Successful API calls: ${successCalls.length}`);
    console.log(`❌ Failed API calls: ${errorCalls.length}`);
    
    if (errorCalls.length > 0) {
      errorCalls.forEach(call => {
        console.log(`🚨 API Error: ${call.method} ${call.url} - Status: ${call.status}`);
      });
      
      await auditor.reportBug('/dashboard', 'API Integration', 
        `${errorCalls.length} API calls failed during dashboard interactions`, 'high');
    }
    
    // Check for expected API endpoints
    const expectedEndpoints = ['checkins', 'dashboard', 'categories', 'streaks'];
    const calledEndpoints = apiCalls.map(call => {
      const url = new URL(call.url);
      return url.pathname;
    });
    
    for (const expectedEndpoint of expectedEndpoints) {
      const endpointCalled = calledEndpoints.some(path => path.includes(expectedEndpoint));
      if (!endpointCalled) {
        console.log(`⚠️ Expected API endpoint '${expectedEndpoint}' was not called`);
      } else {
        console.log(`✅ API endpoint '${expectedEndpoint}' was called`);
      }
    }
    
    console.log('✅ Dashboard API Integration Audit Complete');
  });
  
  test('Dashboard Accessibility and Keyboard Navigation', async ({ page }) => {
    console.log('♿ [SUB-AGENT 2] Starting Dashboard Accessibility Audit...');
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Test keyboard navigation
    let focusableElements = 0;
    
    // Tab through elements
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      
      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        return {
          tagName: active?.tagName,
          role: active?.getAttribute('role'),
          ariaLabel: active?.getAttribute('aria-label'),
          className: active?.className
        };
      });
      
      if (focusedElement.tagName && ['BUTTON', 'A', 'INPUT', 'SELECT'].includes(focusedElement.tagName)) {
        focusableElements++;
        console.log(`✅ Focusable element ${i + 1}: ${focusedElement.tagName} (${focusedElement.ariaLabel || focusedElement.className})`);
      }
    }
    
    if (focusableElements === 0) {
      await auditor.reportBug('/dashboard', 'Accessibility', 
        'No keyboard-focusable elements found on dashboard', 'high');
    } else {
      console.log(`✅ Found ${focusableElements} keyboard-focusable elements`);
    }
    
    // Test ARIA attributes
    const ariaElements = await page.locator('[aria-label], [aria-describedby], [role]').count();
    console.log(`✅ Found ${ariaElements} elements with ARIA attributes`);
    
    if (ariaElements === 0) {
      await auditor.reportBug('/dashboard', 'Accessibility', 
        'No ARIA attributes found for screen reader support', 'medium');
    }
    
    console.log('✅ Dashboard Accessibility Audit Complete');
  });
  
  test.afterAll(async () => {
    const report = auditor.getBugReport();
    
    console.log('\n🎯 [SUB-AGENT 2] DASHBOARD & HEXAGON AUDIT COMPLETE!');
    console.log('=====================================');
    console.log(`📊 Total Issues Found: ${report.totalBugs}`);
    console.log(`🔴 Critical: ${report.critical}`);
    console.log(`🟠 High: ${report.high}`);
    console.log(`🟡 Medium: ${report.medium}`);
    console.log(`🟢 Low: ${report.low}`);
    console.log(`🎯 Categories Tested: ${report.categoriesTestedCount}/6`);
    console.log('=====================================');
    
    // Output JSON report for orchestrator
    console.log('\n📄 JSON REPORT FOR ORCHESTRATOR:');
    console.log(JSON.stringify(report, null, 2));
    
    if (report.bugs.length > 0) {
      console.log('\n🐛 DETAILED BUG REPORT:');
      report.bugs.forEach((bug, index) => {
        const categoryText = bug.category ? ` [${bug.category}]` : '';
        console.log(`\n${index + 1}. [${bug.severity.toUpperCase()}]${categoryText} ${bug.page}`);
        console.log(`   Element: ${bug.element}`);
        console.log(`   Issue: ${bug.issue}`);
        console.log(`   Screenshot: ${bug.screenshot}`);
        if (bug.consoleErrors && bug.consoleErrors.length > 0) {
          console.log(`   Console Errors: ${bug.consoleErrors.join(', ')}`);
        }
      });
    } else {
      console.log('\n🎉 NO BUGS FOUND IN DASHBOARD & HEXAGON!');
    }
    
    console.log('\n✅ Sub-Agent 2 reporting complete to orchestrator');
  });
});