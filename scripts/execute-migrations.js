#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

async function executeSql(sql, description) {
  console.log(`\n🔄 Executing: ${description}...`);
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  // Try alternative endpoint if first one fails
  if (!response.ok) {
    const alternativeResponse = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (alternativeResponse.ok) {
      const result = await alternativeResponse.json();
      console.log(`✅ ${description} completed`);
      return result;
    }
    
    console.error(`❌ Failed to execute ${description}`);
    console.error(`Status: ${response.status}`);
    const errorText = await response.text();
    console.error(`Error: ${errorText}`);
    throw new Error(`Failed to execute ${description}`);
  }

  const result = await response.json();
  console.log(`✅ ${description} completed`);
  return result;
}

async function runMigrations() {
  try {
    console.log('🚀 Starting AXIS6 database migrations...\n');

    // Read migration files
    const migration1 = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql'),
      'utf8'
    );
    
    const migration2 = fs.readFileSync(
      path.join(__dirname, '..', 'supabase', 'migrations', '002_auth_trigger.sql'),
      'utf8'
    );

    // Split migration1 into smaller chunks to handle large SQL
    const statements = migration1.split(/;(?=\s*\n)/).filter(s => s.trim());
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        const description = statement.substring(0, 50).replace(/\n/g, ' ');
        await executeSql(statement + ';', `Statement ${i + 1}: ${description}...`);
      }
    }

    // Execute auth trigger
    await executeSql(migration2, 'Auth trigger creation');

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📊 Created tables:');
    console.log('  - axis6_profiles');
    console.log('  - axis6_categories (with 6 initial categories)');
    console.log('  - axis6_checkins');
    console.log('  - axis6_streaks');
    console.log('  - axis6_daily_stats');
    console.log('\n🔐 RLS policies are active');
    console.log('🎯 Auth trigger is configured');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations();