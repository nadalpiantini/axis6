import { Page, Locator } from '@playwright/test';

export class ProfilePage {
  public readonly page: Page;
  public readonly pageTitle: Locator;
  public readonly userEmail: Locator;
  public readonly userName: Locator;
  public readonly editNameButton: Locator;
  public readonly nameInput: Locator;
  public readonly saveNameButton: Locator;
  public readonly cancelEditButton: Locator;
  public readonly backToDashboardLink: Locator;
  public readonly settingsLink: Locator;
  public readonly logoutButton: Locator;
  
  // Statistics section
  public readonly statisticsSection: Locator;
  public readonly currentStreak: Locator;
  public readonly longestStreak: Locator;
  public readonly totalCheckins: Locator;
  
  // Psychological profile section
  public readonly psychologicalProfileSection: Locator;
  public readonly personalityAssessmentButton: Locator;
  public readonly retakeAssessmentButton: Locator;
  
  // Account actions section
  public readonly exportDataButton: Locator;
  public readonly deleteAccountButton: Locator;
  
  // Navigation and utility
  public readonly loadingSpinner: Locator;
  public readonly errorMessage: Locator;
  public readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main page elements
    this.pageTitle = page.locator('h1', { hasText: /my profile/i });
    this.userEmail = page.locator('text=/[\w.-]+@[\w.-]+\.\w+/'); // Regex for email pattern
    this.userName = page.locator('[data-testid="user-name"]').or(page.locator('p.font-medium').first());
    
    // Edit functionality
    this.editNameButton = page.locator('button').filter({ hasText: /edit/i }).first();
    this.nameInput = page.locator('input[type="text"]').first();
    this.saveNameButton = page.locator('button').filter({ hasText: /save/i }).first();
    this.cancelEditButton = page.locator('button').filter({ hasText: /cancel|x/i }).first();
    
    // Navigation elements
    this.backToDashboardLink = page.locator('a[href="/dashboard"]').first();
    this.settingsLink = page.locator('a[href="/settings"]').first();
    this.logoutButton = page.locator('button[aria-label="Sign out"]').or(page.locator('button').filter({ hasText: /logout|sign out/i }));
    
    // Statistics section
    this.statisticsSection = page.locator('text=Your Statistics').locator('..');
    this.currentStreak = page.locator('text=Current Streak').locator('..');
    this.longestStreak = page.locator('text=Longest Streak').locator('..');
    this.totalCheckins = page.locator('text=Total Check-ins').locator('..');
    
    // Psychological profile section  
    this.psychologicalProfileSection = page.locator('text=Psychological Profile').locator('..');
    this.personalityAssessmentButton = page.locator('button', { hasText: /take personality assessment/i });
    this.retakeAssessmentButton = page.locator('button', { hasText: /retake assessment/i });
    
    // Account actions
    this.exportDataButton = page.locator('button', { hasText: /export.*data/i });
    this.deleteAccountButton = page.locator('button', { hasText: /delete account/i });
    
    // Utility elements
    this.loadingSpinner = page.locator('[data-testid="loading"]').or(page.locator('text=Loading profile'));
    this.errorMessage = page.locator('[role="alert"]').or(page.locator('.error'));
    this.successMessage = page.locator('text=/successfully|success/i');
  }

  async goto() {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyProfilePageLoaded() {
    // Wait for the main title to be visible
    await this.pageTitle.waitFor({ state: 'visible', timeout: 15000 });
    
    // Verify that we're not on a login page
    const loginIndicator = this.page.locator('h1', { hasText: /welcome back|sign in|login/i });
    await loginIndicator.waitFor({ state: 'hidden' }).catch(() => {
      // If it doesn't exist, that's fine
    });
    
    return true;
  }

  async waitForProfileDataLoaded() {
    // Wait for statistics to be visible (indicates data has loaded)
    await this.statisticsSection.waitFor({ state: 'visible', timeout: 10000 });
    return true;
  }

  async editUserName(newName: string) {
    // Click edit button
    await this.editNameButton.waitFor({ state: 'visible' });
    await this.editNameButton.click();
    
    // Wait for input to appear
    await this.nameInput.waitFor({ state: 'visible' });
    
    // Clear and fill new name
    await this.nameInput.clear();
    await this.nameInput.fill(newName);
    
    // Save changes
    await this.saveNameButton.click();
    
    // Wait for save to complete
    await this.page.waitForTimeout(1000);
  }

  async getUserName(): Promise<string | null> {
    try {
      return await this.userName.textContent();
    } catch {
      return null;
    }
  }

  async getUserEmail(): Promise<string | null> {
    try {
      return await this.userEmail.textContent();
    } catch {
      return null;
    }
  }

  async getStatisticValue(statType: 'current' | 'longest' | 'checkins'): Promise<string | null> {
    const locatorMap = {
      current: this.currentStreak,
      longest: this.longestStreak,
      checkins: this.totalCheckins
    };
    
    try {
      const statElement = locatorMap[statType];
      await statElement.waitFor({ state: 'visible', timeout: 5000 });
      
      // Look for numbers in the text content
      const text = await statElement.textContent();
      const match = text?.match(/(\d+)/);
      return match ? match[1] : '0';
    } catch {
      return null;
    }
  }

  async navigateToSettings() {
    await this.settingsLink.click();
    await this.page.waitForURL(/.*\/settings/);
  }

  async navigateToDashboard() {
    await this.backToDashboardLink.click();
    await this.page.waitForURL(/.*\/dashboard/);
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL(/.*\/auth\/login/);
  }

  async startPersonalityAssessment() {
    await this.personalityAssessmentButton.waitFor({ state: 'visible' });
    await this.personalityAssessmentButton.click();
    
    // Wait for modal or new page to load
    await this.page.waitForTimeout(2000);
  }

  async exportUserData() {
    await this.exportDataButton.waitFor({ state: 'visible' });
    await this.exportDataButton.click();
    
    // Wait for download or success message
    await this.page.waitForTimeout(2000);
  }

  async hasPersonalityProfile(): Promise<boolean> {
    try {
      // If retake button is visible, it means a profile exists
      await this.retakeAssessmentButton.waitFor({ state: 'visible', timeout: 3000 });
      return true;
    } catch {
      // Otherwise check for the initial assessment button
      try {
        await this.personalityAssessmentButton.waitFor({ state: 'visible', timeout: 3000 });
        return false;
      } catch {
        // If neither is visible, we can't determine the state
        return false;
      }
    }
  }

  async waitForLoadingToComplete() {
    // Wait for loading spinner to disappear
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 15000 });
    } catch {
      // If no loading spinner found, continue
    }
  }

  async checkForErrors(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 });
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }
}