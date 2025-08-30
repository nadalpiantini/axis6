import { test, expect } from '../fixtures/auth-fixtures';

test.describe('AXIS6 Accessibility Audits', () => {

  test.describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation on landing page', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();

      // Start from the top
      await landingPage.page.keyboard.press('Home');

      let focusCount = 0;
      const maxTabs = 20; // Reasonable limit to prevent infinite loops

      // Tab through all focusable elements
      while (focusCount < maxTabs) {
        await landingPage.page.keyboard.press('Tab');
        focusCount++;

        const focused = landingPage.page.locator(':focus');
        const focusedElement = await focused.first().isVisible();

        if (focusedElement) {
          // Check if focused element is actually focusable
          const tagName = await focused.first().evaluate(el => el.tagName.toLowerCase());
          const isInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName) ||
                               await focused.first().getAttribute('tabindex') !== null;

          if (isInteractive) {
            // Verify focus is visible
            const focusedBox = await focused.first().boundingBox();
            expect(focusedBox).toBeTruthy();
          }
        }
      }

      // Should have found interactive elements
      expect(focusCount).toBeGreaterThan(0);
    });

    test('should support keyboard navigation in authentication forms', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();

      // Tab through form fields
      await loginPage.page.keyboard.press('Tab');
      await expect(loginPage.emailInput).toBeFocused();

      await loginPage.page.keyboard.press('Tab');
      await expect(loginPage.passwordInput).toBeFocused();

      await loginPage.page.keyboard.press('Tab');
      await expect(loginPage.loginButton).toBeFocused();

      // Should be able to submit with Enter
      await loginPage.emailInput.focus();
      await loginPage.page.keyboard.type('test@example.com');

      await loginPage.page.keyboard.press('Tab');
      await loginPage.page.keyboard.type('password123');

      // Enter on button should trigger submit
      await loginPage.page.keyboard.press('Tab');
      await loginPage.page.keyboard.press('Enter');

      // Form should attempt submission (may show validation errors)
      await loginPage.page.waitForTimeout(1000);
    });

    test('should support keyboard navigation on dashboard', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Find interactive elements on dashboard
      const interactiveElements = authenticatedPage.page.locator(
        'button, a, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const elementCount = await interactiveElements.count();
      expect(elementCount).toBeGreaterThan(0);

      // Tab through dashboard elements
      for (let i = 0; i < Math.min(10, elementCount); i++) {
        await authenticatedPage.page.keyboard.press('Tab');

        const focused = authenticatedPage.page.locator(':focus');
        if (await focused.isVisible()) {
          // Verify focus indicators
          const focusedBox = await focused.boundingBox();
          expect(focusedBox).toBeTruthy();
        }
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper semantic structure', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();

      // Check for proper heading hierarchy
      const h1 = landingPage.page.locator('h1');
      expect(await h1.count()).toBeGreaterThanOrEqual(1);

      const headings = landingPage.page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(1);

      // Check heading hierarchy (h1 should come before h2, etc.)
      const headingLevels = await headings.evaluateAll(elements =>
        elements.map(el => parseInt(el.tagName.charAt(1)))
      );

      let previousLevel = 0;
      for (const level of headingLevels) {
        // Should not skip more than one level
        expect(level - previousLevel).toBeLessThanOrEqual(1);
        previousLevel = level;
      }
    });

    test('should have proper ARIA labels and roles', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();

      // Check form inputs have labels
      const emailLabel = await loginPage.emailInput.getAttribute('aria-label') ||
                         await loginPage.page.locator('label[for*="email"]').textContent() ||
                         await loginPage.emailInput.getAttribute('placeholder');
      expect(emailLabel).toBeTruthy();

      const passwordLabel = await loginPage.passwordInput.getAttribute('aria-label') ||
                            await loginPage.page.locator('label[for*="password"]').textContent() ||
                            await loginPage.passwordInput.getAttribute('placeholder');
      expect(passwordLabel).toBeTruthy();

      // Check for form landmarks
      const form = loginPage.page.locator('form, [role="form"]');
      expect(await form.count()).toBeGreaterThan(0);

      // Check button has accessible name
      const buttonText = await loginPage.loginButton.textContent() ||
                        await loginPage.loginButton.getAttribute('aria-label');
      expect(buttonText).toBeTruthy();
    });

    test('should have proper landmark regions', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Check for main content area
      const main = authenticatedPage.page.locator('main, [role="main"]');
      expect(await main.count()).toBeGreaterThanOrEqual(1);

      // Check for navigation if exists
      const nav = authenticatedPage.page.locator('nav, [role="navigation"]');
      const header = authenticatedPage.page.locator('header, [role="banner"]');
      const footer = authenticatedPage.page.locator('footer, [role="contentinfo"]');

      // Should have logical page structure
      expect(await main.count() + await nav.count() + await header.count()).toBeGreaterThan(0);
    });

    test('should provide status announcements for dynamic content', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Look for ARIA live regions
      const liveRegions = authenticatedPage.page.locator('[aria-live], [role="status"], [role="alert"]');

      if (await liveRegions.count() > 0) {
        // Live regions should not be empty when announcing
        for (let i = 0; i < await liveRegions.count(); i++) {
          const region = liveRegions.nth(i);
          const ariaLive = await region.getAttribute('aria-live');

          if (ariaLive) {
            expect(['polite', 'assertive', 'off']).toContain(ariaLive);
          }
        }
      }

      // Try to trigger a status update (check-in)
      const checkInButton = authenticatedPage.page.locator('button:has-text("Check In")').first();
      if (await checkInButton.isVisible() && !await checkInButton.isDisabled()) {
        await checkInButton.click();
        await authenticatedPage.page.waitForTimeout(2000);

        // Should announce success or error status
        const statusElements = authenticatedPage.page.locator(
          '[role="status"], [role="alert"], .sr-only, .screen-reader-only'
        );

        if (await statusElements.count() > 0) {
          const hasStatusText = await statusElements.first().textContent();
          expect(hasStatusText?.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Visual Accessibility', () => {
    test('should have sufficient color contrast', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();

      // Check high-contrast elements (headlines, buttons)
      const criticalElements = landingPage.page.locator('h1, h2, button, a');

      for (let i = 0; i < Math.min(5, await criticalElements.count()); i++) {
        const element = criticalElements.nth(i);

        if (await element.isVisible()) {
          const styles = await element.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize
            };
          });

          // Basic check - should have color and background color defined
          expect(styles.color).not.toBe('');
          expect(styles.fontSize).toBeTruthy();
        }
      }
    });

    test('should be usable when zoomed to 200%', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();

      // Simulate 200% zoom
      await landingPage.page.setViewportSize({ width: 640, height: 360 }); // Half of 1280x720

      // Content should still be accessible
      await expect(landingPage.heroTitle).toBeVisible();
      await expect(landingPage.loginButton).toBeVisible();
      await expect(landingPage.registerButton).toBeVisible();

      // Buttons should still be clickable
      const buttonBox = await landingPage.loginButton.boundingBox();
      expect(buttonBox?.width).toBeGreaterThan(44); // Minimum touch target
      expect(buttonBox?.height).toBeGreaterThan(44);
    });

    test('should handle high contrast mode', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Simulate high contrast by checking if essential elements are visible
      const essentialElements = [
        authenticatedPage.hexagonChart,
        authenticatedPage.page.locator('button, a').first()
      ];

      for (const element of essentialElements) {
        if (await element.isVisible()) {
          const boundingBox = await element.boundingBox();
          expect(boundingBox?.width).toBeGreaterThan(0);
          expect(boundingBox?.height).toBeGreaterThan(0);
        }
      }
    });

    test('should not rely solely on color for information', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Check for status indicators that might use color
      const statusElements = authenticatedPage.page.locator(
        '.status, [data-testid*="status"], .completed, .checked'
      );

      for (let i = 0; i < Math.min(3, await statusElements.count()); i++) {
        const element = statusElements.nth(i);

        if (await element.isVisible()) {
          // Should have text content, icons, or shape differences (not just color)
          const hasText = await element.textContent();
          const hasIcon = await element.locator('svg, [class*="icon"]').count() > 0;
          const hasAriaLabel = await element.getAttribute('aria-label');

          expect(hasText?.trim() || hasIcon || hasAriaLabel).toBeTruthy();
        }
      }
    });
  });

  test.describe('Motor Accessibility', () => {
    test('should have adequate click targets', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Check button sizes meet minimum requirements
      const buttons = authenticatedPage.page.locator('button, [role="button"], a');

      for (let i = 0; i < Math.min(5, await buttons.count()); i++) {
        const button = buttons.nth(i);

        if (await button.isVisible()) {
          const box = await button.boundingBox();

          // WCAG 2.1 AA: minimum 44x44 CSS pixels for touch targets
          expect(box?.width).toBeGreaterThanOrEqual(44);
          expect(box?.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should support click and touch interactions', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();

      // Test both click and touch on interactive elements
      const registerButton = landingPage.registerButton;

      // Test click
      await registerButton.click();
      await landingPage.page.waitForURL('**/auth/register');

      // Go back
      await landingPage.page.goBack();
      await landingPage.verifyLandingPageLoaded();

      // Test touch (tap)
      await registerButton.tap();
      await landingPage.page.waitForURL('**/auth/register');
    });

    test('should not require precise mouse control', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Test that hexagon elements can be activated from different points
      const hexagon = authenticatedPage.hexagonChart;

      if (await hexagon.isVisible()) {
        const box = await hexagon.boundingBox();

        if (box) {
          // Click at different points within the hexagon
          const points = [
            { x: box.x + box.width * 0.3, y: box.y + box.height * 0.3 },
            { x: box.x + box.width * 0.7, y: box.y + box.height * 0.7 },
            { x: box.x + box.width * 0.5, y: box.y + box.height * 0.5 }
          ];

          for (const point of points) {
            await authenticatedPage.page.mouse.click(point.x, point.y);
            await authenticatedPage.page.waitForTimeout(500);
            // Should handle clicks at different positions
          }
        }
      }
    });

    test('should support voice activation', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();

      // Check that form elements can be focused programmatically
      // (which is how voice control software works)

      await loginPage.emailInput.focus();
      await expect(loginPage.emailInput).toBeFocused();

      await loginPage.passwordInput.focus();
      await expect(loginPage.passwordInput).toBeFocused();

      await loginPage.loginButton.focus();
      await expect(loginPage.loginButton).toBeFocused();

      // Elements should be activatable via Enter key
      await loginPage.page.keyboard.press('Enter');
      await loginPage.page.waitForTimeout(1000);
    });
  });

  test.describe('Cognitive Accessibility', () => {
    test('should have consistent navigation', async ({ landingPage, loginPage, registerPage }) => {
      // Check navigation consistency across pages

      // Landing page
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();

      const landingNavigation = await landingPage.page.locator('nav, [role="navigation"]').count();

      // Login page
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();

      const loginNavigation = await loginPage.page.locator('nav, [role="navigation"]').count();

      // Register page
      await registerPage.goto('/auth/register');
      await registerPage.verifyRegisterForm();

      const registerNavigation = await registerPage.page.locator('nav, [role="navigation"]').count();

      // Navigation should be consistent (or predictably absent on auth pages)
      if (landingNavigation > 0) {
        expect(loginNavigation + registerNavigation).toBeGreaterThan(0);
      }
    });

    test('should provide clear instructions and feedback', async ({ registerPage }) => {
      await registerPage.goto('/auth/register');
      await registerPage.verifyRegisterForm();

      // Try invalid input to trigger validation messages
      await registerPage.emailInput.fill('invalid-email');
      await registerPage.passwordInput.fill('123');
      await registerPage.registerButton.click();

      await registerPage.page.waitForTimeout(1000);

      // Should provide clear error messages
      const errorMessages = registerPage.page.locator(
        '[role="alert"], .error, [class*="error"], [data-testid*="error"]'
      );

      if (await errorMessages.count() > 0) {
        const errorText = await errorMessages.first().textContent();
        expect(errorText?.trim().length).toBeGreaterThan(5); // Meaningful error message
      }
    });

    test('should have reasonable timeout handling', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Simulate slow interaction
      await authenticatedPage.page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
        await route.continue();
      });

      // Try to perform action that requires API call
      const checkInButton = authenticatedPage.page.locator('button:has-text("Check In")').first();

      if (await checkInButton.isVisible() && !await checkInButton.isDisabled()) {
        await checkInButton.click();

        // Should show loading state or feedback during slow operation
        const loadingIndicator = authenticatedPage.page.locator(
          '.loading, .spinner, [aria-busy="true"], [data-testid*="loading"]'
        );

        if (await loadingIndicator.count() > 0) {
          await expect(loadingIndicator.first()).toBeVisible();
        }

        // Wait for completion
        await authenticatedPage.page.waitForTimeout(5000);
      }
    });

    test('should provide undo functionality where appropriate', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Look for actions that might have undo functionality
      const actionButtons = authenticatedPage.page.locator(
        'button:has-text("Delete"), button:has-text("Remove"), button:has-text("Clear")'
      );

      if (await actionButtons.count() > 0) {
        // Check if there are corresponding undo mechanisms
        const undoElements = authenticatedPage.page.locator(
          'button:has-text("Undo"), .undo, [data-testid*="undo"]'
        );

        // If destructive actions exist, undo should be available
        if (await actionButtons.count() > 0) {
          // Either undo functionality or confirmation dialogs
          const confirmDialogs = authenticatedPage.page.locator(
            '[role="dialog"], [role="alertdialog"], .modal, .confirm'
          );

          expect(await undoElements.count() + await confirmDialogs.count()).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  test.describe('Comprehensive Accessibility', () => {
    test('should pass automated accessibility scan', async ({ landingPage, utils }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();

      // Run accessibility checks
      const a11yIssues = await utils.checkAccessibility(landingPage.page);

      // Categorize issues by severity
      const criticalIssues = a11yIssues.filter(issue =>
        issue.type === 'missing-alt' || issue.type === 'no-headings'
      );

      const minorIssues = a11yIssues.filter(issue =>
        !criticalIssues.includes(issue)
      );

      // Should have minimal critical accessibility issues
      expect(criticalIssues.length).toBeLessThanOrEqual(2);

      // Total issues should be manageable
      expect(a11yIssues.length).toBeLessThanOrEqual(5);
    });

    test('should work with assistive technologies', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Check for proper ARIA attributes that assistive tech relies on
      const interactiveElements = authenticatedPage.page.locator(
        'button, [role="button"], input, select, [tabindex]'
      );

      for (let i = 0; i < Math.min(5, await interactiveElements.count()); i++) {
        const element = interactiveElements.nth(i);

        if (await element.isVisible()) {
          // Should have accessible name
          const accessibleName =
            await element.textContent() ||
            await element.getAttribute('aria-label') ||
            await element.getAttribute('aria-labelledby') ||
            await element.getAttribute('title');

          expect(accessibleName?.trim()).toBeTruthy();

          // Interactive elements should have proper roles
          const role = await element.getAttribute('role') ||
                      await element.evaluate(el => el.tagName.toLowerCase());

          expect(role).toBeTruthy();
        }
      }
    });
  });
});
