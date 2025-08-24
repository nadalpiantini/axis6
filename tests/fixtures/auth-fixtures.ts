import { test as base } from '@playwright/test';
import { 
  LandingPage, 
  LoginPage, 
  RegisterPage, 
  DashboardPage, 
  TestUtils 
} from '../utils/page-objects';

// Test user data
export const TEST_USERS = {
  valid: {
    email: 'test-user@axis6-playwright.local',
    password: 'TestPass123!',
    name: 'Test User'
  },
  invalid: {
    email: 'invalid-email',
    password: '123',
    name: ''
  }
} as const;

// Environment-specific configuration
export const TEST_CONFIG = {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:6789',
  isProduction: process.env.NODE_ENV === 'production',
  testTimeout: 30000,
  slowTestTimeout: 60000
} as const;

// Extend base test with page objects
type TestFixtures = {
  landingPage: LandingPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  dashboardPage: DashboardPage;
  utils: typeof TestUtils;
  testUser: { email: string; password: string; name: string };
  authenticatedPage: DashboardPage;
};

export const test = base.extend<TestFixtures>({
  // Landing page fixture
  landingPage: async ({ page }, use) => {
    const landingPage = new LandingPage(page);
    await use(landingPage);
  },
  
  // Login page fixture
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  
  // Register page fixture
  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },
  
  // Dashboard page fixture
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
  
  // Utils fixture
  utils: async ({}, use) => {
    await use(TestUtils);
  },
  
  // Test user fixture - generates unique user for each test
  testUser: async ({}, use) => {
    const testUser = {
      email: TestUtils.generateTestEmail(),
      password: TestUtils.generateTestPassword(),
      name: `Test User ${Date.now()}`
    };
    await use(testUser);
  },
  
  // Authenticated page fixture - logs user in automatically
  authenticatedPage: async ({ page, testUser }, use) => {
    // Navigate to registration page and create account
    const registerPage = new RegisterPage(page);
    await registerPage.goto('/auth/register');
    await registerPage.register(testUser.email, testUser.password, testUser.name);
    
    // Wait for navigation to either onboarding or dashboard
    await page.waitForURL(/\/(dashboard|auth\/onboarding)/, { timeout: 15000 });
    
    // Handle onboarding if present
    if (page.url().includes('onboarding')) {
      // Skip onboarding by navigating directly to dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    // Verify we're logged in and on dashboard
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verifyDashboardLoaded();
    
    await use(dashboardPage);
  }
});

export { expect } from '@playwright/test';