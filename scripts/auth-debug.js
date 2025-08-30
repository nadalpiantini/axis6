#!/usr/bin/env node
/**
 * AXIS6 Authentication Debug Script
 * 
 * Detailed debugging to identify "Database error creating new user" issues
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 AXIS6 AUTHENTICATION DEBUG')
console.log('='.repeat(50))

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkDatabaseTables() {
  console.log('\n📊 CHECKING DATABASE TABLES')
  console.log('='.repeat(30))
  
  const tables = ['axis6_profiles', 'axis6_categories', 'axis6_checkins', 'axis6_streaks', 'axis6_daily_stats']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('count')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ Table ${table}: NOT FOUND`)
        } else if (error.code === '42501') {
          console.log(`⚠️ Table ${table}: EXISTS but ACCESS DENIED`)
        } else {
          console.log(`❌ Table ${table}: ERROR - ${error.message}`)
        }
      } else {
        console.log(`✅ Table ${table}: OK`)
      }
    } catch (err) {
      console.log(`❌ Table ${table}: EXCEPTION - ${err.message}`)
    }
  }
}

async function checkAuthTriggers() {
  console.log('\n🔧 CHECKING AUTH TRIGGERS')
  console.log('='.repeat(30))
  
  try {
    // Check if the trigger function exists
    const { data: functions, error: funcError } = await supabaseAdmin
      .rpc('pg_get_functiondef', { func_oid: 'public.handle_new_user()' })
    
    if (funcError) {
      console.log('❌ handle_new_user() function: NOT FOUND')
      console.log('💡 Run the auth triggers migration in Supabase SQL Editor')
    } else {
      console.log('✅ handle_new_user() function: EXISTS')
    }
    
    // Check if the trigger exists
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created')
      .eq('event_object_table', 'users')
    
    if (triggerError || !triggers || triggers.length === 0) {
      console.log('❌ on_auth_user_created trigger: NOT FOUND')
      console.log('💡 Run the auth triggers migration in Supabase SQL Editor')
    } else {
      console.log('✅ on_auth_user_created trigger: EXISTS')
    }
    
  } catch (error) {
    console.log('❌ Error checking triggers:', error.message)
  }
}

async function checkRLSPolicies() {
  console.log('\n🔒 CHECKING RLS POLICIES')
  console.log('='.repeat(30))
  
  try {
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .ilike('tablename', 'axis6_%')
    
    if (error) {
      console.log('❌ Error checking RLS policies:', error.message)
      return
    }
    
    if (!policies || policies.length === 0) {
      console.log('❌ No RLS policies found for axis6_ tables')
      console.log('💡 Run the RLS policies migration in Supabase SQL Editor')
    } else {
      console.log(`✅ Found ${policies.length} RLS policies`)
      policies.forEach(policy => {
        console.log(`   - ${policy.tablename}: ${policy.policyname}`)
      })
    }
    
  } catch (error) {
    console.log('❌ Error checking RLS policies:', error.message)
  }
}

async function testUserCreationMethods() {
  console.log('\n🧪 TESTING USER CREATION METHODS')
  console.log('='.repeat(35))
  
  const testEmail = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@axis6.test`
  const testPassword = 'TestSecure2025!@#'
  
  console.log(`Test Email: ${testEmail}`)
  console.log(`Test Password: ${testPassword}`)
  
  // Method 1: Admin createUser
  console.log('\n1️⃣ Testing Admin createUser...')
  try {
    const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: false,
      user_metadata: { name: 'Debug Test User' }
    })
    
    if (adminError) {
      console.log('❌ Admin createUser failed:', adminError.message)
      console.log('   Error details:', JSON.stringify(adminError, null, 2))
    } else {
      console.log('✅ Admin createUser successful!')
      console.log(`   User ID: ${adminData.user.id}`)
      
      // Clean up
      await supabaseAdmin.auth.admin.deleteUser(adminData.user.id)
      console.log('   → Cleaned up test user')
    }
  } catch (error) {
    console.log('❌ Admin createUser exception:', error.message)
  }
  
  // Method 2: Regular signUp
  console.log('\n2️⃣ Testing Regular signUp...')
  try {
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp({
      email: `signup_${testEmail}`,
      password: testPassword,
      options: {
        data: { name: 'Debug SignUp User' }
      }
    })
    
    if (signUpError) {
      console.log('❌ Regular signUp failed:', signUpError.message)
      console.log('   Error details:', JSON.stringify(signUpError, null, 2))
    } else {
      console.log('✅ Regular signUp successful!')
      console.log(`   User ID: ${signUpData.user?.id}`)
      
      // Clean up
      if (signUpData.user) {
        await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id)
        console.log('   → Cleaned up test user')
      }
    }
  } catch (error) {
    console.log('❌ Regular signUp exception:', error.message)
  }
}

async function checkSupabaseAuthSettings() {
  console.log('\n⚙️ CHECKING SUPABASE AUTH SETTINGS')
  console.log('='.repeat(35))
  
  const projectId = SUPABASE_URL.split('.')[0].split('//')[1]
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}/auth/settings`
  
  console.log(`🔗 Dashboard URL: ${dashboardUrl}`)
  console.log('\n📋 Required Settings to Check:')
  console.log('')
  console.log('1️⃣ Authentication > Providers:')
  console.log('   ✅ Email provider should be ENABLED')
  console.log('')
  console.log('2️⃣ Authentication > Settings > Email Auth:')
  console.log('   ✅ Enable Email Signup: ON')
  console.log('   ❌ Confirm Email: OFF (for development)')
  console.log('   ❌ Secure Email Change: OFF (for development)')
  console.log('')
  console.log('3️⃣ Authentication > Settings > URL Configuration:')
  console.log('   Site URL: http://localhost:3000')
  console.log('   Redirect URLs:')
  console.log('     - http://localhost:3000/**')
  console.log('     - http://localhost:3000/auth/callback')
  console.log('')
  console.log('4️⃣ Database > Tables > axis6_profiles:')
  console.log('   ✅ RLS should be ENABLED')
  console.log('   ✅ Check if table exists and has correct schema')
}

async function main() {
  try {
    await checkDatabaseTables()
    await checkAuthTriggers()
    await checkRLSPolicies()
    await testUserCreationMethods()
    await checkSupabaseAuthSettings()
    
    console.log('\n🎯 DEBUG SUMMARY')
    console.log('='.repeat(20))
    console.log('If you see any ❌ errors above:')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Run the migrations from supabase/migrations/')
    console.log('3. Check Authentication settings in Dashboard')
    console.log('4. Verify RLS policies are enabled')
    console.log('5. Run this debug script again')
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message)
    process.exit(1)
  }
}

// Run the debug
main()
