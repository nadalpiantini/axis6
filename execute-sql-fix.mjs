#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key
const supabase = createClient(
  'https://nvpnhqhjttgwfwvkgmpk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTI1NiwiZXhwIjoyMDcxMjg1MjU2fQ.GP7JmDzqShni-KeZ9oyyNeWj_jWGrQLLYKt8SHxkXNM'
);

async function executeEmergencyFix() {
  console.log('🚨 AXIS6 EMERGENCY CHAT FIX - TOURNAMENT DEPLOYMENT');
  console.log('================================================');
  
  try {
    // Step 1: Test database connection
    console.log('📝 Step 1: Testing database connection...');
    const { data: profileTest, error: profileError } = await supabase
      .from('axis6_profiles')
      .select('id')
      .limit(1);
    
    if (profileError) {
      console.error('❌ Profile table connection failed:', profileError);
      return;
    }
    console.log('✅ Database connection verified');
    console.log('📊 Profile table accessible');

    // Step 2: Test chat rooms table
    console.log('\n📝 Step 2: Testing chat tables...');
    const { data: rooms, error: roomError } = await supabase
      .from('axis6_chat_rooms')
      .select('id, name, is_active, creator_id')
      .limit(5);
    
    if (roomError) {
      console.error('❌ Chat rooms error:', roomError);
      console.log('🔧 This confirms the RLS policy issues!');
    } else {
      console.log('✅ Chat rooms query successful');
      console.log('📊 Found', rooms?.length || 0, 'rooms');
    }

    // Step 3: Test chat messages
    console.log('\n📝 Step 3: Testing chat messages...');
    const { data: messages, error: msgError } = await supabase
      .from('axis6_chat_messages')
      .select('id, content, sender_id, room_id')
      .limit(3);
    
    if (msgError) {
      console.error('❌ Chat messages error:', msgError);
      console.log('🔧 RLS policies need immediate fixing!');
    } else {
      console.log('✅ Chat messages accessible');
      console.log('📊 Found', messages?.length || 0, 'messages');
    }

    // Step 4: Test participants
    console.log('\n📝 Step 4: Testing participants table...');
    const { data: participants, error: partError } = await supabase
      .from('axis6_chat_participants')
      .select('user_id, room_id, joined_at')
      .limit(3);
    
    if (partError) {
      console.error('❌ Chat participants error:', partError);
      console.log('🔧 Participant policies broken!');
    } else {
      console.log('✅ Chat participants accessible');
      console.log('📊 Found', participants?.length || 0, 'participants');
    }

    console.log('\n🎯 EMERGENCY ACTION REQUIRED:');
    console.log('=============================');
    console.log('1. 🌐 Open: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new');
    console.log('2. 📋 Copy SQL from: emergency_chat_fix.sql');
    console.log('3. ▶️  Click RUN to apply fix');
    console.log('4. 🧪 Test chat functionality');
    console.log('5. 🚀 Deploy to tournament!');
    
    console.log('\n⏱️  TOURNAMENT STATUS: URGENT DEPLOYMENT NEEDED');
    console.log('✅ Database accessible via service role');
    console.log('✅ Emergency SQL fix prepared');
    console.log('⚠️  Manual execution via dashboard required');
    
  } catch (error) {
    console.error('❌ Emergency fix script error:', error);
    console.log('\n🚨 IMMEDIATE FALLBACK:');
    console.log('1. Use Supabase Dashboard SQL Editor');
    console.log('2. File: emergency_chat_fix.sql');
    console.log('3. Execute manually NOW!');
  }
}

// Execute the diagnostic
executeEmergencyFix();