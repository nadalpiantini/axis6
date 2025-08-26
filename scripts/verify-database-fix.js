#!/usr/bin/env node

/**
 * Verification script to confirm database fixes are applied
 * Run after executing PRODUCTION_FIX_SAFE.sql in Supabase
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyDatabaseFix() {
  console.log('🔍 Verifying Database Fix...\n')
  console.log('================================')
  
  let allTestsPassed = true
  const results = {
    tables: {},
    queries: {},
    policies: {}
  }
  
  // Test 1: Check all required tables exist
  console.log('\n📊 CHECKING TABLES EXISTENCE:')
  const requiredTables = [
    'axis6_categories',
    'axis6_checkins', 
    'axis6_profiles',
    'axis6_streaks',
    'axis6_daily_stats',
    'axis6_mantras',
    'axis6_user_mantras',
    'axis6_temperament_profiles',
    'axis6_temperament_questions',
    'axis6_temperament_responses',
    'axis6_personalization_settings',
    'axis6_temperament_activities'
  ]
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0)
      
      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`)
        results.tables[table] = 'ERROR'
        allTestsPassed = false
      } else {
        console.log(`✅ ${table}: EXISTS`)
        results.tables[table] = 'OK'
      }
    } catch (err) {
      console.log(`❌ ${table}: EXCEPTION - ${err.message}`)
      results.tables[table] = 'EXCEPTION'
      allTestsPassed = false
    }
  }
  
  // Test 2: Check temperament questions were inserted
  console.log('\n📝 CHECKING TEMPERAMENT QUESTIONS:')
  try {
    const { data: questions, error } = await supabase
      .from('axis6_temperament_questions')
      .select('*')
      .eq('is_active', true)
    
    if (error) {
      console.log(`❌ Questions query failed: ${error.message}`)
      results.queries.temperamentQuestions = 'ERROR'
      allTestsPassed = false
    } else if (questions && questions.length > 0) {
      console.log(`✅ Found ${questions.length} active questions`)
      results.queries.temperamentQuestions = questions.length
    } else {
      console.log(`⚠️ No temperament questions found (may need to run SQL script)`)
      results.queries.temperamentQuestions = 0
      allTestsPassed = false
    }
  } catch (err) {
    console.log(`❌ Questions exception: ${err.message}`)
    results.queries.temperamentQuestions = 'EXCEPTION'
    allTestsPassed = false
  }
  
  // Test 3: Test authenticated user queries (simulated)
  console.log('\n🔐 CHECKING AUTHENTICATED ACCESS:')
  const testUserId = 'b07a89a3-6030-42f9-8c60-ce28afc47132' // Example UUID
  
  // Test axis6_profiles with correct column
  try {
    const { data, error } = await supabase
      .from('axis6_profiles')
      .select('*')
      .eq('id', testUserId) // Using 'id' not 'user_id'
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (expected)
      console.log(`❌ Profile query error: ${error.message}`)
      results.queries.profiles = 'ERROR'
      allTestsPassed = false
    } else {
      console.log(`✅ Profile query works (id column)`)
      results.queries.profiles = 'OK'
    }
  } catch (err) {
    console.log(`❌ Profile exception: ${err.message}`)
    results.queries.profiles = 'EXCEPTION'
    allTestsPassed = false
  }
  
  // Test axis6_checkins
  try {
    const { data, error } = await supabase
      .from('axis6_checkins')
      .select('*')
      .eq('user_id', testUserId)
      .limit(1)
    
    if (error && error.code !== 'PGRST116') {
      console.log(`❌ Checkins query error: ${error.message}`)
      results.queries.checkins = 'ERROR'
      allTestsPassed = false
    } else {
      console.log(`✅ Checkins query works`)
      results.queries.checkins = 'OK'
    }
  } catch (err) {
    console.log(`❌ Checkins exception: ${err.message}`)
    results.queries.checkins = 'EXCEPTION'
    allTestsPassed = false
  }
  
  // Test axis6_temperament_profiles
  try {
    const { data, error } = await supabase
      .from('axis6_temperament_profiles')
      .select('*')
      .eq('user_id', testUserId)
      .maybeSingle()
    
    if (error && error.code !== 'PGRST116') {
      console.log(`❌ Temperament profile query error: ${error.message}`)
      results.queries.temperamentProfiles = 'ERROR'
      allTestsPassed = false
    } else {
      console.log(`✅ Temperament profile query works`)
      results.queries.temperamentProfiles = 'OK'
    }
  } catch (err) {
    console.log(`❌ Temperament profile exception: ${err.message}`)
    results.queries.temperamentProfiles = 'EXCEPTION'
    allTestsPassed = false
  }
  
  // Test 4: Check categories are accessible
  console.log('\n🎯 CHECKING PUBLIC DATA ACCESS:')
  try {
    const { data: categories, error } = await supabase
      .from('axis6_categories')
      .select('*')
      .order('position')
    
    if (error) {
      console.log(`❌ Categories query failed: ${error.message}`)
      results.queries.categories = 'ERROR'
      allTestsPassed = false
    } else if (categories && categories.length === 6) {
      console.log(`✅ All 6 categories accessible`)
      results.queries.categories = 6
    } else {
      console.log(`⚠️ Found ${categories?.length || 0} categories (expected 6)`)
      results.queries.categories = categories?.length || 0
      allTestsPassed = false
    }
  } catch (err) {
    console.log(`❌ Categories exception: ${err.message}`)
    results.queries.categories = 'EXCEPTION'
    allTestsPassed = false
  }
  
  // Final Report
  console.log('\n================================')
  console.log('📊 VERIFICATION SUMMARY:')
  console.log('================================')
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✅ Database is properly configured')
    console.log('✅ Tables exist and are accessible')
    console.log('✅ Queries use correct column names')
    console.log('\n✨ The production site should work without errors!')
  } else {
    console.log('⚠️ SOME TESTS FAILED')
    console.log('\n🔧 REQUIRED ACTIONS:')
    
    if (Object.values(results.tables).includes('ERROR')) {
      console.log('1. Run PRODUCTION_FIX_SAFE.sql in Supabase Dashboard')
    }
    
    if (results.queries.temperamentQuestions === 0) {
      console.log('2. Ensure temperament questions are inserted')
    }
    
    if (results.queries.profiles === 'ERROR') {
      console.log('3. Check that profile queries use "id" column, not "user_id"')
    }
    
    console.log('\n📄 See docs/EXECUTE_DATABASE_FIX.md for detailed instructions')
  }
  
  // Output JSON results for programmatic use
  console.log('\n📋 DETAILED RESULTS:')
  console.log(JSON.stringify(results, null, 2))
  
  process.exit(allTestsPassed ? 0 : 1)
}

// Run verification
verifyDatabaseFix().catch(err => {
  console.error('❌ Verification script failed:', err)
  process.exit(1)
})