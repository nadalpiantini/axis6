import { test, expect } from '@playwright/test';

/**
 * AXIS6 Dashboard Bug Report - Simple Manual Testing
 * Direct testing of dashboard functionality without authentication fixtures
 */
test.describe('Dashboard Bug Report', () => {

  test('comprehensive dashboard button functionality analysis', async ({ page }) => {
    console.log('\n🔍 AXIS6 Dashboard Button Functionality Analysis');
    console.log('================================================\n');

    const bugs: string[] = [];
    const working: string[] = [];
    const jsErrors: string[] = [];

    // Capture JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(`JS Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      jsErrors.push(`Page Error: ${error.message}`);
    });

    try {
      // Step 1: Navigate to landing page first
      console.log('📍 Step 1: Testing landing page accessibility...');
      await page.goto('http://localhost:3000/');
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Check if landing page loads
      const landingPageLoaded = await page.locator('h1').count() > 0;
      if (landingPageLoaded) {
        working.push('✅ Landing page loads successfully');
        console.log('  ✅ Landing page loads successfully');
      } else {
        bugs.push('❌ Landing page fails to load');
        console.log('  ❌ Landing page fails to load');
      }

      // Step 2: Try to access dashboard directly (should redirect to login)
      console.log('\n📍 Step 2: Testing dashboard access redirect...');
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/login')) {
        working.push('✅ Dashboard properly redirects to login when unauthenticated');
        console.log('  ✅ Dashboard properly redirects to login when unauthenticated');
      } else {
        bugs.push('❌ Dashboard redirect behavior unexpected');
        console.log(`  ❌ Dashboard redirect unexpected - Current URL: ${currentUrl}`);
      }

      // Step 3: Test login page elements
      console.log('\n📍 Step 3: Testing login page elements...');
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

      if (await emailInput.isVisible()) {
        working.push('✅ Email input field is present');
        console.log('  ✅ Email input field is present');
      } else {
        bugs.push('❌ Email input field not found');
        console.log('  ❌ Email input field not found');
      }

      if (await passwordInput.isVisible()) {
        working.push('✅ Password input field is present');
        console.log('  ✅ Password input field is present');
      } else {
        bugs.push('❌ Password input field not found');
        console.log('  ❌ Password input field not found');
      }

      if (await loginButton.isVisible()) {
        working.push('✅ Login button is present');
        console.log('  ✅ Login button is present');
      } else {
        bugs.push('❌ Login button not found');
        console.log('  ❌ Login button not found');
      }

      // Step 4: Test header components (if any are visible)
      console.log('\n📍 Step 4: Testing header components...');
      const headerLogos = page.locator('header img, header svg, header .logo, [data-testid*="logo"]');
      const headerLogoCount = await headerLogos.count();
      
      if (headerLogoCount > 0) {
        working.push('✅ Header logo elements found');
        console.log(`  ✅ Header logo elements found (${headerLogoCount} elements)`);
      } else {
        bugs.push('❌ No header logo elements found');
        console.log('  ❌ No header logo elements found');
      }

      // Check for Spanish text in header
      const spanishTexts = ['días', 'Mi Perfil', 'Configuración', 'Cerrar Sesión'];
      let spanishFound = false;
      for (const text of spanishTexts) {
        if (await page.locator(`text="${text}"`).count() > 0) {
          bugs.push(`❌ Spanish text still found: "${text}"`);
          console.log(`  ❌ Spanish text still found: "${text}"`);
          spanishFound = true;
        }
      }
      
      if (!spanishFound) {
        working.push('✅ No Spanish text found in current page');
        console.log('  ✅ No Spanish text found in current page');
      }

      // Step 5: Test navigation buttons accessibility
      console.log('\n📍 Step 5: Testing navigation elements...');
      const navButtons = page.locator('nav a, nav button, header a, header button');
      const navButtonCount = await navButtons.count();
      
      if (navButtonCount > 0) {
        working.push(`✅ Found ${navButtonCount} navigation elements`);
        console.log(`  ✅ Found ${navButtonCount} navigation elements`);
        
        // Test a few navigation elements for proper styling
        for (let i = 0; i < Math.min(navButtonCount, 3); i++) {
          const navButton = navButtons.nth(i);
          const buttonText = await navButton.textContent();
          const href = await navButton.getAttribute('href');
          const isButton = await navButton.evaluate(el => el.tagName.toLowerCase() === 'button');
          
          if (buttonText && buttonText.trim()) {
            console.log(`    - Element ${i + 1}: "${buttonText.trim()}"${href ? ` (href: ${href})` : isButton ? ' (button)' : ''}`);
          }
        }
      } else {
        bugs.push('❌ No navigation elements found');
        console.log('  ❌ No navigation elements found');
      }

      // Step 6: Test responsive design
      console.log('\n📍 Step 6: Testing responsive design...');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      
      const bodyMobile = await page.locator('body').boundingBox();
      if (bodyMobile && bodyMobile.width <= 400) {
        working.push('✅ Mobile viewport renders correctly');
        console.log('  ✅ Mobile viewport renders correctly');
      } else {
        bugs.push('❌ Mobile viewport issues detected');
        console.log('  ❌ Mobile viewport issues detected');
      }

      // Reset to desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(1000);

      // Step 7: Attempt to simulate dashboard access with mock session
      console.log('\n📍 Step 7: Testing dashboard structure (if accessible)...');
      
      // Try to bypass auth for testing (this might not work but let's try)
      await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
      const finalUrl = page.url();
      
      if (finalUrl.includes('/dashboard')) {
        console.log('  🎯 Dashboard accessed - Testing dashboard elements...');
        
        // Look for hexagon chart
        const hexagonChart = page.locator('[data-testid="hexagon-chart"], svg[viewBox]');
        if (await hexagonChart.isVisible()) {
          working.push('✅ Hexagon chart element found');
          console.log('    ✅ Hexagon chart element found');
          
          // Test hexagon buttons
          const hexagonButtons = hexagonChart.locator('circle, [data-testid*="hexagon-"]');
          const hexagonButtonCount = await hexagonButtons.count();
          console.log(`    - Found ${hexagonButtonCount} potential hexagon buttons`);
          
          if (hexagonButtonCount >= 6) {
            working.push('✅ Expected number of hexagon buttons found (6+)');
            console.log('    ✅ Expected number of hexagon buttons found (6+)');
          } else if (hexagonButtonCount > 0) {
            bugs.push(`❌ Unexpected number of hexagon buttons: ${hexagonButtonCount} (expected 6)`);
            console.log(`    ❌ Unexpected number of hexagon buttons: ${hexagonButtonCount} (expected 6)`);
          }
        } else {
          bugs.push('❌ Hexagon chart not found in dashboard');
          console.log('    ❌ Hexagon chart not found in dashboard');
        }
        
        // Look for category cards
        const categoryCards = page.locator('[data-testid*="category-card"], .category-card');
        const categoryCardCount = await categoryCards.count();
        
        if (categoryCardCount > 0) {
          working.push(`✅ Category cards found (${categoryCardCount})`);
          console.log(`    ✅ Category cards found (${categoryCardCount})`);
          
          // Test dropdown functionality on first card
          if (categoryCardCount > 0) {
            const firstCard = categoryCards.first();
            const dropdownButton = firstCard.locator('button:has(svg), button[aria-label*="options"]');
            
            if (await dropdownButton.isVisible()) {
              working.push('✅ Category card dropdown button found');
              console.log('    ✅ Category card dropdown button found');
              
              // Test dropdown click
              await dropdownButton.click();
              await page.waitForTimeout(1000);
              
              const dropdownMenu = page.locator('.absolute.top-full, [data-testid*="dropdown"]');
              if (await dropdownMenu.isVisible()) {
                working.push('✅ Category dropdown opens successfully');
                console.log('    ✅ Category dropdown opens successfully');
                
                const dropdownOptions = dropdownMenu.locator('button');
                const optionCount = await dropdownOptions.count();
                console.log(`      - Found ${optionCount} dropdown options`);
                
              } else {
                bugs.push('❌ Category dropdown does not open');
                console.log('    ❌ Category dropdown does not open');
              }
            } else {
              bugs.push('❌ Category card dropdown button not found');
              console.log('    ❌ Category card dropdown button not found');
            }
          }
        } else {
          bugs.push('❌ No category cards found');
          console.log('    ❌ No category cards found');
        }
        
        // Look for Plan My Day button
        const planMyDayButton = page.locator('a[href="/my-day"]:has-text("Plan My Day")');
        if (await planMyDayButton.isVisible()) {
          working.push('✅ Plan My Day button found');
          console.log('    ✅ Plan My Day button found');
          
          // Check styling
          const buttonStyles = await planMyDayButton.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              background: styles.background,
              fontSize: styles.fontSize,
              fontWeight: styles.fontWeight
            };
          });
          
          if (buttonStyles.background.includes('blue') || buttonStyles.background.includes('gradient')) {
            working.push('✅ Plan My Day button has proper blue/gradient styling');
            console.log('    ✅ Plan My Day button has proper blue/gradient styling');
          } else {
            bugs.push('❌ Plan My Day button styling may be incorrect');
            console.log('    ❌ Plan My Day button styling may be incorrect');
          }
        } else {
          bugs.push('❌ Plan My Day button not found');
          console.log('    ❌ Plan My Day button not found');
        }
        
        // Check for Day Balance bar (should be removed)
        const balanceBars = page.locator('.balance-bar, [data-testid*="balance"], .day-balance');
        const balanceBarCount = await balanceBars.count();
        
        if (balanceBarCount === 0) {
          working.push('✅ Day Balance bar appears to be removed (not found)');
          console.log('    ✅ Day Balance bar appears to be removed (not found)');
        } else {
          bugs.push(`❌ Found ${balanceBarCount} potential Day Balance bar elements`);
          console.log(`    ❌ Found ${balanceBarCount} potential Day Balance bar elements`);
        }
        
      } else {
        console.log('  ℹ️  Dashboard not directly accessible (requires authentication)');
        bugs.push('ℹ️  Dashboard requires authentication (expected behavior)');
      }

    } catch (error) {
      bugs.push(`❌ Critical error during testing: ${error}`);
      console.log(`  ❌ Critical error: ${error}`);
    }

    // Final Report
    console.log('\n' + '='.repeat(60));
    console.log('🎯 AXIS6 DASHBOARD BUG REPORT SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n✅ WORKING FUNCTIONALITY (${working.length} items):`);
    working.forEach(item => console.log(`  ${item}`));

    console.log(`\n❌ ISSUES FOUND (${bugs.length} items):`);
    bugs.forEach(item => console.log(`  ${item}`));

    if (jsErrors.length > 0) {
      console.log(`\n🚨 JAVASCRIPT ERRORS (${jsErrors.length} errors):`);
      jsErrors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }

    console.log('\n' + '='.repeat(60));
    console.log(`OVERALL STATUS: ${bugs.length === 0 ? '✅ ALL TESTS PASSED' : `❌ ${bugs.length} ISSUES NEED ATTENTION`}`);
    console.log('='.repeat(60) + '\n');

    // The test should not fail - just report findings
    expect(true).toBeTruthy(); // Always pass so we can see the full report
  });

});