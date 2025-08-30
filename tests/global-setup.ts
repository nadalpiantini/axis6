import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Runs once before all test projects
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting AXIS6 Playwright Test Suite');

  // Validate environment variables
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  console.log(`📍 Testing against: ${baseURL}`);

  // Optional: Create test user account if needed for production testing
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Running tests against production environment');
  }

  // Optional: Warm up the server
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    await browser.close();
    console.log('✅ Server warmup completed');
  } catch (error) {
    console.warn('⚠️  Server warmup failed:', error);
  }
}

export default globalSetup;
