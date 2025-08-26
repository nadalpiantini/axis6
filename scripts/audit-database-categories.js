#!/usr/bin/env node
/**
 * AXIS6 Database Audit Script
 * Emergency audit to diagnose hexagon button issues
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function auditDatabase() {
  console.log('🔍 AXIS6 Database Audit - Category Analysis\n')
  
  try {
    // 1. Check total category count
    console.log('📊 CATEGORY COUNT ANALYSIS')
    const { data: countData, error: countError } = await supabase
      .from('axis6_categories')
      .select('id', { count: 'exact' })
    
    if (countError) throw countError
    
    console.log(`Total categories: ${countData.length}`)
    console.log(`❌ EXPECTED: 6 categories`)
    console.log(`${countData.length === 6 ? '✅' : '❌'} ACTUAL: ${countData.length} categories\n`)
    
    // 2. Check category details
    console.log('📋 CATEGORY DETAILS')
    const { data: categories, error: categoriesError } = await supabase
      .from('axis6_categories')
      .select('*')
      .order('position')
    
    if (categoriesError) throw categoriesError
    
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. Slug: "${cat.slug}"`)
      console.log(`   Name: ${typeof cat.name === 'string' ? cat.name : JSON.stringify(cat.name)}`)
      console.log(`   Color: ${cat.color}`)
      console.log(`   Position: ${cat.position}`)
      console.log('')
    })
    
    // 3. Check for duplicates
    console.log('🔍 DUPLICATE ANALYSIS')
    const slugCounts = {}
    categories.forEach(cat => {
      slugCounts[cat.slug] = (slugCounts[cat.slug] || 0) + 1
    })
    
    const duplicates = Object.entries(slugCounts).filter(([, count]) => count > 1)
    if (duplicates.length > 0) {
      console.log('❌ DUPLICATES FOUND:')
      duplicates.forEach(([slug, count]) => {
        console.log(`   "${slug}": ${count} entries`)
      })
    } else {
      console.log('✅ No duplicate slugs found')
    }
    
    // 4. Check JSONB structure
    console.log('\n🏗️ JSONB STRUCTURE ANALYSIS')
    categories.forEach((cat, index) => {
      const nameType = typeof cat.name
      let nameStructure = 'INVALID'
      let englishName = 'MISSING'
      
      if (nameType === 'object' && cat.name) {
        nameStructure = 'OBJECT'
        englishName = cat.name.en || 'MISSING'
      } else if (nameType === 'string') {
        try {
          const parsed = JSON.parse(cat.name)
          nameStructure = 'STRING_JSON'
          englishName = parsed.en || 'MISSING'
        } catch {
          nameStructure = 'STRING_INVALID'
          englishName = cat.name
        }
      }
      
      console.log(`${index + 1}. ${cat.slug}: ${nameStructure} -> "${englishName}"`)
    })
    
    // 5. Summary and recommendations
    console.log('\n🎯 DIAGNOSIS SUMMARY')
    console.log('==================')
    
    if (categories.length > 6) {
      console.log(`❌ CRITICAL: ${categories.length} categories (expected 6)`)
      console.log(`   This breaks hexagon layout designed for exactly 6 buttons`)
    }
    
    const invalidNames = categories.filter(cat => {
      const nameType = typeof cat.name
      if (nameType === 'object') return !cat.name?.en
      if (nameType === 'string') {
        try {
          const parsed = JSON.parse(cat.name)
          return !parsed.en
        } catch {
          return true
        }
      }
      return true
    })
    
    if (invalidNames.length > 0) {
      console.log(`❌ CRITICAL: ${invalidNames.length} categories with invalid JSONB names`)
      invalidNames.forEach(cat => {
        console.log(`   "${cat.slug}": ${JSON.stringify(cat.name)}`)
      })
    }
    
    // 6. Recommended fixes
    console.log('\n🔧 RECOMMENDED FIXES')
    console.log('===================')
    
    if (categories.length > 6) {
      console.log('1. Remove excess categories (keep only the original 6)')
    }
    
    if (duplicates.length > 0) {
      console.log('2. Remove duplicate entries')
    }
    
    if (invalidNames.length > 0) {
      console.log('3. Fix JSONB structure for all categories')
    }
    
    console.log('\nRun fix-database-categories.js to apply repairs')
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message)
    process.exit(1)
  }
}

auditDatabase()