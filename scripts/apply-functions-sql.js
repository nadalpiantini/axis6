#!/usr/bin/env node

/**
 * Apply missing functions using direct SQL execution
 */

const fs = require('fs');
const path = require('path');

async function applyFunctions() {
  console.log('🔧 Applying missing database functions...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-functions.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📂 SQL file read:', sqlPath);
    console.log('📊 Size:', sqlContent.length, 'characters\n');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));
    
    console.log(`📋 Found ${statements.length} statements to execute\n`);
    
    // Instructions for manual execution
    console.log('📝 INSTRUCTIONS:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the following SQL:\n');
    console.log('=' .repeat(60));
    console.log(sqlContent);
    console.log('=' .repeat(60));
    console.log('\n4. Click "Run" to execute the SQL');
    console.log('5. Verify the functions are created successfully');
    
    // Also save to a file for easy access
    const outputPath = path.join(__dirname, 'functions-to-apply.sql');
    fs.writeFileSync(outputPath, sqlContent);
    console.log(`\n💾 SQL saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🔧 AXIS6 - Apply Missing Database Functions');
  console.log('=' .repeat(50));
  
  await applyFunctions();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Instructions provided!');
  console.log('🔄 After applying the SQL, test the my-day page again.');
}

main().catch(console.error);

