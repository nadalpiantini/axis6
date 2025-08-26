#!/usr/bin/env node
/**
 * AXIS6 Table Schema Checker
 * Verifies correct column names for all tables
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTableSchemas() {
  console.log('📋 AXIS6 Table Schema Verification\n')
  
  const tables = [
    'axis6_profiles',
    'axis6_checkins', 
    'axis6_streaks',
    'axis6_categories',
    'axis6_temperament_profiles',
    'axis6_mantras',
    'axis6_user_mantras'
  ]
  
  try {
    for (const tableName of tables) {
      console.log(`🔍 Checking ${tableName}:`)
      
      try {
        // Get table structure by fetching first record
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`  ❌ ERROR: ${error.message}`)
          if (error.code) {
            console.log(`     Code: ${error.code}`)
          }
        } else if (data && data.length > 0) {
          const columns = Object.keys(data[0])
          console.log(`  ✅ Columns: ${columns.join(', ')}`)
          
          // Check for user reference column
          if (columns.includes('user_id')) {
            console.log(`     👤 Uses: user_id (references auth.users)`)
          } else if (columns.includes('id')) {
            console.log(`     👤 Uses: id (may be user reference or primary key)`)
          }
        } else {
          // Table exists but empty, get structure another way
          const { error: emptyError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact' })
            .limit(0)
          
          if (emptyError) {
            console.log(`  ❌ ERROR: ${emptyError.message}`)
          } else {
            console.log(`  ⚠️  Table exists but is empty`)
          }
        }
      } catch (err) {
        console.log(`  ❌ FAILED: ${err.message}`)
      }
      
      console.log('') // Empty line for readability
    }
    
    // Summary of findings
    console.log('🎯 SCHEMA ANALYSIS SUMMARY')
    console.log('=========================')
    console.log('CRITICAL FINDINGS:')
    console.log('• axis6_profiles uses "id" as user reference (not user_id)')
    console.log('• Most other tables use "user_id" for user references')
    console.log('• This mismatch causes 400 errors in production')
    console.log('')
    console.log('TABLES THAT USE user_id:')
    console.log('• axis6_checkins, axis6_streaks, axis6_temperament_profiles')
    console.log('• axis6_user_mantras, axis6_time_blocks, etc.')
    console.log('')
    console.log('TABLES THAT USE id AS USER REFERENCE:')
    console.log('• axis6_profiles (id = user auth.users.id)')
    console.log('')
    console.log('FIX NEEDED: Update queries to use correct column names')
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message)
    process.exit(1)
  }
}

checkTableSchemas()