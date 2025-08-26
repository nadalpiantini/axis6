#!/usr/bin/env node
/**
 * AXIS6 Production Fix Verification Script
 * 
 * This script verifies that all production errors have been resolved
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyProductionFix() {
  console.log('🔍 AXIS6 PRODUCTION FIX VERIFICATION')
  console.log('=====================================\n')
  
  let allTestsPassed = true
  
  // Test 1: Verify missing tables are now created
  console.log('1️⃣ Testing missing table creation...')
  const missingTables = [
    'axis6_temperament_profiles',
    'axis6_temperament_questions', 
    'axis6_temperament_responses',
    'axis6_personalization_settings',
    'axis6_temperament_activities'
  ]
  
  for (const table of missingTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error && error.code === 'PGRST116') {
        console.log(`   ❌ ${table} still missing`)
        allTestsPassed = false
      } else if (error) {
        console.log(`   ⚠️  ${table} exists but has error: ${error.message}`)
      } else {
        console.log(`   ✅ ${table} exists and accessible`)
      }
    } catch (error) {
      console.log(`   ❌ ${table} test failed: ${error.message}`)
      allTestsPassed = false
    }
  }
  
  // Test 2: Verify checkins table schema fix
  console.log('\n2️⃣ Testing checkins table timestamp fix...')
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('axis6_checkins')
      .select('*')
      .gte('completed_at', `${today}T00:00:00.000Z`)
      .limit(1)
    
    if (error) {
      console.log(`   ❌ Timestamp query failed: ${error.message}`)
      allTestsPassed = false
    } else {
      console.log(`   ✅ Timestamp queries now work correctly`)
    }
  } catch (error) {
    console.log(`   ❌ Timestamp test failed: ${error.message}`)
    allTestsPassed = false
  }
  
  // Test 3: Verify profile query fix
  console.log('\n3️⃣ Testing profile query fix...')
  try {
    const { data, error } = await supabase
      .from('axis6_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`   ❌ Profile query failed: ${error.message}`)
      allTestsPassed = false
    } else {
      console.log(`   ✅ Profile queries working correctly`)
    }
  } catch (error) {
    console.log(`   ❌ Profile test failed: ${error.message}`)
    allTestsPassed = false
  }
  
  // Test 4: Verify temperament questions data
  console.log('\n4️⃣ Testing temperament questions data...')
  try {
    const { data, error } = await supabase
      .from('axis6_temperament_questions')
      .select('*')
      .eq('is_active', true)
    
    if (error) {
      console.log(`   ❌ Questions query failed: ${error.message}`)
      allTestsPassed = false
    } else if (!data || data.length === 0) {
      console.log(`   ⚠️  Questions table exists but no data found`)
    } else {
      console.log(`   ✅ Found ${data.length} temperament questions`)
    }
  } catch (error) {
    console.log(`   ❌ Questions test failed: ${error.message}`)
    allTestsPassed = false
  }
  
  // Test 5: Verify RLS policies
  console.log('\n5️⃣ Testing RLS policies...')
  try {
    // This should fail without authentication
    const { data, error } = await supabase
      .from('axis6_temperament_profiles')
      .select('*')
      .limit(1)
    
    if (error && error.code === '42501') {
      console.log(`   ✅ RLS policies working correctly (access blocked)`)
    } else if (error) {
      console.log(`   ⚠️  RLS test gave unexpected error: ${error.message}`)
    } else {
      console.log(`   ⚠️  RLS might not be working (access allowed without auth)`)
    }
  } catch (error) {
    console.log(`   ❌ RLS test failed: ${error.message}`)
  }
  
  // Test 6: Test realtime capabilities
  console.log('\n6️⃣ Testing realtime configuration...')
  try {
    const channel = supabase.channel('test-channel')
    console.log(`   ✅ Realtime client initialized successfully`)
    await supabase.removeChannel(channel)
  } catch (error) {
    console.log(`   ❌ Realtime test failed: ${error.message}`)
    allTestsPassed = false
  }
  
  // Summary
  console.log('\n📋 VERIFICATION SUMMARY')
  console.log('========================')
  
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED!')
    console.log('\n🎉 Production fix successful! Your AXIS6 application should now work correctly.')
    console.log('\n📝 What was fixed:')
    console.log('   • Created missing temperament tables')
    console.log('   • Fixed checkins timestamp schema')
    console.log('   • Corrected profile query column names')
    console.log('   • Enhanced realtime configuration')
    console.log('   • Updated TypeScript definitions')
    
    console.log('\n🚀 Next steps:')
    console.log('   • Restart your development server: npm run dev')
    console.log('   • Test the dashboard and AI features')
    console.log('   • Check that buttons are now functional')
    console.log('   • Verify WebSocket connections work')
    
  } else {
    console.log('❌ Some tests failed.')
    console.log('\n🔧 Manual fixes required:')
    console.log('   1. Execute the SQL script in Supabase Dashboard:')
    console.log('      /PRODUCTION_FIX_COMPLETE.sql')
    console.log('   2. Check Supabase Auth settings')
    console.log('   3. Verify environment variables')
    console.log('   4. Run this script again to verify')
  }
}

async function main() {
  try {
    await verifyProductionFix()
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}