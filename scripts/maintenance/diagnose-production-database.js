#!/usr/bin/env node
/**
 * AXIS6 Production Database Emergency Diagnosis
 * Analyzes the critical errors seen in browser console
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnoseCriticalErrors() {
  console.log('🚨 AXIS6 Production Database Emergency Diagnosis\n')
  
  try {
    // Test the failing user ID from logs
    const testUserId = 'b07a89a3-6030-42f9-8c60-ce28afc47132'
    console.log(`Testing with User ID: ${testUserId}\n`)
    
    // 1. Check axis6_checkins (404 error in logs)
    console.log('📊 TESTING AXIS6_CHECKINS (404 in logs)')
    try {
      const { data: checkinsData, error: checkinsError } = await supabase
        .from('axis6_checkins')
        .select('*', { count: 'exact' })
        .limit(1)
      
      if (checkinsError) {
        console.log(`❌ axis6_checkins: ERROR - ${checkinsError.message}`)
        console.log(`   Code: ${checkinsError.code}`)
        console.log(`   Details: ${JSON.stringify(checkinsError.details)}`)
        console.log(`   This explains the 404 errors!`)
      } else {
        console.log(`✅ axis6_checkins: EXISTS (${checkinsData?.length || 0} records found)`)
      }
    } catch (err) {
      console.log(`❌ axis6_checkins: CRITICAL FAILURE - ${err.message}`)
    }
    
    // 2. Check axis6_profiles (400 error in logs)
    console.log('\n📊 TESTING AXIS6_PROFILES (400 in logs)')
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('axis6_profiles')
        .select('*')
        .eq('user_id', testUserId)
        .limit(1)
      
      if (profilesError) {
        console.log(`❌ axis6_profiles: ERROR - ${profilesError.message}`)
        console.log(`   Code: ${profilesError.code}`)
        console.log(`   Details: ${JSON.stringify(profilesError.details)}`)
        console.log(`   This explains the 400 errors!`)
      } else {
        console.log(`✅ axis6_profiles: SUCCESS (${profilesData?.length || 0} records found)`)
      }
    } catch (err) {
      console.log(`❌ axis6_profiles: CRITICAL FAILURE - ${err.message}`)
    }
    
    // 3. Check axis6_temperament_profiles (406 error in logs)  
    console.log('\n📊 TESTING AXIS6_TEMPERAMENT_PROFILES (406 in logs)')
    try {
      const { data: tempData, error: tempError } = await supabase
        .from('axis6_temperament_profiles')
        .select('*')
        .eq('user_id', testUserId)
        .limit(1)
      
      if (tempError) {
        console.log(`❌ axis6_temperament_profiles: ERROR - ${tempError.message}`)
        console.log(`   Code: ${tempError.code}`)
        console.log(`   Details: ${JSON.stringify(tempError.details)}`)
        console.log(`   This explains the 406 errors!`)
      } else {
        console.log(`✅ axis6_temperament_profiles: SUCCESS (${tempData?.length || 0} records found)`)
      }
    } catch (err) {
      console.log(`❌ axis6_temperament_profiles: CRITICAL FAILURE - ${err.message}`)
    }
    
    // 4. Check RLS policies
    console.log('\n🔒 CHECKING RLS POLICIES')
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'axis6_profiles' })
        .limit(10)
      
      if (policiesError) {
        console.log(`⚠️  Cannot check RLS policies: ${policiesError.message}`)
      } else {
        console.log(`📋 Found ${policies?.length || 0} RLS policies for axis6_profiles`)
      }
    } catch (err) {
      console.log(`⚠️  RLS policy check failed: ${err.message}`)
    }
    
    // 5. Check table structure
    console.log('\n🏗️ CHECKING TABLE STRUCTURES')
    const tables = ['axis6_profiles', 'axis6_checkins', 'axis6_temperament_profiles']
    
    for (const tableName of tables) {
      try {
        // Get first record to see structure
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
        } else if (data && data.length > 0) {
          console.log(`✅ ${tableName}: Columns - ${Object.keys(data[0]).join(', ')}`)
        } else {
          console.log(`⚠️  ${tableName}: Exists but empty`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
      }
    }
    
    // 6. Test auth context
    console.log('\n🔐 TESTING AUTH CONTEXT')
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.log(`❌ Auth context: ${authError.message}`)
        console.log(`   This might explain query permission issues!`)
      } else {
        console.log(`✅ Auth context: User ${authData.user?.id} (service role)`)
      }
    } catch (err) {
      console.log(`❌ Auth context: ${err.message}`)
    }
    
    // 7. Summary and recommendations
    console.log('\n🎯 DIAGNOSIS SUMMARY')
    console.log('==================')
    console.log('CRITICAL PRODUCTION ERRORS:')
    console.log('1. 404 errors suggest axis6_checkins may be missing/inaccessible')
    console.log('2. 400 errors on axis6_profiles indicate RLS policy issues')
    console.log('3. 406 errors on temperament tables suggest content negotiation problems')
    console.log('4. WebSocket failures prevent realtime updates')
    console.log('5. React Error #130 from undefined data in components')
    console.log('')
    
    console.log('IMMEDIATE FIXES NEEDED:')
    console.log('1. Check if axis6_checkins table exists and has proper RLS')
    console.log('2. Fix RLS policies on axis6_profiles for user access')
    console.log('3. Ensure user_id columns match auth.uid() in policies')
    console.log('4. Add error boundaries for failed database queries')
    console.log('5. Disable realtime if WebSocket connections fail')
    
  } catch (error) {
    console.error('❌ Emergency diagnosis failed:', error.message)
    process.exit(1)
  }
}

diagnoseCriticalErrors()