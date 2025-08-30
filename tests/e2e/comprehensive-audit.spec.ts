import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Comprehensive AXIS6 Production Audit
 *
 * This test suite systematically audits ALL functionality on axis6.app using real user credentials.
 * It clicks every button, tests every feature, and identifies all bugs for fixing.
 *
 * User: nadalpiantini@gmail.com
 * Password: Teclados#13
 */

const REAL_USER_CREDENTIALS = {
  email: 'nadalpiantini@gmail.com',
  password: 'Teclados#13'
};

const BASE_URL = 'https://axis6.app';

interface BugReport {
  page: string;
  element: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  screenshot?: string;
  networkLogs?: string[];
  consoleErrors?: string[];
}

class ComprehensiveAuditor {
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
      if (url.includes('/api/') || url.includes('supabase.co')) {
        this.networkLogs.push(`${request.method()} ${url}`);
      }
    });

    // Monitor network responses for errors
    this.page.on('response', response => {
      const url = response.url();
      if ((url.includes('/api/') || url.includes('supabase.co')) && response.status() >= 400) {
        this.networkLogs.push(`❌ ${response.status()} ${url}`);
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

  async reportBug(page: string, element: string, issue: string, severity: BugReport['severity'] = 'medium') {
    const screenshot = await this.page.screenshot({
      path: `test-results/bug-${this.bugs.length + 1}-${page.replace('/', '_')}.png`,
      fullPage: true
    });

    this.bugs.push({
      page,
      element,
      issue,
      severity,
      screenshot: `bug-${this.bugs.length + 1}-${page.replace('/', '_')}.png`,
      networkLogs: [...this.networkLogs],
      consoleErrors: [...this.consoleErrors]
    });

    console.log(`🐛 BUG FOUND [${severity.toUpperCase()}] on ${page}: ${issue}`);

    // Clear logs for next test
    this.networkLogs = [];
    this.consoleErrors = [];
  }

  async testInteractiveElement(selector: string, elementName: string, currentPage: string) {
    try {
      const element = this.page.locator(selector);
      const count = await element.count();

      if (count === 0) {
        await this.reportBug(currentPage, elementName, `Element not found: ${selector}`, 'low');
        return false;
      }

      for (let i = 0; i < count; i++) {
        const el = element.nth(i);

        if (await el.isVisible() && await el.isEnabled()) {
          try {
            await el.click();
            await this.page.waitForTimeout(1000);

            // Check for any errors after click
            if (this.consoleErrors.length > 0) {
              await this.reportBug(currentPage, elementName,
                `JavaScript error after clicking: ${this.consoleErrors.join(', ')}`, 'high');
            }

          } catch (error) {
            await this.reportBug(currentPage, elementName,
              `Click failed: ${error}`, 'medium');
          }
        } else {
          await this.reportBug(currentPage, elementName,
            `Element not clickable (visible: ${await el.isVisible()}, enabled: ${await el.isEnabled()})`, 'low');
        }
      }

      return true;
    } catch (error) {
      await this.reportBug(currentPage, elementName, `Test error: ${error}`, 'medium');
      return false;
    }
  }

  async auditPageNavigation(expectedUrl: string, pageName: string) {
    await this.page.waitForTimeout(2000);

    const currentUrl = this.page.url();
    if (!currentUrl.includes(expectedUrl)) {
      await this.reportBug(pageName, 'Navigation',
        `Expected URL containing '${expectedUrl}', got '${currentUrl}'`, 'high');
    }

    // Check for loading states
    const isLoading = await this.page.locator('[data-loading="true"], .loading, [class*="spinner"]').count() > 0;
    if (isLoading) {
      await this.page.waitForTimeout(5000); // Wait for loading to complete
    }
  }

  async auditFormSubmission(formSelector: string, formName: string, currentPage: string) {
    try {
      const form = this.page.locator(formSelector);
      if (await form.count() === 0) {
        await this.reportBug(currentPage, formName, 'Form not found', 'medium');
        return;
      }

      const submitButton = form.locator('button[type="submit"], button:has-text("Submit")');
      if (await submitButton.count() > 0) {
        const initialNetworkCount = this.networkLogs.length;
        await submitButton.click();
        await this.page.waitForTimeout(3000);

        // Check if form submission triggered network activity
        if (this.networkLogs.length === initialNetworkCount) {
          await this.reportBug(currentPage, formName,
            'Form submission did not trigger any network requests', 'medium');
        }
      }
    } catch (error) {
      await this.reportBug(currentPage, formName, `Form test error: ${error}`, 'medium');
    }
  }

  getBugReport() {
    return {
      totalBugs: this.bugs.length,
      critical: this.bugs.filter(b => b.severity === 'critical').length,
      high: this.bugs.filter(b => b.severity === 'high').length,
      medium: this.bugs.filter(b => b.severity === 'medium').length,
      low: this.bugs.filter(b => b.severity === 'low').length,
      bugs: this.bugs
    };
  }
}

test.describe('AXIS6 Comprehensive Production Audit', () => {
  let auditor: ComprehensiveAuditor;

  test.setTimeout(300000); // 5 minutes timeout for comprehensive testing

  test.beforeEach(async ({ page }) => {
    auditor = new ComprehensiveAuditor(page);
  });

  test('Full Application Audit with Real User Credentials', async ({ page }) => {
    console.log('🚀 Starting comprehensive AXIS6 audit...');

    // ========== PHASE 1: AUTHENTICATION ==========
    console.log('📝 PHASE 1: Testing Authentication');

    await page.goto(`${BASE_URL}/auth/login`);
    await auditor.auditPageNavigation('/auth/login', 'Login Page');

    // Test login form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

    if (await emailInput.count() === 0) {
      await auditor.reportBug('/auth/login', 'Email Input', 'Email input field not found', 'critical');
    }

    if (await passwordInput.count() === 0) {
      await auditor.reportBug('/auth/login', 'Password Input', 'Password input field not found', 'critical');
    }

    if (await loginButton.count() === 0) {
      await auditor.reportBug('/auth/login', 'Login Button', 'Login button not found', 'critical');
    }

    // Perform login
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      await emailInput.fill(REAL_USER_CREDENTIALS.email);
      await passwordInput.fill(REAL_USER_CREDENTIALS.password);

      if (await loginButton.count() > 0) {
        await loginButton.click();
        await page.waitForTimeout(5000);

        // Check if login was successful
        const currentUrl = page.url();
        if (currentUrl.includes('/auth/login')) {
          await auditor.reportBug('/auth/login', 'Login Process',
            'Login appears to have failed - still on login page', 'critical');
        } else {
          console.log('✅ Login successful');
        }
      }
    }

    // ========== PHASE 2: LANDING PAGE ==========
    console.log('📝 PHASE 2: Testing Landing Page');

    await page.goto(BASE_URL);
    await auditor.auditPageNavigation('/', 'Landing Page');

    // Test all interactive elements on landing page
    await auditor.testInteractiveElement('button', 'Buttons', '/');
    await auditor.testInteractiveElement('a[href]', 'Links', '/');
    await auditor.testInteractiveElement('[role="button"]', 'Button Roles', '/');

    // Test hexagon on landing page if present
    await auditor.testInteractiveElement('svg', 'SVG Elements', '/');
    await auditor.testInteractiveElement('svg circle', 'SVG Circles', '/');

    // ========== PHASE 3: DASHBOARD ==========
    console.log('📝 PHASE 3: Testing Dashboard');

    await page.goto(`${BASE_URL}/dashboard`);
    await auditor.auditPageNavigation('/dashboard', 'Dashboard');

    // Test hexagon interactions
    await auditor.testInteractiveElement('svg circle', 'Hexagon Circles', '/dashboard');
    await auditor.testInteractiveElement('[data-testid^="category-card"]', 'Category Cards', '/dashboard');

    // Test check-in buttons
    await auditor.testInteractiveElement('button:has-text("Check In")', 'Check In Buttons', '/dashboard');
    await auditor.testInteractiveElement('button:has-text("Complete")', 'Complete Buttons', '/dashboard');

    // Test navigation buttons
    await auditor.testInteractiveElement('[data-testid="nav-"]', 'Navigation Items', '/dashboard');

    // ========== PHASE 4: MY DAY PAGE ==========
    console.log('📝 PHASE 4: Testing My Day');

    await page.goto(`${BASE_URL}/my-day`);
    await auditor.auditPageNavigation('/my-day', 'My Day');

    // Test time block interactions
    await auditor.testInteractiveElement('button:has-text("Add")', 'Add Buttons', '/my-day');
    await auditor.testInteractiveElement('button:has-text("Edit")', 'Edit Buttons', '/my-day');
    await auditor.testInteractiveElement('button:has-text("Delete")', 'Delete Buttons', '/my-day');

    // Test time pickers and form elements
    await auditor.testInteractiveElement('select', 'Select Elements', '/my-day');
    await auditor.testInteractiveElement('input[type="time"]', 'Time Inputs', '/my-day');

    // ========== PHASE 5: PROFILE PAGE ==========
    console.log('📝 PHASE 5: Testing Profile');

    await page.goto(`${BASE_URL}/profile`);
    await auditor.auditPageNavigation('/profile', 'Profile');

    // Test profile form elements
    await auditor.testInteractiveElement('input[type="text"]', 'Text Inputs', '/profile');
    await auditor.testInteractiveElement('input[type="email"]', 'Email Inputs', '/profile');
    await auditor.testInteractiveElement('textarea', 'Textarea Elements', '/profile');
    await auditor.testInteractiveElement('button:has-text("Save")', 'Save Buttons', '/profile');
    await auditor.testInteractiveElement('button:has-text("Update")', 'Update Buttons', '/profile');

    // ========== PHASE 6: SETTINGS PAGE ==========
    console.log('📝 PHASE 6: Testing Settings');

    await page.goto(`${BASE_URL}/settings`);
    await auditor.auditPageNavigation('/settings', 'Settings');

    // Test settings controls
    await auditor.testInteractiveElement('input[type="checkbox"]', 'Checkboxes', '/settings');
    await auditor.testInteractiveElement('input[type="radio"]', 'Radio Buttons', '/settings');
    await auditor.testInteractiveElement('select', 'Select Dropdowns', '/settings');
    await auditor.testInteractiveElement('[role="switch"]', 'Switch Controls', '/settings');

    // ========== PHASE 7: ANALYTICS PAGE ==========
    console.log('📝 PHASE 7: Testing Analytics');

    await page.goto(`${BASE_URL}/analytics`);
    await auditor.auditPageNavigation('/analytics', 'Analytics');

    // Test analytics interactions
    await auditor.testInteractiveElement('button:has-text("Filter")', 'Filter Buttons', '/analytics');
    await auditor.testInteractiveElement('button:has-text("Export")', 'Export Buttons', '/analytics');
    await auditor.testInteractiveElement('[data-testid^="chart-"]', 'Chart Elements', '/analytics');

    // ========== PHASE 8: ACHIEVEMENTS PAGE ==========
    console.log('📝 PHASE 8: Testing Achievements');

    await page.goto(`${BASE_URL}/achievements`);
    await auditor.auditPageNavigation('/achievements', 'Achievements');

    // Test achievement interactions
    await auditor.testInteractiveElement('[data-testid^="achievement-"]', 'Achievement Items', '/achievements');
    await auditor.testInteractiveElement('button:has-text("View")', 'View Buttons', '/achievements');

    // ========== PHASE 9: NAVIGATION TESTING ==========
    console.log('📝 PHASE 9: Testing Navigation');

    const pages = [
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/my-day', name: 'My Day' },
      { url: '/analytics', name: 'Analytics' },
      { url: '/achievements', name: 'Achievements' },
      { url: '/profile', name: 'Profile' },
      { url: '/settings', name: 'Settings' }
    ];

    for (const pageInfo of pages) {
      await page.goto(`${BASE_URL}${pageInfo.url}`);
      await auditor.auditPageNavigation(pageInfo.url, pageInfo.name);

      // Test browser back button
      await page.goBack();
      await page.waitForTimeout(1000);

      // Test browser forward button
      await page.goForward();
      await page.waitForTimeout(1000);
    }

    // ========== PHASE 10: FORM SUBMISSIONS ==========
    console.log('📝 PHASE 10: Testing Forms');

    // Test various forms throughout the app
    const formsToTest = [
      { page: '/profile', selector: 'form', name: 'Profile Form' },
      { page: '/settings', selector: 'form', name: 'Settings Form' }
    ];

    for (const formInfo of formsToTest) {
      await page.goto(`${BASE_URL}${formInfo.page}`);
      await auditor.auditFormSubmission(formInfo.selector, formInfo.name, formInfo.page);
    }

    // ========== FINAL REPORT ==========
    const report = auditor.getBugReport();
    console.log('\n🎯 COMPREHENSIVE AUDIT COMPLETE!');
    console.log('=====================================');
    console.log(`📊 Total Issues Found: ${report.totalBugs}`);
    console.log(`🔴 Critical: ${report.critical}`);
    console.log(`🟠 High: ${report.high}`);
    console.log(`🟡 Medium: ${report.medium}`);
    console.log(`🟢 Low: ${report.low}`);
    console.log('=====================================');

    if (report.bugs.length > 0) {
      console.log('\n🐛 DETAILED BUG REPORT:');
      report.bugs.forEach((bug, index) => {
        console.log(`\n${index + 1}. [${bug.severity.toUpperCase()}] ${bug.page}`);
        console.log(`   Element: ${bug.element}`);
        console.log(`   Issue: ${bug.issue}`);
        if (bug.consoleErrors?.length > 0) {
          console.log(`   Console Errors: ${bug.consoleErrors.join(', ')}`);
        }
        if (bug.networkLogs?.length > 0) {
          console.log(`   Network Issues: ${bug.networkLogs.filter(log => log.includes('❌')).join(', ')}`);
        }
      });
    } else {
      console.log('\n🎉 NO BUGS FOUND! Application is working perfectly!');
    }

    // Allow some bugs for now, but fail if critical issues are found
    expect(report.critical).toBe(0);
  });

  test('Test Hexagon Category Interactions', async ({ page }) => {
    console.log('🎯 Testing Hexagon Category Interactions');

    // Login first
    await page.goto(`${BASE_URL}/auth/login`);
    await page.locator('input[type="email"]').fill(REAL_USER_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(REAL_USER_CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Find and test each hexagon segment
    const hexagonSegments = page.locator('svg circle, svg path[class*="category"], [data-category]');
    const segmentCount = await hexagonSegments.count();

    console.log(`Found ${segmentCount} hexagon segments to test`);

    for (let i = 0; i < segmentCount; i++) {
      const segment = hexagonSegments.nth(i);

      if (await segment.isVisible()) {
        console.log(`Testing hexagon segment ${i + 1}/${segmentCount}`);

        // Get initial state
        const initialClasses = await segment.getAttribute('class') || '';
        const initialFill = await segment.getAttribute('fill') || '';

        // Click the segment
        await segment.click();
        await page.waitForTimeout(2000);

        // Check for state change
        const newClasses = await segment.getAttribute('class') || '';
        const newFill = await segment.getAttribute('fill') || '';

        if (initialClasses === newClasses && initialFill === newFill) {
          console.log(`⚠️ Hexagon segment ${i + 1} did not change state after click`);
        } else {
          console.log(`✅ Hexagon segment ${i + 1} changed state successfully`);
        }
      }
    }
  });

  test('Test All Category Check-ins', async ({ page }) => {
    console.log('📋 Testing All Category Check-ins');

    // Login first
    await page.goto(`${BASE_URL}/auth/login`);
    await page.locator('input[type="email"]').fill(REAL_USER_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(REAL_USER_CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Go to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // The 6 AXIS6 categories
    const expectedCategories = ['Physical', 'Mental', 'Emotional', 'Social', 'Spiritual', 'Material'];

    for (const category of expectedCategories) {
      console.log(`Testing ${category} category check-in...`);

      // Look for category-specific elements
      const categoryButton = page.locator(`[data-category="${category.toLowerCase()}"], button:has-text("${category}"), [data-testid*="${category.toLowerCase()}"]`);
      const checkInButton = page.locator(`button:has-text("Check In ${category}"), button:has-text("Complete ${category}")`);

      if (await categoryButton.count() > 0) {
        await categoryButton.first().click();
        await page.waitForTimeout(1500);
      } else if (await checkInButton.count() > 0) {
        await checkInButton.first().click();
        await page.waitForTimeout(1500);
      } else {
        console.log(`⚠️ No clickable element found for ${category} category`);
      }
    }

    // Verify completion counter if present
    const completionCounter = page.locator('text=/\\d+\\/6.*completed?/, text=/\\d+.*of.*6/');
    if (await completionCounter.count() > 0) {
      const counterText = await completionCounter.textContent();
      console.log(`Current completion status: ${counterText}`);
    }
  });

  test('Test All API Endpoints', async ({ page }) => {
    console.log('🔗 Testing API Endpoints');

    // Monitor all network requests
    const apiRequests: { url: string; method: string; status: number; }[] = [];

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('supabase.co')) {
        apiRequests.push({
          url,
          method: response.request().method(),
          status: response.status()
        });
      }
    });

    // Login and navigate through app to trigger API calls
    await page.goto(`${BASE_URL}/auth/login`);
    await page.locator('input[type="email"]').fill(REAL_USER_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(REAL_USER_CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    // Visit each page to trigger API calls
    const pagesToVisit = ['/dashboard', '/my-day', '/profile', '/settings', '/analytics', '/achievements'];

    for (const pageUrl of pagesToVisit) {
      console.log(`Visiting ${pageUrl} to trigger API calls...`);
      await page.goto(`${BASE_URL}${pageUrl}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // Analyze API requests
    console.log(`\n📊 API Request Analysis (Total: ${apiRequests.length})`);

    const errorRequests = apiRequests.filter(req => req.status >= 400);
    if (errorRequests.length > 0) {
      console.log(`\n🚨 API Errors Found (${errorRequests.length}):`);
      errorRequests.forEach(req => {
        console.log(`   ${req.method} ${req.url} - Status: ${req.status}`);
      });
    } else {
      console.log('✅ All API requests returned successful status codes');
    }

    // Group by endpoint
    const endpointSummary = apiRequests.reduce((acc, req) => {
      const endpoint = req.url.split('?')[0]; // Remove query parameters
      if (!acc[endpoint]) {
        acc[endpoint] = { count: 0, methods: new Set(), statuses: new Set() };
      }
      acc[endpoint].count++;
      acc[endpoint].methods.add(req.method);
      acc[endpoint].statuses.add(req.status);
      return acc;
    }, {} as Record<string, { count: number; methods: Set<string>; statuses: Set<number> }>);

    console.log('\n📈 Endpoint Summary:');
    Object.entries(endpointSummary).forEach(([endpoint, stats]) => {
      const cleanEndpoint = endpoint.replace(/^https?:\/\/[^\/]+/, '');
      console.log(`   ${cleanEndpoint}: ${stats.count} calls, Methods: [${Array.from(stats.methods).join(', ')}], Status: [${Array.from(stats.statuses).join(', ')}]`);
    });

    // Fail test if there are critical API errors
    const criticalErrors = errorRequests.filter(req => req.status >= 500);
    expect(criticalErrors.length).toBe(0);
  });
});
