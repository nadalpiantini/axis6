#!/usr/bin/env node
/**
 * Simple Categories Insert
 * Inserts the 6 basic categories without order_index
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function insertBasicCategories() {
  console.log('📝 INSERTING BASIC CATEGORIES')
  console.log('==============================\n')
  
  try {
    console.log('Checking existing table structure...')
    
    const { data: existingCategories, error: checkError } = await supabase
      .from('axis6_categories')
      .select('*')
      .limit(1)
    
    if (checkError) {
      console.log('   ❌ Cannot access categories table:', checkError.message)
      return false
    }
    
    console.log('   ✅ Categories table is accessible')
    
    const categories = [
      { name: 'Physical', slug: 'physical', description: 'Exercise, nutrition, sleep, and overall physical health', icon: 'activity', color: '#A6C26F' },
      { name: 'Mental', slug: 'mental', description: 'Learning, focus, productivity, and cognitive growth', icon: 'brain', color: '#365D63' },
      { name: 'Emotional', slug: 'emotional', description: 'Mood management, stress relief, and emotional balance', icon: 'heart', color: '#D36C50' },
      { name: 'Social', slug: 'social', description: 'Relationships, connections, and social interactions', icon: 'users', color: '#6F3D56' },
      { name: 'Spiritual', slug: 'spiritual', description: 'Meditation, mindfulness, purpose, and inner peace', icon: 'sparkles', color: '#2C3E50' },
      { name: 'Purpose', slug: 'purpose', description: 'Goals, achievements, and life direction', icon: 'target', color: '#C85729' }
    ]
    
    console.log('Inserting categories...')
    
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
        console.log(`   ✅ ${cat.name} category inserted`)
      }
    }
    
    console.log('\nVerifying final result...')
    
    const { data: finalCategories, error: finalError } = await supabase
      .from('axis6_categories')
      .select('*')
    
    if (finalError) {
      console.log('   ❌ Verification failed:', finalError.message)
      return false
    }
    
    console.log(`   ✅ Found ${finalCategories.length} categories in database`)
    console.log(`   📋 Categories: ${finalCategories.map(c => c.name).join(', ')}`)
    
    if (finalCategories.length >= 6) {
      console.log('\n🎉 SUCCESS!')
      console.log('✅ All required categories are configured')
      console.log('✅ AXIS6 MVP should now work!')
      console.log('')
      console.log('🚀 Test the application at: https://axis6.app')
      return true
    } else {
      console.log('\n⚠️ Some categories may be missing')
      return false
    }
    
  } catch (error) {
    console.error('❌ Category insertion failed:', error)
    return false
  }
}

// Execute category insertion
insertBasicCategories()
  .then(success => {
    if (success) {
      console.log('\n✅ Categories configured successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Category configuration failed.')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })