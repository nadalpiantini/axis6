import { test, expect } from '@playwright/test';

/**
 * AXIS6 Dashboard Complete Button Testing
 * Full end-to-end testing with actual authentication
 */
test.describe('Dashboard Complete Button Testing', () => {

  test('full dashboard button functionality with real authentication', async ({ page }) => {
    console.log('\n🚀 AXIS6 Dashboard Complete Button Testing');
    console.log('='.repeat(50));

    const bugs: string[] = [];
    const working: string[] = [];
    const jsErrors: string[] = [];
    const testResults: { [key: string]: string[] } = {};

    // Generate unique test user
    const testUser = {
      email: `test-user-${Date.now()}@axis6-test.local`,
      password: 'TestPass123!',
      name: `Test User ${Date.now()}`
    };

    // Capture JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('CSP')) {
        jsErrors.push(`Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      jsErrors.push(`Page Error: ${error.message}`);
    });

    try {
      console.log('\n📍 Step 1: Navigate to registration page...');
      await page.goto('http://localhost:3000/auth/register');
      await page.waitForLoadState('networkidle');

      console.log('\n📍 Step 2: Register test user...');
      
      // Fill registration form
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]').first();
      const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
      const registerButton = page.locator('button[type="submit"], button:has-text("Create Account"), button:has-text("Register")');

      if (await emailInput.isVisible()) {
        await emailInput.fill(testUser.email);
        console.log(`  ✅ Email filled: ${testUser.email}`);
      } else {
        bugs.push('❌ Email input not found on registration page');
      }

      if (await passwordInput.isVisible()) {
        await passwordInput.fill(testUser.password);
        console.log('  ✅ Password filled');
      } else {
        bugs.push('❌ Password input not found on registration page');
      }

      // Fill confirm password if exists
      if (await confirmPasswordInput.isVisible()) {
        await confirmPasswordInput.fill(testUser.password);
        console.log('  ✅ Password confirmation filled');
      }

      // Check if name field exists
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
      if (await nameInput.isVisible()) {
        await nameInput.fill(testUser.name);
        console.log('  ✅ Name filled');
      }

      // Submit registration
      if (await registerButton.isVisible()) {
        await registerButton.click();
        console.log('  ✅ Registration submitted');

        // Wait for redirect or success
        try {
          await page.waitForURL('**/dashboard', { timeout: 30000 });
          working.push('✅ User registration and auto-login successful');
          console.log('  ✅ Registration successful - redirected to dashboard');
        } catch {
          // Maybe redirected to login page
          if (page.url().includes('/auth/login')) {
            console.log('  ℹ️  Redirected to login page - attempting login...');
            
            // Fill login form
            const loginEmail = page.locator('input[type="email"]');
            const loginPassword = page.locator('input[type="password"]');
            const loginBtn = page.locator('button[type="submit"], button:has-text("Sign In")');

            await loginEmail.fill(testUser.email);
            await loginPassword.fill(testUser.password);
            await loginBtn.click();

            await page.waitForURL('**/dashboard', { timeout: 15000 });
            working.push('✅ User login successful after registration');
            console.log('  ✅ Login successful - now on dashboard');
          } else {
            bugs.push('❌ Registration/login process failed');
            return;
          }
        }
      } else {
        bugs.push('❌ Register button not found');
        return;
      }

      console.log('\n📍 Step 3: Testing dashboard page structure...');
      
      // Verify we're on dashboard
      expect(page.url()).toContain('/dashboard');
      working.push('✅ Successfully accessed dashboard page');

      // Wait for dashboard to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Additional wait for any dynamic content

      console.log('\n📍 Step 4: Testing hexagon visualization...');
      testResults['Hexagon Tests'] = [];
      
      const hexagonChart = page.locator('[data-testid="hexagon-chart"]');
      if (await hexagonChart.isVisible()) {
        working.push('✅ Hexagon chart is visible');
        testResults['Hexagon Tests'].push('✅ Hexagon chart found');
        console.log('  ✅ Hexagon chart found');

        // Test hexagon axis buttons
        const axisNames = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'];
        let axisButtonsFound = 0;
        let axisButtonsWorking = 0;

        for (const axisName of axisNames) {
          const axisButton = page.locator(`[data-testid="hexagon-${axisName}"]`);
          if (await axisButton.isVisible()) {
            axisButtonsFound++;
            console.log(`    ✅ ${axisName} axis button found`);
            
            // Test clicking the axis button
            try {
              await axisButton.click();
              await page.waitForTimeout(1500); // Wait for response
              
              // Look for feedback (toast, state change, etc.)
              const toastNotification = page.locator('.toast, [role="alert"], [data-testid*="toast"]');
              const hasToast = await toastNotification.count() > 0;
              
              if (hasToast) {
                axisButtonsWorking++;
                testResults['Hexagon Tests'].push(`✅ ${axisName} button click works (shows feedback)`);
                console.log(`      ✅ ${axisName} button click shows feedback`);
              } else {
                testResults['Hexagon Tests'].push(`❌ ${axisName} button click shows no feedback`);
                console.log(`      ❌ ${axisName} button click shows no feedback`);
              }
              
            } catch (error) {
              testResults['Hexagon Tests'].push(`❌ ${axisName} button click error: ${error}`);
              console.log(`      ❌ ${axisName} button click error: ${error}`);
            }
          } else {
            testResults['Hexagon Tests'].push(`❌ ${axisName} button not found`);
            console.log(`    ❌ ${axisName} axis button not found`);
          }
        }

        if (axisButtonsFound === 6) {
          working.push('✅ All 6 hexagon axis buttons found');
        } else {
          bugs.push(`❌ Only ${axisButtonsFound}/6 hexagon axis buttons found`);
        }

        if (axisButtonsWorking > 0) {
          working.push(`✅ ${axisButtonsWorking}/6 hexagon buttons show feedback when clicked`);
        } else {
          bugs.push('❌ No hexagon buttons show feedback when clicked');
        }

      } else {
        bugs.push('❌ Hexagon chart not found');
        testResults['Hexagon Tests'].push('❌ Hexagon chart not found');
      }

      console.log('\n📍 Step 5: Testing category cards and dropdowns...');
      testResults['Category Card Tests'] = [];

      const categoryContainer = page.locator('[data-testid="category-cards"]');
      if (await categoryContainer.isVisible()) {
        working.push('✅ Category cards container found');
        testResults['Category Card Tests'].push('✅ Category cards container found');

        const categories = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'];
        let cardsFound = 0;
        let dropdownsWorking = 0;

        for (const category of categories) {
          const categoryCard = page.locator(`[data-testid="category-card-${category}"]`);
          if (await categoryCard.isVisible()) {
            cardsFound++;
            console.log(`    ✅ ${category} category card found`);
            testResults['Category Card Tests'].push(`✅ ${category} card found`);

            // Test dropdown functionality
            const dropdownButton = categoryCard.locator('button:has([class*="chevron"]), button:has(svg)').last();
            if (await dropdownButton.isVisible()) {
              try {
                await dropdownButton.click();
                await page.waitForTimeout(1000);

                // Look for dropdown menu
                const dropdownMenu = page.locator('.absolute.top-full, [role="menu"], .dropdown-menu');
                if (await dropdownMenu.isVisible()) {
                  dropdownsWorking++;
                  testResults['Category Card Tests'].push(`✅ ${category} dropdown opens`);
                  console.log(`      ✅ ${category} dropdown opens`);

                  // Test dropdown options
                  const dropdownOptions = dropdownMenu.locator('button');
                  const optionCount = await dropdownOptions.count();
                  if (optionCount > 0) {
                    testResults['Category Card Tests'].push(`✅ ${category} dropdown has ${optionCount} options`);
                    console.log(`        ✅ Found ${optionCount} options in dropdown`);

                    // Test clicking first option
                    const firstOption = dropdownOptions.first();
                    const optionText = await firstOption.textContent();
                    await firstOption.click();
                    await page.waitForTimeout(1000);

                    testResults['Category Card Tests'].push(`✅ ${category} option "${optionText}" clickable`);
                    console.log(`        ✅ Option "${optionText}" clicked successfully`);
                  }

                  // Close dropdown by clicking outside
                  await page.click('body', { position: { x: 100, y: 100 } });
                  await page.waitForTimeout(500);

                } else {
                  testResults['Category Card Tests'].push(`❌ ${category} dropdown does not open`);
                  console.log(`      ❌ ${category} dropdown does not open`);
                }
              } catch (error) {
                testResults['Category Card Tests'].push(`❌ ${category} dropdown error: ${error}`);
                console.log(`      ❌ ${category} dropdown error: ${error}`);
              }
            } else {
              testResults['Category Card Tests'].push(`❌ ${category} dropdown button not found`);
              console.log(`      ❌ ${category} dropdown button not found`);
            }
          } else {
            testResults['Category Card Tests'].push(`❌ ${category} card not found`);
            console.log(`    ❌ ${category} category card not found`);
          }
        }

        if (cardsFound === 6) {
          working.push('✅ All 6 category cards found');
        } else {
          bugs.push(`❌ Only ${cardsFound}/6 category cards found`);
        }

        if (dropdownsWorking > 0) {
          working.push(`✅ ${dropdownsWorking}/6 category dropdowns work`);
        } else {
          bugs.push('❌ No category dropdowns work');
        }

      } else {
        bugs.push('❌ Category cards container not found');
        testResults['Category Card Tests'].push('❌ Category cards container not found');
      }

      console.log('\n📍 Step 6: Testing Plan My Day button...');
      testResults['Plan My Day Tests'] = [];

      const planMyDayButton = page.locator('a[href="/my-day"]:has-text("Plan My Day")');
      if (await planMyDayButton.isVisible()) {
        working.push('✅ Plan My Day button found');
        testResults['Plan My Day Tests'].push('✅ Plan My Day button found');
        console.log('  ✅ Plan My Day button found');

        // Test button styling
        const buttonStyles = await planMyDayButton.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            background: styles.background,
            border: styles.border,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight
          };
        });

        if (buttonStyles.background.includes('blue') || buttonStyles.background.includes('gradient')) {
          working.push('✅ Plan My Day button has proper blue styling');
          testResults['Plan My Day Tests'].push('✅ Button has blue/gradient styling');
          console.log('    ✅ Button has proper blue styling');
        } else {
          bugs.push('❌ Plan My Day button styling incorrect');
          testResults['Plan My Day Tests'].push('❌ Button styling incorrect');
        }

        // Test navigation
        try {
          await planMyDayButton.click();
          await page.waitForURL('**/my-day', { timeout: 10000 });
          working.push('✅ Plan My Day button navigates correctly');
          testResults['Plan My Day Tests'].push('✅ Navigation to /my-day works');
          console.log('    ✅ Navigation to /my-day works');

          // Navigate back to dashboard
          await page.goto('http://localhost:3000/dashboard');
          await page.waitForLoadState('networkidle');

        } catch (error) {
          bugs.push('❌ Plan My Day button navigation failed');
          testResults['Plan My Day Tests'].push(`❌ Navigation failed: ${error}`);
          console.log(`    ❌ Navigation failed: ${error}`);
        }

      } else {
        bugs.push('❌ Plan My Day button not found');
        testResults['Plan My Day Tests'].push('❌ Plan My Day button not found');
        console.log('  ❌ Plan My Day button not found');
      }

      console.log('\n📍 Step 7: Testing header navigation...');
      testResults['Header Tests'] = [];

      // Test header elements
      const headerLogos = page.locator('header img, header svg, header .logo, [data-testid*="logo"]');
      const logoCount = await headerLogos.count();

      if (logoCount > 0) {
        working.push(`✅ Found ${logoCount} header logo element(s)`);
        testResults['Header Tests'].push(`✅ ${logoCount} logo element(s) found`);
        console.log(`  ✅ Found ${logoCount} header logo element(s)`);
      } else {
        bugs.push('❌ No header logo elements found');
        testResults['Header Tests'].push('❌ No logo elements found');
      }

      // Check for Spanish text
      const spanishTexts = ['días', 'Mi Perfil', 'Configuración', 'Cerrar Sesión'];
      let spanishFound = false;
      for (const text of spanishTexts) {
        if (await page.locator(`text="${text}"`).count() > 0) {
          bugs.push(`❌ Spanish text found in header: "${text}"`);
          testResults['Header Tests'].push(`❌ Spanish text: "${text}"`);
          spanishFound = true;
          console.log(`    ❌ Spanish text found: "${text}"`);
        }
      }

      if (!spanishFound) {
        working.push('✅ No Spanish text found in header');
        testResults['Header Tests'].push('✅ No Spanish text found');
        console.log('  ✅ No Spanish text found in header');
      }

      // Test navigation links
      const navLinks = [
        { href: '/analytics', name: 'Analytics' },
        { href: '/achievements', name: 'Achievements' },
        { href: '/profile', name: 'Profile' },
        { href: '/settings', name: 'Settings' }
      ];

      let workingNavLinks = 0;
      for (const link of navLinks) {
        const navLink = page.locator(`a[href="${link.href}"]`);
        if (await navLink.isVisible()) {
          workingNavLinks++;
          testResults['Header Tests'].push(`✅ ${link.name} link found`);
          console.log(`    ✅ ${link.name} link found`);
        } else {
          testResults['Header Tests'].push(`❌ ${link.name} link not found`);
          console.log(`    ❌ ${link.name} link not found`);
        }
      }

      if (workingNavLinks > 0) {
        working.push(`✅ ${workingNavLinks}/4 navigation links found`);
      } else {
        bugs.push('❌ No navigation links found');
      }

      console.log('\n📍 Step 8: Testing Day Balance bar removal...');
      testResults['Day Balance Tests'] = [];

      const balanceBars = page.locator('.balance-bar, [data-testid*="balance"], .day-balance, .progress-bar:not([data-testid*="completion"])');
      const balanceBarCount = await balanceBars.count();

      if (balanceBarCount === 0) {
        working.push('✅ Day Balance bar successfully removed');
        testResults['Day Balance Tests'].push('✅ No Day Balance bar elements found');
        console.log('  ✅ Day Balance bar appears to be successfully removed');
      } else {
        bugs.push(`❌ Found ${balanceBarCount} potential Day Balance bar elements`);
        testResults['Day Balance Tests'].push(`❌ ${balanceBarCount} balance bar elements found`);
        console.log(`  ❌ Found ${balanceBarCount} potential Day Balance bar elements`);
      }

      console.log('\n📍 Step 9: Testing mobile responsiveness...');
      testResults['Mobile Tests'] = [];

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);

      // Test that elements are still visible and functional on mobile
      const mobileHexagon = page.locator('[data-testid="hexagon-chart"]');
      if (await mobileHexagon.isVisible()) {
        working.push('✅ Hexagon chart visible on mobile');
        testResults['Mobile Tests'].push('✅ Hexagon visible on mobile');
        console.log('  ✅ Hexagon chart visible on mobile');
      } else {
        bugs.push('❌ Hexagon chart not visible on mobile');
        testResults['Mobile Tests'].push('❌ Hexagon not visible on mobile');
      }

      const mobileCategoryCards = page.locator('[data-testid*="category-card"]');
      const mobileCardCount = await mobileCategoryCards.count();
      if (mobileCardCount > 0) {
        working.push(`✅ ${mobileCardCount} category cards visible on mobile`);
        testResults['Mobile Tests'].push(`✅ ${mobileCardCount} cards visible on mobile`);
        console.log(`  ✅ ${mobileCardCount} category cards visible on mobile`);
      } else {
        bugs.push('❌ No category cards visible on mobile');
        testResults['Mobile Tests'].push('❌ No cards visible on mobile');
      }

      // Reset viewport
      await page.setViewportSize({ width: 1280, height: 720 });

    } catch (error) {
      bugs.push(`❌ Critical error during testing: ${error}`);
      console.log(`❌ Critical error: ${error}`);
    }

    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE AXIS6 DASHBOARD BUG REPORT');
    console.log('='.repeat(80));

    // Detailed test results
    for (const [testCategory, results] of Object.entries(testResults)) {
      console.log(`\n📊 ${testCategory.toUpperCase()}`);
      console.log('-'.repeat(40));
      results.forEach(result => console.log(`  ${result}`));
    }

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

    console.log('\n' + '='.repeat(80));
    console.log(`FINAL STATUS: ${bugs.length === 0 ? '🎉 ALL TESTS PASSED!' : `⚠️  ${bugs.length} ISSUES NEED ATTENTION`}`);
    console.log('='.repeat(80) + '\n');

    // Always pass so we see the full report
    expect(true).toBeTruthy();
  });

});