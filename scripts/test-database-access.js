#!/usr/bin/env node
/**
 * Database Access Test Script for AXIS6
 * 
 * This script tests user authentication and database access to diagnose 404 errors
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabaseAccess() {
  console.log('🔍 Testing database access...\n')
  
  // Test 1: Check if we can connect to Supabase
  console.log('1️⃣ Testing Supabase connection...')
  try {
    const { data, error } = await supabase.from('axis6_categories').select('*').limit(1)
    if (error) {
      console.log(`❌ Connection failed: ${error.message}`)
      return
    }
    console.log('✅ Supabase connection successful')
  } catch (error) {
    console.log(`❌ Connection error: ${error.message}`)
    return
  }
  
  // Test 2: Check current user session
  console.log('\n2️⃣ Checking user session...')
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.log(`❌ Session error: ${error.message}`)
    } else if (user) {
      console.log(`✅ User authenticated: ${user.id}`)
      console.log(`   Email: ${user.email}`)
    } else {
      console.log('⚠️  No user session found')
    }
  } catch (error) {
    console.log(`❌ Session check error: ${error.message}`)
  }
  
  // Test 3: Test table access with different scenarios
  console.log('\n3️⃣ Testing table access...')
  
  const tables = [
    'axis6_profiles',
    'axis6_categories',
    'axis6_checkins',
    'axis6_temperament_profiles'
  ]
  
  for (const table of tables) {
    console.log(`\n   Testing ${table}...`)
    
    try {
      // Test with no user (should work for public tables)
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`   ❌ Table ${table} does not exist`)
        } else if (error.code === '42501') {
          console.log(`   ❌ Access denied to ${table} (RLS policy issue)`)
        } else {
          console.log(`   ❌ Error accessing ${table}: ${error.message}`)
        }
      } else {
        console.log(`   ✅ ${table} accessible`)
      }
    } catch (error) {
      console.log(`   ❌ Exception accessing ${table}: ${error.message}`)
    }
  }
  
  // Test 4: Check RLS policies
  console.log('\n4️⃣ Testing RLS policies...')
  
  try {
    // Try to access user-specific data without authentication
    const { data, error } = await supabase
      .from('axis6_profiles')
      .select('*')
      .eq('id', 'test-user-id')
    
    if (error && error.code === '42501') {
      console.log('✅ RLS policies are working (correctly blocking access)')
    } else if (error) {
      console.log(`⚠️  RLS test result: ${error.message}`)
    } else {
      console.log('⚠️  RLS might not be properly configured')
    }
  } catch (error) {
    console.log(`❌ RLS test error: ${error.message}`)
  }
  
  // Test 5: Check if user profile exists
  console.log('\n5️⃣ Checking user profile...')
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data, error } = await supabase
        .from('axis6_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ User profile table does not exist')
        } else if (error.code === 'PGRST116') {
          console.log('⚠️  User profile not found (needs to be created)')
        } else {
          console.log(`❌ Error checking profile: ${error.message}`)
        }
      } else {
        console.log('✅ User profile exists')
        console.log(`   Name: ${data.name}`)
        console.log(`   Onboarded: ${data.onboarded}`)
      }
    } else {
      console.log('⚠️  No user to check profile for')
    }
  } catch (error) {
    console.log(`❌ Profile check error: ${error.message}`)
  }
}

async function testWithAuthentication() {
  console.log('\n🔐 Testing with authentication...')
  
  // This would require user credentials - for now just show instructions
  console.log('To test with authentication, you need to:')
  console.log('1. Sign in to the application')
  console.log('2. Check the browser console for the actual requests')
  console.log('3. Verify the user session is active')
}

async function main() {
  try {
    await testDatabaseAccess()
    await testWithAuthentication()
    
    console.log('\n📋 Summary:')
    console.log('If you see 404 errors in the browser, it could be due to:')
    console.log('1. User not authenticated (no valid session)')
    console.log('2. RLS policies blocking access')
    console.log('3. Tables not existing (though our check shows they do)')
    console.log('4. Incorrect table names in the queries')
    
    console.log('\n💡 Next steps:')
    console.log('1. Check if user is properly signed in')
    console.log('2. Verify the session is active in browser')
    console.log('3. Check browser network tab for exact error details')
    console.log('4. Verify RLS policies are correctly configured')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
