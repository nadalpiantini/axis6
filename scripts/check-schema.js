#!/usr/bin/env node

/**
 * Check database schema to understand data types
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nvpnhqhjttgwfwvkgmpk.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTI1NiwiZXhwIjoyMDcxMjg1MjU2fQ.GP7JmDzqShni-KeZ9oyyNeWj_jWGrQLLYKt8SHxkXNM';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkSchema() {
  console.log('🔍 Verificando esquema de base de datos...\n');

  try {
    // Verificar tabla categories
    console.log('📋 Verificando axis6_categories...');
    const { data: categories, error: catError } = await supabase
      .from('axis6_categories')
      .select('id')
      .limit(1);
    
    if (catError) {
      console.log('❌ Error al acceder axis6_categories:', catError.message);
    } else {
      console.log('✅ axis6_categories accesible, sample ID type:', typeof categories[0]?.id);
      console.log('   Sample ID value:', categories[0]?.id);
    }
    
    // Verificar tabla activities
    console.log('\n📋 Verificando axis6_axis_activities...');
    const { data: activities, error: actError } = await supabase
      .from('axis6_axis_activities')
      .select('id')
      .limit(1);
    
    if (actError) {
      console.log('❌ Error al acceder axis6_axis_activities:', actError.message);
    } else {
      console.log('✅ axis6_axis_activities accesible, sample ID type:', typeof activities[0]?.id);
      console.log('   Sample ID value:', activities[0]?.id);
    }
    
    // Verificar tablas problemáticas existentes
    console.log('\n🚨 Verificando tablas problemáticas...');
    
    const problematicTables = [
      'axis6_time_blocks',
      'axis6_activity_logs', 
      'axis6_daily_time_summary'
    ];
    
    for (const tableName of problematicTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`⚠️ ${tableName}: Existe y está accesible`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

checkSchema().catch(console.error);