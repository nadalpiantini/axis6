#!/usr/bin/env node

/**
 * Verify migration 011 status and provide manual instructions
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvpnhqhjttgwfwvkgmpk.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTI1NiwiZXhwIjoyMDcxMjg1MjU2fQ.GP7JmDzqShni-KeZ9oyyNeWj_jWGrQLLYKt8SHxkXNM';

// Create Supabase client
const supabase = createClient(supabaseUrl, serviceKey);

async function verifyTables() {
  console.log('🗄️ AXIS6 Migration 011 Verification');
  console.log('=' .repeat(50));
  
  const tables = [
    'axis6_time_blocks',
    'axis6_activity_logs', 
    'axis6_daily_time_summary'
  ];
  
  let allTablesExist = true;
  
  for (const tableName of tables) {
    try {
      console.log(`🔍 Checking table: ${tableName}...`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${tableName}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table ${tableName}: Accessible`);
      }
    } catch (error) {
      console.log(`❌ Table ${tableName}: ${error.message}`);
      allTablesExist = false;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  
  if (allTablesExist) {
    console.log('🎉 All tables exist! Migration 011 is applied.');
    console.log('✅ My Day feature should work correctly in production.');
  } else {
    console.log('⚠️  Migration 011 needs to be applied manually.');
    console.log('\n📋 Manual Steps:');
    console.log('1. Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new');
    console.log('2. Copy the contents of: supabase/migrations/011_my_day_time_tracking.sql');
    console.log('3. Paste and execute the SQL in the Supabase SQL editor');
    console.log('4. Run this script again to verify');
    
    console.log('\n🔗 Direct link to SQL editor:');
    console.log('https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new');
  }
  
  // Test a few core functions if tables exist
  if (allTablesExist) {
    console.log('\n🧪 Testing core functions...');
    
    try {
      // Test the get_my_day_data function
      const { data: functionTest, error: functionError } = await supabase.rpc(
        'get_my_day_data', 
        { 
          p_user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
          p_date: '2025-01-01' 
        }
      );
      
      if (functionError) {
        console.log('❌ RPC Function test failed:', functionError.message);
      } else {
        console.log('✅ RPC Functions working correctly');
      }
    } catch (error) {
      console.log('❌ RPC Function test error:', error.message);
    }
  }
}

verifyTables().catch(console.error);