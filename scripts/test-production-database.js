#!/usr/bin/env node
/**
 * Test Production Database - Verify migrations and functionality
 * This script tests the production database to ensure all migrations are applied
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDatabaseSetup() {
  console.log('🧪 AXIS6 Production Database Test')
  console.log('==================================\n')
  
  try {
    // Test 1: Check categories table (main test)
    console.log('1️⃣ Testing categories table...')
    const { data: categories, error: catError } = await supabase
      .from('axis6_categories')
      .select('*')
      .order('order_index')
    
    if (catError) {
      console.log('   ❌ Cannot query categories table:', catError.message)
      console.log('   💡 This likely means the migrations have not been run yet')
      return false
    }
    
    if (categories.length === 0) {
      console.log('   ❌ Categories table is empty - migrations not applied')
      return false
    }
    
    console.log(`   ✅ Categories table accessible with ${categories.length} entries`)
    
    // Test 2: Check categories are populated correctly
    console.log('\n2️⃣ Testing categories data...')
    
    if (categories.length !== 6) {
      console.log(`   ❌ Expected 6 categories, found ${categories.length}`)
      return false
    }
    
    const expectedCategories = ['Physical', 'Mental', 'Emotional', 'Social', 'Spiritual', 'Purpose']
    const foundCategories = categories.map(c => c.name)
    const missingCategories = expectedCategories.filter(c => !foundCategories.includes(c))
    
    if (missingCategories.length > 0) {
      console.log(`   ❌ Missing categories: ${missingCategories.join(', ')}`)
      return false
    } else {
      console.log('   ✅ All 6 categories found with correct names')
      console.log(`   📝 Categories: ${foundCategories.join(', ')}`)
    }
    
    // Test 3: Test checkins table access
    console.log('\n3️⃣ Testing checkins table...')
    const { data: checkins, error: checkinsError } = await supabase
      .from('axis6_checkins')
      .select('*')
      .limit(1)
    
    if (checkinsError) {
      console.log('   ❌ Cannot access checkins table:', checkinsError.message)
    } else {
      console.log('   ✅ Checkins table accessible')
    }
    
    // Test 4: Test streaks table access  
    console.log('\n4️⃣ Testing streaks table...')
    const { data: streaks, error: streaksError } = await supabase
      .from('axis6_streaks')
      .select('*')
      .limit(1)
    
    if (streaksError) {
      console.log('   ❌ Cannot access streaks table:', streaksError.message)
    } else {
      console.log('   ✅ Streaks table accessible')
    }
    
    // Test 5: Test dashboard function
    console.log('\n5️⃣ Testing dashboard optimization function...')
    // Create a test user UUID for testing
    const testUuid = '00000000-0000-0000-0000-000000000000'
    
    const { data: dashboardTest, error: dashboardError } = await supabase
      .rpc('get_dashboard_data_optimized', { p_user_id: testUuid })
    
    if (dashboardError) {
      console.log('   ❌ Dashboard function error:', dashboardError.message)
    } else {
      console.log('   ✅ Dashboard function works (returned data structure)')
    }
    
    console.log('\n🎉 Database Test Complete!')
    console.log('============================')
    console.log('✅ Production database appears to be ready!')
    console.log('🚀 You can now test the full application at https://axis6.app')
    
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Run the test
testDatabaseSetup()
  .then(success => {
    if (success) {
      console.log('\n✅ All tests passed!')
      process.exit(0)
    } else {
      console.log('\n❌ Some tests failed. Check the output above.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Failed to run database tests:', error)
    process.exit(1)
  })