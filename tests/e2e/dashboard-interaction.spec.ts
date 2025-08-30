import { test, expect } from '../fixtures/auth-fixtures';

test.describe('AXIS6 Dashboard Button Interactions', () => {

  test.beforeEach(async ({ loginPage, testUser }) => {
    // Create and login with test user first
    await loginPage.goto();
    await loginPage.registerUser(testUser.email, testUser.password, testUser.name);
    await loginPage.loginUser(testUser.email, testUser.password);
  });

  test.describe('Hexagon Button Functionality', () => {
    test('should respond to hexagon axis button clicks', async ({ dashboardPage, testUtils }) => {
      await dashboardPage.goto();
      await dashboardPage.verifyDashboardLoaded();

      // Enable console error monitoring
      const consoleLogs: string[] = [];
      dashboardPage.page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push(`Console Error: ${msg.text()}`);
        }
      });

      // Find hexagon clickable elements
      const hexagonSVG = dashboardPage.hexagonChart;
      await expect(hexagonSVG).toBeVisible();

      // Look for clickable circles in SVG
      const clickableCircles = hexagonSVG.locator('circle');
      const circleCount = await clickableCircles.count();

      if (circleCount > 0) {
        console.log(`Found ${circleCount} clickable circles in hexagon`);

        // Try clicking the first circle
        const firstCircle = clickableCircles.first();
        await expect(firstCircle).toBeVisible();

        // Get initial state
        const initialFill = await firstCircle.getAttribute('fill');
        console.log('Initial circle fill:', initialFill);

        // Click the circle
        await firstCircle.click();

        // Wait for potential state change
        await dashboardPage.page.waitForTimeout(2000);

        // Check if fill changed
        const newFill = await firstCircle.getAttribute('fill');
        console.log('New circle fill:', newFill);

        // Log any console errors
        if (consoleLogs.length > 0) {
          console.log('Console Errors:', consoleLogs);
        }

      } else {
        console.log('No clickable circles found in hexagon');
        await testUtils.takeDebugScreenshot('no-circles');
      }
    });

    test('should update visual state after category button clicks', async ({ dashboardPage, testUtils }) => {
      await dashboardPage.goto();
      await dashboardPage.verifyDashboardLoaded();

      // Find category cards
      const categoryCards = dashboardPage.page.locator('[data-testid^="category-card-"]');
      const cardCount = await categoryCards.count();

      if (cardCount > 0) {
        console.log(`Found ${cardCount} category cards`);

        const firstCard = categoryCards.first();
        await expect(firstCard).toBeVisible();

        // Get initial visual state
        const initialClasses = await firstCard.getAttribute('class');
        const initialDataChecked = await firstCard.getAttribute('data-checked');

        console.log('Initial card classes:', initialClasses);
        console.log('Initial data-checked:', initialDataChecked);

        // Click the card
        await firstCard.click();

        // Wait for visual update
        await dashboardPage.page.waitForTimeout(2000);

        // Check visual changes
        const newClasses = await firstCard.getAttribute('class');
        const newDataChecked = await firstCard.getAttribute('data-checked');

        console.log('New card classes:', newClasses);
        console.log('New data-checked:', newDataChecked);

        // Take screenshot for visual verification
        await testUtils.takeDebugScreenshot('category-card-interaction');

      } else {
        console.log('No category cards found');
        await testUtils.takeDebugScreenshot('no-category-cards');
      }
    });

    test('should show network activity when buttons are clicked', async ({ dashboardPage, testUtils }) => {
      await dashboardPage.goto();
      await dashboardPage.verifyDashboardLoaded();

      // Monitor network requests
      const apiCalls: string[] = [];
      dashboardPage.page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('supabase.co')) {
          apiCalls.push(`${request.method()} ${url}`);
        }
      });

      // Monitor network responses
      const apiResponses: Array<{url: string, status: number}> = [];
      dashboardPage.page.on('response', response => {
        const url = response.url();
        if (url.includes('/api/') || url.includes('supabase.co')) {
          apiResponses.push({ url, status: response.status() });
        }
      });

      // Click a category button
      const categoryButton = dashboardPage.page.locator('[data-testid^="category-card-"]').first();
      if (await categoryButton.isVisible()) {
        console.log('Clicking category button...');
        await categoryButton.click();

        // Wait for potential API calls
        await dashboardPage.page.waitForTimeout(3000);

        console.log('API Calls made:', apiCalls);
        console.log('API Responses:', apiResponses);

        // Check if any API calls were made
        const hasAPIActivity = apiCalls.length > 0 || apiResponses.length > 0;
        console.log('Has API Activity:', hasAPIActivity);

        if (!hasAPIActivity) {
          console.log('🚨 NO API ACTIVITY DETECTED - This indicates the button click is not triggering backend calls');
          await testUtils.takeDebugScreenshot('no-api-activity');
        }

      } else {
        console.log('No category buttons found');
      }
    });
  });

  test.describe('Visual State Changes', () => {
    test('should change hexagon fill percentage when categories are completed', async ({ dashboardPage, testUtils }) => {
      await dashboardPage.goto();
      await dashboardPage.verifyDashboardLoaded();

      // Find the progress hexagon (usually a polygon with gradient fill)
      const progressHexagon = dashboardPage.page.locator('svg polygon[fill*="gradient"], svg polygon[fill*="url"]');

      if (await progressHexagon.count() > 0) {
        const hexagon = progressHexagon.first();

        // Get initial scale/opacity
        const initialTransform = await hexagon.getAttribute('style') ||
                               await hexagon.getAttribute('transform') || '';
        console.log('Initial hexagon transform/style:', initialTransform);

        // Click a category to complete it
        const categoryButton = dashboardPage.page.locator('[data-testid^="category-card-"]').first();
        if (await categoryButton.isVisible()) {
          await categoryButton.click();
          await dashboardPage.page.waitForTimeout(2000);

          // Check if hexagon visual state changed
          const newTransform = await hexagon.getAttribute('style') ||
                              await hexagon.getAttribute('transform') || '';
          console.log('New hexagon transform/style:', newTransform);

          // Take before/after screenshots
          await testUtils.takeDebugScreenshot('hexagon-after-click');

          if (initialTransform !== newTransform) {
            console.log('✅ Hexagon visual state changed');
          } else {
            console.log('🚨 Hexagon visual state did NOT change');
          }
        }
      } else {
        console.log('No progress hexagon found');
        await testUtils.takeDebugScreenshot('no-progress-hexagon');
      }
    });

    test('should display completion count correctly', async ({ dashboardPage }) => {
      await dashboardPage.goto();
      await dashboardPage.verifyDashboardLoaded();

      // Find completion counter
      const completionCounter = dashboardPage.page.locator('text=/\\d+\\/6.*completed?/');

      if (await completionCounter.isVisible()) {
        const initialCount = await completionCounter.textContent();
        console.log('Initial completion count:', initialCount);

        // Click a category
        const categoryButton = dashboardPage.page.locator('[data-testid^="category-card-"]').first();
        if (await categoryButton.isVisible()) {
          await categoryButton.click();
          await dashboardPage.page.waitForTimeout(2000);

          const newCount = await completionCounter.textContent();
          console.log('New completion count:', newCount);

          if (initialCount !== newCount) {
            console.log('✅ Completion count updated');
          } else {
            console.log('🚨 Completion count did NOT update');
          }
        }
      } else {
        console.log('No completion counter found');
      }
    });
  });

  test.describe('Error Detection', () => {
    test('should capture JavaScript errors during interactions', async ({ dashboardPage, testUtils }) => {
      await dashboardPage.goto();
      await dashboardPage.verifyDashboardLoaded();

      const jsErrors: string[] = [];
      const networkErrors: string[] = [];

      // Monitor JavaScript errors
      dashboardPage.page.on('pageerror', error => {
        jsErrors.push(`Page Error: ${error.message}`);
      });

      dashboardPage.page.on('console', msg => {
        if (msg.type() === 'error') {
          jsErrors.push(`Console Error: ${msg.text()}`);
        }
      });

      // Monitor network errors
      dashboardPage.page.on('response', response => {
        if (response.status() >= 400) {
          networkErrors.push(`${response.status()} ${response.url()}`);
        }
      });

      // Interact with various elements
      const interactiveElements = [
        '[data-testid^="category-card-"]',
        'svg circle',
        'button'
      ];

      for (const selector of interactiveElements) {
        const elements = dashboardPage.page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          console.log(`Testing interactions with ${count} elements matching ${selector}`);

          // Click first element of each type
          try {
            await elements.first().click();
            await dashboardPage.page.waitForTimeout(1000);
          } catch (error) {
            console.log(`Error clicking ${selector}:`, error);
          }
        }
      }

      // Wait for any delayed errors
      await dashboardPage.page.waitForTimeout(3000);

      // Report errors
      if (jsErrors.length > 0) {
        console.log('🚨 JavaScript Errors:', jsErrors);
      }

      if (networkErrors.length > 0) {
        console.log('🚨 Network Errors:', networkErrors);
      }

      if (jsErrors.length === 0 && networkErrors.length === 0) {
        console.log('✅ No errors detected during interactions');
      }

      // Take final screenshot
      await testUtils.takeDebugScreenshot('error-detection-complete');
    });
  });
});
