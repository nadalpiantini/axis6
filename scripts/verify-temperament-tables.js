#!/usr/bin/env node
/**
 * Verify Temperament Tables Script for AXIS6
 * 
 * This script verifies that the temperament tables were created successfully
 * after running the migration
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyTemperamentTables() {
  console.log('🔍 Verifying temperament tables...\n')
  
  const temperamentTables = [
    'axis6_temperament_profiles',
    'axis6_temperament_questions',
    'axis6_temperament_responses',
    'axis6_personalization_settings',
    'axis6_temperament_activities'
  ]
  
  let allTablesExist = true
  
  for (const table of temperamentTables) {
    console.log(`Checking ${table}...`)
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ ${table} - DOES NOT EXIST`)
          allTablesExist = false
        } else {
          console.log(`⚠️  ${table} - Error: ${error.message}`)
        }
      } else {
        console.log(`✅ ${table} - EXISTS`)
      }
    } catch (error) {
      console.log(`❌ ${table} - Exception: ${error.message}`)
      allTablesExist = false
    }
  }
  
  console.log('\n📊 Summary:')
  if (allTablesExist) {
    console.log('🎉 All temperament tables exist!')
    console.log('💡 The 404 errors should now be resolved.')
    console.log('   Try refreshing your application.')
  } else {
    console.log('❌ Some temperament tables are missing.')
    console.log('💡 You need to run the temperament migration.')
    console.log('   Copy and paste the SQL from TEMPERAMENT_MIGRATION_FIX.sql')
    console.log('   into the Supabase SQL Editor and run it.')
  }
  
  // Test specific table that was causing 404 errors
  console.log('\n🔍 Testing specific 404 error table...')
  try {
    const { data, error } = await supabase
      .from('axis6_temperament_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`❌ axis6_temperament_profiles still has issues: ${error.message}`)
    } else {
      console.log('✅ axis6_temperament_profiles is accessible')
    }
  } catch (error) {
    console.log(`❌ axis6_temperament_profiles exception: ${error.message}`)
  }
}

async function main() {
  try {
    await verifyTemperamentTables()
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
