import { test, expect } from '../fixtures/auth-fixtures';

test.describe('Profile Page Tests', () => {

  test.describe('Authentication Requirements', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      // Try to access profile page without authentication
      await page.goto('/profile');

      // Should redirect to login page
      await expect(page).toHaveURL(/.*\/auth\/login/);
    });
  });

  test.describe('Authenticated Profile Access', () => {
    test('should load profile page with authenticated user', async ({
      registerPage,
      dashboardPage,
      page,
      testUser
    }) => {
      // Register and authenticate user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);

      // Wait for successful registration/login
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);

      // Navigate to profile page
      await page.goto('/profile');

      // Should not redirect to login
      await expect(page).not.toHaveURL(/.*\/auth\/login/);

      // Should show profile page content
      await expect(page.locator('h1', { hasText: 'My Profile' })).toBeVisible({ timeout: 10000 });

      // Should show user email
      await expect(page.locator('text=' + testUser.email)).toBeVisible();
    });

    test('should display user statistics section', async ({
      registerPage,
      page,
      testUser
    }) => {
      // Register user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);

      // Go to profile
      await page.goto('/profile');

      // Wait for profile to load
      await expect(page.locator('h1', { hasText: 'My Profile' })).toBeVisible();

      // Should show statistics section
      await expect(page.locator('text=Your Statistics')).toBeVisible();
      await expect(page.locator('text=Current Streak')).toBeVisible();
      await expect(page.locator('text=Longest Streak')).toBeVisible();
      await expect(page.locator('text=Total Check-ins')).toBeVisible();
    });
  });

  test.describe('Profile Functionality', () => {
    test('should allow editing user name', async ({
      registerPage,
      page,
      testUser
    }) => {
      // Register user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);

      // Go to profile
      await page.goto('/profile');
      await expect(page.locator('h1', { hasText: 'My Profile' })).toBeVisible();

      // Find and click edit button for name
      const editButton = page.locator('button').filter({ hasText: /edit/i }).first();

      // Wait for edit button to be visible
      await expect(editButton).toBeVisible({ timeout: 5000 });
      await editButton.click();

      // Should show input field
      const nameInput = page.locator('input[type="text"]').first();
      await expect(nameInput).toBeVisible();

      // Edit the name
      const newName = 'Updated Test User';
      await nameInput.clear();
      await nameInput.fill(newName);

      // Save changes
      const saveButton = page.locator('button').filter({ hasText: /save/i }).first();
      await saveButton.click();

      // Should show updated name
      await expect(page.locator('text=' + newName)).toBeVisible();
    });

    test('should show psychological profile section', async ({
      registerPage,
      page,
      testUser
    }) => {
      // Register user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);

      // Go to profile
      await page.goto('/profile');
      await expect(page.locator('h1', { hasText: 'My Profile' })).toBeVisible();

      // Should show psychological profile section
      await expect(page.locator('text=Psychological Profile')).toBeVisible();

      // Should show assessment button if no profile exists
      const assessmentButton = page.locator('button', { hasText: /Take Personality Assessment/i });
      await expect(assessmentButton).toBeVisible();
    });

    test('should have working logout functionality', async ({
      registerPage,
      page,
      testUser
    }) => {
      // Register user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);

      // Go to profile
      await page.goto('/profile');
      await expect(page.locator('h1', { hasText: 'My Profile' })).toBeVisible();

      // Click logout button
      const logoutButton = page.locator('button[aria-label="Sign out"]');
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();

      // Should redirect to login page
      await expect(page).toHaveURL(/.*\/auth\/login/);
    });
  });

  test.describe('Profile Navigation', () => {
    test('should have working back to dashboard link', async ({
      registerPage,
      page,
      testUser
    }) => {
      // Register user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);

      // Go to profile
      await page.goto('/profile');
      await expect(page.locator('h1', { hasText: 'My Profile' })).toBeVisible();

      // Click back to dashboard
      const backButton = page.locator('a[href="/dashboard"]').first();
      await expect(backButton).toBeVisible();
      await backButton.click();

      // Should navigate to dashboard
      await expect(page).toHaveURL(/.*\/dashboard/);
    });

    test('should have working settings link', async ({
      registerPage,
      page,
      testUser
    }) => {
      // Register user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);

      // Go to profile
      await page.goto('/profile');
      await expect(page.locator('h1', { hasText: 'My Profile' })).toBeVisible();

      // Click settings link
      const settingsButton = page.locator('a[href="/settings"]').first();
      await expect(settingsButton).toBeVisible();
      await settingsButton.click();

      // Should navigate to settings page
      await expect(page).toHaveURL(/.*\/settings/);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle loading states gracefully', async ({
      registerPage,
      page,
      testUser
    }) => {
      // Register user
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);
      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);

      // Navigate to profile
      await page.goto('/profile');

      // Should not show indefinite loading
      // Wait for either the profile content or an error message
      await Promise.race([
        expect(page.locator('h1', { hasText: 'My Profile' })).toBeVisible({ timeout: 10000 }),
        expect(page.locator('text=Loading profile')).toBeVisible({ timeout: 10000 })
      ]);

      // After loading, should show content
      await expect(page.locator('h1', { hasText: 'My Profile' })).toBeVisible({ timeout: 15000 });
    });
  });
});
