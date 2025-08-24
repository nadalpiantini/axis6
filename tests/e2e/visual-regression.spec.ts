import { test, expect } from '../fixtures/auth-fixtures';

test.describe('AXIS6 Visual Regression Tests', () => {
  
  test.describe('Landing Page Visuals', () => {
    test('should match landing page screenshot', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // Wait for animations to complete
      await landingPage.page.waitForTimeout(2000);
      
      // Take full page screenshot
      await expect(landingPage.page).toHaveScreenshot('landing-page-full.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
    
    test('should match hero section', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // Focus on hero section
      const heroSection = landingPage.page.locator('section').first();
      
      await expect(heroSection).toHaveScreenshot('hero-section.png', {
        animations: 'disabled'
      });
    });
    
    test('should match hexagon visualization', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // Wait for hexagon to fully render
      await landingPage.page.waitForTimeout(1000);
      
      const hexagon = landingPage.hexagonChart;
      await expect(hexagon).toHaveScreenshot('landing-hexagon.png', {
        animations: 'disabled'
      });
    });
    
    test('should match features section', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      const featuresSection = landingPage.page.locator('section').nth(1);
      
      await expect(featuresSection).toHaveScreenshot('features-section.png', {
        animations: 'disabled'
      });
    });
  });

  test.describe('Authentication Pages Visuals', () => {
    test('should match login page layout', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();
      
      await expect(loginPage.page).toHaveScreenshot('login-page.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
    
    test('should match register page layout', async ({ registerPage }) => {
      await registerPage.goto('/auth/register');
      await registerPage.verifyRegisterForm();
      
      await expect(registerPage.page).toHaveScreenshot('register-page.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
    
    test('should match login form validation states', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();
      
      // Test empty form validation
      await loginPage.loginButton.click();
      await loginPage.page.waitForTimeout(1000);
      
      const loginForm = loginPage.page.locator('form, [data-testid="login-form"]').first();
      await expect(loginForm).toHaveScreenshot('login-form-validation.png');
    });
  });

  test.describe('Dashboard Visuals', () => {
    test('should match dashboard layout', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Wait for all data to load
      await authenticatedPage.page.waitForLoadState('networkidle');
      await authenticatedPage.page.waitForTimeout(2000);
      
      await expect(authenticatedPage.page).toHaveScreenshot('dashboard-full.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
    
    test('should match hexagon chart on dashboard', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      const hexagon = authenticatedPage.hexagonChart;
      await expect(hexagon).toHaveScreenshot('dashboard-hexagon.png', {
        animations: 'disabled'
      });
    });
    
    test('should match category cards layout', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      const categoryCards = authenticatedPage.page.locator(
        '[data-testid*="category"], .category-card, .axis-card'
      );
      
      if (await categoryCards.count() > 0) {
        // Screenshot the first few category cards
        for (let i = 0; i < Math.min(3, await categoryCards.count()); i++) {
          const card = categoryCards.nth(i);
          await expect(card).toHaveScreenshot(`category-card-${i}.png`);
        }
      }
    });
    
    test('should match streak counters', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      const streakElements = authenticatedPage.page.locator(
        '[data-testid*="streak"], .streak, .streak-counter'
      );
      
      if (await streakElements.count() > 0) {
        const streaksContainer = streakElements.first().locator('..'); // Parent container
        await expect(streaksContainer).toHaveScreenshot('streaks-section.png');
      }
    });
  });

  test.describe('Responsive Design Visuals', () => {
    test('should match mobile landing page', async ({ landingPage }) => {
      await landingPage.page.setViewportSize({ width: 375, height: 667 });
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      await landingPage.page.waitForTimeout(2000);
      
      await expect(landingPage.page).toHaveScreenshot('landing-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
    
    test('should match mobile dashboard', async ({ authenticatedPage }) => {
      await authenticatedPage.page.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.verifyDashboardLoaded();
      
      await authenticatedPage.page.waitForTimeout(2000);
      
      await expect(authenticatedPage.page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
    
    test('should match tablet layout', async ({ landingPage }) => {
      await landingPage.page.setViewportSize({ width: 768, height: 1024 });
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      await landingPage.page.waitForTimeout(2000);
      
      await expect(landingPage.page).toHaveScreenshot('landing-tablet.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
    
    test('should match desktop wide layout', async ({ landingPage }) => {
      await landingPage.page.setViewportSize({ width: 1920, height: 1080 });
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      await landingPage.page.waitForTimeout(2000);
      
      await expect(landingPage.page).toHaveScreenshot('landing-wide.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Interactive State Visuals', () => {
    test('should match button hover states', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // Hover over register button
      await landingPage.registerButton.hover();
      await landingPage.page.waitForTimeout(500);
      
      await expect(landingPage.registerButton).toHaveScreenshot('register-button-hover.png');
      
      // Hover over login button
      await landingPage.loginButton.hover();
      await landingPage.page.waitForTimeout(500);
      
      await expect(landingPage.loginButton).toHaveScreenshot('login-button-hover.png');
    });
    
    test('should match focus states', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();
      
      // Focus on email input
      await loginPage.emailInput.focus();
      await expect(loginPage.emailInput).toHaveScreenshot('email-input-focused.png');
      
      // Focus on password input
      await loginPage.passwordInput.focus();
      await expect(loginPage.passwordInput).toHaveScreenshot('password-input-focused.png');
      
      // Focus on login button
      await loginPage.loginButton.focus();
      await expect(loginPage.loginButton).toHaveScreenshot('login-button-focused.png');
    });
    
    test('should match checked-in state', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Find and click a check-in button
      const checkInButton = authenticatedPage.page.locator(
        'button:has-text("Check In"):not([disabled])'
      ).first();
      
      if (await checkInButton.isVisible()) {
        // Get the parent card/container
        const categoryContainer = checkInButton.locator('..');
        
        // Screenshot before check-in
        await expect(categoryContainer).toHaveScreenshot('category-before-checkin.png');
        
        // Perform check-in
        await checkInButton.click();
        await authenticatedPage.page.waitForTimeout(2000);
        
        // Screenshot after check-in
        await expect(categoryContainer).toHaveScreenshot('category-after-checkin.png');
      }
    });
    
    test('should match error states', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();
      
      // Trigger validation errors
      await loginPage.login('invalid@email', 'wrong');
      await loginPage.page.waitForTimeout(1000);
      
      const loginForm = loginPage.page.locator('form, [data-testid="login-form"]').first();
      await expect(loginForm).toHaveScreenshot('login-form-errors.png');
    });
  });

  test.describe('Dark Mode Visuals', () => {
    test('should match dark mode landing page', async ({ landingPage }) => {
      // Set dark mode preference
      await landingPage.page.emulateMedia({ colorScheme: 'dark' });
      
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      await landingPage.page.waitForTimeout(2000);
      
      await expect(landingPage.page).toHaveScreenshot('landing-dark-mode.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
    
    test('should match dark mode dashboard', async ({ authenticatedPage }) => {
      await authenticatedPage.page.emulateMedia({ colorScheme: 'dark' });
      
      await authenticatedPage.verifyDashboardLoaded();
      await authenticatedPage.page.waitForTimeout(2000);
      
      await expect(authenticatedPage.page).toHaveScreenshot('dashboard-dark-mode.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Animation States', () => {
    test('should match loading states', async ({ page, testUser }) => {
      // Intercept API calls to create loading state
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      await page.goto('/auth/login');
      
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const passwordInput = page.getByRole('textbox', { name: /password/i });
      const loginButton = page.getByRole('button', { name: /sign in|login/i });
      
      await emailInput.fill(testUser.email);
      await passwordInput.fill(testUser.password);
      await loginButton.click();
      
      // Capture loading state
      await page.waitForTimeout(500);
      
      const loadingIndicator = page.locator('.loading, .spinner, [data-testid*="loading"]');
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toHaveScreenshot('loading-state.png');
      }
    });
    
    test('should match hexagon animation frames', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // If hexagon has animations, capture different frames
      const hexagon = landingPage.hexagonChart;
      
      // Initial state
      await expect(hexagon).toHaveScreenshot('hexagon-frame-1.png', {
        animations: 'disabled'
      });
      
      // Allow some animation time
      await landingPage.page.waitForTimeout(1000);
      
      await expect(hexagon).toHaveScreenshot('hexagon-frame-2.png', {
        animations: 'disabled'
      });
    });
  });

  test.describe('Cross-Browser Consistency', () => {
    test('should look consistent across browsers', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      await landingPage.page.waitForTimeout(2000);
      
      // This screenshot will be compared across different browser projects
      await expect(landingPage.page).toHaveScreenshot('cross-browser-landing.png', {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.3 // Allow for slight browser rendering differences
      });
    });
  });

  test.describe('Component Isolation', () => {
    test('should match individual UI components', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Test individual components in isolation
      const components = [
        { selector: '[data-testid*="hexagon"], svg[viewBox]', name: 'hexagon-component' },
        { selector: '[data-testid*="category"], .category-card', name: 'category-component' },
        { selector: '[data-testid*="streak"], .streak', name: 'streak-component' },
        { selector: 'button', name: 'button-component' }
      ];
      
      for (const component of components) {
        const element = authenticatedPage.page.locator(component.selector).first();
        
        if (await element.isVisible()) {
          await expect(element).toHaveScreenshot(`${component.name}.png`);
        }
      }
    });
  });

  test.describe('Layout Edge Cases', () => {
    test('should handle very long content', async ({ authenticatedPage, page }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Inject very long text to test layout
      await page.addStyleTag({
        content: `
          .test-long-content::after {
            content: "This is a very long piece of content that should test how the layout handles overflow and wrapping in various components and containers throughout the application interface";
          }
        `
      });
      
      await page.evaluate(() => {
        const elements = document.querySelectorAll('h1, h2, h3, button');
        elements.forEach(el => el.classList.add('test-long-content'));
      });
      
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('layout-long-content.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
    
    test('should handle empty states', async ({ page }) => {
      // Mock empty API responses
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]) // Empty array
        });
      });
      
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('dashboard-empty-state.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });
});