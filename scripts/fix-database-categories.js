#!/usr/bin/env node
/**
 * AXIS6 Database Fix Script
 * Emergency fix for hexagon button issues
 * Removes the mysterious "smokecat" category and ensures exactly 6 categories
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixDatabase() {
  console.log('🔧 AXIS6 Database Fix - Removing Mysterious Categories\n')
  
  try {
    // 1. Pre-fix audit
    console.log('📊 PRE-FIX STATE')
    const { data: beforeCategories, error: beforeError } = await supabase
      .from('axis6_categories')
      .select('id, slug, name')
      .order('position')
    
    if (beforeError) throw beforeError
    
    console.log(`Categories before fix: ${beforeCategories.length}`)
    beforeCategories.forEach((cat, index) => {
      const englishName = cat.name?.en || 'Unknown'
      console.log(`${index + 1}. ${cat.slug} -> "${englishName}"`)
    })
    
    // 2. Identify the valid 6 categories (AXIS6 core)
    const validSlugs = ['physical', 'mental', 'emotional', 'social', 'spiritual', 'material']
    
    // 3. Find categories to remove (anything not in valid list)
    const categoriesToRemove = beforeCategories.filter(cat => !validSlugs.includes(cat.slug))
    
    if (categoriesToRemove.length === 0) {
      console.log('\n✅ No invalid categories found to remove')
      return
    }
    
    console.log(`\n🎯 CATEGORIES TO REMOVE: ${categoriesToRemove.length}`)
    categoriesToRemove.forEach(cat => {
      const englishName = cat.name?.en || 'Unknown'
      console.log(`❌ Removing: ${cat.slug} (ID: ${cat.id}) -> "${englishName}"`)
    })
    
    // 4. Check for related data (checkins, streaks) before deletion
    console.log('\n🔍 Checking for related data...')
    for (const cat of categoriesToRemove) {
      // Check checkins
      const { data: checkins, error: checkinsError } = await supabase
        .from('axis6_checkins')
        .select('id', { count: 'exact' })
        .eq('category_id', cat.id)
      
      if (checkinsError) throw checkinsError
      
      // Check streaks
      const { data: streaks, error: streaksError } = await supabase
        .from('axis6_streaks')
        .select('id', { count: 'exact' })
        .eq('category_id', cat.id)
      
      if (streaksError) throw streaksError
      
      console.log(`   ${cat.slug}: ${checkins.length || 0} checkins, ${streaks.length || 0} streaks`)
      
      // If there's user data, we need to be careful
      if ((checkins.length || 0) > 0 || (streaks.length || 0) > 0) {
        console.log(`   ⚠️  This category has user data - will clean up`)
        
        // Delete related checkins first
        if (checkins.length > 0) {
          const { error: deleteCheckinsError } = await supabase
            .from('axis6_checkins')
            .delete()
            .eq('category_id', cat.id)
          
          if (deleteCheckinsError) throw deleteCheckinsError
          console.log(`   ✅ Deleted ${checkins.length} checkins`)
        }
        
        // Delete related streaks
        if (streaks.length > 0) {
          const { error: deleteStreaksError } = await supabase
            .from('axis6_streaks')
            .delete()
            .eq('category_id', cat.id)
          
          if (deleteStreaksError) throw deleteStreaksError
          console.log(`   ✅ Deleted ${streaks.length} streaks`)
        }
      }
    }
    
    // 5. Delete the invalid categories
    console.log('\n💥 PERFORMING DELETION')
    for (const cat of categoriesToRemove) {
      const { error: deleteCategoryError } = await supabase
        .from('axis6_categories')
        .delete()
        .eq('id', cat.id)
      
      if (deleteCategoryError) throw deleteCategoryError
      
      const englishName = cat.name?.en || 'Unknown'
      console.log(`✅ Deleted category: ${cat.slug} -> "${englishName}"`)
    }
    
    // 6. Post-fix verification
    console.log('\n📊 POST-FIX VERIFICATION')
    const { data: afterCategories, error: afterError } = await supabase
      .from('axis6_categories')
      .select('id, slug, name')
      .order('position')
    
    if (afterError) throw afterError
    
    console.log(`Categories after fix: ${afterCategories.length}`)
    afterCategories.forEach((cat, index) => {
      const englishName = cat.name?.en || 'Unknown'
      console.log(`${index + 1}. ${cat.slug} -> "${englishName}"`)
    })
    
    // 7. Final status
    if (afterCategories.length === 6) {
      console.log('\n🎉 SUCCESS! Database now has exactly 6 categories')
      console.log('✅ Hexagon buttons should now work properly')
      console.log('🚀 Deploy the code safeguards and test production')
    } else {
      console.log(`\n❌ WARNING: Still have ${afterCategories.length} categories (expected 6)`)
      console.log('   Manual intervention may be required')
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
    console.error('   Database may be in inconsistent state')
    process.exit(1)
  }
}

// Confirmation prompt
if (process.argv.includes('--force')) {
  fixDatabase()
} else {
  console.log('🚨 AXIS6 DATABASE FIX - EMERGENCY REPAIR')
  console.log('=====================================')
  console.log('')
  console.log('This will PERMANENTLY DELETE the mysterious "smokecat" category')
  console.log('and any associated user data (checkins, streaks).')
  console.log('')
  console.log('⚠️  This action CANNOT be undone!')
  console.log('')
  console.log('To proceed, run: node scripts/fix-database-categories.js --force')
  console.log('')
}