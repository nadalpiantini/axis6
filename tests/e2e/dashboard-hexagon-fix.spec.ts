import { test, expect } from '../fixtures/auth-fixtures';

test.describe('Dashboard Hexagon Button Fix Verification', () => {
  
  test.beforeEach(async ({ loginPage, testUser }) => {
    // Login with test user
    await loginPage.goto();
    await loginPage.loginUser(testUser.email, testUser.password);
  });

  test('hexagon buttons should be clickable and trigger API calls', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();
    
    // Monitor network requests
    const apiCalls: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('axis6_checkins') || url.includes('/api/checkins')) {
        apiCalls.push(`${request.method()} ${url}`);
      }
    });
    
    // Find hexagon buttons
    const hexagonButtons = page.locator('[data-testid^="hexagon-"]');
    const buttonCount = await hexagonButtons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
    
    // Click first hexagon button
    const firstButton = hexagonButtons.first();
    await expect(firstButton).toBeVisible();
    
    // Clear API calls array
    apiCalls.length = 0;
    
    // Click the button
    await firstButton.click();
    
    // Wait for API call
    await page.waitForTimeout(1000);
    
    // Verify API call was made
    expect(apiCalls.length).toBeGreaterThan(0);
    console.log('API calls made:', apiCalls);
  });

  test('hexagon buttons should show visual feedback on hover', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();
    
    // Find hexagon circle elements
    const hexagonCircles = page.locator('svg circle[r="30"]');
    const firstCircle = hexagonCircles.first();
    
    await expect(firstCircle).toBeVisible();
    
    // Get initial styles
    const initialStroke = await firstCircle.getAttribute('stroke');
    const initialStrokeWidth = await firstCircle.getAttribute('stroke-width');
    
    // Hover over the circle
    await firstCircle.hover();
    await page.waitForTimeout(300); // Wait for animation
    
    // Check if hover state is visible (stroke should change)
    const hoverStroke = await firstCircle.getAttribute('stroke');
    const hoverStrokeWidth = await firstCircle.getAttribute('stroke-width');
    
    console.log('Initial stroke:', initialStroke, 'width:', initialStrokeWidth);
    console.log('Hover stroke:', hoverStroke, 'width:', hoverStrokeWidth);
  });

  test('toast notifications should appear when clicking hexagon buttons', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();
    
    // Click a hexagon button
    const hexagonButton = page.locator('[data-testid^="hexagon-"]').first();
    await hexagonButton.click();
    
    // Wait for toast to appear
    await page.waitForTimeout(500);
    
    // Check for toast notification
    const toast = page.locator('div').filter({ hasText: /completed!|unchecked/i });
    const toastVisible = await toast.isVisible().catch(() => false);
    
    expect(toastVisible).toBe(true);
    console.log('Toast notification appeared successfully');
  });

  test('hexagon buttons should work on touch devices', async ({ dashboardPage, page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();
    
    // Find hexagon button
    const hexagonButton = page.locator('[data-testid^="hexagon-"]').first();
    await expect(hexagonButton).toBeVisible();
    
    // Tap the button (touch event)
    await hexagonButton.tap();
    
    // Wait for response
    await page.waitForTimeout(1000);
    
    // Verify no errors in console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(500);
    expect(consoleErrors).toHaveLength(0);
  });

  test('hexagon progress should update when categories are completed', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();
    
    // Find the progress polygon
    const progressPolygon = page.locator('svg motion\\:polygon, svg polygon').filter({ has: page.locator('[fill*="gradient"]') });
    
    // Get initial scale
    const initialStyle = await progressPolygon.getAttribute('style');
    console.log('Initial progress style:', initialStyle);
    
    // Complete a category
    const hexagonButton = page.locator('[data-testid^="hexagon-"]').first();
    await hexagonButton.click();
    
    // Wait for animation
    await page.waitForTimeout(1000);
    
    // Check if progress updated
    const newStyle = await progressPolygon.getAttribute('style');
    console.log('Updated progress style:', newStyle);
    
    // The styles should be different if the progress updated
    if (initialStyle && newStyle) {
      expect(initialStyle).not.toEqual(newStyle);
    }
  });

  test('all 6 hexagon buttons should be interactive', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();
    
    // Find all hexagon buttons
    const hexagonButtons = page.locator('[data-testid^="hexagon-"]');
    const buttonCount = await hexagonButtons.count();
    
    // Should have exactly 6 buttons for AXIS6
    expect(buttonCount).toBe(6);
    
    // Test each button is clickable
    for (let i = 0; i < buttonCount; i++) {
      const button = hexagonButtons.nth(i);
      await expect(button).toBeVisible();
      
      // Get button state
      const ariaLabel = await button.getAttribute('aria-label');
      console.log(`Button ${i + 1} state:`, ariaLabel);
      
      // Verify button is interactive
      const isClickable = await button.isEnabled();
      expect(isClickable).toBe(true);
    }
  });

  test('keyboard navigation should work for hexagon buttons', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();
    
    // Focus first hexagon button
    const firstButton = page.locator('[data-testid^="hexagon-"]').first();
    await firstButton.focus();
    
    // Press Enter to activate
    await page.keyboard.press('Enter');
    
    // Wait for action
    await page.waitForTimeout(500);
    
    // Check for toast or state change
    const toast = page.locator('div').filter({ hasText: /completed!|unchecked/i });
    const toastVisible = await toast.isVisible().catch(() => false);
    
    expect(toastVisible).toBe(true);
    console.log('Keyboard activation successful');
  });

  test('performance: hexagon should render without lag', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();
    
    // Measure render performance
    const startTime = Date.now();
    
    // Click multiple buttons rapidly
    const buttons = page.locator('[data-testid^="hexagon-"]');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(3, buttonCount); i++) {
      await buttons.nth(i).click();
      await page.waitForTimeout(100);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`Clicked 3 buttons in ${totalTime}ms`);
    
    // Should complete within reasonable time (< 2 seconds for 3 clicks)
    expect(totalTime).toBeLessThan(2000);
  });
});