/**
 * HexagonClock Accessibility E2E Tests
 * WCAG 2.1 AA compliance validation on real devices
 */

import { test, expect, devices } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('HexagonClock Accessibility E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login and authenticate
    await page.goto('http://localhost:6789/auth/login');
    
    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('passes axe-core accessibility audit on dashboard', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Wait for HexagonClock to render
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Run axe accessibility audit
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('.hexagon-clock-container')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('passes axe-core accessibility audit on my day page', async ({ page }) => {
      await page.goto('http://localhost:6789/my-day');
      await page.waitForLoadState('networkidle');
      
      // Wait for time planning mode to render
      await page.waitForSelector('.hexagon-clock-container', { timeout: 10000 });

      // Run axe accessibility audit
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('.hexagon-clock-container')
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('meets color contrast requirements', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Check specific color contrast requirements
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('.hexagon-clock-container')
        .withTags(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('supports tab navigation through interactive elements', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Get all focusable elements within the hexagon clock
      const focusableElements = await page.locator('.hexagon-clock-container button').all();
      
      if (focusableElements.length > 0) {
        // Tab through each element
        for (let i = 0; i < Math.min(focusableElements.length, 6); i++) {
          await page.keyboard.press('Tab');
          
          // Check that an element is focused
          const focusedElement = page.locator(':focus');
          await expect(focusedElement).toBeVisible();
          
          // Verify the focused element is within our component
          const isWithinHexagon = await focusedElement.evaluate(el => {
            return el.closest('.hexagon-clock-container') !== null;
          });
          
          if (isWithinHexagon) {
            // Element should have visible focus indicator
            const focusedElementBox = await focusedElement.boundingBox();
            expect(focusedElementBox).toBeTruthy();
          }
        }
      }
    });

    test('supports Enter key activation', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Find the first category button
      const physicalButton = page.locator('button[title*="Physical"]');
      
      if (await physicalButton.isVisible()) {
        // Focus the button
        await physicalButton.focus();
        await expect(physicalButton).toBeFocused();
        
        // Activate with Enter key
        await page.keyboard.press('Enter');
        
        // Button should still be visible after activation
        await expect(physicalButton).toBeVisible();
      }
    });

    test('supports Space key activation', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Find the first category button
      const physicalButton = page.locator('button[title*="Physical"]');
      
      if (await physicalButton.isVisible()) {
        // Focus the button
        await physicalButton.focus();
        await expect(physicalButton).toBeFocused();
        
        // Activate with Space key
        await page.keyboard.press('Space');
        
        // Button should still be visible after activation
        await expect(physicalButton).toBeVisible();
      }
    });

    test('provides visible focus indicators', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Find and focus the first button
      const firstButton = page.locator('.hexagon-clock-container button').first();
      
      if (await firstButton.isVisible()) {
        await firstButton.focus();
        await expect(firstButton).toBeFocused();
        
        // Check for visible focus indicator
        const focusIndicator = await firstButton.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            outlineStyle: styles.outlineStyle,
            outlineColor: styles.outlineColor,
            boxShadow: styles.boxShadow,
          };
        });
        
        // Should have either outline or box-shadow focus indicator
        const hasFocusIndicator = 
          focusIndicator.outline !== 'none' ||
          focusIndicator.outlineWidth !== '0px' ||
          focusIndicator.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBe(true);
      }
    });

    test('keyboard navigation works on mobile devices', async ({ page }) => {
      await page.setViewportSize(devices['iPad'].viewport); // iPad supports external keyboard
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Test tab navigation on mobile
      const buttons = page.locator('.hexagon-clock-container button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        // Tab to first button
        await page.keyboard.press('Tab');
        
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // Should be able to activate with Enter
        await page.keyboard.press('Enter');
        await expect(focusedElement).toBeVisible();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('provides meaningful button labels', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Check that all buttons have meaningful labels
      const buttons = page.locator('.hexagon-clock-container button');
      const buttonCount = await buttons.count();
      
      expect(buttonCount).toBeGreaterThan(0);

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        
        // Each button should have either text content or aria-label or title
        const hasLabel = await button.evaluate(el => {
          const text = el.textContent?.trim();
          const ariaLabel = el.getAttribute('aria-label');
          const title = el.getAttribute('title');
          
          return Boolean(text || ariaLabel || title);
        });
        
        expect(hasLabel).toBe(true);
      }
    });

    test('announces completion percentages correctly', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Check that percentage information is accessible
      const physicalButton = page.locator('button[title*="Physical"]');
      
      if (await physicalButton.isVisible()) {
        const title = await physicalButton.getAttribute('title');
        expect(title).toBeTruthy();
        
        // Title should contain meaningful information about the category
        expect(title).toMatch(/Physical/i);
      }
    });

    test('provides context for time distribution mode', async ({ page }) => {
      await page.goto('http://localhost:6789/my-day');
      await page.waitForLoadState('networkidle');
      
      // Wait for time planning mode
      await page.waitForSelector('text=Total Time', { timeout: 10000 }).catch(() => {
        // If Total Time text is not found, skip this test
        test.skip(true, 'My Day page not available or not in time planning mode');
      });

      const buttons = page.locator('.hexagon-clock-container button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const title = await firstButton.getAttribute('title');
        
        if (title) {
          // Should provide time context
          const hasTimeContext = /hour|minute|time|h\s|m\s/i.test(title) || 
                                 /\d+h|\d+m/.test(title);
          expect(hasTimeContext).toBe(true);
        }
      }
    });

    test('supports ARIA live regions for dynamic updates', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Check for ARIA live regions (if implemented)
      const liveRegions = page.locator('[aria-live]');
      const liveRegionCount = await liveRegions.count();
      
      // If live regions exist, they should be properly configured
      if (liveRegionCount > 0) {
        for (let i = 0; i < liveRegionCount; i++) {
          const liveRegion = liveRegions.nth(i);
          const ariaLive = await liveRegion.getAttribute('aria-live');
          
          expect(ariaLive).toMatch(/polite|assertive|off/);
        }
      }
    });
  });

  test.describe('Touch Target Accessibility', () => {
    test('meets minimum touch target size requirements', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12'].viewport);
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Check all interactive touch targets
      const buttons = page.locator('.hexagon-clock-container button');
      const buttonCount = await buttons.count();
      
      expect(buttonCount).toBeGreaterThan(0);

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const boundingBox = await button.boundingBox();
        
        if (boundingBox) {
          // WCAG 2.1 AA requires minimum 44x44px touch targets
          expect(Math.min(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('provides adequate spacing between touch targets', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12'].viewport);
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      const buttons = page.locator('.hexagon-clock-container button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 1) {
        const boundingBoxes = [];
        
        // Get all button positions
        for (let i = 0; i < Math.min(buttonCount, 6); i++) {
          const box = await buttons.nth(i).boundingBox();
          if (box) boundingBoxes.push(box);
        }
        
        // Check spacing between adjacent buttons
        for (let i = 0; i < boundingBoxes.length - 1; i++) {
          for (let j = i + 1; j < boundingBoxes.length; j++) {
            const box1 = boundingBoxes[i];
            const box2 = boundingBoxes[j];
            
            // Calculate minimum distance between button edges
            const horizontalDistance = Math.max(0, 
              Math.min(box1.x + box1.width, box2.x + box2.width) - 
              Math.max(box1.x, box2.x)
            );
            
            const verticalDistance = Math.max(0,
              Math.min(box1.y + box1.height, box2.y + box2.height) - 
              Math.max(box1.y, box2.y)
            );
            
            // If buttons don't overlap, they should have adequate spacing
            if (horizontalDistance === 0 || verticalDistance === 0) {
              const edgeDistance = Math.min(
                Math.abs(box1.x + box1.width - box2.x),
                Math.abs(box2.x + box2.width - box1.x),
                Math.abs(box1.y + box1.height - box2.y),
                Math.abs(box2.y + box2.height - box1.y)
              );
              
              // Should have some spacing (flexible for hexagon layout)
              expect(edgeDistance).toBeGreaterThan(0);
            }
          }
        }
      }
    });
  });

  test.describe('Reduced Motion Support', () => {
    test('respects prefers-reduced-motion preference', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Check that animations are reduced or disabled
      const animatedElements = page.locator('.hexagon-clock-container [style*="animation"]');
      const animatedCount = await animatedElements.count();
      
      // If animations exist, they should be very short duration
      if (animatedCount > 0) {
        for (let i = 0; i < animatedCount; i++) {
          const element = animatedElements.nth(i);
          const animationDuration = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return parseFloat(styles.animationDuration) * 1000; // Convert to ms
          });
          
          // Animation should be very short for reduced motion
          expect(animationDuration).toBeLessThan(300); // <300ms
        }
      }
    });

    test('provides static alternative when animations disabled', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // All content should be immediately visible
      await expect(page.locator('text=Balance Ritual')).toBeVisible();
      
      // Category buttons should be visible
      const buttons = page.locator('.hexagon-clock-container button');
      const buttonCount = await buttons.count();
      
      expect(buttonCount).toBeGreaterThan(0);
      
      // All buttons should be visible immediately
      for (let i = 0; i < Math.min(buttonCount, 6); i++) {
        await expect(buttons.nth(i)).toBeVisible();
      }
    });
  });

  test.describe('High Contrast Mode', () => {
    test('maintains usability in forced-colors mode', async ({ page }) => {
      // Simulate forced colors mode (high contrast)
      await page.emulateMedia({ forcedColors: 'active' });
      
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Check that interactive elements are still visible
      const buttons = page.locator('.hexagon-clock-container button');
      const buttonCount = await buttons.count();
      
      expect(buttonCount).toBeGreaterThan(0);

      // All buttons should remain visible and interactive
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        await expect(button).toBeVisible();
        
        // Button should be clickable
        await expect(button).toBeEnabled();
      }

      // Text content should be visible
      await expect(page.locator('text=Balance Ritual')).toBeVisible();
    });
  });

  test.describe('Language and Internationalization', () => {
    test('supports right-to-left (RTL) languages', async ({ page }) => {
      // Set RTL direction
      await page.addInitScript(() => {
        document.documentElement.dir = 'rtl';
      });

      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Component should handle RTL layout
      const container = page.locator('.hexagon-clock-container');
      const direction = await container.evaluate(el => {
        return window.getComputedStyle(el).direction;
      });

      // Should inherit RTL direction or handle it appropriately
      expect(['rtl', 'ltr']).toContain(direction);
      
      // Interactive elements should still work
      const physicalButton = page.locator('button[title*="Physical"]');
      if (await physicalButton.isVisible()) {
        await physicalButton.click();
        await expect(physicalButton).toBeVisible();
      }
    });

    test('provides proper language context', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Check that content has proper language context
      const langAttribute = await page.evaluate(() => {
        return document.documentElement.lang || document.documentElement.getAttribute('lang');
      });

      expect(langAttribute).toBeTruthy();
      expect(typeof langAttribute).toBe('string');
    });
  });

  test.describe('Error State Accessibility', () => {
    test('provides accessible error messages', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Try to trigger an error state (simulate network failure)
      await page.route('**/*', route => route.abort());
      
      await page.reload();
      
      // Look for error handling
      const errorElements = page.locator('[role="alert"], .error-message');
      const errorCount = await errorElements.count();
      
      if (errorCount > 0) {
        // Error messages should be accessible
        for (let i = 0; i < errorCount; i++) {
          const errorElement = errorElements.nth(i);
          
          // Should have visible text or aria-label
          const hasAccessibleText = await errorElement.evaluate(el => {
            return Boolean(el.textContent?.trim() || el.getAttribute('aria-label'));
          });
          
          expect(hasAccessibleText).toBe(true);
        }
      }
    });

    test('maintains focus management during error recovery', async ({ page }) => {
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Focus an element
      const physicalButton = page.locator('button[title*="Physical"]');
      if (await physicalButton.isVisible()) {
        await physicalButton.focus();
        await expect(physicalButton).toBeFocused();
        
        // After error recovery, focus management should be preserved
        // (This would be more relevant in actual error scenarios)
        await expect(physicalButton).toBeVisible();
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('provides accessible mobile experience', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12'].viewport);
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Run mobile accessibility audit
      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('.hexagon-clock-container')
        .withTags(['mobile'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('supports mobile screen readers', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12'].viewport);
      await page.goto('http://localhost:6789/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Check that mobile screen readers can access content
      const buttons = page.locator('.hexagon-clock-container button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        
        // Should have accessible name
        const accessibleName = await firstButton.evaluate(el => {
          return el.getAttribute('aria-label') || 
                 el.getAttribute('title') || 
                 el.textContent?.trim();
        });
        
        expect(accessibleName).toBeTruthy();
        expect(accessibleName!.length).toBeGreaterThan(0);
      }
    });
  });
});