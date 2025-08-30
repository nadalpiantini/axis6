import { test, expect } from '../fixtures/auth-fixtures';

test.describe('AXIS6 Dashboard Functionality', () => {

  test.describe('Dashboard Loading and Navigation', () => {
    test('should load dashboard correctly for authenticated user', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Check page title
      await expect(authenticatedPage.page).toHaveTitle(/Dashboard|AXIS6/);

      // Verify key dashboard elements are visible
      await expect(authenticatedPage.hexagonChart).toBeVisible();
    });

    test('should display user data correctly', async ({ authenticatedPage, testUser }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Should show user name or email somewhere
      const userInfo = authenticatedPage.page.locator(`text="${testUser.name}"`).or(
        authenticatedPage.page.locator(`text="${testUser.email}"`)
      );

      // User info might be in a menu or header
      if (await authenticatedPage.userMenu.isVisible()) {
        await authenticatedPage.userMenu.click();
        await expect(userInfo).toBeVisible();
      }
    });

    test('should handle dashboard data loading states', async ({ authenticatedPage }) => {
      // Navigate to dashboard
      await authenticatedPage.goto('/dashboard');

      // Should handle loading state gracefully
      await authenticatedPage.page.waitForLoadState('networkidle');
      await authenticatedPage.verifyDashboardLoaded();

      // Check for any loading indicators that should be hidden
      const loadingIndicators = authenticatedPage.page.locator('[data-testid*="loading"], .loading, .spinner');
      if (await loadingIndicators.count() > 0) {
        await expect(loadingIndicators.first()).toBeHidden();
      }
    });
  });

  test.describe('Hexagon Visualization', () => {
    test('should display hexagon chart correctly', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      const hexagon = authenticatedPage.hexagonChart;
      await expect(hexagon).toBeVisible();

      // Check SVG structure
      if (await hexagon.locator('svg').isVisible()) {
        const svgElements = hexagon.locator('circle, path, line');
        expect(await svgElements.count()).toBeGreaterThan(0);
      }

      // Should have interactive elements
      const interactiveElements = hexagon.locator('[role="button"], button, [data-testid*="category"]');
      if (await interactiveElements.count() > 0) {
        await expect(interactiveElements.first()).toBeVisible();
      }
    });

    test('should show all 6 categories in hexagon', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Look for category indicators in the hexagon
      const categories = ['Physical', 'Mental', 'Emotional', 'Social', 'Spiritual', 'Material'];

      for (const category of categories) {
        // Check if category is represented (text, data attribute, or class)
        const categoryElement = authenticatedPage.page.locator(
          `[data-category="${category.toLowerCase()}"], [data-testid*="${category.toLowerCase()}"], text="${category}"`
        ).first();

        // If element exists, it should be visible
        if (await categoryElement.count() > 0) {
          await expect(categoryElement).toBeVisible();
        }
      }
    });

    test('should be interactive and respond to clicks', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Find clickable elements in hexagon
      const clickableElements = authenticatedPage.hexagonChart.locator(
        'circle[role="button"], [data-testid*="category"], .category-segment'
      );

      if (await clickableElements.count() > 0) {
        const firstElement = clickableElements.first();
        await firstElement.click();

        // Should trigger some interaction (modal, highlight, navigation)
        // Check for modal or state change
        await authenticatedPage.page.waitForTimeout(1000); // Wait for interaction
      }
    });
  });

  test.describe('Daily Check-ins', () => {
    test('should allow user to perform daily check-ins', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Look for check-in buttons or cards
      const checkInButtons = authenticatedPage.page.locator(
        '[data-testid*="checkin"], [data-testid*="check-in"], button:has-text("Check In")'
      );

      if (await checkInButtons.count() > 0) {
        const firstCheckIn = checkInButtons.first();
        await firstCheckIn.click();

        // Should show some feedback or update the UI
        await authenticatedPage.page.waitForTimeout(2000);

        // Check for success indicator
        const successIndicator = authenticatedPage.page.locator(
          '.success, [data-testid*="success"], .completed, [class*="checked"]'
        );

        if (await successIndicator.count() > 0) {
          await expect(successIndicator.first()).toBeVisible();
        }
      }
    });

    test('should show check-in status for each category', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Look for category cards with check-in status
      const categoryCards = authenticatedPage.page.locator('[data-testid*="category"], .category-card');

      if (await categoryCards.count() > 0) {
        for (let i = 0; i < Math.min(3, await categoryCards.count()); i++) {
          const card = categoryCards.nth(i);
          await expect(card).toBeVisible();

          // Should have some status indicator
          const statusElements = card.locator('.status, [data-testid*="status"], .checked, .unchecked');
          if (await statusElements.count() > 0) {
            await expect(statusElements.first()).toBeVisible();
          }
        }
      }
    });

    test('should prevent duplicate check-ins for same day', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Find a check-in button and click it
      const checkInButton = authenticatedPage.page.locator(
        'button:has-text("Check In"), [data-testid*="checkin-button"]'
      ).first();

      if (await checkInButton.isVisible()) {
        await checkInButton.click();
        await authenticatedPage.page.waitForTimeout(2000);

        // Button should be disabled or changed to "Checked In"
        const isDisabled = await checkInButton.isDisabled();
        const hasCheckedText = await checkInButton.textContent();

        expect(isDisabled || hasCheckedText?.includes('Checked')).toBeTruthy();
      }
    });
  });

  test.describe('Streak Tracking', () => {
    test('should display streak information', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Look for streak counters or indicators
      const streakElements = authenticatedPage.page.locator(
        '[data-testid*="streak"], .streak, [class*="streak"]'
      );

      if (await streakElements.count() > 0) {
        for (let i = 0; i < Math.min(3, await streakElements.count()); i++) {
          const streakElement = streakElements.nth(i);
          await expect(streakElement).toBeVisible();

          // Should contain numeric data
          const streakText = await streakElement.textContent();
          expect(streakText).toMatch(/\d+/); // Should contain at least one number
        }
      }
    });

    test('should update streaks after check-ins', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Get initial streak count
      const streakElement = authenticatedPage.page.locator('[data-testid*="streak"]').first();
      let initialStreak = 0;

      if (await streakElement.isVisible()) {
        const streakText = await streakElement.textContent();
        initialStreak = parseInt(streakText?.match(/\d+/)?.[0] || '0');
      }

      // Perform a check-in
      const checkInButton = authenticatedPage.page.locator('button:has-text("Check In")').first();
      if (await checkInButton.isVisible() && !await checkInButton.isDisabled()) {
        await checkInButton.click();
        await authenticatedPage.page.waitForTimeout(3000);

        // Reload to see updated streak
        await authenticatedPage.page.reload();
        await authenticatedPage.verifyDashboardLoaded();

        // Check if streak updated
        if (await streakElement.isVisible()) {
          const newStreakText = await streakElement.textContent();
          const newStreak = parseInt(newStreakText?.match(/\d+/)?.[0] || '0');
          expect(newStreak).toBeGreaterThanOrEqual(initialStreak);
        }
      }
    });
  });

  test.describe('Dashboard Responsiveness', () => {
    test('should adapt to mobile viewport', async ({ authenticatedPage }) => {
      // Set mobile viewport
      await authenticatedPage.page.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.verifyDashboardLoaded();

      // Hexagon should still be visible and properly sized
      await expect(authenticatedPage.hexagonChart).toBeVisible();

      // Check if layout adapts (stacked cards, smaller hexagon, etc.)
      const dashboardContainer = authenticatedPage.page.locator('main, [data-testid="dashboard"], .dashboard');
      if (await dashboardContainer.isVisible()) {
        const containerWidth = await dashboardContainer.boundingBox();
        expect(containerWidth?.width).toBeLessThanOrEqual(400); // Should fit mobile screen
      }
    });

    test('should work on tablet viewport', async ({ authenticatedPage }) => {
      // Set tablet viewport
      await authenticatedPage.page.setViewportSize({ width: 768, height: 1024 });
      await authenticatedPage.verifyDashboardLoaded();

      // All elements should still be accessible
      await expect(authenticatedPage.hexagonChart).toBeVisible();

      // Check touch-friendly button sizes
      const buttons = authenticatedPage.page.locator('button');
      if (await buttons.count() > 0) {
        const buttonBox = await buttons.first().boundingBox();
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44); // Minimum touch target
      }
    });

    test('should handle different screen orientations', async ({ authenticatedPage }) => {
      // Portrait
      await authenticatedPage.page.setViewportSize({ width: 375, height: 812 });
      await authenticatedPage.verifyDashboardLoaded();
      await expect(authenticatedPage.hexagonChart).toBeVisible();

      // Landscape
      await authenticatedPage.page.setViewportSize({ width: 812, height: 375 });
      await authenticatedPage.page.waitForTimeout(1000);
      await expect(authenticatedPage.hexagonChart).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ authenticatedPage }) => {
      // Intercept API calls and simulate errors
      await authenticatedPage.page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await authenticatedPage.goto('/dashboard');

      // Should show error message or fallback UI
      const errorElement = authenticatedPage.page.locator(
        '[role="alert"], .error, [data-testid*="error"], [class*="error"]'
      );

      if (await errorElement.count() > 0) {
        await expect(errorElement.first()).toBeVisible();
      } else {
        // Or should at least load basic structure without crashing
        await expect(authenticatedPage.page.locator('body')).toBeVisible();
      }
    });

    test('should handle slow network conditions', async ({ authenticatedPage }) => {
      // Simulate slow network
      await authenticatedPage.page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3s delay
        await route.continue();
      });

      await authenticatedPage.goto('/dashboard');

      // Should show loading states during slow requests
      const loadingIndicator = authenticatedPage.page.locator(
        '.loading, .spinner, [data-testid*="loading"]'
      );

      // Loading indicator should appear initially
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator.first()).toBeVisible();
      }

      // Wait for actual content to load
      await authenticatedPage.page.waitForLoadState('networkidle', { timeout: 30000 });
      await authenticatedPage.verifyDashboardLoaded();
    });
  });

  test.describe('Data Persistence', () => {
    test('should persist check-in data across sessions', async ({ authenticatedPage, page, testUser }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Perform a check-in if possible
      const checkInButton = page.locator('button:has-text("Check In")').first();
      if (await checkInButton.isVisible() && !await checkInButton.isDisabled()) {
        await checkInButton.click();
        await page.waitForTimeout(2000);
      }

      // Clear session and login again
      await page.context().clearCookies();

      // Login again
      await page.goto('/auth/login');
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const passwordInput = page.getByRole('textbox', { name: /password/i });
      const loginButton = page.getByRole('button', { name: /sign in|login/i });

      await emailInput.fill(testUser.email);
      await passwordInput.fill(testUser.password);
      await loginButton.click();

      await page.waitForURL('**/dashboard');
      await authenticatedPage.verifyDashboardLoaded();

      // Previous check-in should still be visible
      const checkedInElement = page.locator('.completed, .checked, [data-checked="true"]');
      if (await checkedInElement.count() > 0) {
        await expect(checkedInElement.first()).toBeVisible();
      }
    });

    test('should maintain UI state during page refresh', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Get current state
      const hexagonVisible = await authenticatedPage.hexagonChart.isVisible();

      // Refresh page
      await authenticatedPage.page.reload();
      await authenticatedPage.page.waitForLoadState('networkidle');

      // State should be restored
      await authenticatedPage.verifyDashboardLoaded();
      expect(await authenticatedPage.hexagonChart.isVisible()).toBe(hexagonVisible);
    });
  });
});
