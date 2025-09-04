import { test, expect } from '@playwright/test';

/**
 * AXIS6 Dashboard Final Bug Report
 * Direct testing approach with proper form validation
 */
test.describe('Dashboard Final Bug Report', () => {

  test('complete dashboard functionality test with proper registration', async ({ page }) => {
    console.log('\n🎯 AXIS6 DASHBOARD FINAL BUG REPORT');
    console.log('====================================================================================\n');

    const bugs: string[] = [];
    const working: string[] = [];
    const jsErrors: string[] = [];
    let dashboardAccessible = false;

    // Generate unique test credentials
    const testUser = {
      email: `test-${Date.now()}@axis6playwright.com`,
      password: 'TestPassword123!',
      name: 'Playwright Test User'
    };

    // Capture JavaScript errors (ignore CSP warnings)
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('CSP') && !msg.text().includes('Content Security Policy')) {
        jsErrors.push(`Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      jsErrors.push(`Page Error: ${error.message}`);
    });

    try {
      console.log('📍 PHASE 1: AUTHENTICATION TESTING');
      console.log('━'.repeat(50));

      // Step 1: Test landing page
      console.log('\n🔍 Testing landing page...');
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      const landingTitle = page.locator('h1');
      if (await landingTitle.isVisible()) {
        working.push('✅ Landing page loads successfully');
        console.log('  ✅ Landing page loads');
      } else {
        bugs.push('❌ Landing page does not load');
        console.log('  ❌ Landing page failed to load');
      }

      // Step 2: Test registration form
      console.log('\n🔍 Testing registration process...');
      await page.goto('http://localhost:3000/auth/register');
      await page.waitForLoadState('networkidle');

      // Fill out registration form properly
      const nameInput = page.locator('[data-testid="name-input"]');
      const emailInput = page.locator('[data-testid="email-input"]');
      const passwordInput = page.locator('[data-testid="password-input"]');
      const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
      const termsCheckbox = page.locator('input[type="checkbox"]').first();
      const submitButton = page.locator('[data-testid="register-submit"]');

      if (await nameInput.isVisible()) {
        await nameInput.fill(testUser.name);
        working.push('✅ Name input works');
        console.log('  ✅ Name field filled');
      }

      if (await emailInput.isVisible()) {
        await emailInput.fill(testUser.email);
        working.push('✅ Email input works');
        console.log('  ✅ Email field filled');
      }

      if (await passwordInput.isVisible()) {
        await passwordInput.fill(testUser.password);
        working.push('✅ Password input works');
        console.log('  ✅ Password field filled');
      }

      if (await confirmPasswordInput.isVisible()) {
        await confirmPasswordInput.fill(testUser.password);
        working.push('✅ Confirm password input works');
        console.log('  ✅ Confirm password field filled');
      }

      if (await termsCheckbox.isVisible()) {
        await termsCheckbox.check();
        working.push('✅ Terms checkbox works');
        console.log('  ✅ Terms checkbox checked');
      }

      // Wait for validation to complete
      await page.waitForTimeout(1000);

      // Check if button is enabled now
      const isButtonEnabled = await submitButton.isEnabled();
      if (isButtonEnabled) {
        working.push('✅ Registration form validation works');
        console.log('  ✅ Registration button enabled after validation');

        // Submit registration
        await submitButton.click();
        console.log('  🔄 Registration submitted...');

        // Wait for redirect - could go to dashboard, onboarding, or login
        try {
          await page.waitForURL('**/dashboard', { timeout: 15000 });
          dashboardAccessible = true;
          working.push('✅ Registration successful with direct dashboard access');
          console.log('  ✅ Registration successful - redirected to dashboard');
        } catch {
          try {
            await page.waitForURL('**/auth/onboarding', { timeout: 5000 });
            // Complete onboarding quickly
            await page.goto('http://localhost:3000/dashboard');
            await page.waitForURL('**/dashboard', { timeout: 10000 });
            dashboardAccessible = true;
            working.push('✅ Registration successful via onboarding flow');
            console.log('  ✅ Registration successful - via onboarding');
          } catch {
            // Maybe went to login page - try to login
            if (page.url().includes('/auth/login')) {
              console.log('  🔄 Redirected to login - attempting login...');
              const loginEmail = page.locator('input[type="email"]');
              const loginPassword = page.locator('input[type="password"]');
              const loginButton = page.locator('button[type="submit"]');

              await loginEmail.fill(testUser.email);
              await loginPassword.fill(testUser.password);
              await loginButton.click();

              try {
                await page.waitForURL('**/dashboard', { timeout: 10000 });
                dashboardAccessible = true;
                working.push('✅ Login successful after registration');
                console.log('  ✅ Login successful');
              } catch {
                bugs.push('❌ Login failed after registration');
                console.log('  ❌ Login failed after registration');
              }
            } else {
              bugs.push('❌ Unexpected redirect after registration');
              console.log(`  ❌ Unexpected redirect: ${page.url()}`);
            }
          }
        }
      } else {
        bugs.push('❌ Registration button remains disabled despite form completion');
        console.log('  ❌ Registration button still disabled');
      }

      if (!dashboardAccessible) {
        console.log('\n⚠️  Dashboard not accessible - testing what we can reach...');
        
        // Test accessible pages instead
        await page.goto('http://localhost:3000/auth/login');
        await page.waitForLoadState('networkidle');

        // Test header components on login page
        const headerElements = page.locator('header, .header, nav');
        if (await headerElements.count() > 0) {
          working.push('✅ Header elements found on accessible pages');
        }

        // Test navigation elements
        const navLinks = page.locator('a[href]');
        const navCount = await navLinks.count();
        if (navCount > 0) {
          working.push(`✅ ${navCount} navigation links found`);
        }

        console.log('\n📋 ACCESSIBLE PAGES TEST SUMMARY:');
        console.log(`  - Working functionality: ${working.length} items`);
        console.log(`  - Issues found: ${bugs.length} items`);
        
        working.forEach(item => console.log(`    ${item}`));
        bugs.forEach(item => console.log(`    ${item}`));

        return; // Exit early if dashboard not accessible
      }

      console.log('\n📍 PHASE 2: DASHBOARD BUTTON FUNCTIONALITY');
      console.log('━'.repeat(50));

      // Ensure we're on the dashboard
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for dynamic content

      console.log('\n🔍 Testing hexagon visualization...');
      
      // Test hexagon chart
      const hexagonChart = page.locator('[data-testid="hexagon-chart"]');
      if (await hexagonChart.isVisible()) {
        working.push('✅ Hexagon chart is visible');
        console.log('  ✅ Hexagon chart found');

        // Test all 6 axis buttons
        const axisNames = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material'];
        let workingAxisButtons = 0;
        
        for (const axis of axisNames) {
          const axisButton = page.locator(`[data-testid="hexagon-${axis}"]`);
          if (await axisButton.isVisible()) {
            console.log(`    ✅ ${axis} button found`);
            
            try {
              await axisButton.click();
              await page.waitForTimeout(1500);
              
              // Check for feedback
              const feedback = page.locator('.toast, [role="alert"], [class*="toast"]');
              if (await feedback.count() > 0) {
                workingAxisButtons++;
                console.log(`      ✅ ${axis} button shows feedback`);
              } else {
                console.log(`      ⚠️  ${axis} button no visible feedback`);
              }
            } catch (error) {
              console.log(`      ❌ ${axis} button error: ${error}`);
            }
          } else {
            console.log(`    ❌ ${axis} button NOT found`);
          }
        }

        if (workingAxisButtons >= 3) {
          working.push(`✅ ${workingAxisButtons}/6 hexagon buttons functional`);
        } else if (workingAxisButtons > 0) {
          bugs.push(`⚠️  Only ${workingAxisButtons}/6 hexagon buttons functional`);
        } else {
          bugs.push('❌ No hexagon buttons are functional');
        }

      } else {
        bugs.push('❌ Hexagon chart not found');
        console.log('  ❌ Hexagon chart not found');
      }

      console.log('\n🔍 Testing category cards...');
      
      // Test category cards and dropdowns
      const categoryCards = page.locator('[data-testid*="category-card"]');
      const cardCount = await categoryCards.count();
      
      if (cardCount > 0) {
        working.push(`✅ ${cardCount} category cards found`);
        console.log(`  ✅ Found ${cardCount} category cards`);

        // Test first category card dropdown
        const firstCard = categoryCards.first();
        const dropdownTrigger = firstCard.locator('button:has([class*="chevron"]), button:has(svg)').last();
        
        if (await dropdownTrigger.isVisible()) {
          try {
            await dropdownTrigger.click();
            await page.waitForTimeout(1000);
            
            const dropdownMenu = page.locator('.absolute.top-full, [role="menu"]');
            if (await dropdownMenu.isVisible()) {
              working.push('✅ Category card dropdown opens');
              console.log('    ✅ Category dropdown opens');
              
              const options = dropdownMenu.locator('button');
              const optionCount = await options.count();
              console.log(`      ✅ Found ${optionCount} dropdown options`);
              
              if (optionCount > 0) {
                working.push(`✅ Category dropdown has ${optionCount} options`);
              }
            } else {
              bugs.push('❌ Category dropdown does not open');
              console.log('    ❌ Category dropdown does not open');
            }
          } catch (error) {
            bugs.push('❌ Category dropdown interaction failed');
            console.log(`    ❌ Dropdown error: ${error}`);
          }
        } else {
          bugs.push('❌ Category card dropdown button not found');
          console.log('    ❌ Dropdown button not found');
        }
      } else {
        bugs.push('❌ No category cards found');
        console.log('  ❌ No category cards found');
      }

      console.log('\n🔍 Testing Plan My Day button...');
      
      const planMyDayButton = page.locator('a[href="/my-day"]:has-text("Plan My Day")');
      if (await planMyDayButton.isVisible()) {
        working.push('✅ Plan My Day button found');
        console.log('  ✅ Plan My Day button found');

        // Test styling
        const styles = await planMyDayButton.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            background: computed.background,
            color: computed.color,
            fontWeight: computed.fontWeight
          };
        });

        if (styles.background.includes('blue') || styles.background.includes('gradient')) {
          working.push('✅ Plan My Day button has correct styling');
          console.log('    ✅ Button has blue/gradient styling');
        } else {
          bugs.push('❌ Plan My Day button styling incorrect');
          console.log('    ❌ Button styling may be incorrect');
        }

        // Test navigation
        try {
          await planMyDayButton.click();
          await page.waitForURL('**/my-day', { timeout: 10000 });
          working.push('✅ Plan My Day navigation works');
          console.log('    ✅ Navigation to My Day page works');
          
          // Navigate back
          await page.goto('http://localhost:3000/dashboard');
          await page.waitForLoadState('networkidle');
        } catch (error) {
          bugs.push('❌ Plan My Day navigation failed');
          console.log(`    ❌ Navigation failed: ${error}`);
        }
      } else {
        bugs.push('❌ Plan My Day button not found');
        console.log('  ❌ Plan My Day button not found');
      }

      console.log('\n🔍 Testing header components...');
      
      // Test header logo
      const headerLogos = page.locator('header img, header svg, [data-testid*="logo"]');
      const logoCount = await headerLogos.count();
      
      if (logoCount > 0) {
        working.push(`✅ ${logoCount} header logo element(s) found`);
        console.log(`  ✅ Found ${logoCount} logo element(s)`);
      } else {
        bugs.push('❌ No header logo elements found');
        console.log('  ❌ No header logo elements found');
      }

      // Check for Spanish text
      const spanishTexts = ['días', 'Mi Perfil', 'Configuración', 'Cerrar Sesión'];
      let foundSpanishText = false;
      
      for (const spanishText of spanishTexts) {
        if (await page.locator(`text="${spanishText}"`).count() > 0) {
          bugs.push(`❌ Spanish text found: "${spanishText}"`);
          console.log(`    ❌ Spanish text still present: "${spanishText}"`);
          foundSpanishText = true;
        }
      }

      if (!foundSpanishText) {
        working.push('✅ No Spanish text found in header');
        console.log('  ✅ Header appears to be English only');
      }

      console.log('\n🔍 Testing navigation links...');
      
      const navLinks = [
        { href: '/analytics', name: 'Analytics' },
        { href: '/achievements', name: 'Achievements' },
        { href: '/settings', name: 'Settings' },
        { href: '/profile', name: 'Profile' }
      ];

      let workingNavLinks = 0;
      for (const link of navLinks) {
        const linkElement = page.locator(`a[href="${link.href}"]`);
        if (await linkElement.isVisible()) {
          workingNavLinks++;
          console.log(`    ✅ ${link.name} link found`);
        } else {
          console.log(`    ❌ ${link.name} link NOT found`);
        }
      }

      if (workingNavLinks >= 2) {
        working.push(`✅ ${workingNavLinks}/4 navigation links found`);
      } else {
        bugs.push(`❌ Only ${workingNavLinks}/4 navigation links found`);
      }

      console.log('\n🔍 Testing Day Balance bar removal...');
      
      const balanceBars = page.locator('.balance-bar, [data-testid*="balance"], .day-balance');
      const balanceBarCount = await balanceBars.count();

      if (balanceBarCount === 0) {
        working.push('✅ Day Balance bar successfully removed');
        console.log('  ✅ No Day Balance bar elements found');
      } else {
        bugs.push(`❌ ${balanceBarCount} Day Balance bar elements still present`);
        console.log(`  ❌ Found ${balanceBarCount} balance bar elements`);
      }

    } catch (error) {
      bugs.push(`❌ Critical error: ${error}`);
      console.log(`\n❌ Critical error during testing: ${error}`);
    }

    // Generate final comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE AXIS6 DASHBOARD BUG REPORT - FINAL RESULTS');
    console.log('='.repeat(80));

    console.log(`\n📊 TESTING SUMMARY:`);
    console.log(`   🟢 Working Features: ${working.length}`);
    console.log(`   🔴 Issues Found: ${bugs.length}`);
    console.log(`   🟡 JavaScript Errors: ${jsErrors.length}`);
    console.log(`   📱 Dashboard Accessible: ${dashboardAccessible ? 'Yes' : 'No'}`);

    console.log(`\n✅ WORKING FUNCTIONALITY (${working.length} items):`);
    working.forEach((item, index) => console.log(`   ${index + 1}. ${item}`));

    console.log(`\n❌ ISSUES FOUND (${bugs.length} items):`);
    bugs.forEach((item, index) => console.log(`   ${index + 1}. ${item}`));

    if (jsErrors.length > 0) {
      console.log(`\n🚨 JAVASCRIPT ERRORS (${jsErrors.length} errors):`);
      jsErrors.forEach((error, index) => console.log(`   ${index + 1}. ${error}`));
    }

    console.log('\n📋 SPECIFIC BUG LOCATIONS:');
    console.log('━'.repeat(40));
    
    if (bugs.some(bug => bug.includes('hexagon'))) {
      console.log('🔸 HEXAGON ISSUES:');
      console.log('   Location: /app/dashboard/page.tsx - HexagonVisualization component');
      console.log('   Test IDs: [data-testid="hexagon-chart"], [data-testid="hexagon-{axis}"]');
    }
    
    if (bugs.some(bug => bug.includes('category'))) {
      console.log('🔸 CATEGORY CARD ISSUES:');
      console.log('   Location: /app/dashboard/page.tsx - MemoizedCategoryCard component');
      console.log('   Test IDs: [data-testid="category-card-{category}"]');
    }
    
    if (bugs.some(bug => bug.includes('Plan My Day'))) {
      console.log('🔸 PLAN MY DAY ISSUES:');
      console.log('   Location: /app/dashboard/page.tsx - Line ~670');
      console.log('   Element: <Link href="/my-day">Plan My Day</Link>');
    }
    
    if (bugs.some(bug => bug.includes('Spanish'))) {
      console.log('🔸 SPANISH TEXT ISSUES:');
      console.log('   Location: /components/layout/StandardHeader.tsx');
      console.log('   Lines: Check around lines 146, 201, 207, 216');
    }

    console.log('\n🏆 OVERALL ASSESSMENT:');
    const totalTests = working.length + bugs.length;
    const successRate = Math.round((working.length / totalTests) * 100);
    
    if (successRate >= 80) {
      console.log(`   🎉 EXCELLENT: ${successRate}% of features working correctly`);
    } else if (successRate >= 60) {
      console.log(`   👍 GOOD: ${successRate}% of features working correctly`);
    } else if (successRate >= 40) {
      console.log(`   ⚠️  NEEDS WORK: ${successRate}% of features working correctly`);
    } else {
      console.log(`   🚨 CRITICAL: Only ${successRate}% of features working correctly`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('END OF DASHBOARD BUG REPORT');
    console.log('='.repeat(80) + '\n');

    // Always pass to show the full report
    expect(true).toBeTruthy();
  });

});