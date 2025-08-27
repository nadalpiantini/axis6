#!/usr/bin/env node
/**
 * Test current state of My Day RPC functions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nvpnhqhjttgwfwvkgmpk.supabase.co';

// Load environment
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = envContent.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const [key, ...values] = line.split('=');
      return [key.trim(), values.join('=').trim().replace(/^"/, '').replace(/"$/, '')];
    });
  
  envVars.forEach(([key, value]) => {
    process.env[key] = value;
  });
}

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testCurrentFunctions() {
  console.log('🔍 TESTING CURRENT MY DAY FUNCTION STATE');
  console.log('Database:', SUPABASE_URL);
  console.log('');

  const testUserId = 'b07a89a3-6030-42f9-8c60-ce28afc47132'; // Alan's real user ID
  const testDate = new Date().toISOString().split('T')[0];

  let functionsWorking = 0;
  const results = [];

  try {
    // Test 1: get_my_day_data
    console.log('1️⃣ Testing get_my_day_data...');
    try {
      const { data: dayData, error: dayError } = await supabase.rpc('get_my_day_data', {
        p_user_id: testUserId,
        p_date: testDate
      });

      if (dayError) {
        console.log('❌ get_my_day_data:', dayError.message);
        results.push(`❌ get_my_day_data: ${dayError.message}`);
      } else {
        console.log('✅ get_my_day_data: Working -', typeof dayData, dayData ? JSON.stringify(dayData).substring(0, 100) + '...' : 'null');
        results.push('✅ get_my_day_data: Working');
        functionsWorking++;
      }
    } catch (err) {
      console.log('❌ get_my_day_data exception:', err.message);
      results.push(`❌ get_my_day_data: Exception - ${err.message}`);
    }

    // Test 2: start_activity_timer  
    console.log('2️⃣ Testing start_activity_timer...');
    try {
      const { data: startData, error: startError } = await supabase.rpc('start_activity_timer', {
        p_user_id: testUserId,
        p_category_id: '272e361b-5b58-404c-964c-c1977cbdab80', // Physical category
        p_time_block_id: null,
        p_activity_name: 'Test Current State',
        p_activity_id: null
      });

      if (startError) {
        console.log('❌ start_activity_timer:', startError.message);
        results.push(`❌ start_activity_timer: ${startError.message}`);
      } else {
        console.log('✅ start_activity_timer: Working -', typeof startData);
        results.push('✅ start_activity_timer: Working');
        functionsWorking++;

        // Test 3: stop_activity_timer (if start worked)
        if (typeof startData === 'number' || (startData && startData.id)) {
          console.log('3️⃣ Testing stop_activity_timer...');
          const logId = typeof startData === 'number' ? startData : startData.id;
          
          try {
            const { data: stopData, error: stopError } = await supabase.rpc('stop_activity_timer', {
              p_user_id: testUserId,
              p_activity_log_id: logId
            });

            if (stopError) {
              console.log('❌ stop_activity_timer:', stopError.message);
              results.push(`❌ stop_activity_timer: ${stopError.message}`);
            } else {
              console.log('✅ stop_activity_timer: Working -', typeof stopData);
              results.push('✅ stop_activity_timer: Working');
              functionsWorking++;
            }
          } catch (err) {
            console.log('❌ stop_activity_timer exception:', err.message);
            results.push(`❌ stop_activity_timer: Exception - ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.log('❌ start_activity_timer exception:', err.message);
      results.push(`❌ start_activity_timer: Exception - ${err.message}`);
    }

    console.log('');
    console.log('📊 FUNCTION STATUS SUMMARY');
    console.log('═══════════════════════════');
    results.forEach(result => console.log(result));
    console.log('');
    console.log(`Working functions: ${functionsWorking}/3`);

    if (functionsWorking === 3) {
      console.log('');
      console.log('🎉 ALL FUNCTIONS ARE WORKING!');
      console.log('✅ My Day page should be functional');
      console.log('🔗 Test at: https://axis6.app/my-day');
      console.log('📊 Production status: READY ✅');
    } else if (functionsWorking > 0) {
      console.log('');
      console.log('⚠️  PARTIAL SUCCESS');
      console.log(`${functionsWorking}/3 functions are working`);
      console.log('🔧 Manual intervention may be needed for remaining functions');
    } else {
      console.log('');
      console.log('❌ NO FUNCTIONS WORKING');
      console.log('🚨 CRITICAL: Manual deployment required immediately');
      console.log('');
      console.log('📋 MANUAL DEPLOYMENT STEPS:');
      console.log('1. Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql');
      console.log('2. Copy all contents from: scripts/FINAL_MY_DAY_FIX.sql');  
      console.log('3. Paste and execute in SQL Editor');
      console.log('4. Verify functions appear in Database > Functions');
      console.log('5. Re-run this test script to confirm deployment');
    }

    // Clean up any test data
    try {
      await supabase
        .from('axis6_activity_logs')
        .delete()
        .eq('user_id', testUserId)
        .ilike('activity_name', '%test%');
    } catch (err) {
      // Cleanup isn't critical
    }

  } catch (error) {
    console.error('❌ TESTING FAILED:', error.message);
    console.error('');
    console.error('🚨 CRITICAL ERROR: Unable to test database functions');
    console.error('Production My Day page is likely broken');
    process.exit(1);
  }
}

// Execute test
testCurrentFunctions().catch(console.error);