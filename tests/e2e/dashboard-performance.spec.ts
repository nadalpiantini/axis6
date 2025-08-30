import { test, expect } from '../fixtures/auth-fixtures';
import { Page } from '@playwright/test';

test.describe('Dashboard Performance Tests', () => {
  let performanceMetrics: any = {};

  test.beforeEach(async ({ loginPage, testUser, page }) => {
    // Enable performance monitoring
    await page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        renderStart: performance.now(),
        interactions: [],
        errors: [],
        apiCalls: []
      };
    });

    // Monitor performance entries
    page.on('console', msg => {
      if (msg.type() === 'error') {
        performanceMetrics.errors = performanceMetrics.errors || [];
        performanceMetrics.errors.push(msg.text());
      }
    });

    // Create and login with test user
    await loginPage.goto();
    await loginPage.registerUser(testUser.email, testUser.password, testUser.name);
    await loginPage.loginUser(testUser.email, testUser.password);
  });

  test('should load dashboard within performance budget', async ({ dashboardPage, page }) => {
    const startTime = Date.now();

    // Navigate to dashboard and wait for load
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();

    const loadTime = Date.now() - startTime;

    // Check load time is within budget (3 seconds)
    expect(loadTime).toBeLessThan(3000);

    // Get Web Vitals
    const metrics = await page.evaluate(() => {
      const getWebVitals = () => {
        const observer = new PerformanceObserver(() => {});
        const entries = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        return {
          TTFB: entries.responseStart - entries.requestStart,
          FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          LCP: 0, // Would need observer for this
          FID: 0, // Would need user interaction
          CLS: 0, // Would need layout shift observer
          domContentLoaded: entries.domContentLoadedEventEnd - entries.domContentLoadedEventStart,
          loadComplete: entries.loadEventEnd - entries.loadEventStart
        };
      };

      return getWebVitals();
    });

    console.log('Performance Metrics:', metrics);

    // Assert performance budgets
    expect(metrics.TTFB).toBeLessThan(800); // Time to First Byte < 800ms
    expect(metrics.FCP).toBeLessThan(1800); // First Contentful Paint < 1.8s
    expect(metrics.domContentLoaded).toBeLessThan(2000); // DOM Content Loaded < 2s
  });

  test('should handle rapid interactions without performance degradation', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();

    // Measure initial memory usage
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Perform rapid interactions
    const categoryCards = page.locator('[data-testid^="category-card-"]');
    const cardCount = await categoryCards.count();

    const interactionTimes: number[] = [];

    for (let i = 0; i < Math.min(cardCount, 6); i++) {
      const card = categoryCards.nth(i);

      // Measure interaction time
      const startTime = Date.now();
      await card.click();
      await page.waitForTimeout(100); // Small delay to let UI update
      const endTime = Date.now();

      interactionTimes.push(endTime - startTime);
    }

    // Calculate average interaction time
    const avgInteractionTime = interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length;

    // Check memory after interactions
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

    console.log('Interaction Performance:', {
      avgInteractionTime,
      memoryIncreaseMB,
      interactionTimes
    });

    // Assert performance criteria
    expect(avgInteractionTime).toBeLessThan(500); // Interactions should be fast
    expect(memoryIncreaseMB).toBeLessThan(10); // Memory increase should be minimal
  });

  test('should lazy load components efficiently', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();

    // Monitor network requests
    const resourceTimings: any[] = [];

    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        resourceTimings.push({
          url: response.url(),
          status: response.status(),
          size: response.headers()['content-length'],
          timing: response.timing()
        });
      }
    });

    await dashboardPage.verifyDashboardLoaded();

    // Check that code splitting is working
    const jsChunks = resourceTimings.filter(r => r.url.includes('.js'));
    console.log(`Loaded ${jsChunks.length} JavaScript chunks`);

    // Verify lazy loading by checking if certain components load on demand
    const mantraCardVisible = await page.locator('[data-testid="daily-mantra-card"]').isVisible();

    if (!mantraCardVisible) {
      // Scroll to trigger lazy load
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);
    }

    // Check resource loading efficiency
    expect(jsChunks.length).toBeGreaterThan(1); // Should have multiple chunks
    expect(jsChunks.length).toBeLessThan(20); // But not too many
  });

  test('should maintain 60fps during animations', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();

    // Start performance recording
    await page.evaluate(() => {
      window.frameTimings = [];
      let lastTime = performance.now();

      const recordFrame = () => {
        const currentTime = performance.now();
        const delta = currentTime - lastTime;
        window.frameTimings.push(delta);
        lastTime = currentTime;

        if (window.frameTimings.length < 60) {
          requestAnimationFrame(recordFrame);
        }
      };

      requestAnimationFrame(recordFrame);
    });

    // Trigger animations by clicking categories
    const categoryCard = page.locator('[data-testid^="category-card-"]').first();
    await categoryCard.click();

    // Wait for animations to complete
    await page.waitForTimeout(1000);

    // Get frame timings
    const frameTimings = await page.evaluate(() => window.frameTimings);

    // Calculate FPS
    const avgFrameTime = frameTimings.reduce((a: number, b: number) => a + b, 0) / frameTimings.length;
    const fps = 1000 / avgFrameTime;

    console.log(`Average FPS during animation: ${fps.toFixed(2)}`);

    // Should maintain close to 60fps
    expect(fps).toBeGreaterThan(50);
  });

  test('should optimize API calls and prevent redundant requests', async ({ dashboardPage, page }) => {
    const apiCalls: { url: string; method: string; timestamp: number }[] = [];

    // Monitor API calls
    page.on('request', request => {
      if (request.url().includes('supabase.co') || request.url().includes('/api/')) {
        apiCalls.push({
          url: request.url(),
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });

    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();

    // Perform some interactions
    const categoryCard = page.locator('[data-testid^="category-card-"]').first();
    await categoryCard.click();
    await page.waitForTimeout(500);
    await categoryCard.click(); // Click again

    // Analyze API calls
    const checkinsAPICalls = apiCalls.filter(call =>
      call.url.includes('checkins') || call.url.includes('toggle')
    );

    console.log(`Total API calls: ${apiCalls.length}`);
    console.log(`Checkins API calls: ${checkinsAPICalls.length}`);

    // Check for duplicate calls within short timeframe
    const duplicates = checkinsAPICalls.filter((call, index) => {
      return checkinsAPICalls.findIndex(c =>
        c.url === call.url &&
        Math.abs(c.timestamp - call.timestamp) < 100 &&
        checkinsAPICalls.indexOf(c) !== index
      ) !== -1;
    });

    // Should batch or debounce API calls
    expect(duplicates.length).toBe(0);
    expect(checkinsAPICalls.length).toBeLessThanOrEqual(2); // Should optimize multiple clicks
  });

  test('should handle slow network gracefully', async ({ dashboardPage, page, context }) => {
    // Simulate slow 3G network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100); // Add 100ms delay to all requests
    });

    const startTime = Date.now();
    await dashboardPage.goto();

    // Should show loading states
    const loadingIndicator = page.locator('[data-testid="loading-skeleton"], .animate-pulse');
    await expect(loadingIndicator.first()).toBeVisible();

    await dashboardPage.verifyDashboardLoaded();
    const loadTime = Date.now() - startTime;

    console.log(`Load time on slow network: ${loadTime}ms`);

    // Should still load within reasonable time
    expect(loadTime).toBeLessThan(10000); // 10 seconds max on slow network
  });

  test('should properly cleanup memory on navigation', async ({ dashboardPage, page }) => {
    await dashboardPage.goto();
    await dashboardPage.verifyDashboardLoaded();

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Navigate away and back multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('/profile');
      await page.waitForTimeout(500);
      await dashboardPage.goto();
      await dashboardPage.verifyDashboardLoaded();
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });

    await page.waitForTimeout(1000);

    // Check final memory
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    const memoryLeakMB = (finalMemory - initialMemory) / (1024 * 1024);
    console.log(`Potential memory leak: ${memoryLeakMB.toFixed(2)}MB`);

    // Should not have significant memory leaks
    expect(memoryLeakMB).toBeLessThan(20);
  });
});

// Declare global types for performance metrics
declare global {
  interface Window {
    performanceMetrics: any;
    frameTimings: number[];
    gc?: () => void;
  }
}
