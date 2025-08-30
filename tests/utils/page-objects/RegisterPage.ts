import { Page, Locator } from '@playwright/test';

export class RegisterPage {
  public readonly page: Page;
  public readonly nameInput: Locator;
  public readonly emailInput: Locator;
  public readonly passwordInput: Locator;
  public readonly confirmPasswordInput: Locator;
  public readonly registerButton: Locator;
  public readonly loginLink: Locator;
  public readonly termsCheckbox: Locator;
  public readonly termsLink: Locator;
  public readonly errorMessage: Locator;
  public readonly successMessage: Locator;
  public readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // Form elements using data-testid attributes
    this.nameInput = page.locator('[data-testid="name-input"]');
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
    this.registerButton = page.locator('[data-testid="register-submit"]');

    // Navigation and additional elements
    this.loginLink = page.locator('a[href*="/auth/login"]');
    this.termsCheckbox = page.locator('input[type="checkbox"]');
    this.termsLink = page.locator('a', { hasText: /terms|términos|condiciones/i });

    // Feedback messages
    this.errorMessage = page.locator('[role="alert"]');
    this.successMessage = page.locator('[data-testid="success-message"]').or(page.locator('.success'));
    this.loadingSpinner = page.locator('[data-testid="loading"]').or(page.locator('.loading')).or(page.locator('.spinner'));
  }

  async goto() {
    await this.page.goto('/auth/register');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyRegisterForm() {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.registerButton.waitFor({ state: 'visible' });

    return true;
  }

  async register(email: string, password: string, name?: string) {
    if (name) {
      await this.fillName(name);
    }
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(password);
    await this.acceptTermsIfPresent();
    await this.clickRegister();
  }

  async fillName(name: string) {
    await this.nameInput.waitFor({ state: 'visible' });
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async fillEmail(email: string) {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.waitFor({ state: 'visible' });
    await this.confirmPasswordInput.clear();
    await this.confirmPasswordInput.fill(password);
  }

  async acceptTermsIfPresent() {
    try {
      // Wait for form to be ready and terms checkbox to be visible
      await this.page.waitForTimeout(500);
      const checkbox = this.page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        const isChecked = await checkbox.isChecked();
        if (!isChecked) {
          await checkbox.check();
          // Wait for any validation to complete
          await this.page.waitForTimeout(500);
        }
      }
    } catch {
      // Terms checkbox not present or already checked, continue
    }
  }

  async clickRegister() {
    // Wait for button to be enabled
    await this.page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="register-submit"]') as HTMLButtonElement;
      return button && !button.disabled;
    }, { timeout: 10000 });

    await this.registerButton.click();

    // Wait for either navigation or error message
    await Promise.race([
      this.page.waitForURL(/\/(dashboard|auth)/),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
      this.page.waitForLoadState('networkidle')
    ]);
  }

  async clickLoginLink() {
    await this.loginLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getErrorMessage(): Promise<string | null> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 });
      return await this.errorMessage.textContent();
    } catch {
      return null;
    }
  }

  async waitForRegistrationSuccess() {
    // Wait for either dashboard navigation or success message
    await Promise.race([
      this.page.waitForURL(/\/(dashboard|auth)/, { timeout: 15000 }),
      this.successMessage.waitFor({ state: 'visible', timeout: 15000 })
    ]);
  }

  async isLoading(): Promise<boolean> {
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  async waitForFormReady() {
    await this.verifyRegisterForm();
    // Ensure no loading state
    await this.loadingSpinner.waitFor({ state: 'hidden' }).catch(() => {});
  }

  async validatePasswordMatch(): Promise<boolean> {
    const password = await this.passwordInput.inputValue();
    const confirmPassword = await this.confirmPasswordInput.inputValue();
    return password === confirmPassword;
  }
}