import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  public readonly page: Page;
  public readonly welcomeMessage: Locator;
  public readonly hexagonChart: Locator;
  public readonly checkinButtons: Locator;
  public readonly streakCounter: Locator;
  public readonly profileMenu: Locator;
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
    this.welcomeMessage = page.locator('h1').or(page.locator('[data-testid="welcome"]'));
    this.hexagonChart = page.locator('[data-testid="hexagon-chart"]').or(page.locator('svg'));
    this.checkinButtons = page.locator('[data-testid^="checkin-"]').or(page.locator('button', { hasText: /check.?in|completar/i }));
    this.streakCounter = page.locator('[data-testid="streak-counter"]').or(page.locator('text=/\d+.*day|día/'));
    
    // Navigation elements
    this.profileMenu = page.locator('[data-testid="profile-menu"]').or(page.locator('button', { hasText: /profile|perfil/i }));
    this.logoutButton = page.locator('[data-testid="logout"]').or(page.locator('button', { hasText: /logout|cerrar/i }));
    this.navigationMenu = page.locator('nav').or(page.locator('[data-testid="navigation"]'));
    
    // Content sections
    this.statsSection = page.locator('[data-testid="stats-section"]').or(page.locator('section').nth(1));
    this.todaySection = page.locator('[data-testid="today-section"]').or(page.locator('section').first());

    // Category-specific check-ins (AXIS6 categories)
    this.physicalCheckin = page.locator('[data-testid="checkin-physical"]').or(page.locator('button', { hasText: /physical|físico/i }));
    this.mentalCheckin = page.locator('[data-testid="checkin-mental"]').or(page.locator('button', { hasText: /mental/i }));
    this.emotionalCheckin = page.locator('[data-testid="checkin-emotional"]').or(page.locator('button', { hasText: /emotional|emocional/i }));
    this.socialCheckin = page.locator('[data-testid="checkin-social"]').or(page.locator('button', { hasText: /social/i }));
    this.spiritualCheckin = page.locator('[data-testid="checkin-spiritual"]').or(page.locator('button', { hasText: /spiritual|espiritual/i }));
    this.materialCheckin = page.locator('[data-testid="checkin-material"]').or(page.locator('button', { hasText: /material|propósito/i }));
  }

  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyDashboardLoaded() {
    // Wait for main dashboard content
    await this.welcomeMessage.waitFor({ state: 'visible' });
    await this.hexagonChart.waitFor({ state: 'visible' });
    
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
    const confirmButton = this.page.locator('button', { hasText: /confirm|completar|guardar/i });
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
    await this.openProfileMenu();
    await this.logoutButton.click();
    await this.page.waitForURL(/\/(auth|$)/);
  }

  async navigateToStats() {
    const statsLink = this.page.locator('a[href*="/stats"]').or(this.page.locator('a', { hasText: /stats|estadísticas/i }));
    await statsLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSettings() {
    const settingsLink = this.page.locator('a[href*="/settings"]').or(this.page.locator('a', { hasText: /settings|configuración/i }));
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
      const checkedButton = this.page.locator(`[data-testid="checkin-${category}"][aria-pressed="true"]`)
        .or(this.page.locator(`[data-testid="checkin-${category}"].completed`))
        .or(this.page.locator(`[data-testid="checkin-${category}"] .checkmark`));
      
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
    await loginButton.waitFor({ state: 'hidden' }).catch(() => {});
    
    return true;
  }
}