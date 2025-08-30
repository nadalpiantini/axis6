import { test as base, expect } from '@playwright/test';
import {
  LandingPage,
  LoginPage,
  RegisterPage,
  DashboardPage,
  ProfilePage,
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
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',
  testTimeout: 30000,
  slowTestTimeout: 60000
} as const;

// Test fixtures with page objects
type TestFixtures = {
  landingPage: LandingPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  dashboardPage: DashboardPage;
  profilePage: ProfilePage;
  testUtils: TestUtils;
  authenticatedPage: DashboardPage; // Add authenticatedPage fixture
  utils: TestUtils; // Add utils fixture
  testUser: {
    email: string;
    password: string;
    name: string;
  };
};

export const test = base.extend<TestFixtures>({
  landingPage: async ({ page }, use) => {
    const landingPage = new LandingPage(page);
    await use(landingPage);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  registerPage: async ({ page }, use) => {
    const registerPage = new RegisterPage(page);
    await use(registerPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  profilePage: async ({ page }, use) => {
    const profilePage = new ProfilePage(page);
    await use(profilePage);
  },

  testUtils: async ({ page }, use) => {
    const testUtils = new TestUtils(page);
    await use(testUtils);
  },

  // Add authenticatedPage fixture - an authenticated dashboard page
  authenticatedPage: async ({ page, testUser }, use) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login the user
    await loginPage.loginUser(testUser.email, testUser.password);

    // Navigate to dashboard and verify it's loaded
    await dashboardPage.goto('/dashboard');
    await dashboardPage.verifyDashboardLoaded();

    await use(dashboardPage);
  },

  // Add utils fixture - alias for testUtils
  utils: async ({ page }, use) => {
    const testUtils = new TestUtils(page);
    await use(testUtils);
  },

  testUser: async ({}, use) => {
    // Generate unique test user for each test
    const testUser = {
      email: TestUtils.generateTestEmail(),
      password: TestUtils.generateTestPassword(),
      name: `Test User ${Date.now()}`
    };
    await use(testUser);
  }
});

export { expect };
