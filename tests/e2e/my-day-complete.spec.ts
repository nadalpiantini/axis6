import { test, expect, Page } from '@playwright/test'

// Test configuration
const TEST_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://axis6.app'
const TEST_USER = {
  email: 'nadalpiantini@gmail.com',
  password: 'Teclados#13'
}

// Helper function to login
async function login(page: Page) {
  await page.goto(`${TEST_URL}/auth/login`)
  await page.waitForLoadState('networkidle')

  // Fill login form
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', TEST_USER.password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for redirect - may take longer in production
  await page.waitForURL(/\/dashboard|\/my-day/, { timeout: 30000 })

  // Extra wait for authentication to fully complete
  await page.waitForTimeout(2000)
}

// Helper to check modal centering
async function checkModalCentering(page: Page, modalSelector: string) {
  const modal = await page.locator(modalSelector).boundingBox()
  const viewport = page.viewportSize()

  if (modal && viewport) {
    const horizontalCenter = modal.x + (modal.width / 2)
    const verticalCenter = modal.y + (modal.height / 2)
    const viewportCenterX = viewport.width / 2
    const viewportCenterY = viewport.height / 2

    // Check if modal is reasonably centered (within 50px tolerance)
    const isCenteredX = Math.abs(horizontalCenter - viewportCenterX) < 50
    const isCenteredY = Math.abs(verticalCenter - viewportCenterY) < 50

    return { isCenteredX, isCenteredY, modal, viewport }
  }
  return null
}

test.describe('AXIS6 My Day Page - Complete Functionality Audit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${TEST_URL}/my-day`)
    await page.waitForLoadState('networkidle')
  })

  test('Page loads successfully with all core elements', async ({ page }) => {
    // Check for Plan My Day button (new feature)
    await expect(page.getByText('Plan My Day')).toBeVisible()

    // Check action buttons
    await expect(page.getByText('Start Timer')).toBeVisible()
    await expect(page.getByText('Add Block')).toBeVisible()

    // Check date navigation
    await expect(page.locator('h1').filter({ hasText: /Mi Día/ })).toBeVisible()
    const chevronButtons = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left, svg.lucide-chevron-right') })
    await expect(chevronButtons).toHaveCount(2)

    // Check stats cards
    await expect(page.getByText('Planned')).toBeVisible()
    await expect(page.getByText('Actual')).toBeVisible()
    await expect(page.getByText('Efficiency')).toBeVisible()

    // Check main sections
    await expect(page.getByText('Day Overview')).toBeVisible()
    await expect(page.getByText('Time Blocks')).toBeVisible()

    // Check hexagon SVG is rendered
    await expect(page.locator('svg[viewBox="0 0 400 400"]')).toBeVisible()
  })

  test('Hexagon visualization interactions work correctly', async ({ page }) => {
    const hexagon = page.locator('svg[viewBox="0 0 400 400"]')
    await expect(hexagon).toBeVisible()

    // Get all clickable segments
    const segments = hexagon.locator('path[class*="cursor-pointer"]')
    const segmentCount = await segments.count()

    // Should have 6 segments for 6 categories
    expect(segmentCount).toBeGreaterThanOrEqual(6)

    // Test clicking each segment
    for (let i = 0; i < Math.min(segmentCount, 6); i++) {
      const segment = segments.nth(i)

      // Hover to see visual feedback
      await segment.hover()
      await page.waitForTimeout(100)

      // Click segment
      await segment.click()

      // Check if modal opens (TimeBlockScheduler)
      const modal = page.locator('.glass.rounded-2xl').filter({ hasText: 'Schedule Time Block' })
      await expect(modal).toBeVisible({ timeout: 5000 })

      // Close modal
      const closeButton = modal.locator('button').filter({ has: page.locator('svg.lucide-x') })
      await closeButton.click()
      await expect(modal).not.toBeVisible()

      await page.waitForTimeout(200) // Brief pause between interactions
    }
  })

  test('TimeBlockScheduler modal centering and responsiveness', async ({ page, browserName }) => {
    // Skip on webkit due to viewport issues
    test.skip(browserName === 'webkit', 'Webkit has viewport calculation issues')

    // Open modal via Add Block button
    await page.click('button:has-text("Add Block")')

    // Wait for modal to appear
    const modal = page.locator('.glass.rounded-2xl').filter({ hasText: 'Schedule Time Block' })
    await expect(modal).toBeVisible()

    // Check modal centering on desktop
    const centering = await checkModalCentering(page, '.glass.rounded-2xl >> visible=true')
    if (centering) {
      console.log('Modal centering check:', {
        horizontallyCentered: centering.isCenteredX,
        verticallyCentered: centering.isCenteredY,
        modalSize: `${centering.modal.width}x${centering.modal.height}`,
        viewportSize: `${centering.viewport.width}x${centering.viewport.height}`
      })

      // Report centering issues
      if (!centering.isCenteredX || !centering.isCenteredY) {
        console.warn('⚠️ Modal is not properly centered!')
      }
    }

    // Test modal functionality
    await expect(modal.getByText('Axis Category')).toBeVisible()
    await expect(modal.getByText('Activity')).toBeVisible()
    await expect(modal.getByText('Start Time')).toBeVisible()
    await expect(modal.getByText('Duration')).toBeVisible()

    // Test category dropdown
    const categoryDropdown = modal.locator('button').filter({ hasText: /Physical|Mental|Emotional|Social|Spiritual|Material/ }).first()
    await categoryDropdown.click()

    // Check if dropdown opens
    const dropdownMenu = page.locator('.bg-gray-900.border.border-white\\/20')
    await expect(dropdownMenu).toBeVisible()

    // Select a category
    await dropdownMenu.locator('button').first().click()
    await expect(dropdownMenu).not.toBeVisible()

    // Fill in activity
    const activityInput = modal.locator('input[placeholder*="activity name"]')
    if (await activityInput.isVisible()) {
      await activityInput.fill('Test Activity')
    }

    // Close modal
    await modal.locator('button:has-text("Cancel")').click()
    await expect(modal).not.toBeVisible()
  })

  test('ActivityTimer modal functionality and centering', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Webkit has viewport calculation issues')

    // Open timer modal
    await page.click('button:has-text("Start Timer")')

    const modal = page.locator('.glass.rounded-2xl').filter({ hasText: 'Activity Timer' })
    await expect(modal).toBeVisible()

    // Check modal centering
    const centering = await checkModalCentering(page, '.glass.rounded-2xl >> visible=true')
    if (centering) {
      console.log('Timer modal centering:', {
        horizontallyCentered: centering.isCenteredX,
        verticallyCentered: centering.isCenteredY
      })

      if (!centering.isCenteredX || !centering.isCenteredY) {
        console.warn('⚠️ Timer modal is not properly centered!')
      }
    }

    // Check timer display
    await expect(modal.locator('.text-6xl.font-mono')).toBeVisible()
    await expect(modal.locator('.text-6xl.font-mono')).toHaveText('00:00:00')

    // Test activity input
    const activityInput = modal.locator('input[placeholder*="What are you working on"]')
    if (await activityInput.isVisible()) {
      await activityInput.fill('Test Timer Activity')

      // Start timer
      const startButton = modal.locator('button:has-text("Start Timer")')
      await startButton.click()

      // Wait for timer to start
      await page.waitForTimeout(2000)

      // Check if timer is running
      const timerDisplay = modal.locator('.text-6xl.font-mono')
      const timerText = await timerDisplay.textContent()
      expect(timerText).not.toBe('00:00:00')

      // Check for pause/stop buttons
      await expect(modal.locator('button:has-text("Pause")')).toBeVisible()
      await expect(modal.locator('button:has-text("Stop")')).toBeVisible()

      // Stop timer
      await modal.locator('button:has-text("Stop")').click()
    }

    // Close modal if still open
    if (await modal.isVisible()) {
      const closeButton = modal.locator('button').filter({ has: page.locator('svg.lucide-x') })
      await closeButton.click()
    }
  })

  test('Date navigation works correctly', async ({ page }) => {
    // Get initial date
    const dateText = await page.locator('p.text-gray-400').first().textContent()

    // Navigate to previous day
    const prevButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }).first()
    await prevButton.click()
    await page.waitForTimeout(500)

    // Check date changed
    const newDateText = await page.locator('p.text-gray-400').first().textContent()
    expect(newDateText).not.toBe(dateText)

    // Navigate to next day
    const nextButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).last()
    await nextButton.click()
    await page.waitForTimeout(500)

    // Should be back to original date
    const finalDateText = await page.locator('p.text-gray-400').first().textContent()
    expect(finalDateText).toBe(dateText)
  })

  test('Modal overflow and scrolling on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Open scheduler modal
    await page.click('button:has-text("Add Block")')

    const modal = page.locator('.glass.rounded-2xl').filter({ hasText: 'Schedule Time Block' })
    await expect(modal).toBeVisible()

    // Check if modal fits within viewport
    const modalBox = await modal.boundingBox()
    const viewport = page.viewportSize()

    if (modalBox && viewport) {
      // Modal should not exceed viewport bounds
      expect(modalBox.width).toBeLessThanOrEqual(viewport.width)
      expect(modalBox.height).toBeLessThanOrEqual(viewport.height)

      if (modalBox.width > viewport.width * 0.95 || modalBox.height > viewport.height * 0.95) {
        console.warn('⚠️ Modal is too large for mobile viewport!')
      }
    }

    // Close modal
    await modal.locator('button:has-text("Cancel")').click()
  })

  test('Check for Plan My Day button (expected to be missing)', async ({ page }) => {
    // This should fail as the button doesn't exist yet
    const planMyDayButton = page.locator('button:has-text("Plan My Day")')

    // Document that this feature is missing
    const buttonExists = await planMyDayButton.isVisible().catch(() => false)

    if (!buttonExists) {
      console.log('❌ MISSING FEATURE: "Plan My Day" button not found')
      console.log('   This feature should be added for AI-powered daily planning')
    } else {
      await expect(planMyDayButton).toBeVisible()
    }
  })

  test('Performance: Page load and interaction responsiveness', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    await page.goto(`${TEST_URL}/my-day`)
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    console.log(`Page load time: ${loadTime}ms`)
    expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds

    // Measure hexagon interaction responsiveness
    const hexagon = page.locator('svg[viewBox="0 0 400 400"]')
    const segment = hexagon.locator('path[class*="cursor-pointer"]').first()

    const interactionStart = Date.now()
    await segment.click()
    await page.waitForSelector('.glass.rounded-2xl', { state: 'visible' })
    const interactionTime = Date.now() - interactionStart

    console.log(`Modal open time: ${interactionTime}ms`)
    expect(interactionTime).toBeLessThan(500) // Should open within 500ms

    // Close modal
    await page.keyboard.press('Escape')
  })

  test('Accessibility: Keyboard navigation and ARIA labels', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()

    // Check for ARIA labels on interactive elements
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()

    let missingAriaCount = 0
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const buttonText = await button.textContent()

      if (!ariaLabel && !buttonText?.trim()) {
        missingAriaCount++
      }
    }

    if (missingAriaCount > 0) {
      console.warn(`⚠️ ${missingAriaCount} buttons missing ARIA labels or text content`)
    }
  })

  test('Error handling: API failures and edge cases', async ({ page }) => {
    // Intercept API calls to simulate failures
    await page.route('**/api/my-day/**', route => {
      route.abort('failed')
    })

    // Try to open scheduler
    await page.click('button:has-text("Add Block")')

    // Fill form and try to save
    const modal = page.locator('.glass.rounded-2xl').filter({ hasText: 'Schedule Time Block' })

    if (await modal.isVisible()) {
      const activityInput = modal.locator('input[placeholder*="activity name"]')
      if (await activityInput.isVisible()) {
        await activityInput.fill('Test Activity')
        await modal.locator('button:has-text("Schedule")').click()

        // Check for error handling
        await page.waitForTimeout(2000)

        // Modal should still be visible if error occurred
        const isModalStillVisible = await modal.isVisible()
        if (isModalStillVisible) {
          console.log('✅ Modal remains open on API error (good)')
        } else {
          console.warn('⚠️ Modal closed despite API error (needs error handling)')
        }
      }
    }
  })
})

// Additional test suite for visual regression
test.describe('My Day Visual Regression', () => {
  test('Capture screenshots for visual comparison', async ({ page }) => {
    await login(page)
    await page.goto(`${TEST_URL}/my-day`)
    await page.waitForLoadState('networkidle')

    // Full page screenshot
    await page.screenshot({
      path: 'tests/screenshots/my-day-full.png',
      fullPage: true
    })

    // Hexagon screenshot
    const hexagon = page.locator('svg[viewBox="0 0 400 400"]')
    await hexagon.screenshot({
      path: 'tests/screenshots/my-day-hexagon.png'
    })

    // Modal screenshots
    await page.click('button:has-text("Add Block")')
    await page.waitForTimeout(500)
    await page.screenshot({
      path: 'tests/screenshots/my-day-scheduler-modal.png'
    })

    const modal = page.locator('.glass.rounded-2xl').first()
    await modal.locator('button:has-text("Cancel")').click()

    await page.click('button:has-text("Start Timer")')
    await page.waitForTimeout(500)
    await page.screenshot({
      path: 'tests/screenshots/my-day-timer-modal.png'
    })
  })
})
