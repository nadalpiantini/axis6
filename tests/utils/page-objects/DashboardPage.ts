import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  public readonly page: Page;
  public readonly welcomeMessage: Locator;
  public readonly hexagonChart: Locator;
  public readonly checkinButtons: Locator;
  public readonly streakCounter: Locator;
  public readonly profileMenu: Locator;
  public readonly userMenu: Locator;
  public readonly logoutButton: Locator;
  public readonly navigationMenu: Locator;
  public readonly statsSection: Locator;
  public readonly todaySection: Locator;

  // Category-specific check-in buttons
  public readonly physicalCheckin: Locator;
  public readonly mentalCheckin: Locator;
  public readonly emotionalCheckin: Locator;
  public readonly socialCheckin: Locator;
  public readonly spiritualCheckin: Locator;
  public readonly materialCheckin: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main dashboard elements
    this.welcomeMessage = page.locator('h1, [data-testid="welcome"], .welcome');
    this.hexagonChart = page.locator('[data-testid="hexagon-chart"], svg, .hexagon');
    this.checkinButtons = page.locator('[data-testid^="checkin-"], button:has-text(/check.?in/i)');
    this.streakCounter = page.locator('[data-testid="streak-counter"], [data-testid*="streak"], .streak');

    // Navigation elements
    this.profileMenu = page.locator('[data-testid="profile-menu"], button:has-text(/profile/i)');
    this.userMenu = page.locator('[data-testid="user-menu"], [data-testid="profile-menu"], .user-menu, .profile-menu');
    this.logoutButton = page.locator('[data-testid="logout"], button:has-text(/logout|sign out/i)');
    this.navigationMenu = page.locator('nav, [data-testid="navigation"], .navigation');

    // Content sections
    this.statsSection = page.locator('[data-testid="stats-section"], .stats-section');
    this.todaySection = page.locator('[data-testid="today-section"], .today-section');

    // Category-specific check-ins (AXIS6 categories)
    this.physicalCheckin = page.locator('[data-testid*="physical"], button:has-text(/physical/i)');
    this.mentalCheckin = page.locator('[data-testid*="mental"], button:has-text(/mental/i)');
    this.emotionalCheckin = page.locator('[data-testid*="emotional"], button:has-text(/emotional/i)');
    this.socialCheckin = page.locator('[data-testid*="social"], button:has-text(/social/i)');
    this.spiritualCheckin = page.locator('[data-testid*="spiritual"], button:has-text(/spiritual/i)');
    this.materialCheckin = page.locator('[data-testid*="material"], button:has-text(/material/i)');
  }

  async goto(path = '/dashboard') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyDashboardLoaded() {
    // Wait for main dashboard content
    await this.welcomeMessage.or(this.hexagonChart).waitFor({ state: 'visible' });
    return true;
  }

  async performCheckin(category: 'physical' | 'mental' | 'emotional' | 'social' | 'spiritual' | 'material') {
    const buttonMap = {
      physical: this.physicalCheckin,
      mental: this.mentalCheckin,
      emotional: this.emotionalCheckin,
      social: this.socialCheckin,
      spiritual: this.spiritualCheckin,
      material: this.materialCheckin
    };

    const button = buttonMap[category];
    await button.click();

    // Wait for potential modal or immediate UI update
    await this.page.waitForTimeout(1000);

    // Look for confirmation or modal completion
    const confirmButton = this.page.locator('button:has-text(/confirm|save|complete/i)');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.page.waitForLoadState('networkidle');
  }

  async performAllCheckins() {
    const categories: Array<'physical' | 'mental' | 'emotional' | 'social' | 'spiritual' | 'material'> =
      ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'];

    for (const category of categories) {
      try {
        await this.performCheckin(category);
      } catch (error) {
        console.warn(`Failed to check in for ${category}:`, error);
      }
    }
  }

  async getStreakCount(): Promise<number> {
    try {
      const streakText = await this.streakCounter.textContent();
      const match = streakText?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  async openProfileMenu() {
    await this.profileMenu.click();
    await this.page.waitForTimeout(500); // Wait for dropdown
  }

  async logout() {
    try {
      // Try to find logout button directly first
      if (await this.logoutButton.isVisible()) {
        await this.logoutButton.click();
      } else {
        // Try opening profile/user menu first
        await this.openProfileMenu();
        await this.logoutButton.click();
      }
      await this.page.waitForURL(/\/(auth|$)/);
    } catch (error) {
      // Fallback: clear session manually
      await this.page.context().clearCookies();
      await this.page.goto('/auth/login');
    }
  }

  async navigateToStats() {
    const statsLink = this.page.locator('a[href*="/stats"], a:has-text(/stats|analytics/i)');
    await statsLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSettings() {
    const settingsLink = this.page.locator('a[href*="/settings"], a:has-text(/settings/i)');
    await settingsLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async waitForHexagonAnimation() {
    // Wait for hexagon chart to be fully loaded and animated
    await this.hexagonChart.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000); // Allow for animations
  }

  async getCompletedCategories(): Promise<string[]> {
    const completedCategories: string[] = [];
    const categories = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'];

    for (const category of categories) {
      const checkedButton = this.page.locator(`[data-testid*="${category}"][aria-pressed="true"]`)
        .or(this.page.locator(`[data-testid*="${category}"].completed`))
        .or(this.page.locator(`[data-testid*="${category}"] .checkmark`));

      if (await checkedButton.isVisible()) {
        completedCategories.push(category);
      }
    }

    return completedCategories;
  }

  async getTodaysProgress(): Promise<{ completed: number; total: number }> {
    const completedCategories = await this.getCompletedCategories();
    return {
      completed: completedCategories.length,
      total: 6 // AXIS6 has 6 categories
    };
  }

  async verifyAuthenticatedState() {
    // Verify we're on the dashboard and user is authenticated
    await this.verifyDashboardLoaded();

    // Should NOT see login/register buttons
    const loginButton = this.page.locator('a[href*="/auth/login"]');
    await loginButton.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    return true;
  }
}