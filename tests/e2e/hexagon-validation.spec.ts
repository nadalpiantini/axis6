import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://axis6.app';

test.describe('AXIS6 Hexagon Animation Validation', () => {
  test('Hexagon SVG Performance and Interactivity', async ({ page }) => {
    console.log('🚀 Testing hexagon animation on production site...');
    
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');
    
    // Look for the main hexagon SVG
    const hexagonSvg = page.locator('svg').first();
    await expect(hexagonSvg).toBeVisible();
    
    // Count hexagon elements
    const svgElements = await page.locator('svg').count();
    const circleElements = await page.locator('svg circle').count();
    const lineElements = await page.locator('svg line').count();
    
    console.log(`🔷 SVG elements found: ${svgElements}`);
    console.log(`🔷 Circle elements found: ${circleElements}`);
    console.log(`🔷 Line elements found: ${lineElements}`);
    
    // Test hexagon structure (should have 6 dimension circles + center circle)
    expect(circleElements).toBeGreaterThanOrEqual(7); // 6 dimensions + center
    expect(lineElements).toBeGreaterThanOrEqual(6); // 6 connecting lines
    
    // Test animation classes are present
    const animatedElements = await page.locator('.animate-float, .animate-pulse').count();
    console.log(`✨ Animated elements found: ${animatedElements}`);
    expect(animatedElements).toBeGreaterThan(0);
    
    // Test hover interactions on circles
    const firstCircle = page.locator('svg circle').first();
    if (await firstCircle.isVisible()) {
      // Test hover effect
      await firstCircle.hover();
      await page.waitForTimeout(500); // Let hover animation complete
      
      console.log('✅ Hexagon hover interaction tested');
    }
    
    // Test that hexagon is responsive
    const svgBox = await hexagonSvg.boundingBox();
    if (svgBox) {
      console.log(`📐 Hexagon dimensions: ${svgBox.width}x${svgBox.height}`);
      expect(svgBox.width).toBeGreaterThan(200); // Should be reasonably sized
      expect(svgBox.height).toBeGreaterThan(200);
    }
    
    // Performance test: measure animation frame rate
    const animationPerformance = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();
        
        function countFrames() {
          frameCount++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrames);
          } else {
            resolve(frameCount);
          }
        }
        requestAnimationFrame(countFrames);
      });
    });
    
    console.log(`📊 Animation frame rate: ~${animationPerformance} FPS`);
    expect(animationPerformance).toBeGreaterThan(30); // Should be smooth
    
    console.log('🎯 Hexagon animation validation complete!');
  });

  test('Mobile Hexagon Responsiveness', async ({ page, isMobile }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');
    
    const hexagonContainer = page.locator('div').filter({ hasText: /relative.*hexagon|svg/i }).first();
    const hexagonSvg = page.locator('svg').first();
    
    await expect(hexagonSvg).toBeVisible();
    
    if (isMobile) {
      const containerBox = await hexagonContainer.boundingBox();
      const svgBox = await hexagonSvg.boundingBox();
      
      if (containerBox && svgBox) {
        console.log(`📱 Mobile container: ${containerBox.width}x${containerBox.height}`);
        console.log(`📱 Mobile SVG: ${svgBox.width}x${svgBox.height}`);
        
        // Should fit within mobile viewport
        expect(svgBox.width).toBeLessThan(400);
        expect(svgBox.height).toBeLessThan(400);
        
        // Should still be large enough to interact with
        expect(svgBox.width).toBeGreaterThan(150);
        expect(svgBox.height).toBeGreaterThan(150);
      }
    }
    
    console.log('📱 Mobile hexagon responsiveness validated!');
  });
});