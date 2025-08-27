#!/usr/bin/env node
/**
 * AXIS6 Fix Auth Triggers Script
 * 
 * Provides the exact SQL commands to fix the missing auth triggers
 */

require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

console.log('🔧 AXIS6 FIX AUTH TRIGGERS')
console.log('='.repeat(40))

if (!SUPABASE_URL) {
  console.error('❌ Missing Supabase URL in .env.local')
  process.exit(1)
}

const projectId = SUPABASE_URL.split('.')[0].split('//')[1]
const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}/sql/new`

console.log(`🔗 Supabase Dashboard SQL Editor: ${dashboardUrl}`)
console.log('\n📋 INSTRUCTIONS TO FIX AUTH TRIGGERS')
console.log('='.repeat(40))

console.log('\n1️⃣ Open the Supabase Dashboard URL above')
console.log('2️⃣ Copy ONLY the SQL code below (ignore the instructions)')
console.log('3️⃣ Paste it in the SQL Editor')
console.log('4️⃣ Click "Run" to execute')
console.log('5️⃣ Run "npm run auth:diagnostic" to verify the fix')

console.log('\n🔍 COPY THIS SQL CODE ONLY:')
console.log('='.repeat(30))

// Read and display only the SQL content from the migration file
const migrationPath = path.join(__dirname, '../supabase/migrations/002_auth_triggers.sql')
const migrationContent = fs.readFileSync(migrationPath, 'utf8')

// Display the SQL content with clear markers
console.log('-- START COPYING FROM HERE --')
console.log(migrationContent)
console.log('-- STOP COPYING HERE --')

console.log('\n✅ After running the SQL above:')
console.log('1. The handle_new_user() function will be created')
console.log('2. The on_auth_user_created trigger will be created')
console.log('3. User creation should work properly')
console.log('4. User profiles will be created automatically')

console.log('\n🧪 To verify the fix:')
console.log('npm run auth:diagnostic')

console.log('\n🚨 IMPORTANT NOTES:')
console.log('- Copy ONLY the SQL code between the markers')
console.log('- Do NOT copy the JavaScript file content')
console.log('- This will create triggers that automatically create user profiles')
console.log('- The triggers use SECURITY DEFINER for proper permissions')
console.log('- All necessary permissions are granted automatically')
console.log('- This is safe to run multiple times (uses CREATE OR REPLACE)')
