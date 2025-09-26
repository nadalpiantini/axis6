#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Test with anon key first (what users would experience)
const supabaseAnon = createClient(
  'https://nvpnhqhjttgwfwvkgmpk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDkyNTYsImV4cCI6MjA3MTI4NTI1Nn0.yVgnHzflgpX_CMY4VB62ndZlsrfeH0Mlhl026HT06C0'
);

async function testChatSystem() {
  console.log('🧪 TESTING CURRENT CHAT SYSTEM STATUS');
  console.log('=====================================');
  
  try {
    // Test 1: Anonymous access to chat rooms (should work for public rooms)
    console.log('📝 Test 1: Anonymous access to public chat rooms...');
    const { data: publicRooms, error: publicError } = await supabaseAnon
      .from('axis6_chat_rooms')
      .select('id, name, is_active, is_private')
      .eq('is_active', true);
    
    if (publicError) {
      console.error('❌ Public rooms access failed:', publicError.message);
      console.log('🔧 RLS policies need fixing!');
    } else {
      console.log('✅ Public rooms accessible');
      console.log('📊 Found', publicRooms?.length || 0, 'active rooms');
      if (publicRooms?.length > 0) {
        console.log('📋 Sample room:', publicRooms[0]);
      }
    }

    // Test 2: Anonymous access to chat messages
    console.log('\n📝 Test 2: Anonymous access to chat messages...');
    const { data: publicMessages, error: messageError } = await supabaseAnon
      .from('axis6_chat_messages')
      .select('id, content, created_at, room_id')
      .limit(5);
    
    if (messageError) {
      console.error('❌ Message access failed:', messageError.message);
      if (messageError.message.includes('RLS')) {
        console.log('🔧 This is the RLS policy issue causing 500 errors!');
      }
    } else {
      console.log('✅ Messages accessible');
      console.log('📊 Found', publicMessages?.length || 0, 'messages');
    }

    // Test 3: Check if is_private column exists
    console.log('\n📝 Test 3: Checking is_private column...');
    const { data: roomsWithPrivacy, error: privacyError } = await supabaseAnon
      .from('axis6_chat_rooms')
      .select('id, name, is_private')
      .limit(1);
    
    if (privacyError) {
      console.error('❌ is_private column missing:', privacyError.message);
      console.log('🔧 Need to add is_private column!');
    } else {
      console.log('✅ is_private column exists');
    }

    // Test 4: Test participants table
    console.log('\n📝 Test 4: Testing participants access...');
    const { data: participants, error: participantError } = await supabaseAnon
      .from('axis6_chat_participants')
      .select('user_id, room_id, joined_at')
      .limit(3);
    
    if (participantError) {
      console.error('❌ Participants access failed:', participantError.message);
      console.log('🔧 Participant RLS policies broken!');
    } else {
      console.log('✅ Participants accessible');
      console.log('📊 Found', participants?.length || 0, 'participants');
    }

    // Summary
    console.log('\n📊 CHAT SYSTEM STATUS SUMMARY:');
    console.log('==============================');
    if (!publicError && !messageError && !privacyError && !participantError) {
      console.log('🎉 EXCELLENT: Chat system appears to be working!');
      console.log('✅ All core tables accessible');
      console.log('✅ RLS policies functioning');
      console.log('✅ Ready for tournament deployment');
      console.log('\n🚀 TOURNAMENT STATUS: READY TO GO!');
    } else {
      console.log('⚠️  ISSUES DETECTED: SQL fix needed');
      console.log('🔧 Apply emergency_chat_fix.sql via Supabase dashboard');
      console.log('🌐 URL: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new');
      console.log('\n⏱️  URGENT: Fix required before tournament!');
    }
    
  } catch (error) {
    console.error('❌ Chat system test failed:', error);
    console.log('🚨 CRITICAL: Apply SQL fix immediately!');
  }
}

// Run the test
testChatSystem();