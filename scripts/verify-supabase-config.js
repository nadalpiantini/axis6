#!/usr/bin/env node
/**
 * AXIS6 Supabase Configuration Verification Script
 * 
 * Verifies that Supabase is properly configured for authentication
 * and that all required URLs and settings are correct.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

console.log('🔍 AXIS6 SUPABASE CONFIGURATION VERIFICATION')
console.log('='.repeat(50))

// Check environment variables
console.log('\n📋 ENVIRONMENT VARIABLES CHECK')
console.log('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing')
console.log('NEXT_PUBLIC_APP_URL:', APP_URL)

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('\n❌ Missing required environment variables!')
  console.error('Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function verifySupabaseConfig() {
  try {
    // Test 1: Check Supabase connection
    console.log('\n🔗 SUPABASE CONNECTION TEST')
    
    const { data, error } = await supabase
      .from('axis6_categories')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Successfully connected to Supabase')
    
    // Test 2: Check if tables exist
    console.log('\n📊 DATABASE TABLES CHECK')
    
    const tables = [
      'axis6_profiles',
      'axis6_categories', 
      'axis6_checkins',
      'axis6_streaks',
      'axis6_daily_stats'
    ]
    
    let allTablesExist = true
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`)
          allTablesExist = false
        } else {
          console.log(`✅ Table ${table}: OK`)
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`)
        allTablesExist = false
      }
    }
    
    // Test 3: Check RLS policies
    console.log('\n🔒 ROW LEVEL SECURITY CHECK')
    
    try {
      // This should fail if RLS is working correctly (no user context)
      const { data, error } = await supabase
        .from('axis6_profiles')
        .select('*')
        .limit(1)
      
      if (error && error.code === 'PGRST301') {
        console.log('✅ RLS is properly configured (access restricted)')
      } else if (error) {
        console.log('⚠️ RLS check inconclusive:', error.message)
      } else {
        console.log('⚠️ RLS might not be properly configured (access allowed)')
      }
    } catch (err) {
      console.log('⚠️ RLS check failed:', err.message)
    }
    
    // Test 4: Check auth configuration
    console.log('\n🔐 AUTH CONFIGURATION RECOMMENDATIONS')
    
    console.log('📝 Verify these settings in Supabase Dashboard:')
    console.log('   URL: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/auth/settings')
    console.log('')
    console.log('✅ Site URL should be set to:', APP_URL)
    console.log('✅ Redirect URLs should include:')
    console.log('   -', `${APP_URL}/auth/callback`)
    console.log('   -', `${APP_URL}/**`) // Wildcard for development
    
    if (APP_URL.includes('localhost')) {
      console.log('   -', 'http://localhost:3000/auth/callback')
      console.log('   -', 'http://localhost:3000/**')
    }
    
    console.log('')
    console.log('✅ Email Auth should be enabled')
    console.log('✅ Confirm email should be disabled for development')
    console.log('✅ Email templates should be customized (optional)')
    
    return allTablesExist
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message)
    return false
  }
}

async function testAuthFlow() {
  console.log('\n🧪 AUTH FLOW TEST (Sign Up)')
  
  // Generate a test email
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'testpassword123'
  
  try {
    // Test sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User'
        }
      }
    })
    
    if (signUpError) {
      if (signUpError.message.includes('Email rate limit')) {
        console.log('⚠️ Email rate limit reached (this is normal)')
      } else {
        console.log('❌ Sign up failed:', signUpError.message)
      }
    } else {
      console.log('✅ Sign up flow working')
      
      // Clean up test user if created
      if (signUpData.user) {
        try {
          await supabase.auth.admin.deleteUser(signUpData.user.id)
          console.log('✅ Test user cleaned up')
        } catch (cleanupError) {
          console.log('⚠️ Could not clean up test user (manual cleanup needed)')
        }
      }
    }
  } catch (error) {
    console.log('❌ Auth test failed:', error.message)
  }
}

// Main execution
async function main() {
  const dbConfigOk = await verifySupabaseConfig()
  
  if (dbConfigOk) {
    await testAuthFlow()
  }
  
  console.log('\n📋 SUMMARY & NEXT STEPS')
  console.log('='.repeat(30))
  
  if (dbConfigOk) {
    console.log('✅ Database configuration looks good!')
  } else {
    console.log('❌ Database issues detected - check migrations')
  }
  
  console.log('\n🔧 MANUAL VERIFICATION REQUIRED:')
  console.log('1. Check Supabase Auth settings:')
  console.log('   https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/auth/settings')
  console.log('')
  console.log('2. Verify Site URL:', APP_URL)
  console.log('3. Verify Redirect URLs include auth callbacks')
  console.log('4. Test login/register in your application')
  
  console.log('\n🚀 TO FIX CSP ISSUES:')
  console.log('1. Restart your development server: npm run dev')
  console.log('2. Clear browser cache and cookies')
  console.log('3. Try logging in again')
  console.log('4. Check browser console for remaining errors')
  
  process.exit(0)
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

// Run the verification
main().catch(console.error)