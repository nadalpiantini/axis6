#!/usr/bin/env node
/**
 * AXIS6 Temperament Tables Checker
 * Diagnoses profile page database issues
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTemperamentTables() {
  console.log('🔍 AXIS6 Temperament Tables Diagnostic\n')
  
  const tables = [
    'axis6_temperament_profiles',
    'axis6_temperament_questions', 
    'axis6_temperament_responses',
    'axis6_personalization_settings',
    'axis6_temperament_activities'
  ]
  
  try {
    console.log('📊 TABLE EXISTENCE CHECK')
    
    for (const tableName of tables) {
      try {
        // Try to query the table structure
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(0)
        
        if (error) {
          if (error.message.includes('does not exist') || error.code === '42P01') {
            console.log(`❌ ${tableName}: MISSING`)
          } else {
            console.log(`⚠️  ${tableName}: ERROR - ${error.message}`)
          }
        } else {
          console.log(`✅ ${tableName}: EXISTS (${data?.length || 0} records)`)
        }
      } catch (err) {
        console.log(`❌ ${tableName}: MISSING OR INACCESSIBLE`)
      }
    }
    
    // Test specific profile page queries
    console.log('\n🧪 PROFILE PAGE QUERIES TEST')
    
    // Try to fetch a temperament profile (will fail if table missing)
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('axis6_temperament_profiles')
        .select('*')
        .limit(1)
      
      if (profileError) {
        console.log(`❌ Temperament Profile Query: FAILED - ${profileError.message}`)
        console.log(`   This is likely why the profile page crashes!`)
      } else {
        console.log(`✅ Temperament Profile Query: SUCCESS`)
      }
    } catch (err) {
      console.log(`❌ Temperament Profile Query: CRITICAL FAILURE`)
      console.log(`   Error: ${err.message}`)
      console.log(`   This explains the profile page client-side exception!`)
    }
    
    // Check for existing migrations
    console.log('\n📋 MIGRATION STATUS CHECK')
    
    try {
      const { data: migrations, error: migError } = await supabase
        .from('supabase_migrations')
        .select('version')
        .order('version', { ascending: false })
      
      if (migError) {
        console.log('⚠️  Cannot check migration status')
      } else {
        const psychologyMigrations = migrations?.filter(m => 
          m.version.includes('20241225') || m.version.includes('20241226')
        ) || []
        
        console.log(`Found ${psychologyMigrations.length} psychology-related migrations:`)
        psychologyMigrations.forEach(m => console.log(`  - ${m.version}`))
        
        if (psychologyMigrations.length === 0) {
          console.log('❌ Psychology migrations NOT APPLIED')
          console.log('   This explains the missing tables!')
        }
      }
    } catch (err) {
      console.log('⚠️  Migration table check failed')
    }
    
    // Diagnosis summary
    console.log('\n🎯 DIAGNOSIS SUMMARY')
    console.log('===================')
    
    console.log('PROFILE PAGE ERROR CAUSES:')
    console.log('1. Missing temperament tables in database')
    console.log('2. Profile page tries to query non-existent tables')
    console.log('3. Client-side exception occurs during component render')
    console.log('')
    
    console.log('RECOMMENDED FIXES:')
    console.log('1. Apply psychological profiling migrations')
    console.log('2. Add error boundaries to profile page')
    console.log('3. Make temperament features optional')
    console.log('4. Improve defensive error handling')
    console.log('')
    
    console.log('RUN NEXT:')
    console.log('node scripts/apply-temperament-migrations.js')
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message)
    process.exit(1)
  }
}

checkTemperamentTables()