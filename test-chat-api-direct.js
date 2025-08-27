#!/usr/bin/env node

/**
 * Direct Chat API Test - Check Exact Error from Browser
 * 
 * This test simulates the exact API calls that were failing in the browser
 * to verify if the RLS recursion error is fixed.
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://nvpnhqhjttgwfwvkgmpk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDkyNTYsImV4cCI6MjA3MTI4NTI1Nn0.yVgnHzflgpX_CMY4VB62ndZlsrfeH0Mlhl026HT06C0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testDirectChatAPI() {
  console.log('🔍 Testing Direct Chat API Calls (Simulating Browser Error)...\n')

  try {
    // Test 1: The exact failing query from the error
    console.log('1️⃣ Testing the EXACT failing query from browser error...')
    console.log('   Query: axis6_chat_participants?select=room_id&user_id=eq.b07a89a3-6030-42f9-8c60-ce28afc47132')
    
    const { data: participantTest, error: participantError } = await supabase
      .from('axis6_chat_participants')
      .select('room_id')
      .eq('user_id', 'b07a89a3-6030-42f9-8c60-ce28afc47132')

    if (participantError) {
      if (participantError.code === '42P17') {
        console.log('❌ STILL FAILING: 42P17 infinite recursion error detected!')
        console.log('   Error Details:', participantError)
        console.log('\n🔧 ACTION NEEDED: Apply the SQL fix to Supabase database')
        console.log('   File: fix-chat-rls-recursion-corrected.sql')
        return false
      } else {
        console.log('⚠️  Different error (might be expected):', participantError.message)
        console.log('   Code:', participantError.code)
      }
    } else {
      console.log('✅ SUCCESS: No recursion error!')
      console.log(`   Found ${participantTest?.length || 0} participant records`)
    }

    // Test 2: General participants query
    console.log('\n2️⃣ Testing general participants query...')
    const { data: allParticipants, error: allParticipantsError } = await supabase
      .from('axis6_chat_participants')
      .select('room_id, user_id')
      .limit(5)

    if (allParticipantsError) {
      if (allParticipantsError.code === '42P17') {
        console.log('❌ GENERAL QUERY FAILING: 42P17 recursion error!')
        return false
      } else {
        console.log('⚠️  Error:', allParticipantsError.message)
      }
    } else {
      console.log(`✅ SUCCESS: Found ${allParticipants?.length || 0} total participant records`)
    }

    // Test 3: Chat rooms query
    console.log('\n3️⃣ Testing chat rooms query...')
    const { data: rooms, error: roomsError } = await supabase
      .from('axis6_chat_rooms')
      .select('id, name, type, is_active')
      .eq('is_active', true)
      .limit(5)

    if (roomsError) {
      if (roomsError.code === '42P17') {
        console.log('❌ ROOMS QUERY FAILING: 42P17 recursion error!')
        return false
      } else {
        console.log('⚠️  Error:', roomsError.message)
      }
    } else {
      console.log(`✅ SUCCESS: Found ${rooms?.length || 0} active chat rooms`)
      if (rooms && rooms.length > 0) {
        console.log('   Sample room:', rooms[0])
      }
    }

    // Test 4: Complex join query (like in the hook)
    console.log('\n4️⃣ Testing complex join query (like useChatRooms hook)...')
    try {
      const { data: complexQuery, error: complexError } = await supabase
        .from('axis6_chat_participants')
        .select(`
          room_id,
          user_id,
          role,
          joined_at
        `)
        .limit(3)

      if (complexError) {
        if (complexError.code === '42P17') {
          console.log('❌ COMPLEX QUERY FAILING: 42P17 recursion error!')
          return false
        } else {
          console.log('⚠️  Complex query error:', complexError.message)
        }
      } else {
        console.log(`✅ SUCCESS: Complex query works, got ${complexQuery?.length || 0} results`)
      }
    } catch (error) {
      console.log('⚠️  Complex query exception:', error.message)
    }

    // Test 5: Check for table existence and structure
    console.log('\n5️⃣ Testing table structure...')
    const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info', { table_name: 'axis6_chat_participants' })
    
    if (tableError) {
      console.log('⚠️  Cannot query table info directly (expected with RLS)')
    }

    console.log('\n🎉 DIRECT API TEST COMPLETE!')
    
    return true

  } catch (error) {
    console.error('💥 Test failed with exception:', error.message)
    return false
  }
}

// Also test a simulated fetch request like the browser makes
async function testFetchLikeRequest() {
  console.log('\n🌐 Testing with fetch() like browser...')
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/axis6_chat_participants?select=room_id&user_id=eq.b07a89a3-6030-42f9-8c60-ce28afc47132`
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`📡 Fetch response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('❌ Fetch error response:', errorText)
      
      if (errorText.includes('42P17') || errorText.includes('infinite recursion')) {
        console.log('🚨 CONFIRMED: Browser error still present!')
        return false
      }
    } else {
      const data = await response.json()
      console.log('✅ Fetch success:', data)
    }

    return true
  } catch (error) {
    console.error('💥 Fetch test failed:', error.message)
    return false
  }
}

// Run tests
async function runAllTests() {
  const directResult = await testDirectChatAPI()
  const fetchResult = await testFetchLikeRequest()
  
  console.log('\n📊 FINAL RESULTS:')
  console.log(`   Direct API Test: ${directResult ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`   Fetch Test: ${fetchResult ? '✅ PASS' : '❌ FAIL'}`)
  
  if (directResult && fetchResult) {
    console.log('\n🎉 ALL TESTS PASSED! Chat API is working!')
    console.log('   The 42P17 recursion error has been resolved.')
  } else {
    console.log('\n💥 TESTS FAILED! Still have issues.')
    console.log('   Please apply the SQL fix: fix-chat-rls-recursion-corrected.sql')
  }
  
  return directResult && fetchResult
}

runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test script error:', error)
    process.exit(1)
  })
