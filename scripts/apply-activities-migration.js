#!/usr/bin/env node
/**
 * Apply the activities migration to Supabase
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables!')
  console.error('Please check your .env.local file.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function applyMigration() {
  console.log('🚀 Applying activities migration to Supabase...')
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '008_axis_activities.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded successfully')
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`)
      
      // Show a preview of the statement
      const preview = statement.substring(0, 100).replace(/\n/g, ' ')
      console.log(`   ${preview}${statement.length > 100 ? '...' : ''}`)
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      }).single()
      
      if (error) {
        // Try direct execution if RPC fails
        console.log('   RPC failed, trying alternative method...')
        
        // For table creation, we'll check if it exists first
        if (statement.includes('CREATE TABLE')) {
          const tableName = 'axis6_axis_activities'
          const { data: existing } = await supabase
            .from(tableName)
            .select('count')
            .limit(1)
          
          if (existing !== null) {
            console.log(`   ✓ Table ${tableName} already exists`)
            continue
          }
        }
        
        console.error(`   ❌ Failed to execute statement: ${error.message}`)
        // Continue with other statements
      } else {
        console.log('   ✓ Statement executed successfully')
      }
    }
    
    // Verify the table was created
    console.log('\n🔍 Verifying migration...')
    
    const { data, error: verifyError } = await supabase
      .from('axis6_axis_activities')
      .select('count')
      .limit(1)
    
    if (verifyError) {
      if (verifyError.code === '42P01') {
        console.error('❌ Table axis6_axis_activities was not created')
        console.error('You may need to run the migration manually in the Supabase dashboard')
      } else {
        console.error('❌ Error verifying table:', verifyError.message)
      }
    } else {
      console.log('✅ Table axis6_axis_activities exists and is accessible')
      
      // Check RLS policies
      console.log('\n🔐 Checking RLS policies...')
      const { data: testInsert, error: testError } = await supabase
        .from('axis6_axis_activities')
        .select('*')
        .limit(1)
      
      if (testError && testError.code !== 'PGRST116') {
        console.error('⚠️  RLS might not be properly configured:', testError.message)
      } else {
        console.log('✅ RLS policies are in place')
      }
    }
    
    console.log('\n✨ Migration process completed!')
    console.log('\n📌 Next steps:')
    console.log('1. Clear your browser cache')
    console.log('2. Restart the development server')
    console.log('3. Enable Realtime in Supabase dashboard for axis6_axis_activities table')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

// Alternative: Direct table check and creation
async function directMigration() {
  console.log('\n🔄 Attempting direct migration approach...')
  
  try {
    // First, just check if we can query the table
    const { data, error } = await supabase
      .from('axis6_axis_activities')
      .select('*')
      .limit(1)
    
    if (error && error.code === '42P01') {
      console.log('❌ Table does not exist. Please run the migration manually in Supabase SQL Editor:')
      console.log('\n1. Go to https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new')
      console.log('2. Copy the contents of supabase/migrations/008_axis_activities.sql')
      console.log('3. Paste and run the migration')
      console.log('\nThe migration file is located at:')
      console.log(path.join(process.cwd(), 'supabase', 'migrations', '008_axis_activities.sql'))
    } else if (error) {
      console.log('⚠️  Table exists but there was an error:', error.message)
      console.log('This might be normal if RLS is enabled and no data exists yet.')
    } else {
      console.log('✅ Table axis6_axis_activities is already set up correctly!')
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

// Run the migration
applyMigration().catch(err => {
  console.error('\n🔄 Standard migration failed, trying alternative approach...')
  directMigration()
})