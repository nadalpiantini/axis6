#!/usr/bin/env node
/**
 * Inspect Database Schema
 * Check actual table structure in production
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspectSchema() {
  console.log('🔍 INSPECTING DATABASE SCHEMA')
  console.log('==============================\n')
  
  try {
    console.log('1️⃣ Checking categories table structure...')
    
    // Get one category to see the actual structure
    const { data: categories, error: catError } = await supabase
      .from('axis6_categories')
      .select('*')
      .limit(1)
    
    if (catError) {
      console.log('   ❌ Cannot query categories:', catError.message)
      return
    }
    
    if (categories && categories.length > 0) {
      console.log('   ✅ Categories table accessible')
      console.log('   📋 Sample category structure:')
      console.log('   ', JSON.stringify(categories[0], null, 6))
      console.log('')
      console.log('   🔑 Available columns:', Object.keys(categories[0]).join(', '))
    }
    
    console.log('\n2️⃣ Checking all categories...')
    
    const { data: allCategories, error: allError } = await supabase
      .from('axis6_categories')
      .select('*')
    
    if (allError) {
      console.log('   ❌ Error:', allError.message)
    } else {
      console.log(`   ✅ Found ${allCategories.length} categories:`)
      allCategories.forEach(cat => {
        console.log(`      • ${cat.name || cat.title} (${cat.slug})`)
      })
    }
    
    console.log('\n3️⃣ Testing other core tables...')
    
    const tables = ['axis6_checkins', 'axis6_streaks', 'axis6_profiles']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`)
      } else {
        console.log(`   ✅ ${table}: Accessible (${data.length} sample records)`)
        if (data.length > 0) {
          console.log(`      🔑 Columns: ${Object.keys(data[0]).join(', ')}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Schema inspection failed:', error)
  }
}

// Execute inspection
inspectSchema()