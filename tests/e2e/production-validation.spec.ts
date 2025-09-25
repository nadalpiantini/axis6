import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://axis6.app';

test.describe('AXIS6 Production Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Performance monitoring
    await page.addInitScript(() => {
      window.performance.mark('navigation-start');
    });
  });

  test('Production Site Accessibility & Load Time', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to production site
    await page.goto(PRODUCTION_URL);
    
    const loadTime = Date.now() - startTime;
    console.log(`🚀 Page Load Time: ${loadTime}ms`);
    
    // Verify site loads successfully
    await expect(page).toHaveTitle(/AXIS6/);
    
    // Check for critical errors in console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Performance target: < 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // No critical errors
    expect(errors.filter(e => !e.includes('Failed to load resource'))).toHaveLength(0);
  });

  test('Authentication Flow Validation', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Check if auth page exists and is accessible
    const authButton = page.getByRole('link', { name: /login|sign in|get started/i });
    if (await authButton.isVisible()) {
      await authButton.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Verify auth page loads
      await expect(page).toHaveURL(/login|auth|signin/);
      
      // Check form elements exist
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    }
  });

  test('Hexagon Animation Performance (Priority Feature)', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Navigate to dashboard or wherever hexagon appears
    // First check if we need to login
    await page.waitForLoadState('domcontentloaded');
    
    // Look for hexagon elements (they might be on landing page or dashboard)
    const hexagonElements = await page.locator('[class*="hexagon"], svg, canvas').count();
    console.log(`🔷 Found ${hexagonElements} potential hexagon elements`);
    
    // If hexagon elements exist, test animation performance
    if (hexagonElements > 0) {
      // Monitor performance during animation
      await page.evaluate(() => {
        window.performance.mark('animation-start');
      });
      
      // Trigger any hover/click interactions that might animate hexagons
      const interactiveElements = page.locator('[class*="hexagon"], svg, canvas').first();
      if (await interactiveElements.isVisible()) {
        await interactiveElements.hover();
        await page.waitForTimeout(1000); // Let animation complete
        
        await page.evaluate(() => {
          window.performance.mark('animation-end');
          window.performance.measure('hexagon-animation', 'animation-start', 'animation-end');
        });
      }
    }
  });

  test('Mobile Responsiveness & Touch Targets', async ({ page, isMobile }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');
    
    if (isMobile) {
      // Check viewport meta tag
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewportMeta).toContain('width=device-width');
      
      // Test touch targets are at least 44px
      const buttons = page.locator('button, a');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(5, buttonCount); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThanOrEqual(44);
            expect(box.width).toBeGreaterThanOrEqual(44);
          }
        }
      }
    }
  });

  test('Core Web Vitals Measurement', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: Record<string, number> = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'paint') {
              vitals[entry.name] = entry.startTime;
            }
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
            }
          });
          
          // Also get navigation timing
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          vitals.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          vitals.fullyLoaded = navigation.loadEventEnd - navigation.fetchStart;
          
          resolve(vitals);
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          resolve({
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            fullyLoaded: navigation.loadEventEnd - navigation.fetchStart
          });
        }, 3000);
      });
    });
    
    console.log('🔄 Core Web Vitals:', vitals);
    
    // Performance targets
    expect(vitals.domContentLoaded).toBeLessThan(2000); // 2s for DOM ready
    expect(vitals.fullyLoaded).toBeLessThan(5000); // 5s for full load
  });

  test('Security Headers Validation', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL);
    
    if (response) {
      const headers = response.headers();
      
      // Check critical security headers
      expect(headers['strict-transport-security']).toBeTruthy();
      expect(headers['content-security-policy']).toBeTruthy();
      expect(headers['x-frame-options']).toBeTruthy();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-xss-protection']).toBeTruthy();
      expect(headers['referrer-policy']).toBeTruthy();
      
      console.log('🛡️ Security headers validated');
    }
  });

  test('Critical User Journey - Dashboard Access', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');
    
    // Try to access dashboard (may redirect to auth)
    const dashboardLink = page.getByRole('link', { name: /dashboard|app|start/i });
    
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForLoadState('domcontentloaded');
      
      // Should either reach dashboard or auth page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/(dashboard|login|auth|signin)/);
    }
  });

  test('Error Boundaries & Graceful Degradation', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Monitor for unhandled promise rejections
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    // Try to trigger potential error states
    await page.waitForTimeout(2000);
    
    // No unhandled errors should occur on normal page load
    expect(errors).toHaveLength(0);
    
    // Check for error boundary components
    const errorBoundary = page.locator('[data-testid*="error"], .error-boundary, [class*="error-fallback"]');
    const hasErrorBoundary = await errorBoundary.count();
    console.log(`🛡️ Error boundary components: ${hasErrorBoundary}`);
  });

  test('Bundle Size & Performance', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Get performance entries to check bundle sizes
    const resourceSizes = await page.evaluate(() => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const sizes: Record<string, number> = {};
      
      entries.forEach(entry => {
        if (entry.name.includes('.js') || entry.name.includes('.css')) {
          const filename = entry.name.split('/').pop() || 'unknown';
          sizes[filename] = entry.transferSize || 0;
        }
      });
      
      return sizes;
    });
    
    console.log('📦 Bundle sizes:', resourceSizes);
    
    // Check for reasonable bundle sizes (main bundle should be < 1MB)
    const mainBundles = Object.entries(resourceSizes).filter(([name]) => 
      name.includes('main') || name.includes('app') || name.includes('index')
    );
    
    mainBundles.forEach(([name, size]) => {
      console.log(`📦 ${name}: ${(size / 1024).toFixed(2)}KB`);
      expect(size).toBeLessThan(1024 * 1024); // 1MB limit
    });
  });
});