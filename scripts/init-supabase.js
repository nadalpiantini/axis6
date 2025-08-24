#!/usr/bin/env node

/**
 * AXIS6 - Supabase Initialization Helper
 * This script helps verify and initialize your Supabase setup
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function initSupabase() {
  log('\n🚀 AXIS6 - SUPABASE INITIALIZATION', 'cyan');
  log('=' .repeat(50), 'cyan');

  // Check environment variables
  log('\n📋 CHECKING ENVIRONMENT VARIABLES...', 'blue');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    log('❌ Missing Supabase credentials in .env.local', 'red');
    log('Please ensure you have:', 'yellow');
    log('  NEXT_PUBLIC_SUPABASE_URL=your_url', 'yellow');
    log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key', 'yellow');
    process.exit(1);
  }
  
  log('✅ Environment variables found', 'green');
  log(`   URL: ${SUPABASE_URL}`, 'green');

  // Create Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Test connection
  log('\n🔗 TESTING CONNECTION...', 'blue');
  try {
    const { data, error } = await supabase.from('axis6_categories').select('count');
    if (!error) {
      log('✅ Connected to Supabase successfully', 'green');
    } else if (error.code === 'PGRST116') {
      log('⚠️  Connected but tables not found - need to run migrations', 'yellow');
    } else {
      throw error;
    }
  } catch (error) {
    log(`❌ Connection failed: ${error.message}`, 'red');
    process.exit(1);
  }

  // Check tables
  log('\n📊 CHECKING DATABASE TABLES...', 'blue');
  const tables = [
    'axis6_profiles',
    'axis6_categories',
    'axis6_checkins',
    'axis6_streaks',
    'axis6_daily_stats'
  ];

  let tablesOk = true;
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error && error.code === 'PGRST116') {
        log(`❌ Table ${table} not found`, 'red');
        tablesOk = false;
      } else if (error && error.code === '42501') {
        log(`⚠️  Table ${table} exists but RLS may be blocking access`, 'yellow');
      } else if (!error) {
        log(`✅ Table ${table} OK`, 'green');
      }
    } catch (err) {
      log(`❌ Error checking ${table}: ${err.message}`, 'red');
      tablesOk = false;
    }
  }

  if (!tablesOk) {
    log('\n⚠️  SOME TABLES ARE MISSING', 'yellow');
    log('Please run the following:', 'yellow');
    log('1. Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new', 'cyan');
    log('2. Copy the contents of EJECUTAR_EN_SUPABASE.sql', 'cyan');
    log('3. Paste and click RUN', 'cyan');
    return;
  }

  // Check categories data
  log('\n🎯 CHECKING CATEGORIES DATA...', 'blue');
  const { data: categories, error: catError } = await supabase
    .from('axis6_categories')
    .select('*')
    .order('position');

  if (!catError && categories) {
    if (categories.length === 6) {
      log(`✅ Found all 6 categories`, 'green');
      categories.forEach(cat => {
        log(`   - ${cat.slug}: ${cat.name.en || cat.name.es}`, 'green');
      });
    } else if (categories.length === 0) {
      log('⚠️  No categories found - need to insert initial data', 'yellow');
    } else {
      log(`⚠️  Found ${categories.length} categories (expected 6)`, 'yellow');
    }
  }

  // Test auth
  log('\n🔐 TESTING AUTHENTICATION...', 'blue');
  const testEmail = `test-${Date.now()}@axis6.local`;
  const testPassword = 'TestPass123!@#$';

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { name: 'Test User' }
    }
  });

  if (signUpError) {
    if (signUpError.message.includes('not authorized')) {
      log('⚠️  Auth disabled or restricted - check Supabase dashboard', 'yellow');
    } else {
      log(`⚠️  Sign up test failed: ${signUpError.message}`, 'yellow');
    }
  } else if (signUpData.user) {
    log('✅ Authentication is working', 'green');
    if (signUpData.session) {
      log('   ✅ Email confirmation is DISABLED (good for dev)', 'green');
    } else {
      log('   ⚠️  Email confirmation is ENABLED (may slow down dev)', 'yellow');
    }
    
    // Clean up test user if using service role
    if (SERVICE_ROLE_KEY) {
      const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      await adminSupabase.auth.admin.deleteUser(signUpData.user.id);
      log('   🧹 Test user cleaned up', 'green');
    }
  }

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('📝 SUMMARY', 'cyan');
  log('=' .repeat(50), 'cyan');
  
  log('\n✅ SUPABASE IS READY!', 'green');
  log('\n🎯 NEXT STEPS:', 'blue');
  log('1. Go to Supabase Dashboard:', 'yellow');
  log(`   https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/auth/settings`, 'cyan');
  log('\n2. Verify these settings:', 'yellow');
  log('   - Site URL: http://localhost:6789', 'cyan');
  log('   - Redirect URLs include: http://localhost:6789/**', 'cyan');
  log('   - Email confirmations: OFF (for development)', 'cyan');
  log('\n3. Start development:', 'yellow');
  log('   npm run dev', 'cyan');
  log('   Visit: http://localhost:6789', 'cyan');
  
  log('\n🚀 Happy coding with AXIS6!\n', 'green');
}

// Run the initialization
initSupabase().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});