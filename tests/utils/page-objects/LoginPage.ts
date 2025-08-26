import { Page, Locator } from '@playwright/test';

export class LoginPage {
  public readonly page: Page;
  public readonly emailInput: Locator;
  public readonly passwordInput: Locator;
  public readonly loginButton: Locator;
  public readonly forgotPasswordLink: Locator;
  public readonly registerLink: Locator;
  public readonly errorMessage: Locator;
  public readonly successMessage: Locator;
  public readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form elements using data-testid attributes
    this.emailInput = page.locator('[data-testid="email-input"]').or(page.locator('input[id="email"]')).or(page.locator('input[type="email"]'));
    this.passwordInput = page.locator('[data-testid="password-input"]').or(page.locator('input[id="password"]')).or(page.locator('input[type="password"]'));
    this.loginButton = page.locator('[data-testid="login-submit"]').or(page.locator('button[type="submit"]')).or(page.locator('button', { hasText: /sign in|login|iniciar/i }));
    
    // Navigation links
    this.forgotPasswordLink = page.locator('a', { hasText: /forgot|olvidé|recuperar/i });
    this.registerLink = page.locator('a[href*="/auth/register"]').or(page.locator('a', { hasText: /register|registro/i }));
    
    // Feedback messages
    this.errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('.error')).or(page.locator('[role="alert"]'));
    this.successMessage = page.locator('[data-testid="success-message"]').or(page.locator('.success'));
    this.loadingSpinner = page.locator('[data-testid="loading"]').or(page.locator('.loading')).or(page.locator('.spinner'));
  }

  async goto() {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyLoginForm() {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.loginButton.waitFor({ state: 'visible' });
    
    return true;
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  async fillEmail(email: string) {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
    
    // Wait for either navigation or error message
    await Promise.race([
      this.page.waitForURL(/\/(dashboard|auth)/),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
      this.page.waitForLoadState('networkidle')
    ]);
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickRegisterLink() {
    await this.registerLink.click();
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

  async waitForLoginSuccess() {
    // Wait for either dashboard navigation or success message
    await Promise.race([
      this.page.waitForURL(/\/dashboard/, { timeout: 10000 }),
      this.successMessage.waitFor({ state: 'visible', timeout: 10000 })
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
    await this.verifyLoginForm();
    // Ensure no loading state
    await this.loadingSpinner.waitFor({ state: 'hidden' }).catch(() => {});
  }

  /**
   * Register a new user account
   */
  async registerUser(email: string, password: string, name?: string) {
    // Navigate to register page
    await this.page.goto('/auth/register');
    await this.page.waitForLoadState('networkidle');
    
    // Fill registration form
    const emailInput = this.page.locator('input[type="email"]');
    const passwordInput = this.page.locator('input[type="password"]');
    const nameInput = this.page.locator('input[name="name"], input[name="full_name"]');
    const submitButton = this.page.locator('button[type="submit"]');
    
    await emailInput.fill(email);
    await passwordInput.fill(password);
    
    if (name && await nameInput.count() > 0) {
      await nameInput.fill(name);
    }
    
    await submitButton.click();
    
    // Wait for either success redirect or error
    await Promise.race([
      this.page.waitForURL(/\/dashboard/, { timeout: 15000 }),
      this.page.waitForURL(/\/auth\/login/, { timeout: 15000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null)
    ]);
  }

  /**
   * Login with existing user credentials
   */
  async loginUser(email: string, password: string) {
    await this.goto();
    await this.waitForFormReady();
    await this.login(email, password);
    
    // Wait for successful login redirect
    try {
      await this.page.waitForURL(/\/dashboard/, { timeout: 15000 });
    } catch (error) {
      // If login failed, check for error message
      const errorMsg = await this.getErrorMessage();
      if (errorMsg) {
        throw new Error(`Login failed: ${errorMsg}`);
      }
      throw new Error('Login failed: No redirect to dashboard');
    }
  }
}