#!/usr/bin/env node

/**
 * Fix missing database functions for my-day and time-blocks APIs
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nvpnhqhjttgwfwvkgmpk.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTI1NiwiZXhwIjoyMDcxMjg1MjU2fQ.GP7JmDzqShni-KeZ9oyyNeWj_jWGrQLLYKt8SHxkXNM';

const supabase = createClient(supabaseUrl, serviceKey);

async function createMissingFunctions() {
  console.log('🔧 Creating missing database functions...\n');

  const functions = [
    {
      name: 'get_my_day_data',
      sql: `
CREATE OR REPLACE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE)
RETURNS TABLE (
  time_block_id INTEGER,
  category_id INTEGER,
  category_name TEXT,
  category_color TEXT,
  category_icon TEXT,
  activity_id INTEGER,
  activity_name VARCHAR(255),
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status VARCHAR(20),
  notes TEXT,
  actual_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tb.id as time_block_id,
    tb.category_id,
    c.name->>'en' as category_name,
    c.color as category_color,
    c.icon as category_icon,
    tb.activity_id,
    tb.activity_name,
    tb.start_time,
    tb.end_time,
    tb.duration_minutes,
    tb.status,
    tb.notes,
    COALESCE(
      (SELECT SUM(al.duration_minutes)::INTEGER 
       FROM axis6_activity_logs al 
       WHERE al.time_block_id = tb.id),
      0
    ) as actual_duration
  FROM axis6_time_blocks tb
  JOIN axis6_categories c ON c.id = tb.category_id
  WHERE tb.user_id = p_user_id 
    AND tb.date = p_date
  ORDER BY tb.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    },
    {
      name: 'calculate_daily_time_distribution',
      sql: `
CREATE OR REPLACE FUNCTION calculate_daily_time_distribution(p_user_id UUID, p_date DATE)
RETURNS TABLE (
  category_id INTEGER,
  category_name TEXT,
  category_color TEXT,
  planned_minutes INTEGER,
  actual_minutes INTEGER,
  percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH time_data AS (
    SELECT 
      c.id as category_id,
      c.name->>'en' as category_name,
      c.color as category_color,
      COALESCE(SUM(tb.duration_minutes), 0)::INTEGER as planned,
      COALESCE(
        (SELECT SUM(al.duration_minutes)::INTEGER 
         FROM axis6_activity_logs al 
         WHERE al.user_id = p_user_id 
           AND al.category_id = c.id
           AND DATE(al.started_at) = p_date),
        0
      ) as actual
    FROM axis6_categories c
    LEFT JOIN axis6_time_blocks tb ON tb.category_id = c.id 
      AND tb.user_id = p_user_id 
      AND tb.date = p_date
    GROUP BY c.id, c.name, c.color
  )
  SELECT 
    category_id,
    category_name,
    category_color,
    planned as planned_minutes,
    actual as actual_minutes,
    CASE 
      WHEN (SELECT SUM(actual) FROM time_data) > 0 
      THEN ROUND((actual::DECIMAL / (SELECT SUM(actual) FROM time_data) * 100), 2)
      ELSE 0
    END as percentage
  FROM time_data
  ORDER BY category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    }
  ];

  for (const func of functions) {
    console.log(`📝 Creating function: ${func.name}`);
    
    try {
      // Try using the Supabase client's raw SQL capability
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql: func.sql 
      });

      if (error) {
        console.log(`❌ Error creating ${func.name}: ${error.message}`);
        
        // Try alternative approach using direct SQL
        console.log(`🔄 Trying alternative approach for ${func.name}...`);
        
        // Use fetch to the SQL endpoint
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceKey
          },
          body: JSON.stringify({ sql: func.sql })
        });

        if (response.ok) {
          console.log(`✅ Function ${func.name} created successfully (alternative method)`);
        } else {
          const errorText = await response.text();
          console.log(`❌ Alternative method failed for ${func.name}: ${errorText}`);
        }
      } else {
        console.log(`✅ Function ${func.name} created successfully`);
      }
    } catch (error) {
      console.log(`💥 Exception creating ${func.name}: ${error.message}`);
    }
  }
}

async function testFunctions() {
  console.log('\n🧪 Testing functions...\n');

  try {
    // Test get_my_day_data function
    console.log('Testing get_my_day_data...');
    const { data: myDayData, error: myDayError } = await supabase.rpc('get_my_day_data', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      p_date: '2025-01-26'
    });

    if (myDayError) {
      console.log(`❌ get_my_day_data error: ${myDayError.message}`);
    } else {
      console.log(`✅ get_my_day_data working: ${myDayData?.length || 0} records`);
    }

    // Test calculate_daily_time_distribution function
    console.log('Testing calculate_daily_time_distribution...');
    const { data: timeDistData, error: timeDistError } = await supabase.rpc('calculate_daily_time_distribution', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      p_date: '2025-01-26'
    });

    if (timeDistError) {
      console.log(`❌ calculate_daily_time_distribution error: ${timeDistError.message}`);
    } else {
      console.log(`✅ calculate_daily_time_distribution working: ${timeDistData?.length || 0} records`);
    }

  } catch (error) {
    console.log(`💥 Test error: ${error.message}`);
  }
}

async function main() {
  console.log('🔧 AXIS6 - Fix Missing Database Functions');
  console.log('=' .repeat(50));
  
  await createMissingFunctions();
  await testFunctions();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Functions should now be available!');
  console.log('🔄 Please test the my-day page again.');
}

main().catch(console.error);
