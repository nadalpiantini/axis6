import { test, expect } from '../fixtures/auth-fixtures';

test.describe('AXIS6 Performance Audits', () => {
  
  test.describe('Page Load Performance', () => {
    test('landing page should load within performance budget', async ({ landingPage, utils }) => {
      const startTime = Date.now();
      
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      const loadTime = Date.now() - startTime;
      
      // Landing page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Measure detailed performance metrics
      const metrics = await utils.measurePerformance(landingPage.page);
      
      // Core Web Vitals targets
      expect(metrics.firstContentfulPaint).toBeLessThan(1800); // 1.8s FCP
      expect(metrics.domContentLoaded).toBeLessThan(2000); // 2s DOM ready
    });
    
    test('dashboard should load within performance budget', async ({ authenticatedPage, utils }) => {
      const startTime = Date.now();
      
      await authenticatedPage.verifyDashboardLoaded();
      
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 4 seconds (more complex)
      expect(loadTime).toBeLessThan(4000);
      
      const metrics = await utils.measurePerformance(authenticatedPage.page);
      
      // Dashboard performance targets
      expect(metrics.firstContentfulPaint).toBeLessThan(2500); // 2.5s FCP
      expect(metrics.domContentLoaded).toBeLessThan(3000); // 3s DOM ready
    });
    
    test('should handle concurrent user load', async ({ browser, testUser }) => {
      // Simulate multiple concurrent users
      const concurrentUsers = 5;
      const contexts = [];
      
      try {
        // Create multiple browser contexts
        for (let i = 0; i < concurrentUsers; i++) {
          const context = await browser.newContext();
          contexts.push(context);
        }
        
        // Simulate concurrent dashboard access
        const loadPromises = contexts.map(async (context, index) => {
          const page = await context.newPage();
          
          // Register a unique user for each context
          const uniqueUser = {
            email: `test-concurrent-${index}-${Date.now()}@axis6-test.local`,
            password: testUser.password,
            name: `Concurrent User ${index}`
          };
          
          // Register
          await page.goto('/auth/register');
          const emailInput = page.getByRole('textbox', { name: /email/i });
          const passwordInput = page.getByRole('textbox', { name: /password/i });
          const registerButton = page.getByRole('button', { name: /sign up|register/i });
          
          await emailInput.fill(uniqueUser.email);
          await passwordInput.fill(uniqueUser.password);
          await registerButton.click();
          
          await page.waitForURL(/\/(dashboard|auth\/onboarding)/);
          if (page.url().includes('onboarding')) {
            await page.waitForURL('**/dashboard', { timeout: 15000 });
          }
          
          // Measure dashboard load time
          const startTime = Date.now();
          await page.waitForLoadState('networkidle');
          const loadTime = Date.now() - startTime;
          
          await page.close();
          return loadTime;
        });
        
        const loadTimes = await Promise.all(loadPromises);
        
        // All concurrent loads should complete within reasonable time
        const maxLoadTime = Math.max(...loadTimes);
        const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
        
        expect(maxLoadTime).toBeLessThan(8000); // 8s max under load
        expect(avgLoadTime).toBeLessThan(5000); // 5s average
        
      } finally {
        // Clean up contexts
        for (const context of contexts) {
          await context.close();
        }
      }
    });
  });

  test.describe('Resource Optimization', () => {
    test('should not load excessive JavaScript', async ({ landingPage }) => {
      const jsRequests: any[] = [];
      
      landingPage.page.on('response', response => {
        if (response.url().endsWith('.js') || response.request().resourceType() === 'script') {
          jsRequests.push({
            url: response.url(),
            size: response.headers()['content-length'] || 0
          });
        }
      });
      
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // Should not have too many JavaScript files
      expect(jsRequests.length).toBeLessThan(20);
      
      // Calculate total JS size
      const totalJSSize = jsRequests.reduce((total, req) => total + parseInt(req.size || '0'), 0);
      
      // Total JS should be under 1MB for initial page load
      expect(totalJSSize).toBeLessThan(1024 * 1024); // 1MB
    });
    
    test('should optimize images properly', async ({ landingPage }) => {
      const imageRequests: any[] = [];
      
      landingPage.page.on('response', response => {
        if (response.request().resourceType() === 'image') {
          imageRequests.push({
            url: response.url(),
            size: response.headers()['content-length'] || 0,
            type: response.headers()['content-type']
          });
        }
      });
      
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // Check image optimization
      for (const img of imageRequests) {
        // Should use modern formats when possible
        const isModernFormat = img.type?.includes('webp') || 
                               img.type?.includes('avif') || 
                               img.url.includes('.webp') ||
                               img.url.includes('.avif');
        
        const isReasonableSize = parseInt(img.size || '0') < 500000; // 500KB max per image
        
        // Either modern format or reasonable size
        expect(isModernFormat || isReasonableSize).toBe(true);
      }
    });
    
    test('should use appropriate caching headers', async ({ landingPage }) => {
      const staticAssets: any[] = [];
      
      landingPage.page.on('response', response => {
        const url = response.url();
        if (url.includes('_next/static') || url.endsWith('.css') || url.endsWith('.js')) {
          staticAssets.push({
            url,
            cacheControl: response.headers()['cache-control'],
            etag: response.headers()['etag']
          });
        }
      });
      
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // Static assets should have appropriate cache headers
      for (const asset of staticAssets) {
        const hasCaching = asset.cacheControl || asset.etag;
        expect(hasCaching).toBeTruthy();
        
        // Next.js static assets should have long cache times
        if (asset.url.includes('_next/static')) {
          expect(asset.cacheControl).toMatch(/(max-age|immutable)/);
        }
      }
    });
  });

  test.describe('Runtime Performance', () => {
    test('should not block main thread excessively', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Measure main thread blocking
      const longTasks = await authenticatedPage.page.evaluate(() => {
        return new Promise(resolve => {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntries();
            observer.disconnect();
            resolve(entries.map(entry => ({
              duration: entry.duration,
              startTime: entry.startTime
            })));
          });
          
          observer.observe({ entryTypes: ['longtask'] });
          
          // Give it some time to observe
          setTimeout(() => {
            observer.disconnect();
            resolve([]);
          }, 5000);
        });
      });
      
      // Should not have tasks blocking main thread for >50ms
      const blockingTasks = (longTasks as any[]).filter(task => task.duration > 50);
      expect(blockingTasks.length).toBeLessThan(3);
    });
    
    test('should handle large datasets efficiently', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Simulate scrolling and interactions to test performance
      const hexagon = authenticatedPage.hexagonChart;
      
      if (await hexagon.isVisible()) {
        const startTime = Date.now();
        
        // Interact with hexagon multiple times
        for (let i = 0; i < 10; i++) {
          await hexagon.click();
          await authenticatedPage.page.waitForTimeout(100);
        }
        
        const interactionTime = Date.now() - startTime;
        
        // Interactions should be responsive
        expect(interactionTime).toBeLessThan(2000); // Under 2s for 10 interactions
      }
    });
    
    test('should not have memory leaks', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Get initial memory usage
      const initialMemory = await authenticatedPage.page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });
      
      if (initialMemory) {
        // Perform multiple page navigations and interactions
        for (let i = 0; i < 5; i++) {
          await authenticatedPage.page.reload();
          await authenticatedPage.verifyDashboardLoaded();
          await authenticatedPage.page.waitForTimeout(1000);
        }
        
        // Get final memory usage
        const finalMemory = await authenticatedPage.page.evaluate(() => {
          return {
            usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
            totalJSHeapSize: (performance as any).memory.totalJSHeapSize
          };
        });
        
        // Memory usage should not increase dramatically
        const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const increasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        // Less than 50% memory increase is acceptable
        expect(increasePercent).toBeLessThan(50);
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should handle slow network conditions', async ({ landingPage, page }) => {
      // Simulate slow 3G
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        await route.continue();
      });
      
      const startTime = Date.now();
      await landingPage.goto('/');
      
      // Should still load, even if slowly
      await landingPage.verifyLandingPageLoaded();
      
      const loadTime = Date.now() - startTime;
      
      // Should complete within reasonable time even on slow connection
      expect(loadTime).toBeLessThan(10000); // 10s max on slow network
    });
    
    test('should minimize API calls on dashboard', async ({ authenticatedPage }) => {
      const apiCalls: string[] = [];
      
      authenticatedPage.page.on('request', request => {
        if (request.url().includes('/api/') && request.method() === 'GET') {
          apiCalls.push(request.url());
        }
      });
      
      await authenticatedPage.verifyDashboardLoaded();
      
      // Should not make excessive API calls for initial load
      expect(apiCalls.length).toBeLessThan(10);
      
      // Should batch related requests when possible
      const uniqueEndpoints = new Set(apiCalls.map(url => {
        const endpoint = url.split('/api/')[1]?.split('?')[0];
        return endpoint;
      }));
      
      // Should use efficient endpoint design
      expect(uniqueEndpoints.size).toBeLessThan(6);
    });
    
    test('should handle offline conditions gracefully', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();
      
      // Go offline
      await authenticatedPage.page.context().setOffline(true);
      
      // Page should still function for cached content
      await authenticatedPage.page.reload();
      
      // Basic structure should load from cache
      const body = await authenticatedPage.page.locator('body');
      await expect(body).toBeVisible();
      
      // Should show offline indicator
      const offlineIndicator = authenticatedPage.page.locator(
        '.offline, [data-offline="true"], [aria-label*="offline"]'
      );
      
      // Either shows offline indicator or gracefully degrades
      if (await offlineIndicator.count() > 0) {
        await expect(offlineIndicator.first()).toBeVisible();
      }
      
      // Restore online
      await authenticatedPage.page.context().setOffline(false);
    });
  });

  test.describe('Mobile Performance', () => {
    test('should perform well on mobile devices', async ({ landingPage, utils }) => {
      // Simulate mobile device
      await landingPage.page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      const loadTime = Date.now() - startTime;
      
      // Mobile should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5s on mobile
      
      const metrics = await utils.measurePerformance(landingPage.page);
      
      // Mobile-specific performance targets
      expect(metrics.firstContentfulPaint).toBeLessThan(3000); // 3s FCP on mobile
    });
    
    test('should handle touch interactions efficiently', async ({ authenticatedPage }) => {
      await authenticatedPage.page.setViewportSize({ width: 375, height: 667 });
      await authenticatedPage.verifyDashboardLoaded();
      
      // Test touch interactions on hexagon
      const hexagon = authenticatedPage.hexagonChart;
      
      if (await hexagon.isVisible()) {
        const startTime = Date.now();
        
        // Simulate multiple touch interactions
        await hexagon.tap();
        await authenticatedPage.page.waitForTimeout(100);
        
        await hexagon.tap({ position: { x: 50, y: 50 } });
        await authenticatedPage.page.waitForTimeout(100);
        
        const interactionTime = Date.now() - startTime;
        
        // Touch interactions should be responsive
        expect(interactionTime).toBeLessThan(1000);
      }
    });
  });

  test.describe('Performance Monitoring', () => {
    test('should report Core Web Vitals', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();
      
      // Get Core Web Vitals
      const vitals = await landingPage.page.evaluate(() => {
        return new Promise(resolve => {
          const vitals: any = {};
          
          // FCP - First Contentful Paint
          const observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
            }
          });
          observer.observe({ entryTypes: ['paint'] });
          
          // LCP - Largest Contentful Paint
          const lcpObserver = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              vitals.lcp = entry.startTime;
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          
          setTimeout(() => {
            observer.disconnect();
            lcpObserver.disconnect();
            resolve(vitals);
          }, 3000);
        });
      });
      
      const webVitals = vitals as any;
      
      // Core Web Vitals thresholds
      if (webVitals.fcp) {
        expect(webVitals.fcp).toBeLessThan(1800); // Good FCP: <1.8s
      }
      
      if (webVitals.lcp) {
        expect(webVitals.lcp).toBeLessThan(2500); // Good LCP: <2.5s
      }
    });
  });
});