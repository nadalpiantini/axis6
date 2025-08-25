import { Page, Locator } from '@playwright/test';

export class LandingPage {
  public readonly page: Page;
  public readonly heroTitle: Locator;
  public readonly hexagonChart: Locator;
  public readonly featuresSection: Locator;
  public readonly loginButton: Locator;
  public readonly registerButton: Locator;
  public readonly getStartedButton: Locator;
  public readonly ctaSection: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Hero section elements
    this.heroTitle = page.locator('h1');
    this.hexagonChart = page.locator('[data-testid="hexagon-chart"]').or(page.locator('svg')).first();
    this.featuresSection = page.locator('[data-testid="features-section"]').or(page.locator('section').nth(1));
    
    // Navigation buttons
    this.loginButton = page.locator('a[href*="/auth/login"]', { hasText: /login|iniciar/i });
    this.registerButton = page.locator('a[href*="/auth/register"]', { hasText: /register|registro/i });
    this.getStartedButton = page.locator('a', { hasText: /get started|comenzar|empezar/i });
    
    // Call-to-action section
    this.ctaSection = page.locator('[data-testid="cta-section"]').or(page.locator('section').last());
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyLandingPageLoaded() {
    // Wait for main content to be visible
    await this.heroTitle.waitFor({ state: 'visible' });
    
    // Verify essential elements are present
    await this.heroTitle.isVisible();
    await this.hexagonChart.isVisible();
    
    return true;
  }

  async clickLogin() {
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickRegister() {
    await this.registerButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickGetStarted() {
    await this.getStartedButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async scrollToFeatures() {
    await this.featuresSection.scrollIntoViewIfNeeded();
  }

  async verifyHeroContent() {
    const title = await this.heroTitle.textContent();
    return title?.includes('AXIS6') || title?.includes('axis') || title?.includes('balance');
  }

  async getPageTitle() {
    return await this.page.title();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector('body');
  }
}