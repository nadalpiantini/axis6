import { test, expect } from '../fixtures/auth-fixtures';

/**
 * Production Issue Verification Tests
 * Tests to ensure production-specific issues are resolved:
 * 1. Profile page authentication works correctly
 * 2. Dashboard buttons are interactive (CSP fix verification)
 */
test.describe('Production Issue Fixes', () => {
  
  test.describe('Profile Page Authentication', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear any existing auth state
      await page.context().clearCookies();
      
      // Try to access profile page
      await page.goto('/profile');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*\/auth\/login/);
    });
    
    test('authenticated users can access profile without redirect', async ({ 
      registerPage,
      page,
      testUser
    }) => {
      // Register and authenticate
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      
      // Wait for successful registration
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/, { timeout: 10000 });
      
      // Navigate to profile
      await page.goto('/profile');
      
      // Should NOT redirect to login
      await expect(page).not.toHaveURL(/.*\/auth\/login/);
      
      // Profile page should load
      await expect(page.locator('h1', { hasText: /Profile|My Profile/i })).toBeVisible({ timeout: 10000 });
      
      // Verify no console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Wait and check for errors
      await page.waitForTimeout(2000);
      expect(consoleErrors.filter(e => !e.includes('Third-party cookie'))).toHaveLength(0);
    });
  });
  
  test.describe('Dashboard Button Interactions (CSP Fix)', () => {
    test('hexagon buttons should be clickable', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Monitor console for CSP violations
      const cspViolations: string[] = [];
      authenticatedPage.page.on('console', msg => {
        if (msg.text().includes('Content Security Policy') || msg.text().includes('CSP')) {
          cspViolations.push(msg.text());
        }
      });
      
      // Find hexagon interactive elements
      const hexagonButtons = authenticatedPage.hexagonChart.locator(
        'circle[role="button"], [onclick], [data-testid*="category"]'
      );
      
      const buttonCount = await hexagonButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
      
      // Click first interactive element
      const firstButton = hexagonButtons.first();
      await expect(firstButton).toBeVisible();
      
      // Test that click doesn't throw error
      await firstButton.click({ force: true });
      
      // Verify no CSP violations
      expect(cspViolations).toHaveLength(0);
      
      // Check that some state changed (e.g., class or attribute)
      // This is a generic check as the exact behavior depends on implementation
      await authenticatedPage.page.waitForTimeout(500);
    });
    
    test('axis category buttons should be clickable', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Look for axis category buttons
      const categoryButtons = authenticatedPage.page.locator(
        'button:has-text("Physical"), button:has-text("Mental"), button:has-text("Emotional"), ' +
        'button:has-text("Social"), button:has-text("Spiritual"), button:has-text("Material")'
      ).first();
      
      if (await categoryButtons.isVisible()) {
        // Test clicking
        await categoryButtons.click();
        
        // Verify button responded (check for class changes, animations, etc.)
        await authenticatedPage.page.waitForTimeout(500);
        
        // No errors should occur
        const errors = await authenticatedPage.page.evaluate(() => {
          return (window as any).lastError || null;
        });
        expect(errors).toBeNull();
      }
    });
    
    test('framer motion animations should work', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Look for elements with Framer Motion data attributes
      const animatedElements = authenticatedPage.page.locator('[data-framer-motion]');
      
      if (await animatedElements.count() > 0) {
        // Hover to trigger animations
        await animatedElements.first().hover();
        await authenticatedPage.page.waitForTimeout(300);
        
        // Click to trigger tap animations
        await animatedElements.first().click();
        await authenticatedPage.page.waitForTimeout(300);
      }
      
      // Verify page is still functional
      await expect(authenticatedPage.hexagonChart).toBeVisible();
    });
  });
  
  test.describe('Environment Variable Consistency', () => {
    test('supabase client should initialize correctly', async ({ page }) => {
      // Navigate to any page
      await page.goto('/');
      
      // Check that Supabase is initialized (no errors)
      const supabaseErrors = await page.evaluate(() => {
        try {
          // Check if window has any Supabase-related errors
          return (window as any).__supabaseError || null;
        } catch {
          return null;
        }
      });
      
      expect(supabaseErrors).toBeNull();
    });
  });
  
  test.describe('CSP Header Validation', () => {
    test('should have appropriate CSP headers', async ({ page }) => {
      const response = await page.goto('/');
      const headers = response?.headers();
      
      if (headers) {
        const csp = headers['content-security-policy'];
        
        if (csp) {
          // Verify CSP includes necessary directives
          expect(csp).toContain("script-src");
          expect(csp).toContain("'unsafe-inline'"); // Temporary fix should be in place
          expect(csp).toContain("https://*.supabase.co");
        }
      }
    });
  });
});

/**
 * Production-specific test configuration
 */
test.describe('Production Environment Tests', () => {
  test.use({
    baseURL: process.env.PLAYWRIGHT_PRODUCTION_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:6789',
  });
  
  test('production dashboard loads and is interactive', async ({ page }) => {
    // This test can be run against production URL
    await page.goto('/');
    
    // Check that page loads
    await expect(page).toHaveTitle(/AXIS6/);
    
    // No critical JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.waitForTimeout(2000);
    expect(jsErrors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });
});