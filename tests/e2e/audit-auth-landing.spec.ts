import { test, expect, Page } from '@playwright/test';

/**
 * SUB-AGENTE 1: Auth & Landing Page Comprehensive Audit
 * 
 * Specializes in:
 * - Landing page (/) - Hero, features, navigation
 * - Auth pages (/auth/login, /auth/register, /auth/forgot)
 * - Login flow with real credentials (nadalpiantini@gmail.com / Teclados#13)
 * - Form validations and error handling
 * - Cross-page navigation testing
 * 
 * Execution: PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-auth-landing.spec.ts --reporter=line
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
}

class AuthLandingAuditor {
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
      if (url.includes('/api/') || url.includes('supabase.co') || url.includes('auth')) {
        this.networkLogs.push(`${request.method()} ${url}`);
      }
    });
    
    // Monitor network responses for errors
    this.page.on('response', response => {
      const url = response.url();
      if ((url.includes('/api/') || url.includes('supabase.co') || url.includes('auth')) && response.status() >= 400) {
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
  
  async reportBug(page: string, element: string, issue: string, severity: BugReport['severity'] = 'medium') {
    const bugId = this.bugs.length + 1;
    const screenshot = `auth-landing-bug-${bugId}-${page.replace('/', '_')}.png`;
    
    try {
      await this.page.screenshot({ 
        path: `test-results/${screenshot}`,
        fullPage: true 
      });
    } catch (e) {
      console.log(`⚠️ Could not capture screenshot: ${e}`);
    }
    
    this.bugs.push({
      agent: 'auth-landing',
      page,
      element,
      issue,
      severity,
      screenshot,
      networkLogs: [...this.networkLogs],
      consoleErrors: [...this.consoleErrors],
      timestamp: new Date().toISOString()
    });
    
    console.log(`🐛 [SUB-AGENT 1] BUG FOUND [${severity.toUpperCase()}] on ${page}: ${issue}`);
    
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
        }
      }
      
      return true;
    } catch (error) {
      await this.reportBug(currentPage, elementName, `Test error: ${error}`, 'medium');
      return false;
    }
  }
  
  getBugReport() {
    return {
      agent: 'auth-landing',
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

test.describe('SUB-AGENT 1: Auth & Landing Page Comprehensive Audit', () => {
  let auditor: AuthLandingAuditor;
  
  test.setTimeout(120000); // 2 minutes timeout
  
  test.beforeEach(async ({ page }) => {
    auditor = new AuthLandingAuditor(page);
  });
  
  test('Landing Page Complete Audit', async ({ page }) => {
    console.log('🏠 [SUB-AGENT 1] Starting Landing Page Audit...');
    
    // Navigate to landing page
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check page loaded correctly
    const currentUrl = page.url();
    if (!currentUrl.includes(BASE_URL)) {
      await auditor.reportBug('/', 'Navigation', `Failed to load landing page, got: ${currentUrl}`, 'critical');
    }
    
    // Test hero section
    console.log('🎯 Testing Hero Section...');
    await auditor.testInteractiveElement('h1, [data-testid="hero-title"]', 'Hero Title', '/');
    
    // Test all buttons on landing page
    console.log('🔘 Testing Landing Page Buttons...');
    await auditor.testInteractiveElement('button', 'Buttons', '/');
    await auditor.testInteractiveElement('a[href*="auth"], a:has-text("Start"), a:has-text("Login"), a:has-text("Sign")', 'Auth Links', '/');
    
    // Test navigation menu
    console.log('🧭 Testing Navigation Menu...');
    await auditor.testInteractiveElement('nav a, [data-testid*="nav"]', 'Navigation Links', '/');
    
    // Test hexagon visualization if present
    console.log('⬡ Testing Landing Page Hexagon...');
    await auditor.testInteractiveElement('svg', 'SVG Elements', '/');
    await auditor.testInteractiveElement('svg circle, svg path', 'SVG Interactive Elements', '/');
    
    // Test features section
    console.log('✨ Testing Features Section...');
    await auditor.testInteractiveElement('[data-testid*="feature"], .feature', 'Feature Cards', '/');
    
    // Test footer links
    console.log('🔗 Testing Footer...');
    await auditor.testInteractiveElement('footer a', 'Footer Links', '/');
    
    console.log('✅ Landing Page Audit Complete');
  });
  
  test('Authentication Pages Navigation Audit', async ({ page }) => {
    console.log('🔐 [SUB-AGENT 1] Starting Auth Navigation Audit...');
    
    // Test navigation to login page
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Find and click login link
    const loginLinks = page.locator('a[href*="/auth/login"], a:has-text("Login"), a:has-text("Sign In")');
    const loginLinkCount = await loginLinks.count();
    
    if (loginLinkCount === 0) {
      await auditor.reportBug('/', 'Login Link', 'No login link found on landing page', 'high');
    } else {
      await loginLinks.first().click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (!currentUrl.includes('/auth/login')) {
        await auditor.reportBug('/', 'Login Navigation', `Login link did not navigate to login page, got: ${currentUrl}`, 'high');
      }
    }
    
    // Test navigation to register page
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const registerLinks = page.locator('a[href*="/auth/register"], a:has-text("Register"), a:has-text("Sign Up"), a:has-text("Start Free")');
    const registerLinkCount = await registerLinks.count();
    
    if (registerLinkCount === 0) {
      await auditor.reportBug('/', 'Register Link', 'No register link found on landing page', 'medium');
    } else {
      await registerLinks.first().click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (!currentUrl.includes('/auth/register')) {
        await auditor.reportBug('/', 'Register Navigation', `Register link did not navigate to register page, got: ${currentUrl}`, 'high');
      }
    }
    
    console.log('✅ Auth Navigation Audit Complete');
  });
  
  test('Login Page Complete Audit', async ({ page }) => {
    console.log('🔑 [SUB-AGENT 1] Starting Login Page Audit...');
    
    // Navigate to login page
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    
    // Test form elements presence
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
      await auditor.reportBug('/auth/login', 'Login Button', 'Login submit button not found', 'critical');
    }
    
    // Test form interactions
    console.log('📝 Testing Login Form Interactions...');
    await auditor.testInteractiveElement('input', 'Form Inputs', '/auth/login');
    await auditor.testInteractiveElement('button', 'Form Buttons', '/auth/login');
    
    // Test forgot password link
    await auditor.testInteractiveElement('a[href*="forgot"], a:has-text("Forgot")', 'Forgot Password Link', '/auth/login');
    
    // Test register link
    await auditor.testInteractiveElement('a[href*="register"], a:has-text("Sign Up"), a:has-text("Register")', 'Register Link', '/auth/login');
    
    console.log('✅ Login Page Audit Complete');
  });
  
  test('Real User Login Flow Audit', async ({ page }) => {
    console.log('🚀 [SUB-AGENT 1] Starting Real User Login Flow...');
    
    // Navigate to login page
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill login form with real credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
      console.log('🔐 Attempting login with real credentials...');
      
      await emailInput.fill(REAL_USER_CREDENTIALS.email);
      await passwordInput.fill(REAL_USER_CREDENTIALS.password);
      
      // Monitor network activity during login
      const initialNetworkCount = auditor['networkLogs'].length;
      
      await loginButton.click();
      await page.waitForTimeout(5000);
      
      // Check if login was successful
      const currentUrl = page.url();
      const finalNetworkCount = auditor['networkLogs'].length;
      
      if (currentUrl.includes('/auth/login')) {
        // Check for error messages
        const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');
        const hasErrorMessage = await errorMessage.count() > 0;
        
        if (hasErrorMessage) {
          const errorText = await errorMessage.first().textContent();
          await auditor.reportBug('/auth/login', 'Login Error', `Login failed with error: ${errorText}`, 'high');
        } else {
          await auditor.reportBug('/auth/login', 'Login Process', 'Login appears to have failed - no redirect and no error message', 'critical');
        }
      } else if (currentUrl.includes('/dashboard') || currentUrl.includes('/')) {
        console.log('✅ Login successful - redirected to:', currentUrl);
      } else {
        await auditor.reportBug('/auth/login', 'Login Redirect', `Unexpected redirect after login: ${currentUrl}`, 'medium');
      }
      
      // Check if login triggered network activity
      if (finalNetworkCount === initialNetworkCount) {
        await auditor.reportBug('/auth/login', 'Network Activity', 'Login submission did not trigger any network requests', 'high');
      } else {
        console.log(`✅ Login triggered ${finalNetworkCount - initialNetworkCount} network requests`);
      }
      
    } else {
      await auditor.reportBug('/auth/login', 'Form Elements', 'Cannot test login - missing form elements', 'critical');
    }
    
    console.log('✅ Real User Login Flow Complete');
  });
  
  test('Register Page Complete Audit', async ({ page }) => {
    console.log('📝 [SUB-AGENT 1] Starting Register Page Audit...');
    
    // Navigate to register page
    await page.goto(`${BASE_URL}/auth/register`);
    await page.waitForLoadState('networkidle');
    
    // Test form elements presence
    const nameInput = page.locator('input[name="name"], input[type="text"]');
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const registerButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Register")');
    
    console.log('🔍 Checking Register Form Elements...');
    
    if (await nameInput.count() === 0) {
      await auditor.reportBug('/auth/register', 'Name Input', 'Name input field not found', 'medium');
    }
    
    if (await emailInput.count() === 0) {
      await auditor.reportBug('/auth/register', 'Email Input', 'Email input field not found', 'critical');
    }
    
    if (await passwordInput.count() === 0) {
      await auditor.reportBug('/auth/register', 'Password Input', 'Password input field not found', 'critical');
    }
    
    if (await registerButton.count() === 0) {
      await auditor.reportBug('/auth/register', 'Register Button', 'Register submit button not found', 'critical');
    }
    
    // Test form interactions
    console.log('📋 Testing Register Form Interactions...');
    await auditor.testInteractiveElement('input', 'Form Inputs', '/auth/register');
    await auditor.testInteractiveElement('button', 'Form Buttons', '/auth/register');
    await auditor.testInteractiveElement('input[type="checkbox"]', 'Checkboxes', '/auth/register');
    
    // Test login link
    await auditor.testInteractiveElement('a[href*="login"], a:has-text("Sign In"), a:has-text("Login")', 'Login Link', '/auth/register');
    
    console.log('✅ Register Page Audit Complete');
  });
  
  test('Forgot Password Page Audit', async ({ page }) => {
    console.log('🔒 [SUB-AGENT 1] Starting Forgot Password Page Audit...');
    
    // Navigate to forgot password page
    await page.goto(`${BASE_URL}/auth/forgot`);
    await page.waitForLoadState('networkidle');
    
    // Check if page loads or redirects
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/forgot')) {
      console.log('✅ Forgot password page exists');
      
      // Test form elements
      await auditor.testInteractiveElement('input[type="email"], input[name="email"]', 'Email Input', '/auth/forgot');
      await auditor.testInteractiveElement('button[type="submit"], button:has-text("Reset"), button:has-text("Send")', 'Submit Button', '/auth/forgot');
      await auditor.testInteractiveElement('a[href*="login"], a:has-text("Back")', 'Back Links', '/auth/forgot');
      
    } else {
      await auditor.reportBug('/auth/forgot', 'Page Access', `Forgot password page not accessible, redirected to: ${currentUrl}`, 'medium');
    }
    
    console.log('✅ Forgot Password Audit Complete');
  });
  
  test('Cross-Page Navigation Flow', async ({ page }) => {
    console.log('🔄 [SUB-AGENT 1] Starting Cross-Page Navigation Audit...');
    
    const navigationTests = [
      { from: '/', to: '/auth/login', linkSelector: 'a[href*="login"], a:has-text("Login")' },
      { from: '/', to: '/auth/register', linkSelector: 'a[href*="register"], a:has-text("Sign Up"), a:has-text("Start")' },
      { from: '/auth/login', to: '/auth/register', linkSelector: 'a[href*="register"], a:has-text("Sign Up")' },
      { from: '/auth/register', to: '/auth/login', linkSelector: 'a[href*="login"], a:has-text("Sign In")' },
      { from: '/auth/login', to: '/auth/forgot', linkSelector: 'a[href*="forgot"], a:has-text("Forgot")' }
    ];
    
    for (const navTest of navigationTests) {
      console.log(`🔗 Testing navigation: ${navTest.from} → ${navTest.to}`);
      
      await page.goto(`${BASE_URL}${navTest.from}`);
      await page.waitForLoadState('networkidle');
      
      const link = page.locator(navTest.linkSelector);
      const linkCount = await link.count();
      
      if (linkCount === 0) {
        await auditor.reportBug(navTest.from, 'Navigation Link', `No link found to navigate to ${navTest.to}`, 'medium');
      } else {
        await link.first().click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        if (!currentUrl.includes(navTest.to)) {
          await auditor.reportBug(navTest.from, 'Navigation', 
            `Navigation failed: expected ${navTest.to}, got ${currentUrl}`, 'high');
        }
      }
    }
    
    console.log('✅ Cross-Page Navigation Audit Complete');
  });
  
  test.afterAll(async () => {
    const report = auditor.getBugReport();
    
    console.log('\n🎯 [SUB-AGENT 1] AUTH & LANDING AUDIT COMPLETE!');
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
        console.log(`\n${index + 1}. [${bug.severity.toUpperCase()}] ${bug.page}`);
        console.log(`   Element: ${bug.element}`);
        console.log(`   Issue: ${bug.issue}`);
        console.log(`   Screenshot: ${bug.screenshot}`);
        if (bug.consoleErrors && bug.consoleErrors.length > 0) {
          console.log(`   Console Errors: ${bug.consoleErrors.join(', ')}`);
        }
      });
    } else {
      console.log('\n🎉 NO BUGS FOUND IN AUTH & LANDING PAGES!');
    }
    
    // Don't fail the test, let orchestrator handle critical bugs
    console.log('\n✅ Sub-Agent 1 reporting complete to orchestrator');
  });
});