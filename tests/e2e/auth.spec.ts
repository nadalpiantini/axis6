import { test, expect } from '../fixtures/auth-fixtures';
import { TEST_USERS, TEST_CONFIG } from '../fixtures/auth-fixtures';

test.describe('AXIS6 Authentication Flow', () => {
  
  test.describe('Landing Page', () => {
    test('should load landing page correctly', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // Verify page title and meta tags
      await expect(landingPage.page).toHaveTitle(/AXIS6/);
      
      // Check for key elements
      await expect(landingPage.heroTitle).toBeVisible();
      await expect(landingPage.hexagonChart).toBeVisible();
      await expect(landingPage.featuresSection).toBeVisible();
    });
    
    test('should navigate to login page', async ({ landingPage, loginPage }) => {
      await landingPage.goto('/');
      await landingPage.clickLogin();
      
      await loginPage.page.waitForURL('**/auth/login');
      await loginPage.verifyLoginForm();
    });
    
    test('should navigate to register page', async ({ landingPage, registerPage }) => {
      await landingPage.goto('/');
      await landingPage.clickRegister();
      
      await registerPage.page.waitForURL('**/auth/register');
      await registerPage.verifyRegisterForm();
    });
  });

  test.describe('User Registration', () => {
    test('should register new user successfully', async ({ registerPage, dashboardPage, testUser }) => {
      await registerPage.goto('/auth/register');
      await registerPage.verifyRegisterForm();
      
      // Fill registration form
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      
      // Should redirect to dashboard or onboarding
      await registerPage.page.waitForURL(/\/(dashboard|auth\/onboarding)/);
      
      // If redirected to onboarding, complete it
      if (registerPage.page.url().includes('onboarding')) {
        // Handle onboarding flow if it exists
        await registerPage.page.waitForURL('**/dashboard', { timeout: 10000 });
      }
      
      // Verify successful login by checking dashboard
      await dashboardPage.verifyDashboardLoaded();
    });
    
    test('should show validation errors for invalid data', async ({ registerPage }) => {
      await registerPage.goto('/auth/register');
      
      // Try to register with invalid email
      await registerPage.register(TEST_USERS.invalid.email, TEST_USERS.invalid.password);
      
      // Should show validation errors
      await expect(registerPage.errorMessage).toBeVisible();
    });
    
    test('should prevent registration with existing email', async ({ registerPage, testUser }) => {
      await registerPage.goto('/auth/register');
      
      // Register once
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await registerPage.page.waitForURL(/\/(dashboard|auth\/onboarding)/);
      
      // Try to register again with same email
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, 'Different Name');
      
      // Should show error about existing email
      await expect(registerPage.errorMessage).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    test('should login existing user successfully', async ({ loginPage, dashboardPage, testUser, registerPage }) => {
      // First, register a user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await registerPage.page.waitForURL(/\/(dashboard|auth\/onboarding)/);
      
      // Logout (if possible)
      try {
        await dashboardPage.logout();
      } catch (e) {
        // If no logout button, clear session
        await loginPage.page.context().clearCookies();
      }
      
      // Now test login
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();
      
      await loginPage.login(testUser.email, testUser.password);
      
      // Should redirect to dashboard
      await loginPage.page.waitForURL('**/dashboard');
      await dashboardPage.verifyDashboardLoaded();
    });
    
    test('should show error for invalid credentials', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();
      
      await loginPage.login(TEST_USERS.invalid.email, TEST_USERS.invalid.password);
      
      // Should show error message
      await expect(loginPage.errorMessage).toBeVisible();
    });
    
    test('should show error for non-existent user', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      
      await loginPage.login('nonexistent@example.com', 'password123');
      
      // Should show error message
      await expect(loginPage.errorMessage).toBeVisible();
    });
    
    test('should handle empty form submission', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      
      // Try to submit empty form
      await loginPage.loginButton.click();
      
      // Should show validation errors or prevent submission
      const isFormValid = await loginPage.emailInput.evaluate(input => 
        (input as HTMLInputElement).checkValidity()
      );
      expect(isFormValid).toBe(false);
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should navigate to forgot password page', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      
      if (await loginPage.forgotPasswordLink.isVisible()) {
        await loginPage.forgotPasswordLink.click();
        await loginPage.page.waitForURL('**/auth/forgot*');
        
        // Should show password reset form
        const emailInput = loginPage.page.getByRole('textbox', { name: /email/i });
        await expect(emailInput).toBeVisible();
      } else {
        test.skip('Forgot password link not available', () => {});
      }
    });
    
    test('should handle password reset request', async ({ page, testUser, registerPage }) => {
      // First register a user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);
      
      // Navigate to forgot password
      await page.goto('/auth/forgot');
      
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const submitButton = page.getByRole('button', { name: /reset|send/i });
      
      if (await emailInput.isVisible()) {
        await emailInput.fill(testUser.email);
        await submitButton.click();
        
        // Should show success message
        const successMessage = page.locator('[role="status"], .success, [class*="success"]');
        await expect(successMessage).toBeVisible();
      } else {
        test.skip('Password reset form not available', () => {});
      }
    });
  });

  test.describe('Navigation and Session Management', () => {
    test('should redirect unauthenticated users to login', async ({ page, dashboardPage }) => {
      // Clear any existing session
      await page.context().clearCookies();
      
      // Try to access dashboard directly
      await page.goto('/dashboard');
      
      // Should redirect to login
      await page.waitForURL(/\/(auth\/login|login)/);
    });
    
    test('should maintain session across page refreshes', async ({ authenticatedPage }) => {
      // User is already authenticated via fixture
      await authenticatedPage.verifyDashboardLoaded();
      
      // Refresh the page
      await authenticatedPage.page.reload();
      await authenticatedPage.page.waitForLoadState('networkidle');
      
      // Should still be logged in
      await authenticatedPage.verifyDashboardLoaded();
    });
    
    test('should logout user successfully', async ({ authenticatedPage, page }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Logout
      await authenticatedPage.logout();
      
      // Should redirect to login or landing page
      await page.waitForURL(/\/(auth\/login|login|\/)/);
      
      // Trying to access dashboard should redirect to login
      await page.goto('/dashboard');
      await page.waitForURL(/\/(auth\/login|login)/);
    });
  });

  test.describe('Form Validation and UX', () => {
    test('should show real-time validation feedback', async ({ registerPage }) => {
      await registerPage.goto('/auth/register');
      
      // Test email validation
      await registerPage.emailInput.fill('invalid-email');
      await registerPage.emailInput.blur();
      
      // Check if validation styling is applied
      const isInvalid = await registerPage.emailInput.evaluate(input => 
        !((input as HTMLInputElement).checkValidity())
      );
      expect(isInvalid).toBe(true);
    });
    
    test('should handle form accessibility', async ({ loginPage, utils }) => {
      await loginPage.goto('/auth/login');
      
      // Check accessibility
      const a11yIssues = await utils.checkAccessibility(loginPage.page);
      
      // Should have proper labels
      const emailLabel = await loginPage.emailInput.getAttribute('aria-label') || 
                         await loginPage.page.locator('label[for*="email"]').isVisible();
      const passwordLabel = await loginPage.passwordInput.getAttribute('aria-label') || 
                            await loginPage.page.locator('label[for*="password"]').isVisible();
      
      expect(emailLabel).toBeTruthy();
      expect(passwordLabel).toBeTruthy();
    });
    
    test('should support keyboard navigation', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      
      // Navigate using Tab key
      await loginPage.page.keyboard.press('Tab');
      await expect(loginPage.emailInput).toBeFocused();
      
      await loginPage.page.keyboard.press('Tab');
      await expect(loginPage.passwordInput).toBeFocused();
      
      await loginPage.page.keyboard.press('Tab');
      await expect(loginPage.loginButton).toBeFocused();
    });
  });
});