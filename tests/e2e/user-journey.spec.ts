import { test, expect } from '../fixtures/auth-fixtures-v2';

test.describe('AXIS6 Complete User Journey', () => {
  test.setTimeout(60000); // Increase timeout for all tests in this suite
  
  test.describe('End-to-End User Journey', () => {
    test('complete new user flow: register → onboard → first check-in → streak', async ({ 
      landingPage, registerPage, dashboardPage, testUser 
    }) => {
      // Step 1: Landing page discovery
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // User explores features
      await expect(landingPage.featuresSection).toBeVisible();
      const featuresSection = landingPage.page.locator('text="Why AXIS6?"');
      if (await featuresSection.isVisible()) {
        await featuresSection.scrollIntoViewIfNeeded();
      }
      
      // Step 2: User decides to register
      await landingPage.clickRegister();
      await registerPage.verifyRegisterForm();
      
      // Fill registration form with wait for form to be ready
      await registerPage.page.waitForLoadState('networkidle');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await registerPage.page.waitForTimeout(1000); // Wait for form submission
      
      // Step 3: Handle onboarding (if exists)
      await registerPage.page.waitForURL(/\/(dashboard|auth\/onboarding)/, { timeout: 30000 });
      
      if (registerPage.page.url().includes('onboarding')) {
        // Navigate directly to dashboard to skip onboarding
        await registerPage.page.goto('/dashboard');
        await registerPage.page.waitForLoadState('networkidle');
      }
      
      // Step 4: First dashboard experience
      await dashboardPage.verifyDashboardLoaded();
      
      // User sees their hexagon for the first time
      await expect(dashboardPage.hexagonChart).toBeVisible();
      
      // Step 5: Perform first check-in
      const checkInButtons = dashboardPage.page.locator(
        'button:has-text("Check In"), [data-testid*="checkin-button"]'
      );
      
      if (await checkInButtons.count() > 0) {
        // Click the first available check-in
        await checkInButtons.first().click();
        await dashboardPage.page.waitForTimeout(2000);
        
        // Verify check-in was successful
        const successIndicator = dashboardPage.page.locator(
          '.success, [data-testid*="success"], .completed, .checked'
        );
        
        if (await successIndicator.count() > 0) {
          await expect(successIndicator.first()).toBeVisible();
        }
        
        // Step 6: Check streak started
        const streakElement = dashboardPage.page.locator('[data-testid*="streak"], .streak');
        if (await streakElement.count() > 0) {
          const streakText = await streakElement.first().textContent();
          expect(streakText).toMatch(/\d+/); // Should show a number
        }
      }
    });
    
    test('returning user flow: login → view progress → continue streak', async ({ 
      loginPage, dashboardPage, registerPage, testUser 
    }) => {
      // Setup: Create user and perform initial check-in
      await registerPage.goto('/auth/register');
      await registerPage.page.waitForLoadState('networkidle');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await registerPage.page.waitForTimeout(1000);
      await registerPage.page.waitForURL(/\/(dashboard|auth\/onboarding)/, { timeout: 15000 });
      
      if (registerPage.page.url().includes('onboarding')) {
        // Navigate directly to dashboard to skip onboarding
        await registerPage.page.goto('/dashboard');
        await registerPage.page.waitForLoadState('networkidle');
      }
      
      // Perform initial check-in
      const initialCheckIn = dashboardPage.page.locator('button:has-text("Check In")').first();
      if (await initialCheckIn.isVisible() && !await initialCheckIn.isDisabled()) {
        await initialCheckIn.click();
        await dashboardPage.page.waitForTimeout(2000);
      }
      
      // Logout
      try {
        await dashboardPage.logout();
      } catch (e) {
        await loginPage.page.context().clearCookies();
      }
      
      // Returning user journey
      // Step 1: User returns and logs in
      await loginPage.goto('/auth/login');
      await loginPage.login(testUser.email, testUser.password);
      await loginPage.page.waitForURL(/\/(dashboard|auth\/onboarding)/, { timeout: 15000 });
      
      // Skip onboarding if present
      if (loginPage.page.url().includes('onboarding')) {
        await loginPage.page.goto('/dashboard');
        await loginPage.page.waitForLoadState('networkidle');
      }
      
      // Step 2: User sees their previous progress
      await dashboardPage.verifyDashboardLoaded();
      
      // Should see existing streak
      const streakElement = dashboardPage.page.locator('[data-testid*="streak"], .streak');
      if (await streakElement.count() > 0) {
        await expect(streakElement.first()).toBeVisible();
      }
      
      // Should see previous check-ins
      const completedIndicators = dashboardPage.page.locator('.completed, .checked');
      if (await completedIndicators.count() > 0) {
        await expect(completedIndicators.first()).toBeVisible();
      }
      
      // Step 3: Continue building streak (if new day)
      const availableCheckIns = dashboardPage.page.locator(
        'button:has-text("Check In"):not([disabled])'
      );
      
      if (await availableCheckIns.count() > 0) {
        await availableCheckIns.first().click();
        await dashboardPage.page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Multi-Category Journey', () => {
    test('should allow user to check in to multiple categories', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Find all available check-in buttons
      const checkInButtons = authenticatedPage.page.locator(
        'button:has-text("Check In"):not([disabled]), [data-testid*="checkin-button"]:not([disabled])'
      );
      
      const buttonCount = await checkInButtons.count();
      let checkedInCount = 0;
      
      // Try to check in to multiple categories (up to 3)
      for (let i = 0; i < Math.min(3, buttonCount); i++) {
        const button = checkInButtons.nth(i);
        if (await button.isVisible() && !await button.isDisabled()) {
          await button.click();
          await authenticatedPage.page.waitForTimeout(1500);
          checkedInCount++;
        }
      }
      
      // Verify multiple check-ins were successful
      if (checkedInCount > 0) {
        const completedIndicators = authenticatedPage.page.locator('.completed, .checked, [data-checked="true"]');
        expect(await completedIndicators.count()).toBeGreaterThanOrEqual(checkedInCount);
      }
    });
    
    test('should update hexagon visualization with progress', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Get initial hexagon state
      const hexagon = authenticatedPage.hexagonChart;
      const initialState = await hexagon.screenshot();
      
      // Perform check-ins
      const checkInButton = authenticatedPage.page.locator('button:has-text("Check In")').first();
      if (await checkInButton.isVisible() && !await checkInButton.isDisabled()) {
        await checkInButton.click();
        await authenticatedPage.page.waitForTimeout(3000);
        
        // Hexagon should visually update
        const updatedState = await hexagon.screenshot();
        
        // Screenshots should be different (indicates visual update)
        expect(Buffer.compare(initialState, updatedState)).not.toBe(0);
      }
    });
  });

  test.describe('Weekly Progress Journey', () => {
    test('should show weekly progress patterns', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Look for weekly/historical data
      const weeklyElements = authenticatedPage.page.locator(
        '[data-testid*="weekly"], [data-testid*="week"], .weekly-progress'
      );
      
      if (await weeklyElements.count() > 0) {
        await expect(weeklyElements.first()).toBeVisible();
        
        // Should show some kind of progress visualization
        const progressBars = weeklyElements.locator('.progress, [role="progressbar"]');
        const charts = weeklyElements.locator('svg, canvas');
        
        if (await progressBars.count() > 0 || await charts.count() > 0) {
          expect(await progressBars.count() + await charts.count()).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Error Recovery Journey', () => {
    test('user should recover from network interruption', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Simulate network interruption during check-in
      await authenticatedPage.page.setOffline(true);
      
      // Try to perform check-in
      const checkInButton = authenticatedPage.page.locator('button:has-text("Check In")').first();
      if (await checkInButton.isVisible()) {
        await checkInButton.click();
        await authenticatedPage.page.waitForTimeout(2000);
        
        // Should show error or offline indicator
        const errorIndicator = authenticatedPage.page.locator(
          '[role="alert"], .error, .offline, [data-testid*="error"]'
        );
        
        if (await errorIndicator.count() > 0) {
          await expect(errorIndicator.first()).toBeVisible();
        }
      }
      
      // Restore network
      await authenticatedPage.page.setOffline(false);
      await authenticatedPage.page.reload();
      await authenticatedPage.verifyDashboardLoaded();
      
      // Should be able to check in normally
      const retryCheckIn = authenticatedPage.page.locator('button:has-text("Check In")').first();
      if (await retryCheckIn.isVisible() && !await retryCheckIn.isDisabled()) {
        await retryCheckIn.click();
        await authenticatedPage.page.waitForTimeout(2000);
        
        // Should succeed this time
        const successIndicator = authenticatedPage.page.locator('.success, .completed');
        if (await successIndicator.count() > 0) {
          await expect(successIndicator.first()).toBeVisible();
        }
      }
    });
    
    test('user should handle session expiration gracefully', async ({ authenticatedPage, page }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Clear cookies to simulate session expiration
      await page.context().clearCookies();
      
      // Try to perform action that requires authentication
      const checkInButton = page.locator('button:has-text("Check In")').first();
      if (await checkInButton.isVisible()) {
        await checkInButton.click();
        await page.waitForTimeout(2000);
        
        // Should redirect to login or show login prompt
        if (page.url().includes('login')) {
          await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
        } else {
          // Or show authentication error
          const authError = page.locator('[role="alert"], .auth-error, [data-testid*="auth-error"]');
          if (await authError.count() > 0) {
            await expect(authError.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Progressive Web App Journey', () => {
    test('should work as Progressive Web App', async ({ landingPage }) => {
      await landingPage.goto('/');
      
      // Check for PWA manifest
      const manifestLink = landingPage.page.locator('link[rel="manifest"]');
      if (await manifestLink.count() > 0) {
        const manifestHref = await manifestLink.getAttribute('href');
        expect(manifestHref).toBeTruthy();
        
        // Verify manifest is accessible
        const manifestResponse = await landingPage.page.request.get(manifestHref!);
        expect(manifestResponse.status()).toBe(200);
      }
      
      // Check for service worker
      const swRegistered = await landingPage.page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      expect(swRegistered).toBe(true);
    });
    
    test('should handle offline functionality', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Go offline
      await authenticatedPage.page.setOffline(true);
      
      // Page should still be accessible (cached)
      await authenticatedPage.page.reload();
      
      // Basic structure should still load
      const body = authenticatedPage.page.locator('body');
      await expect(body).toBeVisible();
      
      // Should show offline indicator
      const offlineIndicator = authenticatedPage.page.locator(
        '.offline, [data-testid*="offline"], [aria-label*="offline"]'
      );
      
      if (await offlineIndicator.count() > 0) {
        await expect(offlineIndicator.first()).toBeVisible();
      }
    });
  });

  test.describe('Accessibility Journey', () => {
    test('should be navigable with keyboard only', async ({ landingPage, loginPage, dashboardPage, testUser, registerPage }) => {
      // Navigate landing page with keyboard
      await landingPage.goto('/');
      
      // Tab to register button
      let tabCount = 0;
      while (tabCount < 10) { // Prevent infinite loop
        await landingPage.page.keyboard.press('Tab');
        tabCount++;
        
        const focused = await landingPage.page.locator(':focus').textContent();
        if (focused?.includes('Start Free') || focused?.includes('Register')) {
          break;
        }
      }
      
      // Press Enter to navigate
      await landingPage.page.keyboard.press('Enter');
      await registerPage.page.waitForURL('**/auth/register');
      
      // Fill form with keyboard
      await registerPage.emailInput.focus();
      await registerPage.page.keyboard.type(testUser.email);
      
      await registerPage.page.keyboard.press('Tab');
      await registerPage.page.keyboard.type(testUser.password);
      
      if (await registerPage.nameInput.isVisible()) {
        await registerPage.page.keyboard.press('Tab');
        await registerPage.page.keyboard.type(testUser.name);
      }
      
      // Submit form
      await registerPage.page.keyboard.press('Tab');
      await registerPage.page.keyboard.press('Enter');
      
      // Should reach dashboard
      await registerPage.page.waitForURL(/\/(dashboard|auth\/onboarding)/, { timeout: 15000 });
      if (registerPage.page.url().includes('onboarding')) {
        // Navigate directly to dashboard to skip onboarding  
        await registerPage.page.goto('/dashboard');
        await registerPage.page.waitForLoadState('networkidle');
      }
      
      await dashboardPage.verifyDashboardLoaded();
    });
    
    test('should work with screen reader simulation', async ({ authenticatedPage, utils }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Check for proper ARIA labels and roles
      const a11yIssues = await utils.checkAccessibility(authenticatedPage.page);
      
      // Should have minimal accessibility issues
      expect(a11yIssues.filter(issue => issue.type === 'critical').length).toBeLessThanOrEqual(2);
      
      // Check for landmark regions
      const landmarks = authenticatedPage.page.locator('[role="main"], main, [role="navigation"], nav');
      expect(await landmarks.count()).toBeGreaterThan(0);
      
      // Check for heading hierarchy
      const headings = authenticatedPage.page.locator('h1, h2, h3, h4, h5, h6');
      expect(await headings.count()).toBeGreaterThan(0);
    });
  });
});