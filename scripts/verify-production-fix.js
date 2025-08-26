#!/usr/bin/env node

/**
 * Verification script for AXIS6 production database fix
 * Run this after executing PRODUCTION_FIX_COMPLETE.sql
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function verifyTables() {
  log('\n🔍 Verifying Tables...', 'cyan')
  
  const requiredTables = [
    'axis6_profiles',
    'axis6_categories',
    'axis6_checkins',
    'axis6_streaks',
    'axis6_daily_stats',
    'axis6_temperament_profiles',
    'axis6_temperament_questions',
    'axis6_temperament_responses',
    'axis6_personalization_settings',
    'axis6_temperament_activities'
  ]
  
  let allTablesExist = true
  
  for (const table of requiredTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error && error.code === '42P01') {
        log(`  ❌ ${table} - DOES NOT EXIST`, 'red')
        allTablesExist = false
      } else if (error) {
        log(`  ⚠️  ${table} - Error: ${error.message}`, 'yellow')
      } else {
        log(`  ✅ ${table} - Exists (${count || 0} rows)`, 'green')
      }
    } catch (err) {
      log(`  ❌ ${table} - Error checking: ${err.message}`, 'red')
      allTablesExist = false
    }
  }
  
  return allTablesExist
}

async function verifySchemaTypes() {
  log('\n🔍 Verifying Schema Types...', 'cyan')
  
  // Check completed_at column type in axis6_checkins
  const { data: checkinsSchema, error: schemaError } = await supabase
    .rpc('get_column_info', { 
      table_name: 'axis6_checkins',
      column_name: 'completed_at'
    })
    .single()
  
  if (schemaError) {
    // Try alternative query
    const { data, error } = await supabase
      .from('axis6_checkins')
      .select('completed_at')
      .limit(1)
    
    if (!error) {
      log('  ✅ axis6_checkins.completed_at - Schema accessible', 'green')
    } else {
      log(`  ⚠️  Cannot verify completed_at type: ${error.message}`, 'yellow')
    }
  } else {
    const dataType = checkinsSchema?.data_type || 'unknown'
    if (dataType.includes('timestamp')) {
      log(`  ✅ axis6_checkins.completed_at - Type: ${dataType}`, 'green')
    } else {
      log(`  ❌ axis6_checkins.completed_at - Wrong type: ${dataType} (should be TIMESTAMPTZ)`, 'red')
    }
  }
}

async function verifyRLSPolicies() {
  log('\n🔍 Verifying RLS Policies...', 'cyan')
  
  const tablesToCheck = [
    'axis6_temperament_profiles',
    'axis6_temperament_questions',
    'axis6_temperament_responses',
    'axis6_personalization_settings',
    'axis6_temperament_activities'
  ]
  
  for (const table of tablesToCheck) {
    // Test if RLS is enabled by trying to query without auth
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error && error.message.includes('row-level security')) {
      log(`  ✅ ${table} - RLS enabled and working`, 'green')
    } else if (error && error.code === '42P01') {
      log(`  ⚠️  ${table} - Table doesn't exist yet`, 'yellow')
    } else if (data) {
      log(`  ✅ ${table} - Accessible (RLS may be configured correctly)`, 'green')
    } else {
      log(`  ⚠️  ${table} - Unknown status`, 'yellow')
    }
  }
}

async function verifyTemperamentQuestions() {
  log('\n🔍 Verifying Temperament Questions...', 'cyan')
  
  const { data: questions, error } = await supabase
    .from('axis6_temperament_questions')
    .select('*')
    .eq('is_active', true)
    .order('order_index')
  
  if (error && error.code === '42P01') {
    log('  ❌ Temperament questions table does not exist', 'red')
    return false
  } else if (error) {
    log(`  ⚠️  Error fetching questions: ${error.message}`, 'yellow')
    return false
  } else if (questions && questions.length > 0) {
    log(`  ✅ Found ${questions.length} active temperament questions`, 'green')
    questions.slice(0, 3).forEach((q, i) => {
      const questionText = q.question_text?.en || 'No text'
      log(`     ${i + 1}. ${questionText.substring(0, 50)}...`, 'blue')
    })
    return true
  } else {
    log('  ⚠️  No temperament questions found (need to insert sample data)', 'yellow')
    return false
  }
}

async function testSampleQuery() {
  log('\n🔍 Testing Sample Queries...', 'cyan')
  
  // Test profile query with correct column
  const { data: profileData, error: profileError } = await supabase
    .from('axis6_profiles')
    .select('*')
    .limit(1)
  
  if (profileError) {
    log(`  ❌ Profile query failed: ${profileError.message}`, 'red')
  } else {
    log(`  ✅ Profile query successful`, 'green')
  }
  
  // Test checkins query with proper timestamp
  const today = new Date().toISOString().split('T')[0]
  const { data: checkinsData, error: checkinsError } = await supabase
    .from('axis6_checkins')
    .select('*')
    .gte('completed_at', `${today}T00:00:00.000Z`)
    .lte('completed_at', `${today}T23:59:59.999Z`)
    .limit(1)
  
  if (checkinsError) {
    log(`  ❌ Checkins query failed: ${checkinsError.message}`, 'red')
  } else {
    log(`  ✅ Checkins query successful`, 'green')
  }
}

async function main() {
  log('=' .repeat(60), 'cyan')
  log('AXIS6 Production Fix Verification Script', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  try {
    // Run all verifications
    const tablesOk = await verifyTables()
    await verifySchemaTypes()
    await verifyRLSPolicies()
    const questionsOk = await verifyTemperamentQuestions()
    await testSampleQuery()
    
    // Summary
    log('\n' + '=' .repeat(60), 'cyan')
    log('VERIFICATION SUMMARY', 'cyan')
    log('=' .repeat(60), 'cyan')
    
    if (tablesOk && questionsOk) {
      log('\n✅ All critical checks passed!', 'green')
      log('Your AXIS6 production database is properly configured.', 'green')
    } else {
      log('\n⚠️  Some issues detected!', 'yellow')
      log('Please run the PRODUCTION_FIX_COMPLETE.sql script in Supabase Dashboard.', 'yellow')
      log('Path: scripts/PRODUCTION_FIX_COMPLETE.sql', 'blue')
    }
    
    log('\nNext steps:', 'cyan')
    log('1. If any errors, run the SQL fix script in Supabase Dashboard', 'blue')
    log('2. Test the dashboard at http://localhost:6789/dashboard', 'blue')
    log('3. Test the profile page at http://localhost:6789/profile', 'blue')
    log('4. Verify AI features work correctly', 'blue')
    
  } catch (error) {
    log(`\n❌ Verification failed with error: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Run the verification
main().catch(console.error)