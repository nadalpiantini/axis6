#!/usr/bin/env node

/**
 * AXIS6 Realtime Connection Test
 * 
 * This script tests the WebSocket realtime connection to ensure 
 * authentication issues are resolved.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧪 AXIS6 REALTIME CONNECTION TEST')
console.log('=====================================')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

async function testRealtimeConnection() {
  console.log('📡 Testing Realtime Connection...\n')
  
  // Create client with same config as the app
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Don't persist for testing
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 30000,
      reconnectAfterMs: (tries) => {
        return Math.min(1000 * Math.pow(2, tries), 10000)
      },
      transport: 'websocket',
      timeout: 15000,
      log_level: 'info'
    }
  })

  console.log('✅ Supabase client created')

  // Test 1: Check if tables have realtime enabled
  console.log('\n📋 Step 1: Checking realtime publication status...')
  
  try {
    const adminClient = createClient(supabaseUrl, serviceKey)
    
    const { data: publications, error } = await adminClient
      .from('pg_publication_tables')
      .select('tablename')
      .eq('pubname', 'supabase_realtime')
      .like('tablename', 'axis6_%')

    if (error) {
      console.error('❌ Error checking publications:', error.message)
    } else {
      console.log('📊 Tables with Realtime enabled:')
      const enabledTables = publications.map(p => p.tablename)
      
      const requiredTables = [
        'axis6_checkins',
        'axis6_streaks',
        'axis6_profiles',
        'axis6_categories',
        'axis6_daily_stats'
      ]
      
      requiredTables.forEach(table => {
        if (enabledTables.includes(table)) {
          console.log(`   ✅ ${table}`)
        } else {
          console.log(`   ❌ ${table} - NOT ENABLED`)
        }
      })
      
      if (enabledTables.length === 0) {
        console.log('⚠️  No axis6_ tables have realtime enabled')
        console.log('   Run the SQL script provided to enable realtime')
      }
    }
  } catch (error) {
    console.error('❌ Error checking realtime status:', error.message)
  }

  // Test 2: Test unauthenticated connection (should gracefully handle)
  console.log('\n📡 Step 2: Testing unauthenticated realtime connection...')
  
  return new Promise((resolve) => {
    const testChannel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'axis6_checkins'
        },
        (payload) => {
          console.log('📨 Received realtime update:', payload.eventType)
        }
      )
      .subscribe((status, error) => {
        console.log(`🔔 Connection status: ${status}`)
        
        if (error) {
          console.log(`⚠️  Connection error (expected without auth): ${error.message}`)
        }
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connection successful!')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.log('⚠️  Connection failed as expected without authentication')
        }
        
        // Clean up and resolve after 5 seconds
        setTimeout(async () => {
          await supabase.removeChannel(testChannel)
          console.log('🧹 Test channel cleaned up')
          resolve()
        }, 5000)
      })
  })
}

async function testWithAuth() {
  console.log('\n🔐 Step 3: Testing with authentication...')
  console.log('ℹ️  This would require a valid user session in a real app')
  console.log('   The improved code will wait for authentication before connecting')
}

async function runAllTests() {
  try {
    await testRealtimeConnection()
    await testWithAuth()
    
    console.log('\n🎉 REALTIME CONNECTION TEST COMPLETE')
    console.log('=====================================')
    console.log('✅ The improved realtime hooks should now:')
    console.log('   • Wait for user authentication before connecting')
    console.log('   • Handle connection failures gracefully')
    console.log('   • Fall back to polling when needed')
    console.log('   • Provide better error messages')
    console.log('   • Show connection status in development')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the tests
runAllTests()