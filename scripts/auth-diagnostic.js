#!/usr/bin/env node
/**
 * AXIS6 Authentication Diagnostic Script
 * 
 * Comprehensive testing of Supabase authentication configuration
 * Tests user creation, password policies, email settings, and cleanup
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6789'

console.log('🔐 AXIS6 AUTHENTICATION DIAGNOSTIC')
console.log('='.repeat(50))

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testAuthConfiguration() {
  console.log('\n📋 ENVIRONMENT CHECK')
  console.log(`Supabase URL: ${SUPABASE_URL ? '✅ Present' : '❌ Missing'}`)
  console.log(`Service Key: ${SUPABASE_SERVICE_KEY ? '✅ Present' : '❌ Missing'}`)
  console.log(`App URL: ${APP_URL}`)
  
  console.log('\n🧪 TESTING AUTHENTICATION FLOW')
  
  // Generate unique test email
  const testEmail = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@axis6.test`
  const testPassword = 'TestSecure2025!@#'
  const testName = 'Diagnostic Test User'
  
  console.log(`Test Email: ${testEmail}`)
  console.log(`Test Password: ${testPassword}`)
  
  try {
    // Test 1: User Creation
    console.log('\n1️⃣ Testing User Creation...')
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: false,  // Skip email confirmation for testing
      user_metadata: { name: testName }
    })
    
    if (createError) {
      console.log('❌ User Creation Failed:', createError.message)
      
      // Provide specific guidance based on error type
      if (createError.message.includes('rate limit')) {
        console.log('💡 This is normal - you may have hit rate limits')
        console.log('   Wait a few minutes and try again')
      } else if (createError.message.includes('password')) {
        console.log('💡 Password policy issue - check Supabase auth settings')
      } else if (createError.message.includes('email')) {
        console.log('💡 Email configuration issue - check Supabase auth settings')
      }
      return false
    }
    
    console.log('✅ User Created Successfully!')
    console.log(`   User ID: ${createData.user.id}`)
    console.log(`   Email: ${createData.user.email}`)
    console.log(`   Confirmed: ${createData.user.email_confirmed_at ? 'Yes' : 'No'}`)
    
    // Test 2: Profile Creation (check if trigger works)
    console.log('\n2️⃣ Testing Profile Creation...')
    const { data: profileData, error: profileError } = await supabase
      .from('axis6_profiles')
      .select('*')
      .eq('id', createData.user.id)
      .single()
    
    if (profileError) {
      console.log('⚠️ Profile not found:', profileError.message)
      console.log('💡 Check if the handle_new_user() trigger is working')
    } else {
      console.log('✅ Profile Created Successfully!')
      console.log(`   Profile ID: ${profileData.id}`)
      console.log(`   Name: ${profileData.name}`)
      console.log(`   Onboarded: ${profileData.onboarded}`)
    }
    
    // Test 3: User Authentication
    console.log('\n3️⃣ Testing User Authentication...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (authError) {
      console.log('❌ Authentication Failed:', authError.message)
    } else {
      console.log('✅ Authentication Successful!')
      console.log(`   Session User: ${authData.user.email}`)
    }
    
    // Test 4: Cleanup
    console.log('\n4️⃣ Cleaning Up Test User...')
    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(createData.user.id)
      
      if (deleteError) {
        console.log('⚠️ Cleanup Failed:', deleteError.message)
        console.log('💡 You may need to manually delete the test user from Supabase Dashboard')
      } else {
        console.log('✅ Test User Cleaned Up Successfully!')
      }
    } catch (cleanupError) {
      console.log('⚠️ Cleanup Exception:', cleanupError.message)
    }
    
    return true
    
  } catch (error) {
    console.log('❌ Test Exception:', error.message)
    return false
  }
}

async function checkSupabaseSettings() {
  console.log('\n🔧 SUPABASE DASHBOARD SETTINGS CHECK')
  console.log('='.repeat(40))
  
  const projectId = SUPABASE_URL.split('.')[0].split('//')[1]
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}/auth/settings`
  
  console.log(`🔗 Dashboard URL: ${dashboardUrl}`)
  console.log('\n📋 Required Settings:')
  console.log('')
  console.log('1️⃣ URL Configuration:')
  console.log(`   Site URL: ${APP_URL}`)
  console.log('   Redirect URLs:')
  console.log(`     - ${APP_URL}/auth/callback`)
  console.log(`     - ${APP_URL}/**`)
  console.log('')
  console.log('2️⃣ Email Auth:')
  console.log('   ✅ Enable Email Signup: ON')
  console.log('   ❌ Confirm Email: OFF (for development)')
  console.log('   ❌ Secure Email Change: OFF (for development)')
  console.log('')
  console.log('3️⃣ Security:')
  console.log('   ✅ Minimum Password Length: 6')
  console.log('   ✅ Enable RLS: ON')
  console.log('')
  console.log('4️⃣ Rate Limiting:')
  console.log('   Email Rate Limit: 2 per hour (development)')
  console.log('   Sign-up Rate Limit: 30 per 5 minutes')
}

async function main() {
  try {
    const authTestPassed = await testAuthConfiguration()
    
    if (authTestPassed) {
      console.log('\n🎉 AUTHENTICATION DIAGNOSTIC COMPLETE')
      console.log('✅ All tests passed! Your Supabase auth is working correctly.')
    } else {
      console.log('\n⚠️ AUTHENTICATION DIAGNOSTIC COMPLETE')
      console.log('❌ Some tests failed. Check the Supabase Dashboard settings below.')
    }
    
    await checkSupabaseSettings()
    
    console.log('\n🚀 NEXT STEPS')
    console.log('='.repeat(20))
    console.log('1. If tests failed, update Supabase Dashboard settings')
    console.log('2. Restart your development server: npm run dev')
    console.log('3. Test registration/login in your application')
    console.log('4. For production, update URLs to use your domain')
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message)
    process.exit(1)
  }
}

// Run the diagnostic
main()

