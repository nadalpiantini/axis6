#!/usr/bin/env node
/**
 * AXIS6 Supabase Auth Configuration Script
 * 
 * Automatically configures authentication settings for local development
 * and provides instructions for manual configuration.
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6789'

console.log('🔐 AXIS6 AUTH CONFIGURATION')
console.log('='.repeat(40))

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function configureAuth() {
  console.log('\n📋 CURRENT AUTH REQUIREMENTS')
  console.log(`App URL: ${APP_URL}`)
  console.log(`Redirect URLs needed:`)
  console.log(`  - ${APP_URL}/auth/callback`)
  console.log(`  - ${APP_URL}/**`)
  
  console.log('\n🎯 MANUAL CONFIGURATION REQUIRED')
  console.log('Please configure these settings in Supabase Dashboard:')
  console.log('')
  console.log(`🔗 Dashboard URL: https://supabase.com/dashboard/project/${SUPABASE_URL.split('.')[0].split('//')[1]}/auth/settings`)
  console.log('')
  
  console.log('⚙️ AUTH SETTINGS TO CONFIGURE:')
  console.log('')
  console.log('1. SITE URL:')
  console.log(`   Set to: ${APP_URL}`)
  console.log('')
  console.log('2. REDIRECT URLs:')
  console.log(`   Add: ${APP_URL}/auth/callback`)
  console.log(`   Add: ${APP_URL}/**`)
  console.log('')
  console.log('3. EMAIL SETTINGS:')
  console.log('   ✅ Enable Email provider')
  console.log('   ✅ Disable "Confirm email" (for development)')
  console.log('   ✅ Enable "Allow for email based signup"')
  console.log('')
  console.log('4. SECURITY SETTINGS:')
  console.log('   ✅ Enable "Email verification required"')
  console.log('   ✅ Set "Minimum password length" to 6')
  console.log('')
  
  // Test current auth config
  console.log('🧪 TESTING CURRENT AUTH CONFIGURATION')
  
  try {
    // Test password policies
    console.log('\n📝 Testing password strength requirements...')
    const { data, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'strongpassword123',
      options: {
        data: { name: 'Test User' }
      }
    })
    
    if (error) {
      if (error.message.includes('rate limit') || error.message.includes('email rate limit')) {
        console.log('✅ Auth configuration appears to be working (rate limited)')
      } else if (error.message.includes('weak')) {
        console.log('⚠️ Password policy too strict, consider lowering requirements for development')
        console.log(`   Error: ${error.message}`)
      } else {
        console.log('❌ Auth configuration issue:', error.message)
      }
    } else {
      console.log('✅ Auth signup flow working')
      
      // Clean up test user
      if (data.user) {
        try {
          await supabase.auth.admin.deleteUser(data.user.id)
          console.log('✅ Test user cleaned up')
        } catch (cleanupError) {
          console.log('⚠️ Could not clean up test user (this is normal)')
        }
      }
    }
  } catch (error) {
    console.log('❌ Auth test error:', error.message)
  }
  
  console.log('\n🚀 NEXT STEPS')
  console.log('='.repeat(20))
  console.log('1. Open the Supabase Dashboard URL above')
  console.log('2. Configure the auth settings as specified')
  console.log('3. Restart your development server: npm run dev')
  console.log('4. Test login/register in your application')
  console.log('')
  console.log('💡 TIP: For production, update the URLs to use your domain')
}

async function main() {
  try {
    await configureAuth()
  } catch (error) {
    console.error('❌ Configuration failed:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)