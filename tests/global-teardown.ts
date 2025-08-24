import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Runs once after all test projects complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🏁 AXIS6 Playwright Test Suite completed');
  
  // Optional cleanup tasks
  if (process.env.NODE_ENV === 'test') {
    console.log('🧹 Cleaning up test environment');
  }
}

export default globalTeardown;