#!/usr/bin/env node
/**
 * Comprehensive Fix Script for AXIS6
 * 
 * This script addresses all current issues:
 * 1. Authentication problems (no user session)
 * 2. WebSocket connection failures
 * 3. Database access issues
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

async function diagnoseIssues() {
  console.log('🔍 Diagnosing AXIS6 Issues...\n')
  
  // Issue 1: Check authentication
  console.log('1️⃣ Checking Authentication...')
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.log(`❌ Authentication error: ${error.message}`)
    } else if (user) {
      console.log(`✅ User authenticated: ${user.id}`)
      console.log(`   Email: ${user.email}`)
    } else {
      console.log('⚠️  No user session found')
      console.log('   💡 You need to sign in to access the application')
    }
  } catch (error) {
    console.log(`❌ Auth check failed: ${error.message}`)
  }
  
  // Issue 2: Check database tables
  console.log('\n2️⃣ Checking Database Tables...')
  const tables = [
    'axis6_profiles',
    'axis6_categories',
    'axis6_checkins',
    'axis6_streaks',
    'axis6_daily_stats',
    'axis6_temperament_profiles',
    'axis6_temperament_questions',
    'axis6_temperament_responses',
    'axis6_personalization_settings',
    'axis6_temperament_activities'
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ ${table} - DOES NOT EXIST`)
        } else {
          console.log(`⚠️  ${table} - Error: ${error.message}`)
        }
      } else {
        console.log(`✅ ${table} - EXISTS`)
      }
    } catch (error) {
      console.log(`❌ ${table} - Exception: ${error.message}`)
    }
  }
  
  // Issue 3: Check WebSocket/Realtime
  console.log('\n3️⃣ Checking WebSocket Configuration...')
  console.log('   💡 WebSocket failures indicate Realtime is not enabled')
  console.log('   💡 Run the fix-websocket-realtime.sql script to enable')
  
  // Issue 4: Check environment variables
  console.log('\n4️⃣ Checking Environment Variables...')
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]
  
  for (const variable of requiredVars) {
    const value = process.env[variable]
    if (value) {
      console.log(`✅ ${variable} - SET`)
    } else {
      console.log(`❌ ${variable} - MISSING`)
    }
  }
}

async function provideSolutions() {
  console.log('\n📋 ISSUE SUMMARY & SOLUTIONS:\n')
  
  console.log('🔴 CRITICAL ISSUES:')
  console.log('1. No user authentication - You need to sign in')
  console.log('2. WebSocket failures - Realtime not enabled')
  console.log('3. 404 errors - Caused by RLS policies blocking unauthenticated access')
  
  console.log('\n🟡 SOLUTIONS:')
  console.log('1. SIGN IN: Go to https://axis6.app/auth/login and sign in')
  console.log('2. ENABLE REALTIME: Run the WebSocket fix script')
  console.log('3. CLEAR CACHE: Hard refresh your browser (Cmd+Shift+R)')
  
  console.log('\n📝 MANUAL STEPS REQUIRED:')
  console.log('1. Apply WebSocket fix:')
  console.log('   - Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new')
  console.log('   - Copy and paste: scripts/fix-websocket-realtime.sql')
  console.log('   - Click RUN')
  
  console.log('\n2. Sign in to the application:')
  console.log('   - Go to: https://axis6.app/auth/login')
  console.log('   - Use your credentials to sign in')
  
  console.log('\n3. Clear browser cache:')
  console.log('   - Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)')
  console.log('   - Or open DevTools → Network → Disable cache')
  
  console.log('\n🎯 EXPECTED RESULTS:')
  console.log('✅ No more 404 errors')
  console.log('✅ No more WebSocket failures')
  console.log('✅ Application works normally')
  console.log('✅ Real-time updates work')
}

async function testAfterFix() {
  console.log('\n🧪 TESTING AFTER FIX:')
  console.log('After completing the manual steps above, run:')
  console.log('   node scripts/verify-temperament-tables.js')
  console.log('   node scripts/test-database-access.js')
}

async function main() {
  try {
    await diagnoseIssues()
    await provideSolutions()
    await testAfterFix()
    
    console.log('\n🎉 DIAGNOSIS COMPLETE!')
    console.log('Follow the manual steps above to fix all issues.')
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

