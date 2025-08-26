import { test, expect } from '@playwright/test';

test.describe('Dashboard Error Check', () => {
  test('should not have JavaScript initialization errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Listen for page errors (uncaught exceptions)
    page.on('pageerror', err => {
      errors.push(err.toString());
    });
    
    // Go directly to the landing page
    await page.goto('/');
    
    // Check for any JavaScript errors
    expect(errors.filter(e => 
      e.includes('Cannot access') || 
      e.includes('before initialization') ||
      e.includes('ReferenceError')
    )).toHaveLength(0);
    
    console.log('✅ No JavaScript initialization errors found on landing page');
    
    // If we can, try to access dashboard (will redirect to login if not authenticated)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    
    // Check for errors again
    expect(errors.filter(e => 
      e.includes('Cannot access') || 
      e.includes('before initialization') ||
      e.includes('ReferenceError')
    )).toHaveLength(0);
    
    console.log('✅ No JavaScript initialization errors found on dashboard redirect');
  });
});