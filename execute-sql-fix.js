#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client with service role key
const supabase = createClient(
  'https://nvpnhqhjttgwfwvkgmpk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTI1NiwiZXhwIjoyMDcxMjg1MjU2fQ.GP7JmDzqShni-KeZ9oyyNeWj_jWGrQLLYKt8SHxkXNM'
);

async function executeEmergencyFix() {
  console.log('🚨 EXECUTING EMERGENCY CHAT FIX...');
  
  try {
    // Step 1: Add is_private column
    console.log('📝 Step 1: Adding is_private column...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE axis6_chat_rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;'
    });
    
    if (alterError && !alterError.message.includes('already exists')) {
      console.error('❌ Failed to add is_private column:', alterError);
      return;
    }
    console.log('✅ is_private column ready');

    // Step 2: Test connection to chat tables
    console.log('📝 Step 2: Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('axis6_chat_rooms')
      .select('id, name, is_active')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      return;
    }
    console.log('✅ Database connection verified');
    console.log('📊 Found', testData?.length || 0, 'chat rooms');

    // Step 3: Check current policies
    console.log('📝 Step 3: Checking current RLS policies...');
    const { data: policies } = await supabase.rpc('get_policies_info', {});
    console.log('📋 Found policies:', policies?.length || 'unknown');

    // Step 4: Test basic chat functionality
    console.log('📝 Step 4: Testing chat API endpoints...');
    const { data: rooms, error: roomError } = await supabase
      .from('axis6_chat_rooms')
      .select('*')
      .eq('is_active', true);
    
    if (roomError) {
      console.error('❌ Chat rooms query failed:', roomError);
      console.log('🔧 This confirms we need to apply the SQL fix!');
    } else {
      console.log('✅ Chat rooms accessible:', rooms?.length || 0);
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new');
    console.log('2. Copy the SQL from: emergency_chat_fix.sql');
    console.log('3. Run the complete fix immediately');
    console.log('\n⏱️ URGENT: Tournament deployment needed NOW!');
    
  } catch (error) {
    console.error('❌ Emergency fix script error:', error);
    console.log('\n🚨 FALLBACK: Use Supabase Dashboard SQL Editor manually');
    console.log('📁 File: emergency_chat_fix.sql');
  }
}

// Execute the fix
executeEmergencyFix();