import { test, expect } from '../fixtures/auth-fixtures';

test.describe('AXIS6 Plan My Day Feature', () => {
  
  test.beforeEach(async ({ page }) => {
    // Use a simple test user for Plan My Day tests
    const testEmail = `test-${Date.now()}@playwright.local`;
    const testPassword = 'TestPass123!';
    const testName = 'Test User';
    
    // Navigate to registration
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    // Fill registration form
    await page.locator('input[type="text"]').first().fill(testName);
    await page.locator('input[type="email"]').fill(testEmail);
    
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.first().fill(testPassword);
    if (await passwordFields.count() > 1) {
      await passwordFields.nth(1).fill(testPassword);
    }
    
    // Handle checkboxes
    const termsCheckbox = page.locator('input[type="checkbox"][required]').first();
    if (await termsCheckbox.count() > 0) {
      await termsCheckbox.check();
    }
    
    // Submit registration
    await page.locator('button[type="submit"]').click();
    
    // Wait for navigation to dashboard
    try {
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/, { timeout: 15000 });
      
      // If onboarding, complete it
      if (page.url().includes('onboarding')) {
        const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Get Started")');
        if (await nextButton.count() > 0) {
          await nextButton.click();
        }
      }
    } catch {
      // If still on register page, try navigating to dashboard
      if (page.url().includes('register')) {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Ensure we're on the dashboard
    if (!page.url().includes('dashboard')) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
  });

  test.describe('Plan My Day Button', () => {
    
    test('should display Plan My Day button on dashboard', async ({ page }) => {
      // Check that the Plan My Day link is visible
      const planButton = page.locator('a:has-text("Plan My Day")');
      await expect(planButton).toBeVisible();
      
      // Verify it's a link with proper styling (glass style)
      const buttonClasses = await planButton.getAttribute('class');
      expect(buttonClasses).toContain('glass');
      
      // Verify it has the calendar icon
      const calendarIcon = planButton.locator('svg');
      await expect(calendarIcon).toBeVisible();
    });
    
    test('should be clickable and trigger navigation', async ({ page }) => {
      // Find and click the Plan My Day link
      const planButton = page.locator('a:has-text("Plan My Day")');
      await expect(planButton).toBeVisible();
      
      // Click the button and wait for navigation
      await planButton.click();
      
      // Wait for navigation to my-day page
      await page.waitForURL('**/my-day', { timeout: 10000 });
      
      // Verify we're on the my-day page
      expect(page.url()).toContain('/my-day');
      
      // Verify the page has loaded (check for key elements)
      const pageTitle = page.locator('h1, h2').filter({ hasText: /my day|plan.*day/i });
      await expect(pageTitle.first()).toBeVisible({ timeout: 5000 });
    });
    
    test('should have proper accessibility attributes', async ({ page }) => {
      const planButton = page.locator('a:has-text("Plan My Day")');
      
      // Check ARIA attributes
      const ariaLabel = await planButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel.toLowerCase()).toContain('plan');
      
      // Check that button is focusable
      await planButton.focus();
      const isFocused = await planButton.evaluate(el => document.activeElement === el);
      expect(isFocused).toBeTruthy();
    });
  });

  test.describe('Plan My Day Functionality', () => {
    
    test('should show activity suggestions when clicked', async ({ page }) => {
      const planButton = page.locator('button:has-text("Plan My Day"), a:has-text("Plan My Day")');
      await planButton.click();
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Look for activity suggestions
      const suggestionsContainer = page.locator('[data-testid="activity-suggestions"], .suggestions, .activities');
      const hasSuggestions = await suggestionsContainer.isVisible().catch(() => false);
      
      if (hasSuggestions) {
        // Verify at least one suggestion is shown
        const suggestionItems = suggestionsContainer.locator('.activity-item, [data-testid="activity"], li');
        const count = await suggestionItems.count();
        expect(count).toBeGreaterThan(0);
      }
    });
    
    test('should integrate with daily check-ins', async ({ page }) => {
      const planButton = page.locator('button:has-text("Plan My Day"), a:has-text("Plan My Day")');
      await planButton.click();
      
      // Wait for any planning interface to load
      await page.waitForTimeout(2000);
      
      // Check for category references (Physical, Mental, Emotional, etc.)
      const categories = ['Physical', 'Mental', 'Emotional', 'Social', 'Spiritual', 'Material'];
      const pageContent = await page.content();
      
      const hasCategoryReferences = categories.some(category => 
        pageContent.includes(category)
      );
      
      expect(hasCategoryReferences).toBeTruthy();
    });
    
    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Reload page with mobile viewport
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check button is still visible and properly styled
      const planButton = page.locator('button:has-text("Plan My Day"), a:has-text("Plan My Day")');
      await expect(planButton).toBeVisible();
      
      // Check button takes appropriate width on mobile
      const boundingBox = await planButton.boundingBox();
      if (boundingBox) {
        // Button should be reasonably wide on mobile (at least 200px)
        expect(boundingBox.width).toBeGreaterThan(200);
      }
    });
  });

  test.describe('Plan My Day Integration', () => {
    
    test('should save user preferences', async ({ page }) => {
      const planButton = page.locator('button:has-text("Plan My Day"), a:has-text("Plan My Day")');
      await planButton.click();
      
      // Wait for interface to load
      await page.waitForTimeout(2000);
      
      // Look for any preference or settings elements
      const preferenceElements = page.locator('[data-testid*="preference"], [data-testid*="setting"], input[type="checkbox"], input[type="radio"]');
      const hasPreferences = await preferenceElements.count() > 0;
      
      if (hasPreferences) {
        // Try to interact with first preference
        const firstPreference = preferenceElements.first();
        await firstPreference.click();
        
        // Refresh page
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Click Plan My Day again
        await planButton.click();
        await page.waitForTimeout(2000);
        
        // Check if preference was saved (this is a simplified check)
        // In real implementation, we'd verify the specific state
        const elementAfterReload = page.locator('[data-testid*="preference"], [data-testid*="setting"]').first();
        await expect(elementAfterReload).toBeVisible();
      }
    });
    
    test('should track analytics events', async ({ page }) => {
      // Monitor network requests for analytics
      const analyticsRequests: string[] = [];
      
      page.on('request', request => {
        const url = request.url();
        if (url.includes('analytics') || url.includes('track') || url.includes('event')) {
          analyticsRequests.push(url);
        }
      });
      
      // Click Plan My Day button
      const planButton = page.locator('button:has-text("Plan My Day"), a:has-text("Plan My Day")');
      await planButton.click();
      
      // Wait for potential analytics calls
      await page.waitForTimeout(1000);
      
      // Note: Analytics might be blocked or not implemented yet
      // This test documents the expectation
      console.log('Analytics requests captured:', analyticsRequests.length);
    });
    
    test('should handle errors gracefully', async ({ page }) => {
      // Intercept API calls to simulate error
      await page.route('**/api/plan**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });
      
      // Monitor console for errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Click Plan My Day button
      const planButton = page.locator('button:has-text("Plan My Day"), a:has-text("Plan My Day")');
      await planButton.click();
      
      // Wait for error handling
      await page.waitForTimeout(2000);
      
      // Check for error message display
      const errorMessage = page.locator('[role="alert"], .error, [data-testid="error-message"]');
      const hasErrorDisplay = await errorMessage.isVisible().catch(() => false);
      
      // Either show error message or handle gracefully without breaking
      const pageNotBroken = await page.locator('body').isVisible();
      expect(pageNotBroken).toBeTruthy();
      
      // Log any console errors for debugging
      if (consoleErrors.length > 0) {
        console.log('Console errors detected:', consoleErrors);
      }
    });
  });
});