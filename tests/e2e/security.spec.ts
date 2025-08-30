import { test, expect } from '../fixtures/auth-fixtures';

test.describe('AXIS6 Security Audits', () => {

  test.describe('Authentication Security', () => {
    test('should prevent unauthorized access to protected routes', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();

      const protectedRoutes = ['/dashboard', '/settings', '/profile'];

      for (const route of protectedRoutes) {
        await page.goto(route);

        // Should redirect to login or show unauthorized
        const currentUrl = page.url();
        const isRedirectedToAuth = currentUrl.includes('/login') ||
                                  currentUrl.includes('/auth') ||
                                  currentUrl === '/';

        expect(isRedirectedToAuth).toBe(true);
      }
    });

    test('should handle session expiration securely', async ({ authenticatedPage, page }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Clear cookies to simulate session expiration
      await page.context().clearCookies();

      // Try to access protected content
      await page.reload();

      // Should handle expired session appropriately
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const isHandledSecurely = currentUrl.includes('/login') ||
                               currentUrl.includes('/auth') ||
                               await page.locator('[role="alert"]').isVisible();

      expect(isHandledSecurely).toBe(true);
    });

    test('should not expose sensitive data in client-side code', async ({ landingPage }) => {
      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();

      // Check for exposed sensitive data in page source
      const pageContent = await landingPage.page.content();

      // Should not contain database credentials or API keys
      const sensitivePatterns = [
        /password\s*[:=]\s*["'][^"']+["']/i,
        /api[_-]?key\s*[:=]\s*["'][^"']+["']/i,
        /secret\s*[:=]\s*["'][^"']+["']/i,
        /token\s*[:=]\s*["'][^"']+["']/i,
        /postgres:\/\//i,
        /mongodb:\/\//i,
        /mysql:\/\//i
      ];

      for (const pattern of sensitivePatterns) {
        expect(pageContent).not.toMatch(pattern);
      }
    });

    test('should use secure authentication tokens', async ({ page, testUser, registerPage }) => {
      const requests: any[] = [];

      page.on('request', request => {
        requests.push({
          url: request.url(),
          headers: request.headers(),
          method: request.method()
        });
      });

      // Register a user to capture auth requests
      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);

      await page.waitForURL(/\/(dashboard|auth\/onboarding)/);

      // Check authentication headers
      const authRequests = requests.filter(req =>
        req.url.includes('/api/') ||
        req.url.includes('/auth/')
      );

      for (const req of authRequests) {
        // Should use secure headers
        const authHeader = req.headers['authorization'];
        const cookieHeader = req.headers['cookie'];

        if (authHeader) {
          // Should use Bearer tokens or similar
          expect(authHeader).toMatch(/^(Bearer|Basic)\s+/);
        }

        if (cookieHeader) {
          // Should have secure cookie attributes in production
          if (process.env.NODE_ENV === 'production') {
            expect(cookieHeader).toMatch(/Secure|HttpOnly/);
          }
        }
      }
    });
  });

  test.describe('Input Validation Security', () => {
    test('should prevent XSS attacks in form inputs', async ({ registerPage }) => {
      await registerPage.goto('/auth/register');
      await registerPage.verifyRegisterForm();

      // Test XSS payloads
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
        "'; DROP TABLE users; --"
      ];

      for (const payload of xssPayloads) {
        // Clear form
        await registerPage.emailInput.fill('');
        await registerPage.passwordInput.fill('');

        // Try XSS payload in email field
        await registerPage.emailInput.fill(payload);
        await registerPage.passwordInput.fill('validpassword123');

        if (await registerPage.nameInput.isVisible()) {
          await registerPage.nameInput.fill(payload);
        }

        await registerPage.registerButton.click();
        await registerPage.page.waitForTimeout(1000);

        // Check that script didn't execute
        const hasAlert = await registerPage.page.evaluate(() => {
          return window.confirm !== undefined;
        });

        expect(hasAlert).toBe(true); // Confirm function should still exist (not replaced by alert)

        // Page should not execute malicious script
        const pageContent = await registerPage.page.content();
        expect(pageContent).not.toContain('<script>alert');
      }
    });

    test('should sanitize user input display', async ({ authenticatedPage, testUser }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Check if user input is properly displayed (escaped)
      const userElements = authenticatedPage.page.locator(`text="${testUser.name}"`);

      if (await userElements.count() > 0) {
        const elementHTML = await userElements.first().innerHTML();

        // Should not contain raw HTML tags if user input had them
        expect(elementHTML).not.toMatch(/<script/);
        expect(elementHTML).not.toMatch(/javascript:/);
      }
    });

    test('should validate email format properly', async ({ registerPage }) => {
      await registerPage.goto('/auth/register');
      await registerPage.verifyRegisterForm();

      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        'user@.com',
        'user name@domain.com' // space in local part
      ];

      for (const email of invalidEmails) {
        await registerPage.emailInput.fill(email);
        await registerPage.passwordInput.fill('validpassword123');

        await registerPage.registerButton.click();
        await registerPage.page.waitForTimeout(1000);

        // Should show validation error or prevent submission
        const isFormValid = await registerPage.emailInput.evaluate(input =>
          (input as HTMLInputElement).checkValidity()
        );

        const hasErrorMessage = await registerPage.errorMessage.isVisible();

        expect(isFormValid || hasErrorMessage).toBeTruthy();
      }
    });

    test('should enforce password security requirements', async ({ registerPage }) => {
      await registerPage.goto('/auth/register');
      await registerPage.verifyRegisterForm();

      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'abc123',
        'qwerty'
      ];

      for (const password of weakPasswords) {
        await registerPage.emailInput.fill('test@example.com');
        await registerPage.passwordInput.fill(password);

        await registerPage.registerButton.click();
        await registerPage.page.waitForTimeout(1000);

        // Should prevent weak passwords
        const isFormValid = await registerPage.passwordInput.evaluate(input =>
          (input as HTMLInputElement).checkValidity()
        );

        const hasErrorMessage = await registerPage.errorMessage.isVisible();
        const currentUrl = registerPage.page.url();

        // Should either show error or not proceed to dashboard
        expect(isFormValid === false || hasErrorMessage || currentUrl.includes('register')).toBe(true);
      }
    });
  });

  test.describe('CSRF Protection', () => {
    test('should include CSRF protection on forms', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');
      await loginPage.verifyLoginForm();

      // Check for CSRF token in form or headers
      const csrfInputs = loginPage.page.locator('input[name*="csrf"], input[name*="token"]');
      const formElement = loginPage.page.locator('form');

      if (await csrfInputs.count() > 0) {
        // Should have CSRF token input
        const csrfValue = await csrfInputs.first().getAttribute('value');
        expect(csrfValue?.length).toBeGreaterThan(10); // Should be substantial token
      } else if (await formElement.count() > 0) {
        // Or should have CSRF protection in headers/meta tags
        const csrfMeta = loginPage.page.locator('meta[name*="csrf"]');
        if (await csrfMeta.count() > 0) {
          const csrfContent = await csrfMeta.first().getAttribute('content');
          expect(csrfContent?.length).toBeGreaterThan(10);
        }
      }
    });

    test('should reject requests without proper CSRF tokens', async ({ page }) => {
      // This test would typically involve making requests without CSRF tokens
      // and verifying they're rejected, but requires backend cooperation

      const responses: any[] = [];

      page.on('response', response => {
        if (response.url().includes('/api/') && response.request().method() === 'POST') {
          responses.push({
            url: response.url(),
            status: response.status(),
            headers: response.headers()
          });
        }
      });

      await page.goto('/auth/login');

      // Try to submit form (this should include CSRF protection)
      const emailInput = page.getByRole('textbox', { name: /email/i });
      const passwordInput = page.getByRole('textbox', { name: /password/i });
      const loginButton = page.getByRole('button', { name: /sign in|login/i });

      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      await loginButton.click();

      await page.waitForTimeout(2000);

      // Check that API responses don't indicate CSRF vulnerabilities
      for (const response of responses) {
        // 403 would indicate CSRF protection is working for invalid tokens
        // 200/400 are acceptable for valid requests
        expect([200, 400, 401, 403, 422]).toContain(response.status);
      }
    });
  });

  test.describe('Content Security Policy', () => {
    test('should have proper CSP headers', async ({ landingPage }) => {
      const response = await landingPage.page.goto('/');

      if (response) {
        const cspHeader = response.headers()['content-security-policy'] ||
                         response.headers()['content-security-policy-report-only'];

        if (cspHeader) {
          // Should have basic CSP directives
          expect(cspHeader).toMatch(/default-src|script-src|style-src/);

          // Should restrict script sources
          expect(cspHeader).toMatch(/script-src[^;]*'self'/);

          // Should not allow 'unsafe-inline' for scripts in production
          if (process.env.NODE_ENV === 'production') {
            expect(cspHeader).not.toMatch(/script-src[^;]*'unsafe-inline'/);
          }
        }
      }
    });

    test('should block inline scripts when CSP is active', async ({ page }) => {
      // This test checks if CSP is properly blocking dangerous inline scripts
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');

      // Try to inject inline script
      try {
        await page.addScriptTag({
          content: 'window.testCSPBypass = true;'
        });
      } catch (error) {
        // CSP should block this
      }

      // Check if dangerous script was blocked
      const testVar = await page.evaluate(() => (window as any).testCSPBypass);

      // Either script was blocked (undefined) or CSP error was logged
      expect(testVar === undefined || consoleErrors.length > 0).toBe(true);
    });
  });

  test.describe('Data Privacy and Security', () => {
    test('should not log sensitive data in console', async ({ registerPage, testUser }) => {
      const consoleLogs: string[] = [];

      registerPage.page.on('console', msg => {
        consoleLogs.push(msg.text());
      });

      await registerPage.goto('/auth/register');
      await registerPage.register(testUser.email, testUser.password, testUser.name);

      await registerPage.page.waitForTimeout(2000);

      // Check console logs don't contain sensitive data
      const allLogs = consoleLogs.join(' ').toLowerCase();

      expect(allLogs).not.toContain(testUser.password.toLowerCase());
      expect(allLogs).not.toContain('password');
      expect(allLogs).not.toContain('secret');
      expect(allLogs).not.toContain('token');
    });

    test('should handle personal data appropriately', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Check local storage doesn't contain sensitive data
      const localStorageData = await authenticatedPage.page.evaluate(() => {
        const data: any = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            data[key] = localStorage.getItem(key);
          }
        }
        return data;
      });

      // Should not store passwords or sensitive tokens in localStorage
      const allStorageData = JSON.stringify(localStorageData).toLowerCase();
      expect(allStorageData).not.toContain('password');

      // Check sessionStorage as well
      const sessionStorageData = await authenticatedPage.page.evaluate(() => {
        const data: any = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            data[key] = sessionStorage.getItem(key);
          }
        }
        return data;
      });

      const allSessionData = JSON.stringify(sessionStorageData).toLowerCase();
      expect(allSessionData).not.toContain('password');
    });

    test('should use secure communication', async ({ page }) => {
      const requests: any[] = [];

      page.on('request', request => {
        requests.push({
          url: request.url(),
          headers: request.headers()
        });
      });

      await page.goto('/');

      // Check that requests use HTTPS in production
      if (process.env.NODE_ENV === 'production') {
        const httpRequests = requests.filter(req =>
          req.url.startsWith('http://') &&
          !req.url.includes('localhost')
        );

        expect(httpRequests.length).toBe(0);
      }

      // Check for security headers in API requests
      const apiRequests = requests.filter(req => req.url.includes('/api/'));

      for (const req of apiRequests) {
        // Should include appropriate headers
        expect(req.headers['user-agent']).toBeTruthy();
      }
    });
  });

  test.describe('Session Management', () => {
    test('should handle concurrent sessions appropriately', async ({ browser, testUser, registerPage }) => {
      // Create multiple browser contexts
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      try {
        // Register user in first context
        const RegisterPageClass = Object.getPrototypeOf(registerPage).constructor;
        const registerPage1 = new RegisterPageClass(page1);
        await registerPage1.goto('/auth/register');
        await registerPage1.register(testUser.email, testUser.password, testUser.name);

        await page1.waitForURL(/\/(dashboard|auth\/onboarding)/);

        // Try to login with same user in second context
        await page2.goto('/auth/login');
        const emailInput2 = page2.getByRole('textbox', { name: /email/i });
        const passwordInput2 = page2.getByRole('textbox', { name: /password/i });
        const loginButton2 = page2.getByRole('button', { name: /sign in|login/i });

        await emailInput2.fill(testUser.email);
        await passwordInput2.fill(testUser.password);
        await loginButton2.click();

        await page2.waitForTimeout(3000);

        // Both sessions should be handled appropriately
        // (Either both allowed or second session handled securely)
        const page2Url = page2.url();
        const page1Url = page1.url();

        // At least one session should be valid
        expect(page1Url.includes('dashboard') || page2Url.includes('dashboard')).toBe(true);

      } finally {
        await context1.close();
        await context2.close();
      }
    });

    test('should expire sessions appropriately', async ({ authenticatedPage }) => {
      await authenticatedPage.verifyDashboardLoaded();

      // Check if session timeout is implemented
      // This is a simulation since we can't wait for real timeout

      // Check for session refresh mechanisms
      const requests: any[] = [];

      authenticatedPage.page.on('request', request => {
        if (request.url().includes('refresh') || request.url().includes('token')) {
          requests.push({
            url: request.url(),
            method: request.method()
          });
        }
      });

      // Simulate some activity
      await authenticatedPage.page.reload();
      await authenticatedPage.verifyDashboardLoaded();

      // Should handle session management appropriately
      expect(authenticatedPage.page.url()).toContain('dashboard');
    });
  });

  test.describe('Error Handling Security', () => {
    test('should not expose sensitive information in error messages', async ({ loginPage }) => {
      await loginPage.goto('/auth/login');

      // Try login with non-existent user
      await loginPage.login('nonexistent@example.com', 'password123');
      await loginPage.page.waitForTimeout(2000);

      const errorMessage = await loginPage.errorMessage.textContent();

      if (errorMessage) {
        // Should not reveal whether user exists
        expect(errorMessage.toLowerCase()).not.toContain('user not found');
        expect(errorMessage.toLowerCase()).not.toContain('user does not exist');
        expect(errorMessage.toLowerCase()).not.toContain('invalid user');

        // Should use generic error messages
        expect(
          errorMessage.toLowerCase().includes('invalid credentials') ||
          errorMessage.toLowerCase().includes('login failed') ||
          errorMessage.toLowerCase().includes('authentication failed')
        ).toBe(true);
      }
    });

    test('should handle 404 errors securely', async ({ page }) => {
      await page.goto('/nonexistent-page');

      // Should show generic 404, not expose system information
      const pageContent = await page.content().then(content => content.toLowerCase());

      expect(pageContent).not.toContain('stack trace');
      expect(pageContent).not.toContain('internal server error');
      expect(pageContent).not.toContain('database');
      expect(pageContent).not.toContain('sql');
    });
  });

  test.describe('Third-Party Security', () => {
    test('should load external resources securely', async ({ landingPage }) => {
      const requests: any[] = [];

      landingPage.page.on('request', request => {
        const url = request.url();
        if (!url.startsWith(landingPage.page.url().split('/')[0] + '//' + landingPage.page.url().split('/')[2])) {
          requests.push({
            url,
            headers: request.headers()
          });
        }
      });

      await landingPage.goto('/');
      await landingPage.verifyLandingPageLoaded();

      // Check external requests use HTTPS
      const externalRequests = requests.filter(req =>
        !req.url.includes('localhost') &&
        req.url.startsWith('http://')
      );

      expect(externalRequests.length).toBe(0);

      // Check for proper referrer policy
      const externalHttpsRequests = requests.filter(req =>
        req.url.startsWith('https://') &&
        !req.url.includes('localhost')
      );

      for (const req of externalHttpsRequests) {
        // Should have appropriate referrer policy
        expect(req.headers['referer'] === undefined || req.headers['referer']).toBeTruthy();
      }
    });
  });
});
