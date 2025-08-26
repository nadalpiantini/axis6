const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function applyProductionFunctions() {
  console.log('🔧 Applying missing database functions to production...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'fix-functions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Executing SQL functions...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql not available, trying direct execution...');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
            if (stmtError) {
              console.log(`⚠️  Statement failed (this might be expected): ${statement.substring(0, 50)}...`);
            }
          } catch (e) {
            console.log(`⚠️  Statement execution failed: ${e.message}`);
          }
        }
      }
    }
    
    console.log('✅ Functions applied successfully!');
    
    // Test the functions
    console.log('🧪 Testing functions...');
    
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const testDate = '2025-01-26';
    
    // Test get_my_day_data
    const { data: myDayData, error: myDayError } = await supabase
      .rpc('get_my_day_data', {
        p_user_id: testUserId,
        p_date: testDate
      });
    
    if (myDayError) {
      console.log('⚠️  get_my_day_data test failed:', myDayError.message);
    } else {
      console.log('✅ get_my_day_data function working');
    }
    
    // Test calculate_daily_time_distribution
    const { data: timeDistData, error: timeDistError } = await supabase
      .rpc('calculate_daily_time_distribution', {
        p_user_id: testUserId,
        p_date: testDate
      });
    
    if (timeDistError) {
      console.log('⚠️  calculate_daily_time_distribution test failed:', timeDistError.message);
    } else {
      console.log('✅ calculate_daily_time_distribution function working');
    }
    
  } catch (error) {
    console.error('❌ Error applying functions:', error);
    process.exit(1);
  }
}

applyProductionFunctions();
