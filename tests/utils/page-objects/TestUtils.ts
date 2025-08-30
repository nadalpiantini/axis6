import { Page, Browser, BrowserContext } from '@playwright/test';
import { TEST_CONFIG } from '../../fixtures/auth-fixtures';

export class TestUtils {
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Generate a unique test email
   */
  static generateTestEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${random}@axis6-playwright.local`;
  }

  /**
   * Generate a secure test password
   */
  static generateTestPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123453000!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Wait for network to be idle and page to be fully loaded
   */
  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');

    // Wait for any potential loading indicators to disappear
    const loadingIndicators = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      '[aria-label="Loading"]'
    ];

    for (const selector of loadingIndicators) {
      try {
        await this.page.locator(selector).waitFor({ state: 'hidden', timeout: 3000 });
      } catch {
        // Indicator not present, continue
      }
    }
  }

  /**
   * Take a screenshot for debugging
   */
  async takeDebugScreenshot(name: string) {
    const timestamp = Date.now();
    await this.page.screenshot({
      path: `test-results/debug-${name}-${timestamp}.png`,
      fullPage: true
    });
  }

  /**
   * Clear browser storage (localStorage, sessionStorage, cookies)
   */
  async clearBrowserStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await this.page.context().clearCookies();
  }

  /**
   * Check if we're in production environment
   */
  static isProduction(): boolean {
    return TEST_CONFIG.isProduction;
  }

  /**
   * Get current environment URL
   */
  static getBaseURL(): string {
    return TEST_CONFIG.baseURL;
  }

  /**
   * Mock API responses for offline testing
   */
  async mockSupabaseAuth() {
    if (TestUtils.isProduction()) {
      // Don't mock in production
      return;
    }

    await this.page.route('**/auth/v1/**', route => {
      const url = route.request().url();

      if (url.includes('/token')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            user: {
              id: 'mock-user-id',
              email: 'test@axis6.local',
              user_metadata: {
                name: 'Test User'
              }
            }
          })
        });
      } else {
        route.continue();
      }
    });
  }

  /**
   * Check for JavaScript errors on the page
   */
  async checkForConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Check for uncaught exceptions
    this.page.on('pageerror', error => {
      errors.push(`Page error: ${error.message}`);
    });

    return errors;
  }

  /**
   * Wait for specific network requests to complete
   */
  async waitForAPI(urlPattern: string | RegExp, timeout: number = 10000) {
    await this.page.waitForResponse(
      response => {
        const url = response.url();
        return typeof urlPattern === 'string' ?
          url.includes(urlPattern) :
          urlPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * Simulate slow network conditions
   */
  async simulateSlowNetwork() {
    if (TestUtils.isProduction()) {
      // Don't simulate slow network in production
      return;
    }

    await this.page.route('**/*', route => {
      // Add 1-3 second delay to simulate slow network
      const delay = Math.random() * 2000 + 1000;
      setTimeout(() => route.continue(), delay);
    });
  }

  /**
   * Check accessibility issues (basic check)
   */
  async checkBasicAccessibility(): Promise<string[]> {
    const issues: string[] = [];

    // Check for alt text on images
    const images = await this.page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      if (!alt && src && !src.startsWith('data:')) {
        issues.push(`Image missing alt text: ${src}`);
      }
    }

    // Check for form labels
    const inputs = await this.page.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');

      if (id) {
        const label = await this.page.locator(`label[for="${id}"]`).count();
        if (label === 0 && !ariaLabel && !placeholder) {
          const type = await input.getAttribute('type');
          issues.push(`Input missing label: type="${type}"`);
        }
      }
    }

    return issues;
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    const timing = await this.page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      };
    });

    return timing;
  }

  /**
   * Create a new authenticated context for parallel testing
   */
  static async createAuthenticatedContext(
    browser: Browser,
    userEmail?: string,
    userPassword?: string
  ): Promise<BrowserContext> {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to login and authenticate
    await page.goto('/auth/login');

    if (userEmail && userPassword) {
      await page.fill('input[type="email"]', userEmail);
      await page.fill('input[type="password"]', userPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    }

    await page.close();
    return context;
  }

  /**
   * Cleanup test data (for non-production environments)
   */
  async cleanupTestData() {
    if (TestUtils.isProduction()) {
      // Never cleanup in production
      return;
    }

    // Clear browser storage
    await this.clearBrowserStorage();

    // Additional cleanup could be added here
    // e.g., API calls to clean up test users, data, etc.
  }
}
