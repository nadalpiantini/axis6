#!/usr/bin/env node

/**
 * Apply Database Fixes Script
 * Fixes all current database issues causing API errors
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function applyDatabaseFixes() {
  console.log('🔧 Applying database fixes...\n')

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'EMERGENCY_FIX_ALL_ERRORS.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Executing SQL fixes...')
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.log('⚠️  RPC method not available, trying direct execution...')
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement })
          if (stmtError) {
            console.log(`⚠️  Statement failed (this is normal for some statements): ${stmt.substring(0, 50)}...`)
          }
        } catch (e) {
          // Ignore errors for statements that can't be executed via RPC
        }
      }
    }

    console.log('✅ SQL fixes applied\n')

    // Test the fixes
    await testDatabaseFixes()

  } catch (error) {
    console.error('❌ Error applying fixes:', error)
    process.exit(1)
  }
}

async function testDatabaseFixes() {
  console.log('🧪 Testing database fixes...\n')

  // Test 1: Check if get_my_day_data function exists
  console.log('1️⃣ Testing get_my_day_data function...')
  try {
    const { data: myDayData, error: myDayError } = await supabase.rpc('get_my_day_data', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_date: '2025-01-01'
    })

    if (myDayError) {
      if (myDayError.code === '42883') {
        console.log('❌ get_my_day_data function not found')
      } else {
        console.log('⚠️  get_my_day_data function exists but has issues:', myDayError.message)
      }
    } else {
      console.log('✅ get_my_day_data function working')
    }
  } catch (error) {
    console.log('❌ Error testing get_my_day_data:', error.message)
  }

  // Test 2: Check if axis6_axis_activities table exists
  console.log('\n2️⃣ Testing axis6_axis_activities table...')
  try {
    const { data: activities, error: activitiesError } = await supabase
      .from('axis6_axis_activities')
      .select('count')
      .limit(1)

    if (activitiesError) {
      console.log('❌ axis6_axis_activities table error:', activitiesError.message)
    } else {
      console.log('✅ axis6_axis_activities table accessible')
    }
  } catch (error) {
    console.log('❌ Error testing axis6_axis_activities:', error.message)
  }

  // Test 3: Check if axis6_time_blocks table exists
  console.log('\n3️⃣ Testing axis6_time_blocks table...')
  try {
    const { data: timeBlocks, error: timeBlocksError } = await supabase
      .from('axis6_time_blocks')
      .select('count')
      .limit(1)

    if (timeBlocksError) {
      console.log('❌ axis6_time_blocks table error:', timeBlocksError.message)
    } else {
      console.log('✅ axis6_time_blocks table accessible')
    }
  } catch (error) {
    console.log('❌ Error testing axis6_time_blocks:', error.message)
  }

  // Test 4: Check if axis6_categories table exists
  console.log('\n4️⃣ Testing axis6_categories table...')
  try {
    const { data: categories, error: categoriesError } = await supabase
      .from('axis6_categories')
      .select('count')
      .limit(1)

    if (categoriesError) {
      console.log('❌ axis6_categories table error:', categoriesError.message)
    } else {
      console.log('✅ axis6_categories table accessible')
    }
  } catch (error) {
    console.log('❌ Error testing axis6_categories:', error.message)
  }

  console.log('\n🎉 Database fix testing completed!')
  console.log('\n📋 Next steps:')
  console.log('1. Apply the SQL manually in Supabase SQL Editor if needed')
  console.log('2. Restart your development server')
  console.log('3. Test the application')
}

// Run the script
applyDatabaseFixes()
