import { test, expect, Page } from '@playwright/test';

/**
 * SUB-AGENTE 4: Profile & Settings Comprehensive Audit
 *
 * Specializes in:
 * - Profile page (/profile) complete functionality
 * - Settings page (/settings) preferences and configuration
 * - Form submissions and validations
 * - User data updates and persistence
 * - Configuration changes and storage
 * - Account management features
 *
 * Execution: PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-profile-settings.spec.ts --reporter=line
 */

const REAL_USER_CREDENTIALS = {
  email: 'nadalpiantini@gmail.com',
  password: 'Teclados#13'
};

const BASE_URL = 'https://axis6.app';

interface BugReport {
  agent: string;
  page: string;
  element: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  screenshot?: string;
  networkLogs?: string[];
  consoleErrors?: string[];
  timestamp: string;
  fieldName?: string;
}

class ProfileSettingsAuditor {
  private page: Page;
  private bugs: BugReport[] = [];
  private networkLogs: string[] = [];
  private consoleErrors: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // Monitor network requests
    this.page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('supabase.co') ||
          url.includes('profile') || url.includes('settings') ||
          url.includes('user') || url.includes('preferences')) {
        this.networkLogs.push(`${request.method()} ${url}`);
      }
    });

    // Monitor network responses for errors
    this.page.on('response', response => {
      const url = response.url();
      if ((url.includes('/api/') || url.includes('supabase.co') ||
           url.includes('profile') || url.includes('settings')) &&
          response.status() >= 400) {
        this.networkLogs.push(`❌ ${response.status()} ${response.url()}`);
      }
    });

    // Monitor JavaScript errors
    this.page.on('pageerror', error => {
      this.consoleErrors.push(`Page Error: ${error.message}`);
    });

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push(`Console Error: ${msg.text()}`);
      }
    });
  }

  async login() {
    console.log('🔐 Logging in for Profile & Settings testing...');
    await this.page.goto(`${BASE_URL}/auth/login`);
    await this.page.waitForLoadState('networkidle');

    const emailInput = this.page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = this.page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = this.page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();

    if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
      await emailInput.fill(REAL_USER_CREDENTIALS.email);
      await passwordInput.fill(REAL_USER_CREDENTIALS.password);
      await loginButton.click();
      await this.page.waitForTimeout(5000);

      const currentUrl = this.page.url();
      if (currentUrl.includes('/auth/login')) {
        throw new Error('Login failed - still on login page');
      }
    } else {
      throw new Error('Cannot find login form elements');
    }
  }

  async reportBug(page: string, element: string, issue: string, severity: BugReport['severity'] = 'medium', fieldName?: string) {
    const bugId = this.bugs.length + 1;
    const screenshot = `profile-settings-bug-${bugId}-${page.replace('/', '_')}.png`;

    try {
      await this.page.screenshot({
        path: `test-results/${screenshot}`,
        fullPage: true
      });
    } catch (e) {
      console.log(`⚠️ Could not capture screenshot: ${e}`);
    }

    this.bugs.push({
      agent: 'profile-settings',
      page,
      element,
      issue,
      severity,
      screenshot,
      networkLogs: [...this.networkLogs],
      consoleErrors: [...this.consoleErrors],
      timestamp: new Date().toISOString(),
      fieldName
    });

    const fieldText = fieldName ? ` [${fieldName}]` : '';
    console.log(`🐛 [SUB-AGENT 4] BUG FOUND [${severity.toUpperCase()}]${fieldText} on ${page}: ${issue}`);

    // Clear logs for next test
    this.networkLogs = [];
    this.consoleErrors = [];
  }

  async testFormField(fieldSelector: string, fieldName: string, testValue: string, currentPage: string) {
    console.log(`🔍 Testing field: ${fieldName}`);

    const field = this.page.locator(fieldSelector);
    const fieldCount = await field.count();

    if (fieldCount === 0) {
      await this.reportBug(currentPage, fieldName,
        `Field not found: ${fieldSelector}`, 'medium', fieldName);
      return false;
    }

    const firstField = field.first();

    // Test visibility and interaction
    const isVisible = await firstField.isVisible();
    const isEnabled = await firstField.isEnabled();

    if (!isVisible) {
      await this.reportBug(currentPage, fieldName,
        `Field not visible: ${fieldName}`, 'medium', fieldName);
      return false;
    }

    if (!isEnabled) {
      await this.reportBug(currentPage, fieldName,
        `Field not enabled: ${fieldName}`, 'low', fieldName);
      return false;
    }

    // Test field interaction
    try {
      const tagName = await firstField.evaluate(el => el.tagName);
      const fieldType = await firstField.getAttribute('type');

      // Store initial value
      const initialValue = await firstField.inputValue().catch(() => '');

      if (tagName === 'SELECT') {
        const options = await firstField.locator('option').count();
        if (options > 1) {
          await firstField.selectOption({ index: 1 });
          console.log(`✅ Selected option in ${fieldName}`);
        }
      } else if (tagName === 'INPUT') {
        if (fieldType === 'checkbox' || fieldType === 'radio') {
          await firstField.check();
          console.log(`✅ Checked ${fieldName}`);
        } else {
          await firstField.fill(testValue);
          console.log(`✅ Filled ${fieldName} with "${testValue}"`);
        }
      } else if (tagName === 'TEXTAREA') {
        await firstField.fill(testValue);
        console.log(`✅ Filled textarea ${fieldName}`);
      }

      await this.page.waitForTimeout(500);

      // Check if field value changed (except for checkboxes/radios)
      if (fieldType !== 'checkbox' && fieldType !== 'radio') {
        const newValue = await firstField.inputValue().catch(() => '');
        if (initialValue === newValue && testValue !== initialValue) {
          await this.reportBug(currentPage, fieldName,
            `Field value did not change after input: ${fieldName}`, 'medium', fieldName);
        }
      }

      // Check for immediate validation feedback
      const hasValidationError = await this.page.locator('[role="alert"], .error, [class*="error"]').count() > 0;
      if (hasValidationError) {
        console.log(`ℹ️ Validation error triggered for ${fieldName} (this may be expected)`);
      }

      return true;

    } catch (error) {
      await this.reportBug(currentPage, fieldName,
        `Failed to interact with field: ${error}`, 'medium', fieldName);
      return false;
    }
  }

  async testFormSubmission(formSelector: string, formName: string, currentPage: string) {
    console.log(`📤 Testing form submission: ${formName}`);

    const form = this.page.locator(formSelector);
    const formCount = await form.count();

    if (formCount === 0) {
      await this.reportBug(currentPage, formName,
        `Form not found: ${formSelector}`, 'medium');
      return false;
    }

    // Look for submit button
    const submitButtons = form.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update"), input[type="submit"]');
    const submitCount = await submitButtons.count();

    if (submitCount === 0) {
      await this.reportBug(currentPage, formName,
        'No submit button found in form', 'high');
      return false;
    }

    try {
      const initialNetworkCount = this.networkLogs.length;
      const submitButton = submitButtons.first();

      // Check if button is enabled
      const isEnabled = await submitButton.isEnabled();
      if (!isEnabled) {
        console.log(`ℹ️ Submit button is disabled (may require valid form data)`);
        return false;
      }

      await submitButton.click();
      await this.page.waitForTimeout(3000);

      const finalNetworkCount = this.networkLogs.length;

      if (finalNetworkCount > initialNetworkCount) {
        console.log(`✅ Form submission triggered ${finalNetworkCount - initialNetworkCount} API calls`);
        return true;
      } else {
        await this.reportBug(currentPage, formName,
          'Form submission did not trigger any network requests', 'medium');
        return false;
      }

    } catch (error) {
      await this.reportBug(currentPage, formName,
        `Form submission failed: ${error}`, 'high');
      return false;
    }
  }

  async testNavigationToSettings() {
    console.log('🔗 Testing navigation to settings...');

    // Look for navigation links or buttons to settings
    const settingsNavSelectors = [
      'a[href*="/settings"]',
      'button:has-text("Settings")',
      '[data-testid*="settings"]',
      'nav a:has-text("Settings")',
      'a:has-text("Preferences")',
      '[aria-label*="Settings"]'
    ];

    for (const selector of settingsNavSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();

      if (count > 0 && await elements.first().isVisible()) {
        try {
          await elements.first().click();
          await this.page.waitForTimeout(2000);

          const currentUrl = this.page.url();
          if (currentUrl.includes('/settings')) {
            console.log(`✅ Successfully navigated to settings via: ${selector}`);
            return true;
          }
        } catch (error) {
          console.log(`⚠️ Failed to navigate via ${selector}: ${error}`);
        }
      }
    }

    // If no navigation found, try direct navigation
    await this.page.goto(`${BASE_URL}/settings`);
    await this.page.waitForTimeout(2000);

    const currentUrl = this.page.url();
    if (currentUrl.includes('/settings')) {
      console.log(`✅ Direct navigation to settings successful`);
      return true;
    }

    await this.reportBug('/profile', 'Settings Navigation',
      'Cannot navigate to settings page', 'high');
    return false;
  }

  getBugReport() {
    return {
      agent: 'profile-settings',
      totalBugs: this.bugs.length,
      critical: this.bugs.filter(b => b.severity === 'critical').length,
      high: this.bugs.filter(b => b.severity === 'high').length,
      medium: this.bugs.filter(b => b.severity === 'medium').length,
      low: this.bugs.filter(b => b.severity === 'low').length,
      bugs: this.bugs,
      completedAt: new Date().toISOString()
    };
  }
}

test.describe('SUB-AGENT 4: Profile & Settings Audit', () => {
  let auditor: ProfileSettingsAuditor;

  test.setTimeout(180000); // 3 minutes timeout

  test.beforeEach(async ({ page }) => {
    auditor = new ProfileSettingsAuditor(page);
    await auditor.login();
  });

  test('Profile Page Structure and Access Audit', async ({ page }) => {
    console.log('👤 [SUB-AGENT 4] Starting Profile Page Structure Audit...');

    // Navigate to profile page
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');

    // Verify we're on the profile page
    const currentUrl = page.url();
    if (!currentUrl.includes('/profile')) {
      await auditor.reportBug('/profile', 'Page Access',
        `Failed to access profile page, redirected to: ${currentUrl}`, 'critical');
    }

    // Check for basic profile structure
    const profileElements = [
      { selector: 'main, [data-testid="profile"]', name: 'Main Profile Container' },
      { selector: 'h1, h2, [data-testid*="title"]', name: 'Profile Page Title' },
      { selector: 'form', name: 'Profile Form' },
      { selector: 'input, textarea, select', name: 'Form Fields' }
    ];

    for (const element of profileElements) {
      const found = await page.locator(element.selector).count() > 0;
      if (!found) {
        await auditor.reportBug('/profile', element.name,
          `${element.name} not found`, 'medium');
      } else {
        console.log(`✅ Found ${element.name}`);
      }
    }

    console.log('✅ Profile Page Structure Audit Complete');
  });

  test('Profile Form Fields Comprehensive Test', async ({ page }) => {
    console.log('📝 [SUB-AGENT 4] Starting Profile Form Fields Test...');

    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');

    // Test common profile fields
    const profileFields = [
      { selector: 'input[name="name"], input[name="full_name"], input[name="fullName"]', name: 'Name', testValue: 'Test User Name' },
      { selector: 'input[name="email"], input[type="email"]', name: 'Email', testValue: 'test@example.com' },
      { selector: 'input[name="phone"], input[type="tel"]', name: 'Phone', testValue: '+1234530000' },
      { selector: 'textarea[name="bio"], textarea[name="about"]', name: 'Bio/About', testValue: 'Test bio description' },
      { selector: 'input[name="location"], input[name="city"]', name: 'Location', testValue: 'Test City' },
      { selector: 'input[name="timezone"], select[name="timezone"]', name: 'Timezone', testValue: 'America/New_York' },
      { selector: 'input[type="date"], input[name="birthday"]', name: 'Birthday', testValue: '1990-01-01' }
    ];

    let fieldsTestedSuccessfully = 0;

    for (const field of profileFields) {
      const success = await auditor.testFormField(field.selector, field.name, field.testValue, '/profile');
      if (success) {
        fieldsTestedSuccessfully++;
      }
    }

    console.log(`📊 Successfully tested ${fieldsTestedSuccessfully}/${profileFields.length} profile fields`);

    // Test file upload fields (avatar/profile picture)
    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();

    if (fileInputCount > 0) {
      console.log(`✅ Found ${fileInputCount} file upload fields`);

      // Test file input accessibility
      for (let i = 0; i < fileInputCount; i++) {
        const fileInput = fileInputs.nth(i);
        const isVisible = await fileInput.isVisible();
        const hasLabel = await page.locator(`label[for="${await fileInput.getAttribute('id')}"]`).count() > 0;

        if (!hasLabel) {
          await auditor.reportBug('/profile', 'File Input',
            `File input ${i + 1} missing associated label`, 'low');
        }

        console.log(`✅ File input ${i + 1} - Visible: ${isVisible}, Has Label: ${hasLabel}`);
      }
    }

    console.log('✅ Profile Form Fields Test Complete');
  });

  test('Profile Form Submission and Validation Audit', async ({ page }) => {
    console.log('💾 [SUB-AGENT 4] Starting Profile Form Submission Audit...');

    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');

    // Test form submission
    const formSubmissionSuccess = await auditor.testFormSubmission('form', 'Profile Form', '/profile');

    if (!formSubmissionSuccess) {
      // Try to fill required fields first
      console.log('🔄 Attempting to fill required fields before submission...');

      const requiredFields = page.locator('input[required], textarea[required], select[required]');
      const requiredCount = await requiredFields.count();

      if (requiredCount > 0) {
        console.log(`📋 Found ${requiredCount} required fields`);

        for (let i = 0; i < requiredCount; i++) {
          const field = requiredFields.nth(i);
          const fieldName = await field.getAttribute('name') || `required-field-${i + 1}`;

          try {
            const tagName = await field.evaluate(el => el.tagName);

            if (tagName === 'INPUT') {
              const inputType = await field.getAttribute('type');
              if (inputType === 'email') {
                await field.fill('test@example.com');
              } else if (inputType === 'text') {
                await field.fill('Test Value');
              }
            } else if (tagName === 'TEXTAREA') {
              await field.fill('Test content');
            } else if (tagName === 'SELECT') {
              const options = await field.locator('option').count();
              if (options > 1) {
                await field.selectOption({ index: 1 });
              }
            }

            console.log(`✅ Filled required field: ${fieldName}`);

          } catch (error) {
            console.log(`⚠️ Could not fill required field ${fieldName}: ${error}`);
          }
        }

        // Try submission again
        await auditor.testFormSubmission('form', 'Profile Form (with required fields)', '/profile');
      }
    }

    // Test validation messages
    const validationElements = page.locator('[role="alert"], .error, [class*="error"], .invalid-feedback');
    const validationCount = await validationElements.count();

    if (validationCount > 0) {
      console.log(`✅ Found ${validationCount} validation elements`);

      for (let i = 0; i < Math.min(validationCount, 5); i++) {
        const validation = validationElements.nth(i);
        const isVisible = await validation.isVisible();
        const message = await validation.textContent();

        console.log(`📝 Validation ${i + 1}: Visible=${isVisible}, Message="${message}"`);
      }
    }

    console.log('✅ Profile Form Submission Audit Complete');
  });

  test('Settings Page Structure and Navigation Audit', async ({ page }) => {
    console.log('⚙️ [SUB-AGENT 4] Starting Settings Page Audit...');

    // Try to navigate to settings
    const settingsAccessible = await auditor.testNavigationToSettings();

    if (settingsAccessible) {
      // Check for settings structure
      const settingsElements = [
        { selector: 'main, [data-testid="settings"]', name: 'Main Settings Container' },
        { selector: 'h1, h2, [data-testid*="title"]', name: 'Settings Page Title' },
        { selector: 'form, .settings-section', name: 'Settings Sections' }
      ];

      for (const element of settingsElements) {
        const found = await page.locator(element.selector).count() > 0;
        if (!found) {
          await auditor.reportBug('/settings', element.name,
            `${element.name} not found`, 'medium');
        } else {
          console.log(`✅ Found ${element.name}`);
        }
      }

      // Test settings categories/tabs
      const settingsTabs = page.locator('[role="tab"], .tab, [data-testid*="tab"]');
      const tabCount = await settingsTabs.count();

      if (tabCount > 0) {
        console.log(`✅ Found ${tabCount} settings tabs/categories`);

        for (let i = 0; i < Math.min(tabCount, 5); i++) {
          const tab = settingsTabs.nth(i);
          const tabText = await tab.textContent();

          try {
            await tab.click();
            await page.waitForTimeout(1000);
            console.log(`✅ Successfully clicked tab: ${tabText}`);
          } catch (error) {
            await auditor.reportBug('/settings', 'Settings Tab',
              `Failed to click tab "${tabText}": ${error}`, 'medium');
          }
        }
      }

    } else {
      console.log('⚠️ Settings page not accessible - skipping settings-specific tests');
    }

    console.log('✅ Settings Page Audit Complete');
  });

  test('Settings Configuration Options Audit', async ({ page }) => {
    console.log('🔧 [SUB-AGENT 4] Starting Settings Configuration Audit...');

    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    if (!currentUrl.includes('/settings')) {
      console.log('⚠️ Settings page not accessible - skipping configuration tests');
      return;
    }

    // Test common settings controls
    const settingsControls = [
      { selector: 'input[type="checkbox"]', name: 'Checkboxes', testAction: 'check' },
      { selector: 'input[type="radio"]', name: 'Radio Buttons', testAction: 'check' },
      { selector: 'select', name: 'Dropdowns', testAction: 'select' },
      { selector: '[role="switch"], .toggle, .switch', name: 'Toggle Switches', testAction: 'click' },
      { selector: 'input[type="range"], .slider', name: 'Sliders', testAction: 'fill' }
    ];

    let controlsTestedSuccessfully = 0;

    for (const control of settingsControls) {
      const elements = page.locator(control.selector);
      const count = await elements.count();

      if (count > 0) {
        console.log(`✅ Found ${count} ${control.name}`);

        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i);

          if (await element.isVisible() && await element.isEnabled()) {
            try {
              switch (control.testAction) {
                case 'check':
                  await element.check();
                  break;
                case 'click':
                  await element.click();
                  break;
                case 'select':
                  const options = await element.locator('option').count();
                  if (options > 1) {
                    await element.selectOption({ index: 1 });
                  }
                  break;
                case 'fill':
                  await element.fill('50');
                  break;
              }

              await page.waitForTimeout(500);
              controlsTestedSuccessfully++;
              console.log(`✅ Successfully tested ${control.name} #${i + 1}`);

            } catch (error) {
              await auditor.reportBug('/settings', control.name,
                `Failed to interact with ${control.name} #${i + 1}: ${error}`, 'medium');
            }
          }
        }
      }
    }

    console.log(`📊 Successfully tested ${controlsTestedSuccessfully} settings controls`);

    // Test settings persistence by saving
    const saveButtons = page.locator('button:has-text("Save"), button[type="submit"], button:has-text("Apply")');
    const saveButtonCount = await saveButtons.count();

    if (saveButtonCount > 0) {
      try {
        await saveButtons.first().click();
        await page.waitForTimeout(3000);
        console.log(`✅ Successfully clicked settings save button`);
      } catch (error) {
        await auditor.reportBug('/settings', 'Save Settings',
          `Failed to save settings: ${error}`, 'high');
      }
    }

    console.log('✅ Settings Configuration Audit Complete');
  });

  test('Profile & Settings API Integration Audit', async ({ page }) => {
    console.log('🔗 [SUB-AGENT 4] Starting Profile & Settings API Audit...');

    const apiCalls: { url: string; method: string; status: number; }[] = [];

    // Monitor all API calls
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('supabase.co')) {
        apiCalls.push({
          url,
          method: response.request().method(),
          status: response.status()
        });
      }
    });

    // Test profile page API calls
    await page.goto(`${BASE_URL}/profile`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test a form field change
    const nameInput = page.locator('input[name="name"], input[name="full_name"]').first();
    if (await nameInput.count() > 0 && await nameInput.isVisible()) {
      await nameInput.fill('API Test Name');
      await page.waitForTimeout(1000);
    }

    // Test settings page API calls
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Analyze API calls
    console.log(`📊 Profile & Settings API Analysis (Total calls: ${apiCalls.length})`);

    const errorCalls = apiCalls.filter(call => call.status >= 400);
    const successCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);

    console.log(`✅ Successful API calls: ${successCalls.length}`);
    console.log(`❌ Failed API calls: ${errorCalls.length}`);

    if (errorCalls.length > 0) {
      errorCalls.forEach(call => {
        console.log(`🚨 API Error: ${call.method} ${call.url} - Status: ${call.status}`);
      });

      await auditor.reportBug('/profile', 'API Integration',
        `${errorCalls.length} API calls failed during profile/settings interactions`, 'high');
    }

    // Check for expected API endpoints
    const expectedEndpoints = ['profile', 'user', 'settings', 'preferences'];
    const calledEndpoints = apiCalls.map(call => {
      const url = new URL(call.url);
      return url.pathname;
    });

    for (const expectedEndpoint of expectedEndpoints) {
      const endpointCalled = calledEndpoints.some(path => path.includes(expectedEndpoint));
      if (endpointCalled) {
        console.log(`✅ API endpoint '${expectedEndpoint}' was called`);
      } else {
        console.log(`ℹ️ API endpoint '${expectedEndpoint}' was not called`);
      }
    }

    console.log('✅ Profile & Settings API Audit Complete');
  });

  test.afterAll(async () => {
    const report = auditor.getBugReport();

    console.log('\n🎯 [SUB-AGENT 4] PROFILE & SETTINGS AUDIT COMPLETE!');
    console.log('=====================================');
    console.log(`📊 Total Issues Found: ${report.totalBugs}`);
    console.log(`🔴 Critical: ${report.critical}`);
    console.log(`🟠 High: ${report.high}`);
    console.log(`🟡 Medium: ${report.medium}`);
    console.log(`🟢 Low: ${report.low}`);
    console.log('=====================================');

    // Output JSON report for orchestrator
    console.log('\n📄 JSON REPORT FOR ORCHESTRATOR:');
    console.log(JSON.stringify(report, null, 2));

    if (report.bugs.length > 0) {
      console.log('\n🐛 DETAILED BUG REPORT:');
      report.bugs.forEach((bug, index) => {
        const fieldText = bug.fieldName ? ` [${bug.fieldName}]` : '';
        console.log(`\n${index + 1}. [${bug.severity.toUpperCase()}]${fieldText} ${bug.page}`);
        console.log(`   Element: ${bug.element}`);
        console.log(`   Issue: ${bug.issue}`);
        console.log(`   Screenshot: ${bug.screenshot}`);
        if (bug.consoleErrors && bug.consoleErrors.length > 0) {
          console.log(`   Console Errors: ${bug.consoleErrors.join(', ')}`);
        }
      });
    } else {
      console.log('\n🎉 NO BUGS FOUND IN PROFILE & SETTINGS!');
    }

    console.log('\n✅ Sub-Agent 4 reporting complete to orchestrator');
  });
});
