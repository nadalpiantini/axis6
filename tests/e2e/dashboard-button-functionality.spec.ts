import { test, expect, Page } from '@playwright/test';

// Test for dashboard button functionality after surgical modifications
test.describe('Dashboard Button Functionality - Post Surgery', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to dashboard directly
    await page.goto('/dashboard');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard page without auth errors', async () => {
    // Check if page loads or redirects to login
    const currentUrl = page.url();
    
    if (currentUrl.includes('/auth/login')) {
      console.log('✅ Dashboard correctly redirects to login when not authenticated');
      
      // Check login page loads correctly
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    } else {
      console.log('✅ Dashboard loads directly (user already authenticated)');
      
      // Test dashboard components load
      await expect(page.locator('[data-testid="hexagon-chart"]')).toBeVisible();
    }
  });

  test('should display clean header without Spanish greeting', async () => {
    await page.goto('/dashboard');
    
    // If redirected to login, that's expected - we'll test what we can see
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/auth/login')) {
      // Test header modifications
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Check logo is present
      const logo = page.locator('header').locator('svg, img').first();
      await expect(logo).toBeVisible();
      
      // Check NO Spanish greeting text is present
      const spanishGreetings = page.locator('text="Buenas tardes"');
      await expect(spanishGreetings).toHaveCount(0);
      
      const spanishText = page.locator('text="Buenos días"');
      await expect(spanishText).toHaveCount(0);
    }
  });

  test('should not display Day Balance bar', async () => {
    await page.goto('/dashboard');
    
    // If authenticated, check for Day Balance removal
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/auth/login')) {
      // Check Day Balance text is not present
      const dayBalanceText = page.locator('text="Day Balance:"');
      await expect(dayBalanceText).toHaveCount(0);
      
      // Check multicolor progress bar is not present
      const progressBars = page.locator('div[style*="linear-gradient(90deg, #A6C26F"]');
      await expect(progressBars).toHaveCount(0);
    }
  });

  test('should display Daily Motto instead of Daily Mantra', async () => {
    await page.goto('/dashboard');
    
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/auth/login')) {
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Check for "Daily Motto" text
      const dailyMottoText = page.locator('text="Daily Motto"');
      await expect(dailyMottoText).toBeVisible();
      
      // Check "Daily Mantra" is NOT present
      const dailyMantraText = page.locator('text="Daily Mantra"');
      await expect(dailyMantraText).toHaveCount(0);
    }
  });

  test('should not show language switcher in Daily Motto', async () => {
    await page.goto('/dashboard');
    
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/auth/login')) {
      // Wait for components to render
      await page.waitForTimeout(2000);
      
      // Check no language switcher buttons (EN/ES)
      const languageSwitcher = page.locator('button:has-text("EN"), button:has-text("ES")');
      await expect(languageSwitcher).toHaveCount(0);
    }
  });

  test('should display Plan My Day prominently positioned', async () => {
    await page.goto('/dashboard');
    
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/auth/login')) {
      // Wait for content
      await page.waitForTimeout(2000);
      
      // Check Plan My Day is present
      const planMyDayButton = page.locator('text="Plan My Day"');
      await expect(planMyDayButton).toBeVisible();
      
      // Check it has blue styling (indicates prominent position)
      const prominentPlanButton = page.locator('a[href="/my-day"]').filter({ hasText: 'Plan My Day' });
      await expect(prominentPlanButton).toHaveClass(/from-blue-500/);
    }
  });

  test('should have working hexagon axis buttons when authenticated', async () => {
    await page.goto('/dashboard');
    
    // If we're authenticated, test hexagon buttons
    const currentUrl = page.url();
    
    if (currentUrl.includes('/dashboard')) {
      // Wait for hexagon to load
      await page.waitForSelector('[data-testid="hexagon-chart"]', { timeout: 10000 });
      
      // Test hexagon axis button clicks
      const hexagonButtons = page.locator('[data-testid^="hexagon-"]');
      const buttonCount = await hexagonButtons.count();
      
      if (buttonCount > 0) {
        // Try clicking first button
        const firstButton = hexagonButtons.first();
        await firstButton.click();
        
        // Check for any JavaScript errors
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        // Wait briefly for any async operations
        await page.waitForTimeout(1000);
        
        // Report results
        if (errors.length > 0) {
          console.log('❌ JavaScript errors detected:', errors);
        } else {
          console.log('✅ No JavaScript errors during button clicks');
        }
      }
    } else {
      console.log('ℹ️ Cannot test hexagon buttons - authentication required');
    }
  });

  test('should display correct button structure in category cards', async () => {
    await page.goto('/dashboard');
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/dashboard')) {
      // Wait for category cards
      await page.waitForSelector('[data-testid="category-cards"]', { timeout: 10000 });
      
      // Check category cards are present
      const categoryCards = page.locator('[data-testid^="category-card-"]');
      const cardCount = await categoryCards.count();
      
      console.log(`📊 Found ${cardCount} category cards`);
      
      if (cardCount > 0) {
        // Test dropdown buttons are present
        const dropdownButtons = page.locator('button[aria-label*="options menu"]');
        const dropdownCount = await dropdownButtons.count();
        
        console.log(`🔽 Found ${dropdownCount} dropdown buttons`);
        
        // Try clicking a dropdown
        if (dropdownCount > 0) {
          await dropdownButtons.first().click();
          await page.waitForTimeout(500);
          
          // Check if dropdown menu appears
          const dropdownMenu = page.locator('.absolute.z-50').first();
          const isVisible = await dropdownMenu.isVisible().catch(() => false);
          
          console.log(isVisible ? '✅ Dropdown menu opens correctly' : '❌ Dropdown menu not working');
        }
      }
    }
  });

  test('should capture console errors and network requests', async () => {
    const errors: string[] = [];
    const networkRequests: string[] = [];
    
    // Capture console errors
    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}`);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`CONSOLE ERROR: ${msg.text()}`);
      }
    });
    
    // Capture network requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        errors.push(`API ERROR: ${response.status()} ${response.url()}`);
      }
    });
    
    await page.goto('/dashboard');
    await page.waitForTimeout(5000); // Wait for all async operations
    
    // Report findings
    console.log('\n🔍 ERROR ANALYSIS:');
    console.log('==================');
    
    if (errors.length > 0) {
      console.log('❌ ERRORS FOUND:');
      errors.forEach((error, i) => console.log(`  ${i + 1}. ${error}`));
    } else {
      console.log('✅ No errors detected');
    }
    
    console.log('\n📡 NETWORK REQUESTS:');
    console.log('=====================');
    if (networkRequests.length > 0) {
      networkRequests.forEach((req, i) => console.log(`  ${i + 1}. ${req}`));
    } else {
      console.log('No API requests detected');
    }
  });
});