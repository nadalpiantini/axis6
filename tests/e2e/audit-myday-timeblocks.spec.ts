import { test, expect, Page } from '@playwright/test';

/**
 * SUB-AGENTE 3: My Day & Time Blocks Comprehensive Audit
 * 
 * Specializes in:
 * - My Day page (/my-day) complete functionality
 * - Time block creation, editing, and deletion
 * - Activity planning interface
 * - Time pickers and scheduling components
 * - API calls related to time-blocks and scheduling
 * - Activity timer functionality
 * 
 * Execution: PLAYWRIGHT_BASE_URL=https://axis6.app npx playwright test tests/e2e/audit-myday-timeblocks.spec.ts --reporter=line
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
  timeBlockId?: string;
}

class MyDayTimeBlocksAuditor {
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
          url.includes('time-blocks') || url.includes('my-day') || 
          url.includes('activity') || url.includes('timer')) {
        this.networkLogs.push(`${request.method()} ${url}`);
      }
    });
    
    // Monitor network responses for errors
    this.page.on('response', response => {
      const url = response.url();
      if ((url.includes('/api/') || url.includes('supabase.co') || 
           url.includes('time-blocks') || url.includes('activity')) && 
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
    console.log('🔐 Logging in for My Day testing...');
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
  
  async reportBug(page: string, element: string, issue: string, severity: BugReport['severity'] = 'medium', timeBlockId?: string) {
    const bugId = this.bugs.length + 1;
    const screenshot = `myday-timeblocks-bug-${bugId}-${page.replace('/', '_')}.png`;
    
    try {
      await this.page.screenshot({ 
        path: `test-results/${screenshot}`,
        fullPage: true 
      });
    } catch (e) {
      console.log(`⚠️ Could not capture screenshot: ${e}`);
    }
    
    this.bugs.push({
      agent: 'myday-timeblocks',
      page,
      element,
      issue,
      severity,
      screenshot,
      networkLogs: [...this.networkLogs],
      consoleErrors: [...this.consoleErrors],
      timestamp: new Date().toISOString(),
      timeBlockId
    });
    
    const blockText = timeBlockId ? ` [Block ${timeBlockId}]` : '';
    console.log(`🐛 [SUB-AGENT 3] BUG FOUND [${severity.toUpperCase()}]${blockText} on ${page}: ${issue}`);
    
    // Clear logs for next test
    this.networkLogs = [];
    this.consoleErrors = [];
  }
  
  async testTimeBlockCreation() {
    console.log('➕ Testing time block creation...');
    
    // Look for "Add Block" and other time block creation buttons
    const addButtonSelectors = [
      '[data-testid="add-time-block-btn"]', // Primary reliable selector
      'button[aria-label="Add time block"]', // ARIA label selector
      'button:has-text("Add Block")', // Text-based (may fail on mobile due to hidden text)
      'button:has(svg[data-lucide="plus"])', // Button with Plus icon
      'button:has(.lucide-plus)', // Button with Plus icon class
      '[data-testid*="add"]', // Generic testid fallback
      'button[aria-label*="add"]', // Generic ARIA fallback
      'button:has-text("Block")', // Partial text match
      'button:has-text("Add")',
      'button:has-text("Create")',
      '.add-time-block'
    ];
    
    let addButton = null;
    let usedSelector = '';
    
    for (const selector of addButtonSelectors) {
      const button = this.page.locator(selector);
      if (await button.count() > 0 && await button.first().isVisible()) {
        addButton = button.first();
        usedSelector = selector;
        break;
      }
    }
    
    if (!addButton) {
      await this.reportBug('/my-day', 'Add Button', 
        'No "Add" or "Create" button found for time block creation', 'high');
      return false;
    }
    
    console.log(`✅ Found add button with selector: ${usedSelector}`);
    
    // Click the add button
    try {
      const initialNetworkCount = this.networkLogs.length;
      await addButton.click();
      await this.page.waitForTimeout(2000);
      
      // Look for a form or modal that appeared
      const formSelectors = [
        'form',
        '[role="dialog"]',
        '.modal',
        '[data-testid*="form"]',
        '[data-testid*="modal"]',
        '.time-block-form'
      ];
      
      let formFound = false;
      for (const selector of formSelectors) {
        if (await this.page.locator(selector).count() > 0) {
          formFound = true;
          console.log(`✅ Form/modal appeared: ${selector}`);
          break;
        }
      }
      
      if (!formFound) {
        await this.reportBug('/my-day', 'Time Block Form', 
          'Add button clicked but no form or modal appeared', 'high');
      }
      
      // Check if any network calls were made
      const finalNetworkCount = this.networkLogs.length;
      if (finalNetworkCount > initialNetworkCount) {
        console.log(`✅ Add button triggered ${finalNetworkCount - initialNetworkCount} network calls`);
      }
      
      return formFound;
      
    } catch (error) {
      await this.reportBug('/my-day', 'Add Button Click', 
        `Failed to click add button: ${error}`, 'high');
      return false;
    }
  }
  
  async testTimeInputElements() {
    console.log('⏰ Testing time input elements...');
    
    const timeInputSelectors = [
      'input[type="time"]',
      'input[type="datetime-local"]',
      'input[placeholder*="time"]',
      '[data-testid*="time"]',
      '.time-picker',
      'select[name*="hour"]',
      'select[name*="minute"]'
    ];
    
    let timeInputsFound = 0;
    
    for (const selector of timeInputSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        timeInputsFound += count;
        console.log(`✅ Found ${count} time inputs: ${selector}`);
        
        // Test interaction with first element
        const firstElement = elements.first();
        
        if (await firstElement.isVisible() && await firstElement.isEnabled()) {
          try {
            if (selector.includes('input[type="time"]')) {
              await firstElement.fill('14:30');
            } else if (selector.includes('select')) {
              // For select elements, try to select an option
              const options = await firstElement.locator('option').count();
              if (options > 1) {
                await firstElement.selectOption({ index: 1 });
              }
            }
            
            await this.page.waitForTimeout(500);
            console.log(`✅ Successfully interacted with time input`);
            
          } catch (error) {
            await this.reportBug('/my-day', 'Time Input', 
              `Failed to interact with time input: ${error}`, 'medium');
          }
        }
      }
    }
    
    if (timeInputsFound === 0) {
      await this.reportBug('/my-day', 'Time Inputs', 
        'No time input elements found on My Day page', 'medium');
    }
    
    return timeInputsFound > 0;
  }
  
  async testActivitySelection() {
    console.log('🎯 Testing activity selection...');
    
    const activitySelectors = [
      'select[name*="activity"]',
      'select[name*="category"]',
      '[data-testid*="activity"]',
      '[data-testid*="category"]',
      'input[name*="activity"]',
      '.activity-select',
      '.category-select'
    ];
    
    let activityElementsFound = 0;
    
    for (const selector of activitySelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        activityElementsFound += count;
        console.log(`✅ Found ${count} activity elements: ${selector}`);
        
        const firstElement = elements.first();
        
        if (await firstElement.isVisible() && await firstElement.isEnabled()) {
          try {
            const tagName = await firstElement.evaluate(el => el.tagName);
            
            if (tagName === 'SELECT') {
              const options = await firstElement.locator('option').count();
              if (options > 1) {
                await firstElement.selectOption({ index: 1 });
                console.log(`✅ Selected activity option`);
              }
            } else if (tagName === 'INPUT') {
              await firstElement.fill('Test Activity');
              console.log(`✅ Filled activity input`);
            }
            
            await this.page.waitForTimeout(500);
            
          } catch (error) {
            await this.reportBug('/my-day', 'Activity Selection', 
              `Failed to interact with activity element: ${error}`, 'medium');
          }
        }
      }
    }
    
    if (activityElementsFound === 0) {
      await this.reportBug('/my-day', 'Activity Elements', 
        'No activity selection elements found', 'medium');
    }
    
    return activityElementsFound > 0;
  }
  
  async testExistingTimeBlocks() {
    console.log('📅 Testing existing time blocks...');
    
    const timeBlockSelectors = [
      '[data-testid*="time-block"]',
      '.time-block',
      '[data-testid*="block"]',
      '.schedule-item',
      '.activity-block',
      '[class*="time"][class*="block"]'
    ];
    
    let existingBlocksFound = 0;
    
    for (const selector of timeBlockSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        existingBlocksFound += count;
        console.log(`✅ Found ${count} existing time blocks: ${selector}`);
        
        // Test interaction with first few blocks
        const blocksToTest = Math.min(count, 3);
        
        for (let i = 0; i < blocksToTest; i++) {
          const block = elements.nth(i);
          
          if (await block.isVisible()) {
            try {
              // Look for edit/delete buttons within the block
              const editButton = block.locator('button:has-text("Edit"), [data-testid*="edit"], .edit-button');
              const deleteButton = block.locator('button:has-text("Delete"), [data-testid*="delete"], .delete-button');
              
              if (await editButton.count() > 0 && await editButton.isVisible()) {
                await editButton.click();
                await this.page.waitForTimeout(1000);
                console.log(`✅ Edit button works for block ${i + 1}`);
              }
              
              if (await deleteButton.count() > 0 && await deleteButton.isVisible()) {
                console.log(`✅ Delete button found for block ${i + 1} (not clicking to preserve data)`);
              }
              
              // Try clicking the block itself
              await block.click();
              await this.page.waitForTimeout(500);
              console.log(`✅ Time block ${i + 1} is clickable`);
              
            } catch (error) {
              await this.reportBug('/my-day', 'Time Block Interaction', 
                `Failed to interact with time block ${i + 1}: ${error}`, 'medium', `block-${i + 1}`);
            }
          }
        }
      }
    }
    
    console.log(`📊 Total existing time blocks found: ${existingBlocksFound}`);
    
    return existingBlocksFound;
  }
  
  async testActivityTimer() {
    console.log('⏱️ Testing activity timer functionality...');
    
    const timerSelectors = [
      'button:has-text("Start")',
      'button:has-text("Stop")',
      'button:has-text("Pause")',
      '[data-testid*="timer"]',
      '.timer-button',
      '[data-testid*="start"]',
      '[data-testid*="stop"]'
    ];
    
    let timerElementsFound = 0;
    
    for (const selector of timerSelectors) {
      const elements = this.page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        timerElementsFound += count;
        console.log(`✅ Found ${count} timer elements: ${selector}`);
        
        const firstElement = elements.first();
        
        if (await firstElement.isVisible() && await firstElement.isEnabled()) {
          try {
            const initialNetworkCount = this.networkLogs.length;
            await firstElement.click();
            await this.page.waitForTimeout(2000);
            
            const finalNetworkCount = this.networkLogs.length;
            if (finalNetworkCount > initialNetworkCount) {
              console.log(`✅ Timer button triggered ${finalNetworkCount - initialNetworkCount} API calls`);
            }
            
            // Look for timer display updates
            const timerDisplay = this.page.locator('[data-testid*="timer-display"], .timer-display, [class*="timer"][class*="time"]');
            if (await timerDisplay.count() > 0) {
              console.log(`✅ Timer display element found`);
            }
            
          } catch (error) {
            await this.reportBug('/my-day', 'Activity Timer', 
              `Failed to interact with timer: ${error}`, 'medium');
          }
        }
      }
    }
    
    if (timerElementsFound === 0) {
      console.log(`ℹ️ No timer elements found (this may be normal if timer is not implemented)`);
    }
    
    return timerElementsFound > 0;
  }
  
  getBugReport() {
    return {
      agent: 'myday-timeblocks',
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

test.describe('SUB-AGENT 3: My Day & Time Blocks Audit', () => {
  let auditor: MyDayTimeBlocksAuditor;
  
  test.setTimeout(180000); // 3 minutes timeout
  
  test.beforeEach(async ({ page }) => {
    auditor = new MyDayTimeBlocksAuditor(page);
    await auditor.login();
  });
  
  test('My Day Page Load and Structure Audit', async ({ page }) => {
    console.log('📅 [SUB-AGENT 3] Starting My Day Structure Audit...');
    
    // Navigate to My Day page
    await page.goto(`${BASE_URL}/my-day`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the My Day page
    const currentUrl = page.url();
    if (!currentUrl.includes('/my-day')) {
      await auditor.reportBug('/my-day', 'Page Access', 
        `Failed to access My Day page, redirected to: ${currentUrl}`, 'critical');
    }
    
    // Check for basic My Day structure
    const myDayElements = [
      { selector: '[data-testid="my-day-main"], main', name: 'Main My Day Container' },
      { selector: 'h1, h2, [data-testid*="title"]', name: 'Page Title' },
      { selector: 'button, [role="button"]', name: 'Interactive Buttons' }
    ];
    
    for (const element of myDayElements) {
      const found = await page.locator(element.selector).count() > 0;
      if (!found) {
        await auditor.reportBug('/my-day', element.name, 
          `${element.name} not found`, 'medium');
      } else {
        console.log(`✅ Found ${element.name}`);
      }
    }
    
    console.log('✅ My Day Structure Audit Complete');
  });
  
  test('Time Block Creation Comprehensive Test', async ({ page }) => {
    console.log('➕ [SUB-AGENT 3] Starting Time Block Creation Test...');
    
    await page.goto(`${BASE_URL}/my-day`);
    await page.waitForLoadState('networkidle');
    
    const creationSuccess = await auditor.testTimeBlockCreation();
    
    if (creationSuccess) {
      // Test form elements
      await auditor.testTimeInputElements();
      await auditor.testActivitySelection();
      
      // Look for and test submit button
      const submitButtons = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Add")');
      const submitCount = await submitButtons.count();
      
      if (submitCount > 0) {
        console.log(`✅ Found ${submitCount} submit buttons`);
        
        // Fill a basic form if possible
        const nameInput = page.locator('input[name*="name"], input[name*="title"], input[placeholder*="name"]');
        if (await nameInput.count() > 0 && await nameInput.first().isVisible()) {
          await nameInput.first().fill('Test Time Block');
          console.log(`✅ Filled name input`);
        }
        
        // Try to submit (but handle any validation errors)
        try {
          const initialNetworkCount = auditor['networkLogs'].length;
          await submitButtons.first().click();
          await page.waitForTimeout(3000);
          
          const finalNetworkCount = auditor['networkLogs'].length;
          if (finalNetworkCount > initialNetworkCount) {
            console.log(`✅ Form submission triggered ${finalNetworkCount - initialNetworkCount} API calls`);
          }
          
        } catch (error) {
          console.log(`ℹ️ Form submission may require validation: ${error}`);
        }
      } else {
        await auditor.reportBug('/my-day', 'Submit Button', 
          'No submit button found in time block creation form', 'high');
      }
    }
    
    console.log('✅ Time Block Creation Test Complete');
  });
  
  test('Existing Time Blocks Management Audit', async ({ page }) => {
    console.log('📋 [SUB-AGENT 3] Starting Existing Time Blocks Management Audit...');
    
    await page.goto(`${BASE_URL}/my-day`);
    await page.waitForLoadState('networkidle');
    
    const existingBlocksCount = await auditor.testExistingTimeBlocks();
    
    if (existingBlocksCount > 0) {
      console.log(`✅ Successfully tested ${existingBlocksCount} existing time blocks`);
    } else {
      console.log(`ℹ️ No existing time blocks found (this may be normal for a new user)`);
    }
    
    // Test different view modes if available
    const viewModeButtons = page.locator('button:has-text("Day"), button:has-text("Week"), button:has-text("Month"), [data-testid*="view"]');
    const viewModeCount = await viewModeButtons.count();
    
    if (viewModeCount > 0) {
      console.log(`✅ Found ${viewModeCount} view mode buttons`);
      
      for (let i = 0; i < Math.min(viewModeCount, 3); i++) {
        const button = viewModeButtons.nth(i);
        const buttonText = await button.textContent();
        
        try {
          await button.click();
          await page.waitForTimeout(2000);
          console.log(`✅ Successfully clicked view mode: ${buttonText}`);
        } catch (error) {
          await auditor.reportBug('/my-day', 'View Mode', 
            `Failed to click view mode button "${buttonText}": ${error}`, 'medium');
        }
      }
    }
    
    console.log('✅ Existing Time Blocks Management Audit Complete');
  });
  
  test('Activity Timer Functionality Audit', async ({ page }) => {
    console.log('⏱️ [SUB-AGENT 3] Starting Activity Timer Audit...');
    
    await page.goto(`${BASE_URL}/my-day`);
    await page.waitForLoadState('networkidle');
    
    const timerFound = await auditor.testActivityTimer();
    
    if (timerFound) {
      // Test timer state persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const timerAfterReload = page.locator('[data-testid*="timer"], .timer, [class*="timer"]');
      if (await timerAfterReload.count() > 0) {
        console.log(`✅ Timer elements persist after page reload`);
      }
    } else {
      console.log(`ℹ️ Timer functionality not found or not implemented`);
    }
    
    console.log('✅ Activity Timer Audit Complete');
  });
  
  test('My Day API Integration Audit', async ({ page }) => {
    console.log('🔗 [SUB-AGENT 3] Starting My Day API Integration Audit...');
    
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
    
    await page.goto(`${BASE_URL}/my-day`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Try to trigger various API calls
    await auditor.testTimeBlockCreation();
    await page.waitForTimeout(2000);
    
    await auditor.testActivityTimer();
    await page.waitForTimeout(2000);
    
    // Analyze API calls
    console.log(`📊 My Day API Analysis (Total calls: ${apiCalls.length})`);
    
    const errorCalls = apiCalls.filter(call => call.status >= 400);
    const successCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
    
    console.log(`✅ Successful API calls: ${successCalls.length}`);
    console.log(`❌ Failed API calls: ${errorCalls.length}`);
    
    if (errorCalls.length > 0) {
      errorCalls.forEach(call => {
        console.log(`🚨 API Error: ${call.method} ${call.url} - Status: ${call.status}`);
      });
      
      await auditor.reportBug('/my-day', 'API Integration', 
        `${errorCalls.length} API calls failed during My Day interactions`, 'high');
    }
    
    // Check for expected API endpoints
    const expectedEndpoints = ['time-blocks', 'my-day', 'activity-timer', 'stats'];
    const calledEndpoints = apiCalls.map(call => {
      const url = new URL(call.url);
      return url.pathname;
    });
    
    for (const expectedEndpoint of expectedEndpoints) {
      const endpointCalled = calledEndpoints.some(path => path.includes(expectedEndpoint));
      if (endpointCalled) {
        console.log(`✅ API endpoint '${expectedEndpoint}' was called`);
      } else {
        console.log(`ℹ️ API endpoint '${expectedEndpoint}' was not called (may be normal)`);
      }
    }
    
    console.log('✅ My Day API Integration Audit Complete');
  });
  
  test('My Day Responsive Design Audit', async ({ page }) => {
    console.log('📱 [SUB-AGENT 3] Starting My Day Responsive Design Audit...');
    
    await page.goto(`${BASE_URL}/my-day`);
    await page.waitForLoadState('networkidle');
    
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      console.log(`📐 Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(1000);
      
      // Check if main elements are still visible
      const mainContent = page.locator('[data-testid="my-day-main"], main');
      const isVisible = await mainContent.isVisible();
      
      if (!isVisible) {
        await auditor.reportBug('/my-day', 'Responsive Design', 
          `Main content not visible on ${viewport.name} viewport`, 'medium');
      } else {
        console.log(`✅ Main content visible on ${viewport.name}`);
      }
      
      // Test button accessibility on mobile
      if (viewport.name === 'Mobile') {
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i);
          const buttonRect = await button.boundingBox();
          
          if (buttonRect && (buttonRect.width < 44 || buttonRect.height < 44)) {
            await auditor.reportBug('/my-day', 'Mobile Accessibility', 
              `Button ${i + 1} may be too small for touch interaction (${buttonRect.width}x${buttonRect.height})`, 'low');
          }
        }
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-results/my-day-${viewport.name.toLowerCase()}.png`,
        fullPage: true 
      });
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    console.log('✅ My Day Responsive Design Audit Complete');
  });
  
  test.afterAll(async () => {
    const report = auditor.getBugReport();
    
    console.log('\n🎯 [SUB-AGENT 3] MY DAY & TIME BLOCKS AUDIT COMPLETE!');
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
        const blockText = bug.timeBlockId ? ` [${bug.timeBlockId}]` : '';
        console.log(`\n${index + 1}. [${bug.severity.toUpperCase()}]${blockText} ${bug.page}`);
        console.log(`   Element: ${bug.element}`);
        console.log(`   Issue: ${bug.issue}`);
        console.log(`   Screenshot: ${bug.screenshot}`);
        if (bug.consoleErrors && bug.consoleErrors.length > 0) {
          console.log(`   Console Errors: ${bug.consoleErrors.join(', ')}`);
        }
      });
    } else {
      console.log('\n🎉 NO BUGS FOUND IN MY DAY & TIME BLOCKS!');
    }
    
    console.log('\n✅ Sub-Agent 3 reporting complete to orchestrator');
  });
});