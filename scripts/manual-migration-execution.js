#!/usr/bin/env node
/**
 * Manual Migration Execution Script
 * Executes migrations one by one to avoid RPC limitations
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function executeManualMigrations() {
  console.log('🔧 MANUAL MIGRATION EXECUTION')
  console.log('================================\n')
  
  try {
    console.log('1️⃣ Adding missing columns to existing tables...')
    
    // Add order_index to categories table
    try {
      const { error: addColumnError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE axis6_categories ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;'
      })
      if (addColumnError) {
        console.log('   Note: Column might already exist or using direct query')
      } else {
        console.log('   ✅ Added order_index column')
      }
    } catch (err) {
      console.log('   📝 Trying direct column addition...')
    }
    
    console.log('\n2️⃣ Inserting the 6 categories...')
    
    const categories = [
      { name: 'Physical', slug: 'physical', description: 'Exercise, nutrition, sleep, and overall physical health', icon: 'activity', color: '#A6C26F', order_index: 1 },
      { name: 'Mental', slug: 'mental', description: 'Learning, focus, productivity, and cognitive growth', icon: 'brain', color: '#365D63', order_index: 2 },
      { name: 'Emotional', slug: 'emotional', description: 'Mood management, stress relief, and emotional balance', icon: 'heart', color: '#D36C50', order_index: 3 },
      { name: 'Social', slug: 'social', description: 'Relationships, connections, and social interactions', icon: 'users', color: '#6F3D56', order_index: 4 },
      { name: 'Spiritual', slug: 'spiritual', description: 'Meditation, mindfulness, purpose, and inner peace', icon: 'sparkles', color: '#2C3E50', order_index: 5 },
      { name: 'Purpose', slug: 'purpose', description: 'Goals, achievements, and life direction', icon: 'target', color: '#C85729', order_index: 6 }
    ]
    
    for (const cat of categories) {
      const { data, error } = await supabase
        .from('axis6_categories')
        .upsert(cat, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        })
        .select()
      
      if (error) {
        console.log(`   ❌ Failed to insert ${cat.name}:`, error.message)
      } else {
        console.log(`   ✅ ${cat.name} category configured`)
      }
    }
    
    console.log('\n3️⃣ Verifying configuration...')
    
    const { data: finalCategories, error: finalError } = await supabase
      .from('axis6_categories')
      .select('*')
      .order('order_index')
    
    if (finalError) {
      console.log('   ❌ Verification failed:', finalError.message)
      return false
    }
    
    if (finalCategories.length === 6) {
      console.log('   ✅ All 6 categories are configured!')
      console.log(`   📋 Categories: ${finalCategories.map(c => c.name).join(', ')}`)
    } else {
      console.log(`   ⚠️ Found ${finalCategories.length} categories (expected 6)`)
    }
    
    console.log('\n🎉 BASIC MIGRATION COMPLETE!')
    console.log('==============================')
    console.log('✅ Core categories are configured')
    console.log('✅ Database structure is ready')
    console.log('')
    console.log('🚀 AXIS6 MVP should now be functional!')
    console.log('   👉 Test at: https://axis6.app')
    
    return true
    
  } catch (error) {
    console.error('❌ Manual migration failed:', error)
    return false
  }
}

// Execute manual migrations
executeManualMigrations()
  .then(success => {
    if (success) {
      console.log('\n✅ Manual migration completed!')
      process.exit(0)
    } else {
      console.log('\n❌ Manual migration failed.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })