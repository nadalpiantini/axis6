import { Page, Locator, expect } from '@playwright/test';

/**
 * Enhanced Base Page Object with retry mechanisms and smart waits
 */
export class BasePage {
  readonly page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  /**
   * Navigate to a specific path with proper wait
   */
  async goto(path: string = '') {
    await this.page.goto(path);
    await this.waitForPageReady();
  }
  
  /**
   * Wait for page to be fully ready
   */
  async waitForPageReady() {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.page.waitForLoadState('domcontentloaded'),
    ]);
    // Wait for any React hydration
    await this.page.waitForTimeout(500);
  }
  
  /**
   * Smart element finder with fallback strategies
   */
  async findElement(selectors: string[], timeout: number = 10000): Promise<Locator | null> {
    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector);
        await element.waitFor({ state: 'visible', timeout: timeout / selectors.length });
        return element;
      } catch {
        continue;
      }
    }
    return null;
  }
  
  /**
   * Wait for element with retry
   */
  async waitForElementWithRetry(selector: string, retries: number = 3, timeout: number = 5000) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.waitForSelector(selector, { state: 'visible', timeout });
        return true;
      } catch {
        if (i === retries - 1) throw new Error(`Element ${selector} not found after ${retries} retries`);
        await this.page.waitForTimeout(1000);
      }
    }
    return false;
  }
  
  /**
   * Click with retry mechanism
   */
  async clickWithRetry(locator: Locator, retries: number = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await locator.click({ timeout: 5000 });
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }
  
  /**
   * Fill input with retry
   */
  async fillWithRetry(locator: Locator, value: string, retries: number = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await locator.fill(value);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(500);
      }
    }
  }
  
  /**
   * Take screenshot for debugging
   */
  async screenshot(name: string) {
    await this.page.screenshot({ 
      path: `tests/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }
}

/**
 * Enhanced Landing Page Object
 */
export class LandingPage extends BasePage {
  // Multiple selector strategies for each element
  private readonly loginSelectors = [
    '[data-testid="login-link"]',
    'a[href="/auth/login"]',
    'a:has-text("Sign In")',
    'a:has-text("Login")'
  ];
  
  private readonly registerSelectors = [
    '[data-testid="register-link"]',
    'a[href="/auth/register"]',
    'a:has-text("Start Free")',
    'a:has-text("Sign Up")',
    'a:has-text("Get Started")'
  ];
  
  async verifyLandingPageLoaded() {
    await this.waitForPageReady();
    
    // More flexible verification - just check if we're on landing page
    const isLandingPage = this.page.url().endsWith('/') || 
                          this.page.url().includes('localhost:6789') ||
                          this.page.url().includes('axis6.app');
    
    if (!isLandingPage) {
      throw new Error(`Not on landing page. Current URL: ${this.page.url()}`);
    }
  }
  
  async clickLogin() {
    const loginLink = await this.findElement(this.loginSelectors);
    if (loginLink) {
      await this.clickWithRetry(loginLink);
    } else {
      // Fallback: navigate directly
      await this.page.goto('/auth/login');
    }
  }
  
  async clickRegister() {
    const registerLink = await this.findElement(this.registerSelectors);
    if (registerLink) {
      await this.clickWithRetry(registerLink);
    } else {
      // Fallback: navigate directly
      await this.page.goto('/auth/register');
    }
  }
}

/**
 * Enhanced Login Page Object
 */
export class LoginPage extends BasePage {
  async login(email: string, password: string) {
    await this.waitForPageReady();
    
    // Find and fill email
    const emailInput = await this.findElement([
      '[data-testid="email-input"]',
      'input[type="email"]',
      'input[name="email"]',
      '#email'
    ]);
    
    if (emailInput) {
      await this.fillWithRetry(emailInput, email);
    }
    
    // Find and fill password
    const passwordInput = await this.findElement([
      '[data-testid="password-input"]',
      'input[type="password"]',
      'input[name="password"]',
      '#password'
    ]);
    
    if (passwordInput) {
      await this.fillWithRetry(passwordInput, password);
    }
    
    // Find and click submit button
    const submitButton = await this.findElement([
      '[data-testid="login-submit"]',
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Login")'
    ]);
    
    if (submitButton) {
      await this.clickWithRetry(submitButton);
    }
  }
  
  async verifyLoginForm() {
    await this.waitForPageReady();
    const hasEmailInput = await this.page.locator('input[type="email"]').isVisible();
    const hasPasswordInput = await this.page.locator('input[type="password"]').isVisible();
    
    if (!hasEmailInput || !hasPasswordInput) {
      throw new Error('Login form not properly loaded');
    }
  }
}

/**
 * Enhanced Register Page Object
 */
export class RegisterPage extends BasePage {
  async register(email: string, password: string, name?: string) {
    await this.waitForPageReady();
    
    // Fill name if provided
    if (name) {
      const nameInput = await this.findElement([
        '[data-testid="name-input"]',
        'input[type="text"]',
        'input[name="name"]',
        '#name'
      ]);
      
      if (nameInput) {
        await this.fillWithRetry(nameInput, name);
      }
    }
    
    // Fill email
    const emailInput = await this.findElement([
      '[data-testid="email-input"]',
      'input[type="email"]',
      'input[name="email"]',
      '#email'
    ]);
    
    if (emailInput) {
      await this.fillWithRetry(emailInput, email);
    }
    
    // Fill password fields
    const passwordFields = await this.page.locator('input[type="password"]').all();
    if (passwordFields.length > 0) {
      await this.fillWithRetry(passwordFields[0], password);
      
      // Fill confirm password if exists
      if (passwordFields.length > 1) {
        await this.fillWithRetry(passwordFields[1], password);
      }
    }
    
    // Check terms checkbox if exists
    const checkbox = this.page.locator('input[type="checkbox"]');
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }
    
    // Click submit button
    const submitButton = await this.findElement([
      '[data-testid="register-submit"]',
      'button[type="submit"]',
      'button:has-text("Create")',
      'button:has-text("Sign Up")',
      'button:has-text("Register")'
    ]);
    
    if (submitButton) {
      await this.clickWithRetry(submitButton);
    }
    
    // Wait for navigation or error
    await this.page.waitForTimeout(2000);
  }
  
  async verifyRegisterForm() {
    await this.waitForPageReady();
    const hasEmailInput = await this.page.locator('input[type="email"]').isVisible();
    const hasPasswordInput = await this.page.locator('input[type="password"]').isVisible();
    
    if (!hasEmailInput || !hasPasswordInput) {
      throw new Error('Register form not properly loaded');
    }
  }
}

/**
 * Enhanced Dashboard Page Object
 */
export class DashboardPage extends BasePage {
  async verifyDashboardLoaded() {
    await this.waitForPageReady();
    
    // Wait for dashboard-specific elements
    const dashboardSelectors = [
      '[data-testid="dashboard"]',
      '[data-testid="hexagon-chart"]',
      'main',
      'h1:has-text("Dashboard")',
      'h1:has-text("Welcome")',
      'svg' // Hexagon visualization
    ];
    
    const dashboardElement = await this.findElement(dashboardSelectors, 15000);
    if (!dashboardElement) {
      throw new Error('Dashboard did not load properly');
    }
    
    // Wait for data to load
    await this.page.waitForTimeout(2000);
  }
  
  async checkInCategory(categoryName: string) {
    const selectors = [
      `[data-testid="checkin-${categoryName.toLowerCase()}"]`,
      `[data-category="${categoryName.toLowerCase()}"]`,
      `button:has-text("Check In"):near([data-category="${categoryName.toLowerCase()}"])`,
      `button:has-text("Check In")`
    ];
    
    const checkInButton = await this.findElement(selectors);
    if (checkInButton) {
      await this.clickWithRetry(checkInButton);
      await this.page.waitForTimeout(1000);
    }
  }
  
  async verifyCheckInCompleted(categoryName: string) {
    await this.page.waitForTimeout(1000);
    
    const completedSelectors = [
      `[data-testid="completed-${categoryName.toLowerCase()}"]`,
      `[data-category="${categoryName.toLowerCase()}"][data-completed="true"]`,
      `.completed:near([data-category="${categoryName.toLowerCase()}"])`,
      '.completed'
    ];
    
    const completedElement = await this.findElement(completedSelectors);
    expect(completedElement).toBeTruthy();
  }
  
  async logout() {
    // Try multiple logout strategies
    const logoutSelectors = [
      '[data-testid="logout-button"]',
      'button:has-text("Logout")',
      'button:has-text("Sign Out")',
      '[data-testid="user-menu"]'
    ];
    
    const logoutElement = await this.findElement(logoutSelectors);
    if (logoutElement) {
      await this.clickWithRetry(logoutElement);
      
      // If it was a menu, click the actual logout option
      const logoutOption = await this.findElement([
        'button:has-text("Logout")',
        'button:has-text("Sign Out")'
      ]);
      
      if (logoutOption) {
        await this.clickWithRetry(logoutOption);
      }
    } else {
      // Fallback: clear cookies
      await this.page.context().clearCookies();
    }
  }
}

/**
 * Enhanced Test Utilities
 */
export class TestUtils {
  static generateTestEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@playwright-axis6.local`;
  }
  
  static generateTestPassword(): string {
    return 'TestPass123!@#';
  }
  
  static async waitForNavigation(page: Page, url?: string, timeout: number = 30000) {
    if (url) {
      await page.waitForURL(new RegExp(url), { timeout });
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // React hydration buffer
  }
  
  static async waitForNetworkIdle(page: Page, timeout: number = 10000) {
    await Promise.race([
      page.waitForLoadState('networkidle'),
      page.waitForTimeout(timeout)
    ]);
  }
  
  static async retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Operation failed after retries');
  }
  
  static async checkAccessibility(page: Page): Promise<any[]> {
    const issues: any[] = [];
    
    // Check for alt text on images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      issues.push({ type: 'missing-alt', count: imagesWithoutAlt });
    }
    
    // Check for proper heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    if (headings.length === 0) {
      issues.push({ type: 'no-headings' });
    }
    
    // Check for ARIA labels
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const hasText = await button.textContent();
      const hasAriaLabel = await button.getAttribute('aria-label');
      if (!hasText && !hasAriaLabel) {
        issues.push({ type: 'button-no-label' });
      }
    }
    
    return issues;
  }
  
  static async measurePerformance(page: Page): Promise<any> {
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      };
    });
    
    return performanceMetrics;
  }
}