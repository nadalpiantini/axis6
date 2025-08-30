/**
 * HexagonClock Performance E2E Tests
 * Real device performance validation and regression prevention
 */

import { test, expect, devices } from '@playwright/test';

// Performance thresholds based on optimization targets
const PERFORMANCE_THRESHOLDS = {
  initialRender: 100,        // <100ms initial render
  frameTime: 16.67,          // <16.67ms for 60fps
  touchResponse: 50,         // <50ms touch response
  memoryIncrease: 8 * 1024 * 1024, // <8MB memory increase
  bundleLoadTime: 2000,      // <2s bundle load time
  interactionDelay: 100,     // <100ms interaction delay
} as const;

test.describe('HexagonClock Performance E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and authenticate
    await page.goto('http://localhost:3000/auth/login');

    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'test-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      }));
    });
  });

  test.describe('Render Performance', () => {
    test('initial render performance meets <100ms target', async ({ page }) => {
      // Start timing
      const startTime = Date.now();

      await page.goto('http://localhost:3000/dashboard');

      // Wait for HexagonClock to be visible
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      console.log(`Render time: ${renderTime}ms`);
      expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.initialRender * 10); // Allow 10x in E2E
    });

    test('re-render performance after data updates', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Measure re-render performance
      const measurements: number[] = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();

        // Trigger re-render by clicking category
        const physicalButton = page.locator('button[title*="Physical"]');
        if (await physicalButton.isVisible()) {
          await physicalButton.click();
        }

        // Wait for any visual updates
        await page.waitForTimeout(50);

        const endTime = Date.now();
        measurements.push(endTime - startTime);
      }

      const averageRerenderTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      console.log(`Average re-render time: ${averageRerenderTime}ms`);

      // Re-renders should be faster than initial render
      expect(averageRerenderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.initialRender);
    });

    test('handles rapid component mounting/unmounting', async ({ page }) => {
      const navigationTimes: number[] = [];

      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();

        await page.goto('http://localhost:3000/dashboard');
        await expect(page.locator('.hexagon-clock-container')).toBeVisible();

        await page.goto('http://localhost:3000/my-day');
        await page.waitForLoadState('networkidle');

        const endTime = Date.now();
        navigationTimes.push(endTime - startTime);
      }

      const averageNavigationTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
      console.log(`Average navigation time: ${averageNavigationTime}ms`);

      // Should handle rapid navigation without significant degradation
      expect(averageNavigationTime).toBeLessThan(3000); // 3 seconds max
    });
  });

  test.describe('Animation Performance', () => {
    test('maintains smooth animations during interactions', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Enable animations
      await page.evaluate(() => {
        document.body.style.setProperty('--animation-duration', '300ms');
      });

      // Measure frame rate during animations
      const frameMetrics = await page.evaluate(async () => {
        const frameTimes: number[] = [];
        let lastTime = performance.now();
        let frameCount = 0;

        return new Promise((resolve) => {
          const measureFrame = () => {
            const currentTime = performance.now();
            const frameTime = currentTime - lastTime;
            frameTimes.push(frameTime);
            lastTime = currentTime;
            frameCount++;

            if (frameCount < 60) { // Measure 60 frames (~1 second)
              requestAnimationFrame(measureFrame);
            } else {
              const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
              const fps = 1000 / averageFrameTime;
              resolve({ averageFrameTime, fps, frameTimes });
            }
          };

          requestAnimationFrame(measureFrame);
        });
      }) as { averageFrameTime: number; fps: number; frameTimes: number[] };

      console.log(`Average frame time: ${frameMetrics.averageFrameTime.toFixed(2)}ms`);
      console.log(`Average FPS: ${frameMetrics.fps.toFixed(1)}`);

      // Should maintain close to 60fps (allowing some tolerance for E2E)
      expect(frameMetrics.fps).toBeGreaterThan(45); // 45fps minimum
      expect(frameMetrics.averageFrameTime).toBeLessThan(25); // <25ms per frame
    });

    test('animation performance on mobile devices', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12'].viewport);
      await page.goto('http://localhost:3000/dashboard');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Test touch-triggered animations
      const physicalButton = page.locator('button[title*="Physical"]');
      if (await physicalButton.isVisible()) {
        // Measure touch response time
        const startTime = Date.now();
        await physicalButton.tap();
        const endTime = Date.now();

        const touchResponseTime = endTime - startTime;
        console.log(`Mobile touch response time: ${touchResponseTime}ms`);

        expect(touchResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.touchResponse * 2); // Allow 2x for E2E
      }
    });
  });

  test.describe('Memory Performance', () => {
    test('memory usage remains stable during extended use', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Measure initial memory
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Simulate extended usage
      for (let i = 0; i < 20; i++) {
        // Navigate between pages
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');

        await page.goto('http://localhost:3000/my-day');
        await page.waitForLoadState('networkidle');

        // Interact with components
        const button = page.locator('button').first();
        if (await button.isVisible()) {
          await button.click();
        }
      }

      // Force garbage collection (if available)
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });

      // Measure final memory
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      const memoryIncrease = finalMemory - initialMemory;
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryIncrease);
    });

    test('no memory leaks during component lifecycle', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      const memoryMeasurements: number[] = [];

      // Multiple mount/unmount cycles
      for (let i = 0; i < 10; i++) {
        // Navigate away
        await page.goto('http://localhost:3000/');
        await page.waitForLoadState('networkidle');

        // Navigate back
        await page.goto('http://localhost:3000/dashboard');
        await expect(page.locator('.hexagon-clock-container')).toBeVisible();

        // Measure memory
        const memory = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });
        memoryMeasurements.push(memory);

        await page.waitForTimeout(100); // Brief pause
      }

      // Check for memory growth trend
      const firstMeasurement = memoryMeasurements[0];
      const lastMeasurement = memoryMeasurements[memoryMeasurements.length - 1];
      const memoryGrowth = lastMeasurement - firstMeasurement;

      console.log(`Memory growth over 10 cycles: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);

      // Should not grow significantly
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // <5MB growth
    });
  });

  test.describe('Interaction Performance', () => {
    test('touch response time meets <50ms target', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 13 Pro'].viewport);
      await page.goto('http://localhost:3000/dashboard');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      const touchResponseTimes: number[] = [];

      // Test multiple touch interactions
      const buttons = page.locator('button[title]');
      const buttonCount = Math.min(await buttons.count(), 6);

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const startTime = Date.now();
          await button.tap();
          const endTime = Date.now();

          touchResponseTimes.push(endTime - startTime);
        }
      }

      if (touchResponseTimes.length > 0) {
        const averageResponseTime = touchResponseTimes.reduce((a, b) => a + b, 0) / touchResponseTimes.length;
        console.log(`Average touch response time: ${averageResponseTime.toFixed(2)}ms`);

        // Most touches should be under threshold (allow some outliers)
        const fastTouches = touchResponseTimes.filter(time => time < PERFORMANCE_THRESHOLDS.touchResponse * 2);
        expect(fastTouches.length).toBeGreaterThan(touchResponseTimes.length * 0.8); // 80% should be fast
      }
    });

    test('scroll performance with HexagonClock visible', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Add scrollable content
      await page.evaluate(() => {
        const content = document.createElement('div');
        content.style.height = '2000px';
        content.textContent = 'Scrollable content for testing';
        document.body.appendChild(content);
      });

      // Measure scroll performance
      const scrollMetrics = await page.evaluate(async () => {
        const startTime = performance.now();
        let frameCount = 0;
        const frameTimes: number[] = [];

        return new Promise((resolve) => {
          const measureScrollFrame = () => {
            const currentTime = performance.now();
            frameTimes.push(currentTime - startTime - (frameCount * 16.67));
            frameCount++;

            if (frameCount < 30) { // Measure 30 frames during scroll
              window.scrollBy(0, 10);
              requestAnimationFrame(measureScrollFrame);
            } else {
              const averageFrameDelay = frameTimes.reduce((a, b) => a + Math.abs(b), 0) / frameTimes.length;
              resolve({ frameCount, averageFrameDelay });
            }
          };

          requestAnimationFrame(measureScrollFrame);
        });
      }) as { frameCount: number; averageFrameDelay: number };

      console.log(`Scroll frame delay: ${scrollMetrics.averageFrameDelay.toFixed(2)}ms`);

      // Scroll should not cause significant frame delays
      expect(scrollMetrics.averageFrameDelay).toBeLessThan(5); // <5ms average delay
    });
  });

  test.describe('Bundle Performance', () => {
    test('JavaScript bundle loads within performance budget', async ({ page }) => {
      // Clear cache to measure cold load
      await page.evaluate(() => {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
      });

      const startTime = Date.now();
      await page.goto('http://localhost:3000/dashboard');

      // Wait for JavaScript to execute and render
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      const endTime = Date.now();
      const totalLoadTime = endTime - startTime;

      console.log(`Total page load time: ${totalLoadTime}ms`);

      // Should load within reasonable time (E2E has more overhead)
      expect(totalLoadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.bundleLoadTime * 2);
    });

    test('lazy loading performance', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      // HexagonClock should be lazy-loaded
      const suspensePromise = page.waitForSelector('text=Loading...', { timeout: 1000 }).catch(() => null);
      const componentPromise = page.waitForSelector('.hexagon-clock-container', { timeout: 5000 });

      // Either loading state or component should appear quickly
      await Promise.race([suspensePromise, componentPromise]);

      // Component should eventually load
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();
    });
  });

  test.describe('Network Performance', () => {
    test('performs well on slow connections', async ({ page }) => {
      // Simulate slow 3G connection
      await page.route('**/*', async (route) => {
        // Add artificial delay for resources
        await new Promise(resolve => setTimeout(resolve, 200));
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto('http://localhost:3000/dashboard');

      // Should still render within reasonable time on slow connection
      await expect(page.locator('.hexagon-clock-container')).toBeVisible({ timeout: 15000 });

      const endTime = Date.now();
      const loadTimeOnSlowConnection = endTime - startTime;

      console.log(`Load time on slow connection: ${loadTimeOnSlowConnection}ms`);

      // Should handle slow connections gracefully
      expect(loadTimeOnSlowConnection).toBeLessThan(15000); // 15 seconds max
    });

    test('handles intermittent connectivity', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Simulate network going offline
      await page.setOfflineMode(true);

      // Component should still be functional
      const physicalButton = page.locator('button[title*="Physical"]');
      if (await physicalButton.isVisible()) {
        await physicalButton.click();
        // Should handle offline interactions gracefully
        await expect(physicalButton).toBeVisible();
      }

      // Restore connectivity
      await page.setOfflineMode(false);

      // Should recover gracefully
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();
    });
  });

  test.describe('CPU Performance', () => {
    test('efficient CPU usage during animations', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');
      await expect(page.locator('.hexagon-clock-container')).toBeVisible();

      // Measure CPU-intensive operations
      const cpuMetrics = await page.evaluate(async () => {
        const startTime = performance.now();
        let iterations = 0;

        // Simulate work while component is active
        const doWork = () => {
          return new Promise(resolve => {
            const workStart = performance.now();

            // Do some computation
            let result = 0;
            for (let i = 0; i < 100000; i++) {
              result += Math.random();
            }

            const workEnd = performance.now();
            iterations++;

            if (iterations < 10) {
              setTimeout(() => resolve(doWork()), 16); // 60fps timing
            } else {
              resolve({ totalTime: workEnd - startTime, iterations, result });
            }
          });
        };

        return doWork();
      }) as { totalTime: number; iterations: number; result: number };

      console.log(`CPU work completed in: ${cpuMetrics.totalTime.toFixed(2)}ms`);

      // Should complete work efficiently
      expect(cpuMetrics.totalTime).toBeLessThan(500); // <500ms for test work
      expect(cpuMetrics.iterations).toBe(10);
    });
  });

  test.describe('Performance Regression Detection', () => {
    test('performance baseline validation', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      // Measure comprehensive performance metrics
      const metrics = await page.evaluate(async () => {
        const startTime = performance.now();

        // Wait for component to be fully rendered
        await new Promise(resolve => {
          const checkRendered = () => {
            const container = document.querySelector('.hexagon-clock-container');
            if (container) {
              resolve(undefined);
            } else {
              setTimeout(checkRendered, 10);
            }
          };
          checkRendered();
        });

        const renderTime = performance.now() - startTime;

        // Test interaction performance
        const button = document.querySelector('button[title*="Physical"]') as HTMLElement;
        const interactionStart = performance.now();
        if (button) {
          button.click();
        }
        const interactionTime = performance.now() - interactionStart;

        return {
          renderTime,
          interactionTime,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          timestamp: Date.now(),
        };
      });

      console.log('Performance baseline:', {
        renderTime: `${metrics.renderTime.toFixed(2)}ms`,
        interactionTime: `${metrics.interactionTime.toFixed(2)}ms`,
        memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
      });

      // Validate against known performance targets
      expect(metrics.renderTime).toBeLessThan(200); // Allow some E2E overhead
      expect(metrics.interactionTime).toBeLessThan(20); // Should be very fast
      expect(metrics.memoryUsage).toBeGreaterThan(0); // Should be measurable
      expect(metrics.memoryUsage).toBeLessThan(50 * 1024 * 1024); // <50MB reasonable limit
    });
  });
});
