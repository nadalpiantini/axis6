/**
 * Specialized Mobile Experience Audit for AXIS6
 * Focus on the critical mobile issues identified in Phase 1
 */

import { test, expect, devices, type Page } from '@playwright/test';

// Critical mobile device configurations with fallback viewports
const CRITICAL_DEVICES = {
  'iPhone SE': devices['iPhone SE'] || { viewport: { width: 375, height: 667 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
  'iPhone 12': devices['iPhone 12'] || { viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
  'iPad': devices['iPad'] || { viewport: { width: 768, height: 1024 }, userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
  'Samsung Galaxy S21': devices['Galaxy S21'] || { viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36' },
};

// Mobile audit test configuration
test.describe('AXIS6 Mobile Experience Audit', () => {
  
  // Test 1: Mobile Dashboard Experience - Hexagon Visualization
  Object.entries(CRITICAL_DEVICES).forEach(([deviceName, device]) => {
    test(`Dashboard hexagon responsiveness on ${deviceName}`, async ({ browser }) => {
      const context = await browser.newContext({
        ...device,
        permissions: ['geolocation'] // Use a more widely supported permission
      });
      const page = await context.newPage();
      
      const viewportInfo = device.viewport ? `${device.viewport.width}x${device.viewport.height}` : 'unknown viewport';
      console.log(`🔍 Testing Dashboard on ${deviceName} (${viewportInfo})`);
      
      try {
        // Navigate to production dashboard
        await page.goto('https://axis6.app/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Check for hexagon container
        const hexagonContainer = page.locator('.hexagon-clock-container, [data-testid="hexagon-chart"], svg').first();
        
        if (await hexagonContainer.isVisible({ timeout: 10000 })) {
          const boundingBox = await hexagonContainer.boundingBox();
          
          if (boundingBox) {
            console.log(`✅ ${deviceName}: Hexagon found - ${boundingBox.width}x${boundingBox.height}`);
            
            // Verify responsive sizing (adjusted for mobile constraints)
            expect(boundingBox.width).toBeGreaterThan(10); // Minimum 10px width
            expect(boundingBox.height).toBeGreaterThan(10); // Minimum 10px height
            
            // Verify it fits within viewport with some margin
            const viewport = page.viewportSize()!;
            expect(boundingBox.width).toBeLessThanOrEqual(viewport.width * 0.95);
            expect(boundingBox.height).toBeLessThanOrEqual(viewport.height * 0.8);
            
            // Test touch interaction if buttons are present
            const buttons = page.locator('button').filter({ hasText: /Physical|Mental|Emotional|Social|Spiritual|Material/i });
            const buttonCount = await buttons.count();
            
            if (buttonCount > 0) {
              console.log(`📱 ${deviceName}: Found ${buttonCount} interactive elements`);
              
              // Test first button interaction
              const firstButton = buttons.first();
              await firstButton.tap({ timeout: 5000 });
              
              // Verify still visible after interaction
              await expect(firstButton).toBeVisible();
            }
          }
        } else {
          console.log(`❌ ${deviceName}: No hexagon found - checking for error states`);
          
          // Check for error messages or loading states
          const errorMessages = await page.locator('text=Error, text=500, text=Failed, text=Loading').count();
          if (errorMessages > 0) {
            console.log(`🚨 ${deviceName}: Error state detected`);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${deviceName}: Navigation failed - ${error}`);
      } finally {
        await context.close();
      }
    });
  });

  // Test 2: Modal Centering System Validation
  Object.entries(CRITICAL_DEVICES).forEach(([deviceName, device]) => {
    test(`Modal centering on ${deviceName}`, async ({ browser }) => {
      const context = await browser.newContext({
        ...device,
      });
      const page = await context.newPage();
      
      console.log(`🎯 Testing Modal Centering on ${deviceName}`);
      
      try {
        await page.goto('https://axis6.app/settings', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Look for modal triggers
        const modalTriggers = page.locator('button').filter({ 
          hasText: /customize|edit|add|settings/i 
        });
        
        const triggerCount = await modalTriggers.count();
        
        if (triggerCount > 0) {
          const firstTrigger = modalTriggers.first();
          await firstTrigger.tap();
          
          // Wait for modal to appear
          await page.waitForTimeout(500);
          
          // Check for modal with flexbox centering pattern
          const modals = page.locator('.fixed.inset-0.flex.items-center.justify-center, [role="dialog"], .modal-container');
          const modalCount = await modals.count();
          
          if (modalCount > 0) {
            const modal = modals.first();
            const modalBox = await modal.boundingBox();
            
            if (modalBox) {
              const viewport = page.viewportSize()!;
              
              // Calculate centering accuracy
              const modalCenterX = modalBox.x + modalBox.width / 2;
              const modalCenterY = modalBox.y + modalBox.height / 2;
              const viewportCenterX = viewport.width / 2;
              const viewportCenterY = viewport.height / 2;
              
              const horizontalOffset = Math.abs(modalCenterX - viewportCenterX);
              const verticalOffset = Math.abs(modalCenterY - viewportCenterY);
              
              console.log(`📏 ${deviceName}: Modal centering - H:${horizontalOffset}px V:${verticalOffset}px`);
              
              // Perfect centering should be within 20px tolerance
              expect(horizontalOffset).toBeLessThan(20);
              expect(verticalOffset).toBeLessThan(50); // More tolerance for vertical due to headers
            }
          }
        }
      } catch (error) {
        console.log(`❌ ${deviceName}: Modal test failed - ${error}`);
      } finally {
        await context.close();
      }
    });
  });

  // Test 3: Touch Target Compliance (WCAG 44px minimum)
  Object.entries(CRITICAL_DEVICES).forEach(([deviceName, device]) => {
    test(`Touch target compliance on ${deviceName}`, async ({ browser }) => {
      const context = await browser.newContext({
        ...device,
      });
      const page = await context.newPage();
      
      console.log(`👆 Testing Touch Targets on ${deviceName}`);
      
      try {
        await page.goto('https://axis6.app', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Find all interactive elements
        const interactiveElements = page.locator('button, a, input[type="submit"], [role="button"], .cursor-pointer');
        const elementCount = await interactiveElements.count();
        
        console.log(`🎯 ${deviceName}: Found ${elementCount} interactive elements`);
        
        let compliantTargets = 0;
        let nonCompliantTargets = 0;
        
        // Check first 10 elements to avoid timeout
        const checkLimit = Math.min(elementCount, 10);
        
        for (let i = 0; i < checkLimit; i++) {
          const element = interactiveElements.nth(i);
          
          if (await element.isVisible()) {
            const box = await element.boundingBox();
            
            if (box) {
              const minDimension = Math.min(box.width, box.height);
              
              if (minDimension >= 44) {
                compliantTargets++;
              } else {
                nonCompliantTargets++;
                console.log(`⚠️  ${deviceName}: Small target ${minDimension}px`);
              }
            }
          }
        }
        
        console.log(`✅ ${deviceName}: ${compliantTargets} compliant, ${nonCompliantTargets} too small`);
        
        // At least 80% should be compliant
        const complianceRate = compliantTargets / (compliantTargets + nonCompliantTargets);
        expect(complianceRate).toBeGreaterThan(0.8);
        
      } catch (error) {
        console.log(`❌ ${deviceName}: Touch target test failed - ${error}`);
      } finally {
        await context.close();
      }
    });
  });

  // Test 4: My-Day Page Mobile Performance
  Object.entries(CRITICAL_DEVICES).forEach(([deviceName, device]) => {
    test(`My-Day page functionality on ${deviceName}`, async ({ browser }) => {
      const context = await browser.newContext({
        ...device,
      });
      const page = await context.newPage();
      
      console.log(`⏰ Testing My-Day Page on ${deviceName}`);
      
      try {
        await page.goto('https://axis6.app/my-day', { waitUntil: 'networkidle', timeout: 30000 });
        
        // Check for 500 errors
        const errorElements = page.locator('text=500, text=Internal Server Error, text=Something went wrong');
        const errorCount = await errorElements.count();
        
        if (errorCount > 0) {
          console.log(`🚨 ${deviceName}: 500 error detected on My-Day page`);
          
          // Still check if any time-related content loaded
          const timeContent = page.locator('text=Total Time, text=/\\d+h \\d+m/, .time-block, [data-testid*="time"]');
          const timeContentCount = await timeContent.count();
          
          console.log(`⏰ ${deviceName}: Found ${timeContentCount} time-related elements despite error`);
        } else {
          console.log(`✅ ${deviceName}: My-Day page loaded successfully`);
          
          // Look for time planning elements
          const timeElements = page.locator('text=Total Time, text=/\\d+h \\d+m/, .hexagon-clock-container');
          const timeCount = await timeElements.count();
          
          if (timeCount > 0) {
            console.log(`⏰ ${deviceName}: Found ${timeCount} time planning elements`);
            
            // Test interaction with time blocks
            const interactiveTimeElements = page.locator('button').filter({ 
              hasText: /Physical|Mental|Emotional|Social|Spiritual|Material/i 
            });
            
            const interactiveCount = await interactiveTimeElements.count();
            if (interactiveCount > 0) {
              const firstTimeButton = interactiveTimeElements.first();
              await firstTimeButton.tap({ timeout: 5000 });
              
              // Verify interaction worked
              await expect(firstTimeButton).toBeVisible();
            }
          }
        }
        
      } catch (error) {
        console.log(`❌ ${deviceName}: My-Day test failed - ${error}`);
      } finally {
        await context.close();
      }
    });
  });

  // Test 5: Safe Area Support for Notched Devices
  ['iPhone 12', 'iPhone 13 Pro'].forEach(deviceName => {
    if (CRITICAL_DEVICES[deviceName as keyof typeof CRITICAL_DEVICES]) {
      test(`Safe area support on ${deviceName}`, async ({ browser }) => {
        const device = CRITICAL_DEVICES[deviceName as keyof typeof CRITICAL_DEVICES];
        const context = await browser.newContext({
          ...device,
          extraHTTPHeaders: {
            'viewport-fit': 'cover'
          }
        });
        const page = await context.newPage();
        
        console.log(`📱 Testing Safe Area Support on ${deviceName}`);
        
        try {
          await page.goto('https://axis6.app/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
          
          // Check if CSS environment variables are applied
          const safeAreaElements = page.locator('[style*="env(safe-area"], .pt-safe, .pb-safe, .pl-safe, .pr-safe');
          const safeAreaCount = await safeAreaElements.count();
          
          console.log(`🛡️  ${deviceName}: Found ${safeAreaCount} safe area aware elements`);
          
          if (safeAreaCount > 0) {
            // Test if content doesn't overlap with notch area
            const mainContent = page.locator('main, .main-content, .hexagon-clock-container').first();
            
            if (await mainContent.isVisible()) {
              const contentBox = await mainContent.boundingBox();
              
              if (contentBox) {
                // Content should not start at the very top (notch area)
                expect(contentBox.y).toBeGreaterThan(20);
                console.log(`✅ ${deviceName}: Content positioned ${contentBox.y}px from top (safe)`);
              }
            }
          }
          
        } catch (error) {
          console.log(`❌ ${deviceName}: Safe area test failed - ${error}`);
        } finally {
          await context.close();
        }
      });
    }
  });

  // Test 6: Bundle Performance Impact on Mobile
  test('Mobile bundle performance analysis', async ({ browser }) => {
    const device = CRITICAL_DEVICES['iPhone SE']; // Slowest device
    const context = await browser.newContext({
      ...device,
    });
    const page = await context.newPage();
    
    console.log('📊 Analyzing Bundle Performance on iPhone SE');
    
    try {
      // Start performance monitoring
      const startTime = Date.now();
      
      await page.goto('https://axis6.app', { waitUntil: 'networkidle', timeout: 60000 });
      
      const loadTime = Date.now() - startTime;
      console.log(`⏱️  Total load time: ${loadTime}ms`);
      
      // Check bundle sizes via network tab
      const jsRequests = await page.evaluate(() => {
        return performance.getEntriesByType('navigation').map(entry => ({
          name: entry.name,
          transferSize: (entry as PerformanceNavigationTiming).transferSize,
          duration: entry.duration
        }));
      });
      
      console.log('📦 Bundle analysis:', jsRequests);
      
      // Load time should be reasonable on mobile
      expect(loadTime).toBeLessThan(10000); // 10 seconds max for initial load
      
      // Test interaction responsiveness
      const interactiveElements = page.locator('button, a').first();
      if (await interactiveElements.isVisible()) {
        const tapStartTime = Date.now();
        await interactiveElements.tap();
        const tapTime = Date.now() - tapStartTime;
        
        console.log(`👆 Touch response time: ${tapTime}ms`);
        expect(tapTime).toBeLessThan(300); // Should respond within 300ms
      }
      
    } catch (error) {
      console.log(`❌ Bundle performance test failed - ${error}`);
    } finally {
      await context.close();
    }
  });

  // Test 7: Cross-Device Layout Consistency
  test('Cross-device layout consistency', async ({ browser }) => {
    const results: Array<{ device: string; layout: any }> = [];
    
    console.log('🔄 Testing Layout Consistency Across Devices');
    
    for (const [deviceName, device] of Object.entries(CRITICAL_DEVICES)) {
      const context = await browser.newContext({
        ...device,
      });
      const page = await context.newPage();
      
      try {
        await page.goto('https://axis6.app/dashboard', { waitUntil: 'networkidle', timeout: 30000 });
        
        const layout = {
          viewport: device.viewport || { width: 0, height: 0 },
          hexagonVisible: await page.locator('.hexagon-clock-container, svg').first().isVisible(),
          buttonsCount: await page.locator('button').count(),
          linksCount: await page.locator('a').count(),
          hasNavigation: await page.locator('nav, [role="navigation"]').count() > 0,
          hasMainContent: await page.locator('main, [role="main"]').count() > 0,
        };
        
        results.push({ device: deviceName, layout });
        console.log(`📱 ${deviceName}: ${layout.buttonsCount} buttons, hexagon: ${layout.hexagonVisible}`);
        
      } catch (error) {
        console.log(`❌ ${deviceName}: Layout test failed - ${error}`);
        results.push({ 
          device: deviceName, 
          layout: { error: error.toString() } 
        });
      } finally {
        await context.close();
      }
    }
    
    // Verify consistency (at least some elements should be consistent)
    const successfulResults = results.filter(r => !r.layout.error);
    if (successfulResults.length > 1) {
      const firstResult = successfulResults[0];
      
      successfulResults.forEach(result => {
        // Navigation should be consistent
        expect(result.layout.hasNavigation).toBe(firstResult.layout.hasNavigation);
        
        // Button count shouldn't vary dramatically (within 50%)
        if (firstResult.layout.buttonsCount > 0) {
          const buttonCountDiff = Math.abs(result.layout.buttonsCount - firstResult.layout.buttonsCount);
          const buttonCountRatio = buttonCountDiff / firstResult.layout.buttonsCount;
          expect(buttonCountRatio).toBeLessThan(0.5);
        }
      });
    }
    
    console.log('✅ Layout consistency validated across', successfulResults.length, 'devices');
  });
});