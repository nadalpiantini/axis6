import { test, expect } from '@playwright/test';

test.describe('🐛 Chat Module Debug & Fix', () => {
  let page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    // Start with login
    await page.goto('http://localhost:3000/auth/login');

    // Wait for the login form to load
    await page.waitForSelector('form', { timeout: 10000 });

    // Fill in credentials
    await page.fill('input[type="email"]', 'test@axis6.app');
    await page.fill('input[type="password"]', 'Test123!@#');

    // Click the login button
    const loginButton = page.locator('button:has-text("Sign In"), button:has-text("Iniciar"), button[type="submit"]').first();
    await loginButton.click();

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('1. Chat module accessibility from dashboard', async () => {
    console.log('🔍 Checking dashboard for chat access...');

    // Look for chat link in dashboard
    const chatLink = page.locator('a[href*="/chat"]');
    const chatButton = page.locator('button:has-text("Chat")');
    const chatIcon = page.locator('[data-testid="chat-icon"]');

    if (await chatLink.count() > 0) {
      console.log('✅ Chat link found in dashboard');
      await chatLink.click();
      await expect(page).toHaveURL(/.*\/chat/);
    } else if (await chatButton.count() > 0) {
      console.log('✅ Chat button found in dashboard');
      await chatButton.click();
      await expect(page).toHaveURL(/.*\/chat/);
    } else {
      console.log('❌ No chat access found in dashboard - NEEDS FIX');
      // Navigate directly
      await page.goto('http://localhost:3000/chat');
    }
  });

  test('2. Chat main page loads and displays correctly', async () => {
    await page.goto('http://localhost:3000/chat');

    console.log('🔍 Checking chat page structure...');

    // Check for essential elements
    const header = page.locator('header, [role="banner"]');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Check for room list
    const roomList = page.locator('[data-testid="chat-room-list"], .chat-room-list, aside');
    if (await roomList.count() > 0) {
      console.log('✅ Room list component found');
    } else {
      console.log('❌ Room list missing - NEEDS FIX');
    }

    // Check for new chat button
    const newChatButton = page.locator('button:has-text("New Chat"), button:has-text("Nueva Conversación"), [aria-label*="new"]');
    if (await newChatButton.count() > 0) {
      console.log('✅ New chat button found');
    } else {
      console.log('❌ New chat button missing - NEEDS FIX');
    }
  });

  test('3. Create new chat room functionality', async () => {
    await page.goto('http://localhost:3000/chat');

    console.log('🔍 Testing new chat creation...');

    // Try to create new chat
    const newChatBtn = page.locator('button:has-text("New"), button:has-text("Nueva"), [aria-label*="new"]').first();

    if (await newChatBtn.count() > 0) {
      await newChatBtn.click();

      // Check if modal or new page opens
      const modal = page.locator('[role="dialog"], .modal, [data-testid="new-chat-modal"]');
      const newChatPage = page.url().includes('/chat/new');

      if (await modal.count() > 0 || newChatPage) {
        console.log('✅ New chat interface opened');

        // Try to fill room name
        const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="nombre"]').first();
        if (await nameInput.count() > 0) {
          await nameInput.fill('Test Chat Room');
          console.log('✅ Room name input working');
        }

        // Try to create
        const createBtn = page.locator('button:has-text("Create"), button:has-text("Crear")').first();
        if (await createBtn.count() > 0) {
          await createBtn.click();
          console.log('✅ Create button clicked');
        }
      } else {
        console.log('❌ New chat interface not opening - NEEDS FIX');
      }
    } else {
      console.log('❌ Cannot find new chat button - NEEDS FIX');
    }
  });

  test('4. Message sending functionality', async () => {
    await page.goto('http://localhost:3000/chat');

    console.log('🔍 Testing message sending...');

    // Enter a chat room or create one
    const rooms = page.locator('[data-testid^="room-"], .chat-room-item, [role="listitem"]');

    if (await rooms.count() > 0) {
      await rooms.first().click();
      console.log('✅ Entered chat room');
    } else {
      console.log('⚠️ No existing rooms, creating new one...');
      // Create new room logic here
    }

    // Look for message input
    const messageInput = page.locator('textarea[placeholder*="message"], input[placeholder*="message"], [contenteditable="true"]').first();
    const sendButton = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label*="send"]').first();

    if (await messageInput.count() > 0) {
      await messageInput.fill('Test message from Playwright');
      console.log('✅ Message input found and filled');

      if (await sendButton.count() > 0) {
        await sendButton.click();
        console.log('✅ Send button clicked');
      } else {
        // Try Enter key
        await messageInput.press('Enter');
        console.log('⚠️ Send button not found, tried Enter key');
      }
    } else {
      console.log('❌ Message input not found - NEEDS FIX');
    }
  });

  test('5. Visual coherence with AXIS6 design', async () => {
    await page.goto('http://localhost:3000/chat');

    console.log('🎨 Checking visual coherence...');

    // Check for AXIS6 color scheme
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    console.log(`Background color: ${backgroundColor}`);

    // Check for consistent navigation
    const nav = page.locator('nav, [role="navigation"]');
    if (await nav.count() > 0) {
      console.log('✅ Navigation component present');
    }

    // Check for hexagon branding
    const hexagon = page.locator('[class*="hexagon"], svg[data-testid="hexagon"]');
    if (await hexagon.count() > 0) {
      console.log('✅ Hexagon branding present');
    } else {
      console.log('⚠️ No hexagon branding found');
    }

    // Check mobile responsiveness
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    const isMobileResponsive = await page.evaluate(() => {
      const body = document.body;
      return body.scrollWidth <= window.innerWidth;
    });

    if (isMobileResponsive) {
      console.log('✅ Mobile responsive');
    } else {
      console.log('❌ Not mobile responsive - NEEDS FIX');
    }
  });

  test('6. File upload functionality', async () => {
    await page.goto('http://localhost:3000/chat');

    console.log('📎 Testing file upload...');

    // Look for file upload button
    const uploadButton = page.locator('button[aria-label*="upload"], button[aria-label*="attach"], [data-testid="file-upload"]');

    if (await uploadButton.count() > 0) {
      console.log('✅ File upload button found');
      // We won't actually upload in this test, just check UI
    } else {
      console.log('❌ File upload button missing - NEEDS FIX');
    }
  });

  test('7. Search functionality', async () => {
    await page.goto('http://localhost:3000/chat');

    console.log('🔍 Testing search...');

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="buscar"], [aria-label*="search"]');

    if (await searchInput.count() > 0) {
      await searchInput.fill('test search');
      console.log('✅ Search input found and functional');

      // Check for search results
      await page.waitForTimeout(1000);
      const results = page.locator('[data-testid="search-results"], .search-results');
      if (await results.count() > 0) {
        console.log('✅ Search results displayed');
      }
    } else {
      console.log('❌ Search functionality missing - NEEDS FIX');
    }
  });

  test('8. Notifications settings', async () => {
    await page.goto('http://localhost:3000/chat');

    console.log('🔔 Testing notifications...');

    // Look for notification settings
    const notifButton = page.locator('button[aria-label*="notif"], [data-testid="notifications"]');

    if (await notifButton.count() > 0) {
      console.log('✅ Notification settings accessible');
    } else {
      console.log('⚠️ Notification settings not easily accessible');
    }
  });

  test('9. Real-time updates', async () => {
    await page.goto('http://localhost:3000/chat');

    console.log('🔄 Testing real-time functionality...');

    // Check for WebSocket connection indicators
    const wsIndicator = await page.evaluate(() => {
      return window.__supabase ? '✅ Supabase client present' : '❌ Supabase client missing';
    });

    console.log(wsIndicator);
  });

  test('10. Error handling', async () => {
    console.log('⚠️ Testing error handling...');

    // Try to access non-existent room
    await page.goto('http://localhost:3000/chat/non-existent-room-id');

    // Should show error or redirect
    const errorMessage = page.locator('[role="alert"], .error-message, [data-testid="error"]');
    const redirected = page.url().includes('/chat') && !page.url().includes('non-existent');

    if (await errorMessage.count() > 0 || redirected) {
      console.log('✅ Error handling working');
    } else {
      console.log('❌ Error handling needs improvement');
    }
  });
});

test.describe('🎨 Visual Coherence Detailed Check', () => {
  test('AXIS6 Design System Compliance', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[name="email"]', 'test@axis6.app');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:3000/chat');

    // Check color palette compliance
    const styles = await page.evaluate(() => {
      const elements = {
        primaryButtons: Array.from(document.querySelectorAll('button.btn-primary, button[class*="primary"]')),
        backgrounds: Array.from(document.querySelectorAll('[class*="bg-"], main, aside')),
        text: Array.from(document.querySelectorAll('h1, h2, h3, p')),
      };

      return {
        buttonColors: elements.primaryButtons.map(el => window.getComputedStyle(el).backgroundColor),
        backgroundColors: elements.backgrounds.slice(0, 5).map(el => window.getComputedStyle(el).backgroundColor),
        textColors: elements.text.slice(0, 5).map(el => window.getComputedStyle(el).color),
      };
    });

    console.log('🎨 Visual Analysis:', styles);

    // Check for consistent spacing
    const spacing = await page.evaluate(() => {
      const containers = Array.from(document.querySelectorAll('.container, main > div, [class*="px-"]'));
      return containers.slice(0, 3).map(el => {
        const computed = window.getComputedStyle(el);
        return {
          padding: computed.padding,
          margin: computed.margin,
        };
      });
    });

    console.log('📐 Spacing consistency:', spacing);
  });
});
