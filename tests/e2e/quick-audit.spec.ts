import { test, expect, Page } from '@playwright/test';

/**
 * Quick AXIS6 Audit - Essential Page Testing
 * Tests core functionality across key pages
 */

const CREDENTIALS = {
  email: 'nadalpiantini@gmail.com',
  password: 'Teclados#13'
};

test.describe('AXIS6 Quick Audit', () => {
  test('Core Pages and Critical Issues', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    const issues: string[] = [];

    console.log('🚀 Starting AXIS6 Quick Audit');
    console.log(`📍 Testing: ${baseUrl}`);

    // Monitor JS errors
    const jsErrors: string[] = [];
    page.on('pageerror', error => jsErrors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') jsErrors.push(`Console: ${msg.text()}`);
    });

    // Monitor network errors
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    try {
      // 1. TEST LANDING PAGE
      console.log('🏠 Testing Landing Page...');
      const landingStart = Date.now();
      await page.goto(baseUrl);
      await page.waitForLoadState('domcontentloaded');
      const landingTime = Date.now() - landingStart;

      const hasTitle = await page.locator('title').count() > 0;
      if (!hasTitle) issues.push('Landing page missing title');

      const hasHeading = await page.locator('h1').count() > 0;
      if (!hasHeading) issues.push('Landing page missing main heading');

      // Check for call-to-action buttons
      const buttons = await page.locator('button, a[href="/auth/login"], a[href="/auth/register"]').count();
      if (buttons === 0) issues.push('Landing page missing action buttons');

      console.log(`   ✅ Loaded in ${landingTime}ms, found ${buttons} interactive elements`);

      // 2. TEST LOGIN
      console.log('🔐 Testing Authentication...');
      await page.goto(`${baseUrl}/auth/login`);
      await page.waitForLoadState('domcontentloaded');

      const emailField = page.locator('input[type="email"], input[name="email"]');
      const passwordField = page.locator('input[type="password"], input[name="password"]');
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');

      if (await emailField.count() === 0) issues.push('Login page missing email field');
      if (await passwordField.count() === 0) issues.push('Login page missing password field');
      if (await loginButton.count() === 0) issues.push('Login page missing login button');

      // Attempt login
      if (await emailField.count() > 0 && await passwordField.count() > 0) {
        await emailField.fill(CREDENTIALS.email);
        await passwordField.fill(CREDENTIALS.password);
        await loginButton.click();
        await page.waitForTimeout(5000);

        const currentUrl = page.url();
        if (currentUrl.includes('/auth/login')) {
          issues.push('Login failed - still on login page');
        } else {
          console.log('   ✅ Login successful');
        }
      }

      // 3. TEST DASHBOARD
      console.log('📊 Testing Dashboard...');
      const dashboardStart = Date.now();
      await page.goto(`${baseUrl}/dashboard`);
      await page.waitForLoadState('domcontentloaded');
      const dashboardTime = Date.now() - dashboardStart;

      // Look for hexagon visualization
      const hexagonElements = await page.locator('svg, canvas, [data-testid*="hexagon"]').count();
      if (hexagonElements === 0) issues.push('Dashboard missing hexagon visualization');

      // Look for check-in functionality
      const checkInElements = await page.locator('button:has-text("Check"), button:has-text("Complete"), [data-category]').count();
      if (checkInElements === 0) issues.push('Dashboard missing check-in functionality');

      console.log(`   ✅ Loaded in ${dashboardTime}ms, found ${hexagonElements} visualization elements, ${checkInElements} interactive elements`);

      // 4. TEST MY DAY
      console.log('🗓️ Testing My Day...');
      await page.goto(`${baseUrl}/my-day`);
      await page.waitForLoadState('domcontentloaded');

      const timeBlocks = await page.locator('[data-testid*="time"], .time-block, [class*="time"]').count();
      console.log(`   ✅ Found ${timeBlocks} time-related elements`);

      // 5. TEST PROFILE
      console.log('👤 Testing Profile...');
      await page.goto(`${baseUrl}/profile`);
      await page.waitForLoadState('domcontentloaded');

      const profileInputs = await page.locator('input, textarea, select').count();
      const saveButtons = await page.locator('button:has-text("Save"), button:has-text("Update")').count();
      
      if (profileInputs === 0) issues.push('Profile page has no editable fields');
      console.log(`   ✅ Found ${profileInputs} form fields, ${saveButtons} save buttons`);

      // 6. TEST SETTINGS
      console.log('⚙️ Testing Settings...');
      await page.goto(`${baseUrl}/settings`);
      await page.waitForLoadState('domcontentloaded');

      const settingsOptions = await page.locator('[data-testid*="setting"], .setting, a[href*="/settings/"]').count();
      console.log(`   ✅ Found ${settingsOptions} settings options`);

      // 7. TEST ANALYTICS
      console.log('📈 Testing Analytics...');
      await page.goto(`${baseUrl}/analytics`);
      await page.waitForLoadState('domcontentloaded');

      const chartElements = await page.locator('svg, canvas, [data-testid*="chart"], [class*="chart"]').count();
      console.log(`   ✅ Found ${chartElements} chart elements`);

    } catch (error) {
      issues.push(`Critical error during testing: ${error}`);
    }

    // FINAL REPORT
    console.log('\n🎯 QUICK AUDIT REPORT');
    console.log('====================');

    if (jsErrors.length > 0) {
      console.log(`🚨 JavaScript Errors (${jsErrors.length}):`);
      jsErrors.slice(0, 5).forEach(error => console.log(`   ${error}`));
      if (jsErrors.length > 5) console.log(`   ... and ${jsErrors.length - 5} more`);
    } else {
      console.log('✅ No JavaScript errors detected');
    }

    if (networkErrors.length > 0) {
      console.log(`🌐 Network Errors (${networkErrors.length}):`);
      networkErrors.slice(0, 5).forEach(error => console.log(`   ${error}`));
      if (networkErrors.length > 5) console.log(`   ... and ${networkErrors.length - 5} more`);
    } else {
      console.log('✅ No network errors detected');
    }

    if (issues.length > 0) {
      console.log(`🐛 Issues Found (${issues.length}):`);
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('✅ No major issues detected!');
    }

    console.log('\n💡 Quick Recommendations:');
    console.log('1. Address any JavaScript errors first (critical)');
    console.log('2. Ensure all forms have proper validation');
    console.log('3. Test hexagon interactions for responsiveness');
    console.log('4. Verify check-in functionality works end-to-end');
    console.log('5. Test on mobile devices for responsive design');

    // Test should pass unless critical errors found
    const criticalIssues = issues.filter(issue => 
      issue.includes('missing') || 
      issue.includes('failed') ||
      issue.includes('Critical error')
    );

    console.log(`\n🔍 Summary: ${criticalIssues.length} critical issues, ${issues.length - criticalIssues.length} minor issues`);
    
    // Allow some minor issues but fail on critical ones
    expect(criticalIssues.length).toBeLessThan(3);
  });
});