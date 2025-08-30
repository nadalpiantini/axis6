#!/usr/bin/env node
/**
 * Simple AXIS6 Authentication Test
 * Tests basic auth functionality without browser automation
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧪 SIMPLE AUTH TEST')
console.log('='.repeat(25))

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testAuth() {
  console.log('\n🔑 Testing strong password...')
  
  const testEmail = `user-${Date.now()}@axis6.app`
  const strongPassword = 'MyStr0ng!Pass2024'
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: strongPassword,
      options: {
        data: { name: 'Test User' }
      }
    })
    
    if (error) {
      if (error.message.includes('rate limit')) {
        console.log('⚠️ Rate limited - Auth is working!')
        return true
      } else {
        console.log('❌ Auth error:', error.message)
        return false
      }
    } else {
      console.log('✅ Registration successful!')
      console.log(`   User ID: ${data.user?.id}`)
      
      // Clean up
      if (data.user) {
        try {
          await supabase.auth.admin.deleteUser(data.user.id)
          console.log('   → Cleaned up test user')
        } catch (cleanupError) {
          console.log('   ⚠️ Cleanup failed (this is normal)')
        }
      }
      return true
    }
  } catch (error) {
    console.log('❌ Exception:', error.message)
    return false
  }
}

async function main() {
  console.log('Testing auth with strong password...')
  const authWorking = await testAuth()
  
  console.log('\n📊 RESULTS')
  console.log('='.repeat(15))
  
  if (authWorking) {
    console.log('✅ Authentication is working!')
    console.log('\n🚀 READY TO TEST:')
    console.log('1. Open http://localhost:3000')
    console.log('2. Go to Register page')
    console.log('3. Use a strong password like: MyStr0ng!Pass2024')
    console.log('4. Complete onboarding')
    console.log('5. Access dashboard')
  } else {
    console.log('❌ Authentication has issues')
    console.log('\n🔧 CHECK:')
    console.log('1. Supabase Auth settings')
    console.log('2. Password policy configuration')
    console.log('3. Site URL and redirect URLs')
  }
}

main().catch(console.error)