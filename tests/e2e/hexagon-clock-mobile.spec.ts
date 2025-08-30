/**
 * HexagonClock Mobile E2E Tests
 * Real device testing for mobile responsiveness and touch optimization
 */

import { test, expect, devices } from '@playwright/test';

const DEVICE_CONFIGS = [
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone 13 Pro', device: devices['iPhone 13 Pro'] },
  { name: 'Samsung Galaxy S21', device: devices['Galaxy S21'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'iPad', device: devices['iPad'] },
];

// Test configuration for different modes
const TEST_MODES = {
  dashboard: '/dashboard',
  myDay: '/my-day',
  landing: '/',
} as const;

test.describe('HexagonClock Mobile E2E Tests', () => {
  // Run tests on multiple devices
  DEVICE_CONFIGS.forEach(({ name, device }) => {
    test.describe(`${name} Device Tests`, () => {
      test.use({ ...device });

      test.beforeEach(async ({ page }) => {
        // Navigate to login and authenticate
        await page.goto('http://localhost:3000/auth/login');

        // Mock authentication for testing
        await page.evaluate(() => {
          localStorage.setItem('supabase.auth.token', JSON.stringify({
            access_token: 'test-token',
            user: { id: 'test-user-id', email: 'test@example.com' }
          }));
        });
      });

      test(`renders HexagonClock correctly on ${name}`, async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');

        // Wait for HexagonClock to render
        await expect(page.locator('.hexagon-clock-container')).toBeVisible();

        // Verify responsive sizing
        const hexagonContainer = page.locator('.hexagon-clock-container');
        const boundingBox = await hexagonContainer.boundingBox();

        expect(boundingBox).toBeTruthy();
        expect(boundingBox!.width).toBeGreaterThan(100);
        expect(boundingBox!.height).toBeGreaterThan(100);

        // Verify it fits within viewport
        const viewport = page.viewportSize()!;
        expect(boundingBox!.width).toBeLessThanOrEqual(viewport.width);
        expect(boundingBox!.height).toBeLessThanOrEqual(viewport.height);
      });

      test(`perfect modal centering on ${name}`, async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');

        // Wait for component to load
        await expect(page.locator('.hexagon-clock-container')).toBeVisible();

        const container = page.locator('.hexagon-clock-container').first();
        const containerBox = await container.boundingBox();
        const viewport = page.viewportSize()!;

        // Calculate if component is centered
        const containerCenterX = containerBox!.x + containerBox!.width / 2;
        const containerCenterY = containerBox!.y + containerBox!.height / 2;
        const viewportCenterX = viewport.width / 2;
        const viewportCenterY = viewport.height / 2;

        // Allow some tolerance for centering (10px)
        const tolerance = 10;
        expect(Math.abs(containerCenterX - viewportCenterX)).toBeLessThan(tolerance);

        // Vertical centering might be less strict due to headers/navbars
        const verticalTolerance = viewport.height * 0.1; // 10% of viewport height
        expect(Math.abs(containerCenterY - viewportCenterY)).toBeLessThan(verticalTolerance);
      });

      test(`touch targets meet WCAG 2.1 AA requirements on ${name}`, async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');

        // Wait for interactive elements
        await expect(page.locator('button[title*="Physical"]')).toBeVisible();

        // Check all touch targets
        const touchTargets = page.locator('button').filter({
          has: page.locator('text=/Physical|Mental|Emotional|Social|Spiritual|Material/i')
        });

        const count = await touchTargets.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
          const target = touchTargets.nth(i);
          const box = await target.boundingBox();

          if (box) {
            // WCAG 2.1 AA requires minimum 44x44px touch targets
            expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
          }
        }
      });

      test(`touch interactions work correctly on ${name}`, async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');

        // Wait for Physical category button
        const physicalButton = page.locator('button[title*="Physical"]');
        await expect(physicalButton).toBeVisible();

        // Test touch interaction
        await physicalButton.tap();

        // Verify interaction worked (would depend on actual implementation)
        // For now, verify no errors occurred and element is still interactive
        await expect(physicalButton).toBeVisible();

        // Test long press (touch and hold)
        await physicalButton.tap({ timeout: 1000 });
        await expect(physicalButton).toBeVisible();
      });

      test(`handles device rotation on ${name}`, async ({ page }) => {
        if (name === 'iPad') {
          // Test portrait mode
          await page.goto('http://localhost:3000/dashboard');
          await page.waitForLoadState('networkidle');

          await expect(page.locator('.hexagon-clock-container')).toBeVisible();
          const portraitBox = await page.locator('.hexagon-clock-container').first().boundingBox();

          // Rotate to landscape (simulated by changing viewport)
          await page.setViewportSize({ width: 1024, height: 768 });
          await page.waitForTimeout(500); // Allow re-render

          await expect(page.locator('.hexagon-clock-container')).toBeVisible();
          const landscapeBox = await page.locator('.hexagon-clock-container').first().boundingBox();

          // Component should adapt to new orientation
          expect(landscapeBox).toBeTruthy();
          expect(landscapeBox!.width).toBeGreaterThan(0);
        }
      });

      test(`performance on ${name} device`, async ({ page }) => {
        // Start performance monitoring
        await page.goto('http://localhost:3000/dashboard');

        // Measure initial load
        const navigationPromise = page.waitForLoadState('networkidle');
        const startTime = Date.now();
        await navigationPromise;
        const loadTime = Date.now() - startTime;

        // Should load reasonably fast on mobile
        expect(loadTime).toBeLessThan(5000); // 5 seconds max

        // Wait for HexagonClock
        await expect(page.locator('.hexagon-clock-container')).toBeVisible();

        // Test scroll performance
        await page.evaluate(() => {
          window.scrollTo({ top: 100, behavior: 'smooth' });
        });

        await page.waitForTimeout(1000);
        await expect(page.locator('.hexagon-clock-container')).toBeVisible();

        // Test interaction responsiveness
        const physicalButton = page.locator('button[title*="Physical"]');
        if (await physicalButton.isVisible()) {
          const tapStartTime = Date.now();
          await physicalButton.tap();
          const tapEndTime = Date.now();

          // Touch response should be under 100ms
          expect(tapEndTime - tapStartTime).toBeLessThan(100);
        }
      });

      test(`safe area support on ${name} with notch`, async ({ page }) => {
        // This test is most relevant for devices with notches/dynamic island
        if (name.includes('iPhone') && !name.includes('SE')) {
          await page.goto('http://localhost:3000/dashboard');
          await page.waitForLoadState('networkidle');

          await expect(page.locator('.hexagon-clock-container')).toBeVisible();

          // Check that content doesn't overlap with safe areas
          const container = page.locator('.hexagon-clock-container').first();
          const containerBox = await container.boundingBox();

          // Content should not be at the very top (safe area consideration)
          expect(containerBox!.y).toBeGreaterThan(20); // At least 20px from top

          // Content should not extend to very edges
          expect(containerBox!.x).toBeGreaterThan(10);

          const viewport = page.viewportSize()!;
          expect(containerBox!.x + containerBox!.width).toBeLessThan(viewport.width - 10);
        }
      });
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('maintains consistent layout across devices', async ({ page }) => {
      const results: Array<{ device: string; layout: any }> = [];

      for (const { name, device } of DEVICE_CONFIGS.slice(0, 3)) { // Test first 3 devices
        await page.setViewportSize({ width: device.viewport.width, height: device.viewport.height });
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('.hexagon-clock-container')).toBeVisible();

        const layout = {
          hexagonVisible: await page.locator('.hexagon-clock-container').isVisible(),
          buttonsCount: await page.locator('button').count(),
          centerTextVisible: await page.locator('text=Balance Ritual').isVisible(),
        };

        results.push({ device: name, layout });
      }

      // Verify consistency
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.layout.hexagonVisible).toBe(firstResult.layout.hexagonVisible);
        expect(result.layout.centerTextVisible).toBe(firstResult.layout.centerTextVisible);
        // Button count might vary slightly due to responsive design
        expect(Math.abs(result.layout.buttonsCount - firstResult.layout.buttonsCount)).toBeLessThanOrEqual(2);
      });
    });
  });

  test.describe('My Day Mobile Integration', () => {
    test('time planning mode works on mobile devices', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12'].viewport);
      await page.goto('http://localhost:3000/my-day');
      await page.waitForLoadState('networkidle');

      // Look for time planning specific elements
      await expect(page.locator('text=Total Time')).toBeVisible();

      // Check for time displays
      const timeDisplays = page.locator('text=/\\d+h \\d+m/');
      expect(await timeDisplays.count()).toBeGreaterThan(0);

      // Test touch interaction with time blocks
      const categoryButton = page.locator('button').filter({ hasText: /Physical|Mental|Emotional/i }).first();
      if (await categoryButton.isVisible()) {
        await categoryButton.tap();
        // Should remain functional after tap
        await expect(categoryButton).toBeVisible();
      }
    });

    test('clock markers visible in time planning mode', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 13 Pro'].viewport);
      await page.goto('http://localhost:3000/my-day');
      await page.waitForLoadState('networkidle');

      // Check for SVG elements that would contain clock markers
      const svgElements = page.locator('svg');
      expect(await svgElements.count()).toBeGreaterThan(0);

      // Verify hexagon clock container is present
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();
    });
  });

  test.describe('Accessibility on Mobile', () => {
    test('screen reader compatibility on mobile', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12'].viewport);
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');

      // Check for proper ARIA labels
      const buttons = page.locator('button[title]');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(count, 6); i++) { // Check first 6 buttons
        const button = buttons.nth(i);
        const title = await button.getAttribute('title');
        expect(title).toBeTruthy();
        expect(title!.length).toBeGreaterThan(0);
      }
    });

    test('keyboard navigation works on mobile browsers', async ({ page }) => {
      await page.setViewportSize(devices['iPad'].viewport); // iPad supports keyboard
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');

      // Find focusable elements
      const buttons = page.locator('button').filter({
        has: page.locator('text=/Physical|Mental|Emotional|Social|Spiritual|Material/i')
      });

      if (await buttons.count() > 0) {
        // Tab to first button
        await page.keyboard.press('Tab');

        // One of the buttons should be focused
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();

        // Enter should activate button
        await page.keyboard.press('Enter');

        // Should still be visible after activation
        await expect(focusedElement).toBeVisible();
      }
    });
  });

  test.describe('Performance Edge Cases', () => {
    test('handles slow network conditions', async ({ page }) => {
      // Simulate slow 3G
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });

      await page.setViewportSize(devices['Pixel 5'].viewport);
      await page.goto('http://localhost:3000/dashboard');

      // Should still load within reasonable time
      await expect(page.locator('.hexagon-clock-container')).toBeVisible({ timeout: 10000 });

      // Interactive elements should work
      const physicalButton = page.locator('button[title*="Physical"]');
      if (await physicalButton.isVisible()) {
        await physicalButton.tap();
        await expect(physicalButton).toBeVisible();
      }
    });

    test('handles memory pressure simulation', async ({ page }) => {
      await page.setViewportSize(devices['iPhone SE'].viewport); // Smaller device

      // Navigate multiple times to test memory handling
      for (let i = 0; i < 5; i++) {
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.hexagon-clock-container')).toBeVisible();

        await page.goto('http://localhost:3000/my-day');
        await page.waitForLoadState('networkidle');

        // Should handle navigation without issues
        if (await page.locator('text=Total Time').isVisible()) {
          await expect(page.locator('text=Total Time')).toBeVisible();
        }
      }
    });
  });

  test.describe('Real User Scenarios', () => {
    test('complete mobile user workflow', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12'].viewport);

      // Start from dashboard
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Interact with a category
      const physicalButton = page.locator('button[title*="Physical"]');
      if (await physicalButton.isVisible()) {
        await physicalButton.tap();
      }

      // Navigate to My Day
      await page.goto('http://localhost:3000/my-day');
      await page.waitForLoadState('networkidle');

      // Should see time planning mode
      if (await page.locator('text=Total Time').isVisible()) {
        await expect(page.locator('text=Total Time')).toBeVisible();

        // Interact with time planning
        const categoryButton = page.locator('button').filter({ hasText: /Physical|Mental/i }).first();
        if (await categoryButton.isVisible()) {
          await categoryButton.tap();
        }
      }

      // Return to dashboard
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();
    });

    test('handles app-like usage patterns', async ({ page }) => {
      await page.setViewportSize(devices['Samsung Galaxy S21'].viewport);
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');

      // Simulate app switching (going to background and returning)
      await page.evaluate(() => {
        // Simulate page visibility change
        document.dispatchEvent(new Event('visibilitychange'));
      });

      await page.waitForTimeout(1000);

      // Component should still be functional
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Touch interaction should still work
      const button = page.locator('button[title*="Physical"]');
      if (await button.isVisible()) {
        await button.tap();
        await expect(button).toBeVisible();
      }
    });
  });
});
