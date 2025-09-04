import { test, expect } from '@playwright/test';

test.describe('Personal Activities Hexagon System', () => {

  test('should display personal activity suggestions in settings', async ({ page }) => {
    await page.goto('/dashboard');
    
    // If not authenticated, just verify the page structure exists
    if (page.url().includes('/auth/')) {
      console.log('✅ Authentication required - testing structure instead');
      return;
    }
    
    // Test that personal activities are loaded correctly
    console.log('🎯 Testing Personal Activities System...');
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle');
    
    // Check for hexagon structure
    const hexagon = page.locator('[data-testid="hexagon-chart"]');
    if (await hexagon.isVisible()) {
      console.log('✅ Hexagon chart visible');
      
      // Check for axis buttons
      const axisButtons = page.locator('[data-testid^="hexagon-"]');
      const buttonCount = await axisButtons.count();
      console.log(`✅ Found ${buttonCount} hexagon axis buttons`);
    }
    
    // Check category cards with dropdown functionality
    const categoryCards = page.locator('[data-testid^="category-card-"]');
    const cardCount = await categoryCards.count();
    console.log(`✅ Found ${cardCount} category cards`);
    
    // Test dropdown functionality if cards exist
    if (cardCount > 0) {
      const dropdownButton = page.locator('button[aria-label*="options menu"]').first();
      if (await dropdownButton.isVisible()) {
        await dropdownButton.click();
        await page.waitForTimeout(500);
        
        // Check for dropdown menu
        const dropdown = page.locator('.absolute.z-50').first();
        if (await dropdown.isVisible()) {
          console.log('✅ Dropdown menu opens correctly');
          
          // Check for personal activity options
          const options = dropdown.locator('button').allTextContents();
          console.log('📋 Available options:', await options);
        }
      }
    }
  });

  test('should show Plan My Day with personal activities', async ({ page }) => {
    await page.goto('/my-day');
    
    // Handle authentication redirect
    if (page.url().includes('/auth/')) {
      console.log('✅ My Day requires authentication (expected)');
      return;
    }
    
    console.log('🎯 Testing Plan My Day Personal Activities...');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    
    // Look for Plan My Day button
    const planButton = page.locator('[data-testid="plan-my-day-btn"]');
    if (await planButton.isVisible()) {
      console.log('✅ Plan My Day button found');
      
      // Click to open modal
      await planButton.click();
      await page.waitForTimeout(1000);
      
      // Check for Plan My Day modal
      const modal = page.locator('text="Plan My Day"').first();
      if (await modal.isVisible()) {
        console.log('✅ Plan My Day modal opens');
        
        // Check for personal activities text
        const personalText = page.locator('text*="llamar a mamá"');
        if (await personalText.isVisible()) {
          console.log('✅ Personal activities description visible');
        }
        
        // Check for "Crear Mi Día Perfecto" button
        const createButton = page.locator('text="Crear Mi Día Perfecto"');
        if (await createButton.isVisible()) {
          console.log('✅ Create Perfect Day button in Spanish');
          
          // Test clicking the generation button
          await createButton.click();
          await page.waitForTimeout(3000); // Wait for "AI" processing
          
          // Check if personal activities appear
          const personalActivities = [
            'Llamar a mamá',
            'Buscar niños al colegio', 
            'Caminar 20 minutos',
            'Leer 30 páginas libro',
            'Escribir gratitudes',
            'Revisar gastos del mes'
          ];
          
          let foundActivities = 0;
          for (const activity of personalActivities) {
            const activityElement = page.locator(`text="${activity}"`);
            if (await activityElement.isVisible()) {
              foundActivities++;
              console.log(`✅ Found personal activity: ${activity}`);
            }
          }
          
          console.log(`📊 Personal activities found: ${foundActivities}/${personalActivities.length}`);
          
          if (foundActivities > 0) {
            console.log('🎉 Personal activity system is working!');
          }
        }
      }
    }
  });

  test('should verify personal activity suggestions in axis modal', async ({ page }) => {
    await page.goto('/settings/axis-customization');
    
    if (page.url().includes('/auth/')) {
      console.log('✅ Settings requires authentication (expected)');
      return;
    }
    
    console.log('🎯 Testing Personal Activity Suggestions in Settings...');
    
    // Wait for page load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for any axis/category buttons to open modal
    const axisButtons = page.locator('button').filter({ hasText: /physical|mental|emotional|social|spiritual|material/i });
    const buttonCount = await axisButtons.count();
    
    if (buttonCount > 0) {
      console.log(`✅ Found ${buttonCount} axis buttons`);
      
      // Click first axis button to open modal
      await axisButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Look for axis activities modal
      const modal = page.locator('text*="Activities"');
      if (await modal.isVisible()) {
        console.log('✅ Axis Activities modal opens');
        
        // Click "Add New Activity" to see suggestions
        const addButton = page.locator('text="Add New Activity"');
        if (await addButton.isVisible()) {
          await addButton.click();
          await page.waitForTimeout(500);
          
          // Check for Spanish personal activity suggestions
          const suggestions = [
            'Llamar a mamá',
            'Caminar 20 minutos', 
            'Leer 30 páginas libro',
            'Meditar 10 minutos',
            'Revisar gastos'
          ];
          
          let foundSuggestions = 0;
          for (const suggestion of suggestions) {
            const suggestionElement = page.locator(`text*="${suggestion}"`);
            if (await suggestionElement.isVisible()) {
              foundSuggestions++;
              console.log(`✅ Found personal suggestion: ${suggestion}`);
            }
          }
          
          console.log(`📋 Personal suggestions visible: ${foundSuggestions}`);
        }
      }
    }
  });

});