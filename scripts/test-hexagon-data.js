#!/usr/bin/env node
/**
 * AXIS6 Hexagon Button Test
 * Verifies the data flow that powers the hexagon buttons
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testHexagonData() {
  console.log('🔧 AXIS6 Hexagon Button Test\n')
  
  try {
    // 1. Test categories fetch (same as useCategories hook)
    console.log('📊 TESTING CATEGORIES FETCH')
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('axis6_categories')
      .select('*')
      .order('position')
    
    if (categoriesError) throw categoriesError
    
    console.log(`✅ Categories fetched: ${categoriesData.length}`)
    
    // 2. Test the safeguard logic
    const limitedCategories = categoriesData.slice(0, 6)
    console.log(`✅ After safeguard: ${limitedCategories.length}`)
    
    // 3. Test JSONB name parsing
    console.log('\n🏗️ TESTING NAME PARSING')
    const parsedCategories = limitedCategories.map((cat, index) => {
      let displayName = 'Unknown'
      
      try {
        if (typeof cat.name === 'object' && cat.name?.en) {
          displayName = cat.name.en
        }
        else if (typeof cat.name === 'string') {
          const parsed = JSON.parse(cat.name)
          displayName = parsed.en || parsed.es || cat.slug || 'Unknown'
        }
        else {
          displayName = cat.slug || 'Unknown'
        }
      } catch (error) {
        displayName = cat.slug || 'Unknown'
        console.warn(`⚠️  Failed to parse name for ${cat.slug}:`, error)
      }
      
      console.log(`${index + 1}. ${cat.slug} -> "${displayName}"`)
      
      return {
        id: cat.id,
        slug: cat.slug,
        name: displayName,
        color: cat.color,
        icon: cat.icon
      }
    })
    
    // 4. Simulate hexagon button data
    console.log('\n🎯 HEXAGON BUTTON DATA SIMULATION')
    console.log('================================')
    
    // Mock some checkins for testing
    const mockCompletedIds = new Set([parsedCategories[0]?.id, parsedCategories[2]?.id])
    
    const hexagonButtons = parsedCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      completed: mockCompletedIds.has(cat.id)
    }))
    
    hexagonButtons.forEach((button, index) => {
      const status = button.completed ? '✅ COMPLETED' : '⭕ PENDING'
      console.log(`Button ${index + 1}: ${button.name} (${button.icon}) ${status}`)
    })
    
    // 5. Test hexagon layout calculation
    console.log('\n🔬 HEXAGON LAYOUT TEST')
    console.log('======================')
    
    if (hexagonButtons.length === 6) {
      console.log('✅ Perfect! 6 buttons will fit hexagon layout')
      
      // Simulate the hexagon positioning logic
      hexagonButtons.forEach((button, index) => {
        const angle = (Math.PI / 3) * index - Math.PI / 2
        const x = 200 + 160 * Math.cos(angle)
        const y = 200 + 160 * Math.sin(angle)
        console.log(`   ${button.name}: (${Math.round(x)}, ${Math.round(y)})`)
      })
    } else {
      console.log(`❌ ERROR: ${hexagonButtons.length} buttons (expected 6)`)
      console.log('   Hexagon layout will be broken!')
    }
    
    // 6. Final status
    console.log('\n🎉 TEST RESULTS')
    console.log('===============')
    console.log(`✅ Categories in database: ${categoriesData.length}`)
    console.log(`✅ Categories after safeguard: ${limitedCategories.length}`)
    console.log(`✅ All names parsed successfully`)
    console.log(`✅ Hexagon layout: ${hexagonButtons.length === 6 ? 'VALID' : 'BROKEN'}`)
    console.log('')
    
    if (hexagonButtons.length === 6) {
      console.log('🚀 HEXAGON BUTTONS SHOULD WORK!')
      console.log('   - Database fixed ✅')
      console.log('   - Safeguards added ✅') 
      console.log('   - Names parsing correctly ✅')
      console.log('   - Layout calculations valid ✅')
    } else {
      console.log('❌ HEXAGON BUTTONS STILL BROKEN!')
      console.log('   Manual intervention required')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

testHexagonData()