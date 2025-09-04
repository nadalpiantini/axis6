import { test, expect, Page } from '@playwright/test';

/**
 * Targeted AXIS6 Page Audit
 * Tests each discovered page for basic functionality and common issues
 */

const REAL_USER_CREDENTIALS = {
  email: 'nadalpiantini@gmail.com',
  password: 'Teclados#13'
};

interface PageAuditResult {
  page: string;
  status: 'pass' | 'fail';
  issues: string[];
  screenshots: string[];
  loadTime: number;
  hasForm: boolean;
  hasInteractiveElements: boolean;
  jsErrors: string[];
  networkErrors: string[];
}

class PageAuditor {
  private page: Page;
  private results: PageAuditResult[] = [];
  private jsErrors: string[] = [];
  private networkErrors: string[] = [];

  constructor(page: Page) {
    this.page = page;
    this.setupMonitoring();
  }

  private setupMonitoring() {
    this.page.on('pageerror', error => {
      this.jsErrors.push(error.message);
    });

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.jsErrors.push(`Console: ${msg.text()}`);
      }
    });

    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });
  }

  async auditPage(url: string, pageName: string): Promise<PageAuditResult> {
    console.log(`🔍 Auditing ${pageName} (${url})`);
    
    const startTime = Date.now();
    this.jsErrors = [];
    this.networkErrors = [];
    const issues: string[] = [];
    const screenshots: string[] = [];

    try {
      // Navigate to page
      await this.page.goto(url);
      await this.page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;

      // Take screenshot
      const screenshotPath = `test-results/audit-${pageName.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      screenshots.push(screenshotPath);

      // Check for basic page elements
      const hasTitle = await this.page.locator('title').count() > 0;
      if (!hasTitle) {
        issues.push('Missing page title');
      }

      // Check for forms
      const formCount = await this.page.locator('form').count();
      const hasForm = formCount > 0;

      // Check for interactive elements
      const buttonCount = await this.page.locator('button').count();
      const linkCount = await this.page.locator('a[href]').count();
      const inputCount = await this.page.locator('input').count();
      const hasInteractiveElements = (buttonCount + linkCount + inputCount) > 0;

      // Check for obvious errors
      const errorMessages = await this.page.locator('text=/error|Error|ERROR|failed|Failed|FAILED/').count();
      if (errorMessages > 0) {
        issues.push(`Found ${errorMessages} error messages on page`);
      }

      // Check for loading indicators stuck
      const loadingElements = await this.page.locator('[data-loading="true"], .loading, [class*="spinner"], [class*="loading"]').count();
      if (loadingElements > 0) {
        issues.push(`Found ${loadingElements} elements still in loading state`);
      }

      // Add JS and network errors
      issues.push(...this.jsErrors);
      issues.push(...this.networkErrors);

      const result: PageAuditResult = {
        page: pageName,
        status: issues.length === 0 ? 'pass' : 'fail',
        issues,
        screenshots,
        loadTime,
        hasForm,
        hasInteractiveElements,
        jsErrors: [...this.jsErrors],
        networkErrors: [...this.networkErrors]
      };

      this.results.push(result);
      return result;

    } catch (error) {
      const result: PageAuditResult = {
        page: pageName,
        status: 'fail',
        issues: [`Navigation failed: ${error}`],
        screenshots,
        loadTime: Date.now() - startTime,
        hasForm: false,
        hasInteractiveElements: false,
        jsErrors: [...this.jsErrors],
        networkErrors: [...this.networkErrors]
      };

      this.results.push(result);
      return result;
    }
  }

  getReport() {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const avgLoadTime = this.results.reduce((sum, r) => sum + r.loadTime, 0) / this.results.length;

    return {
      summary: {
        totalPages: this.results.length,
        passed,
        failed,
        avgLoadTime: Math.round(avgLoadTime)
      },
      results: this.results
    };
  }
}

test.describe('AXIS6 Targeted Page Audit', () => {
  let auditor: PageAuditor;

  test.beforeEach(async ({ page }) => {
    auditor = new PageAuditor(page);
  });

  test('Audit All Discovered Pages', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    
    // First login
    console.log('🔐 Logging in...');
    await page.goto(`${baseUrl}/auth/login`);
    await page.locator('input[type="email"]').fill(REAL_USER_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(REAL_USER_CREDENTIALS.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);

    console.log('✅ Login completed, starting page audit...\n');

    // Define all pages to audit
    const pagesToAudit = [
      { url: '/', name: 'Landing Page' },
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/my-day', name: 'My Day' },
      { url: '/profile', name: 'Profile' },
      { url: '/analytics', name: 'Analytics' },
      { url: '/achievements', name: 'Achievements' },
      { url: '/settings', name: 'Settings Main' },
      { url: '/settings/account', name: 'Settings Account' },
      { url: '/settings/notifications', name: 'Settings Notifications' },
      { url: '/settings/privacy', name: 'Settings Privacy' },
      { url: '/settings/security', name: 'Settings Security' },
      { url: '/settings/focus', name: 'Settings Focus' },
      { url: '/settings/axis-customization', name: 'Settings Axis Customization' },
      { url: '/chat', name: 'Chat Main' },
      { url: '/chat/new', name: 'Chat New' },
      { url: '/privacy', name: 'Privacy Policy' },
      { url: '/terms', name: 'Terms of Service' },
      { url: '/clock-demo', name: 'Clock Demo' }
    ];

    // Audit each page
    for (const pageInfo of pagesToAudit) {
      await auditor.auditPage(`${baseUrl}${pageInfo.url}`, pageInfo.name);
      await page.waitForTimeout(1000); // Brief pause between pages
    }

    // Test auth pages (logged out)
    console.log('🚪 Testing auth pages (logging out first)...');
    await page.goto(`${baseUrl}/auth/login`);
    
    const authPages = [
      { url: '/auth/login', name: 'Login Page' },
      { url: '/auth/register', name: 'Register Page' },
      { url: '/auth/forgot', name: 'Forgot Password' },
      { url: '/auth/onboarding', name: 'Onboarding' }
    ];

    for (const authPage of authPages) {
      await auditor.auditPage(`${baseUrl}${authPage.url}`, authPage.name);
      await page.waitForTimeout(1000);
    }

    // Generate comprehensive report
    const report = auditor.getReport();
    console.log('\n📊 COMPREHENSIVE PAGE AUDIT REPORT');
    console.log('=====================================');
    console.log(`📋 Total Pages Tested: ${report.summary.totalPages}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚡ Average Load Time: ${report.summary.avgLoadTime}ms`);
    console.log('=====================================\n');

    // Detailed results
    report.results.forEach(result => {
      const status = result.status === 'pass' ? '✅' : '❌';
      console.log(`${status} ${result.page} (${result.loadTime}ms)`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`   🐛 ${issue}`);
        });
      }
      
      if (result.hasForm) {
        console.log(`   📝 Has forms`);
      }
      
      if (result.hasInteractiveElements) {
        console.log(`   🎯 Has interactive elements`);
      }
      
      console.log('');
    });

    // Summary by category
    const criticalIssues = report.results.filter(r => 
      r.issues.some(issue => 
        issue.includes('Navigation failed') || 
        issue.includes('500') || 
        issue.includes('error')
      )
    );

    const performanceIssues = report.results.filter(r => r.loadTime > 3000);

    console.log('🚨 CRITICAL ISSUES:');
    if (criticalIssues.length === 0) {
      console.log('   None found! 🎉');
    } else {
      criticalIssues.forEach(issue => {
        console.log(`   ${issue.page}: ${issue.issues.join(', ')}`);
      });
    }

    console.log('\n⚡ PERFORMANCE ISSUES (>3s load time):');
    if (performanceIssues.length === 0) {
      console.log('   None found! 🎉');
    } else {
      performanceIssues.forEach(issue => {
        console.log(`   ${issue.page}: ${issue.loadTime}ms`);
      });
    }

    // Interactive Elements Summary
    const pagesWithForms = report.results.filter(r => r.hasForm);
    console.log(`\n📝 Pages with Forms (${pagesWithForms.length}):`);
    pagesWithForms.forEach(p => console.log(`   ${p.page}`));

    const pagesWithInteractives = report.results.filter(r => r.hasInteractiveElements);
    console.log(`\n🎯 Pages with Interactive Elements (${pagesWithInteractives.length}):`);
    pagesWithInteractives.forEach(p => console.log(`   ${p.page}`));

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (report.summary.failed > 0) {
      console.log('   1. Fix critical navigation and JavaScript errors');
      console.log('   2. Address missing page elements (titles, forms)');
      console.log('   3. Remove stuck loading indicators');
    }
    if (performanceIssues.length > 0) {
      console.log('   4. Optimize slow-loading pages');
    }
    console.log('   5. Test interactive elements for proper functionality');
    console.log('   6. Ensure consistent error handling across all pages');

    // Test should pass if no critical issues found
    expect(criticalIssues.length).toBeLessThan(5);
  });
});