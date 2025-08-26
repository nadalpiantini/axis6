#!/usr/bin/env node

/**
 * Test Supabase Connection Script
 * 
 * This script tests the Supabase connection and provides detailed debugging information
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

function log(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
  }
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testSupabaseConnection() {
  log('\n🔍 AXIS6 - SUPABASE CONNECTION TEST', 'cyan')
  log('=' .repeat(50), 'cyan')

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  log('\n📋 ENVIRONMENT VARIABLES CHECK', 'blue')
  
  if (!supabaseUrl) {
    log('❌ NEXT_PUBLIC_SUPABASE_URL is missing', 'red')
    return false
  }
  
  if (!supabaseKey) {
    log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', 'red')
    return false
  }

  log('✅ NEXT_PUBLIC_SUPABASE_URL: present', 'green')
  log(`   URL: ${supabaseUrl}`, 'green')
  log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: present', 'green')
  log(`   Key length: ${supabaseKey.length} characters`, 'green')

  // Test URL format
  try {
    new URL(supabaseUrl)
    log('✅ URL format is valid', 'green')
  } catch (error) {
    log('❌ URL format is invalid', 'red')
    return false
  }

  // Create Supabase client
  log('\n🔗 CREATING SUPABASE CLIENT', 'blue')
  
  let supabase
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false, // Don't persist for testing
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
    log('✅ Supabase client created successfully', 'green')
  } catch (error) {
    log(`❌ Failed to create Supabase client: ${error.message}`, 'red')
    return false
  }

  // Test connection with a simple query
  log('\n🔍 TESTING CONNECTION', 'blue')
  
  try {
    const { data, error } = await supabase
      .from('axis6_categories')
      .select('count')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116') {
        log('⚠️  Connected but table not found - this is normal for new setups', 'yellow')
        log('   The connection is working, but the database schema needs to be set up', 'yellow')
        return true
      } else {
        log(`❌ Query failed: ${error.message}`, 'red')
        log(`   Code: ${error.code}`, 'red')
        log(`   Details: ${error.details}`, 'red')
        return false
      }
    } else {
      log('✅ Connection test successful', 'green')
      log(`   Data received: ${JSON.stringify(data)}`, 'green')
      return true
    }
  } catch (error) {
    log(`❌ Connection test failed: ${error.message}`, 'red')
    return false
  }
}

async function testAuthConnection() {
  log('\n🔐 TESTING AUTH CONNECTION', 'blue')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    log('❌ Missing environment variables for auth test', 'red')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test auth status
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      log(`❌ Auth test failed: ${error.message}`, 'red')
      return false
    }
    
    log('✅ Auth connection successful', 'green')
    log(`   Session: ${session ? 'active' : 'none'}`, 'green')
    return true
  } catch (error) {
    log(`❌ Auth test failed: ${error.message}`, 'red')
    return false
  }
}

async function main() {
  try {
    const connectionOk = await testSupabaseConnection()
    const authOk = await testAuthConnection()
    
    log('\n📊 TEST RESULTS', 'cyan')
    log('=' .repeat(30), 'cyan')
    
    if (connectionOk && authOk) {
      log('✅ All tests passed! Supabase is working correctly.', 'green')
      log('\n💡 If you\'re still seeing errors in the browser:', 'blue')
      log('   1. Clear browser cache and localStorage', 'blue')
      log('   2. Check browser console for specific error messages', 'blue')
      log('   3. Ensure you\'re using the latest version of the app', 'blue')
    } else {
      log('❌ Some tests failed. Check the output above for details.', 'red')
      log('\n🔧 TROUBLESHOOTING:', 'yellow')
      log('   1. Verify your .env.local file has correct values', 'yellow')
      log('   2. Check if your Supabase project is active', 'yellow')
      log('   3. Verify your API keys are correct', 'yellow')
      log('   4. Check Supabase dashboard for any service issues', 'yellow')
    }
    
  } catch (error) {
    log(`❌ Test script failed: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Run the test
main()
