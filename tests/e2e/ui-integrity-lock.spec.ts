import { test, expect } from '@playwright/test'

/**
 * 🔒 UI INTEGRITY LOCK TESTS
 * 
 * Estos tests DEBEN pasar SIEMPRE.
 * Si fallan, significa que alguien rompió la línea gráfica perfecta.
 * 
 * Referencia: axis6-ny3k5zpfc.vercel.app/dashboard
 * Commit base: b8d8a72
 */

test.describe('🛡️ UI Specification Lock - CRITICAL', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login')
    
    // Login rápido para tests
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('🎯 HEXAGON SPECIFICATION - NEVER CHANGE', async ({ page }) => {
    // 1. Verificar que existe el SVG exacto
    const svg = page.locator('svg[viewBox="0 0 400 400"]')
    await expect(svg).toBeVisible()
    await expect(svg).toHaveAttribute('viewBox', '0 0 400 400')
    
    // 2. Verificar las 6 círculos exactos (r="30")
    const circles = page.locator('svg circle[r="30"]')
    await expect(circles).toHaveCount(6)
    
    // 3. Verificar gradiente púrpura→coral
    const gradient = page.locator('#gradient')
    await expect(gradient).toBeVisible()
    
    // 4. Verificar HexagonVisualization wrapper
    const hexagonContainer = page.getByTestId('hexagon-chart')
    await expect(hexagonContainer).toBeVisible()
    
    // 5. Verificar responsive classes exactas
    await expect(svg).toHaveClass(/max-w-\[280px\]/)
    await expect(svg).toHaveClass(/sm:max-w-\[350px\]/)
    await expect(svg).toHaveClass(/md:max-w-\[400px\]/)
  })

  test('📐 LAYOUT GRID - IMMUTABLE', async ({ page }) => {
    // Verificar grid principal (lg:grid-cols-3)
    const mainGrid = page.locator('div[role="region"][aria-label*="dashboard"]')
    await expect(mainGrid).toHaveClass(/grid-cols-1/)
    await expect(mainGrid).toHaveClass(/lg:grid-cols-3/)
    
    // Verificar hexagon section (2/3 columnas)
    const hexagonSection = page.locator('.lg\\:col-span-2')
    await expect(hexagonSection).toBeVisible()
  })

  test('🎨 COMPONENT NAMES - LOCKED', async ({ page }) => {
    // Verificar que el data-testid correcto existe
    await expect(page.getByTestId('hexagon-chart')).toBeVisible()
    await expect(page.getByTestId('category-cards')).toBeVisible()
    
    // Verificar estructura del header
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('🚨 CRITICAL ELEMENTS INTEGRITY', async ({ page }) => {
    // 1. LogoFull debe estar centrado
    const logo = page.locator('img[alt*="AXIS6"]').first()
    await expect(logo).toBeVisible()
    
    // 2. StandardHeader con streak
    const header = page.locator('header')
    await expect(header).toBeVisible()
    
    // 3. Stats panel a la derecha
    const statsSection = page.locator('.space-y-4, .space-y-6').first()
    await expect(statsSection).toBeVisible()
    
    // 4. Category cards grid
    const categoryCards = page.getByTestId('category-cards')
    await expect(categoryCards).toBeVisible()
    await expect(categoryCards).toHaveClass(/grid-cols-1/)
    await expect(categoryCards).toHaveClass(/sm:grid-cols-2/)
  })

  test('⚠️ BREAKPOINT ALERT - Detect UI Changes', async ({ page }) => {
    // Test que falla si cambian componentes críticos
    const currentHtml = await page.locator('div[data-testid="hexagon-chart"]').innerHTML()
    
    // Este string debe existir SIEMPRE en el hexágono
    expect(currentHtml).toContain('viewBox="0 0 400 400"')
    expect(currentHtml).toContain('circle')
    expect(currentHtml).toContain('r="30"')
    
    // Si estos elementos no existen, la UI fue modificada
    await expect(page.locator('polygon')).toHaveCount(2) // Background + progress
    await expect(page.locator('circle[r="30"]')).toHaveCount(6) // 6 axis circles
  })
})

/**
 * 🚨 SI ESTOS TESTS FALLAN:
 * 
 * 1. STOP - No continúes
 * 2. Ejecuta: git checkout b8d8a72 -- app/dashboard/page.tsx  
 * 3. Ejecuta: npm run dev
 * 4. Verifica que pasan los tests
 * 5. Investiga qué rompió el diseño
 * 
 * 📞 CONTACT NEEDED si los tests fallan consistentemente.
 */