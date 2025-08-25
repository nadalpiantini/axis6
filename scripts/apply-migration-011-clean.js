#!/usr/bin/env node

/**
 * Apply corrected migration 011 using service role key
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nvpnhqhjttgwfwvkgmpk.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTI1NiwiZXhwIjoyMDcxMjg1MjU2fQ.GP7JmDzqShni-KeZ9oyyNeWj_jWGrQLLYKt8SHxkXNM';

const supabase = createClient(supabaseUrl, serviceKey);

async function applyMigration() {
  console.log('🚀 Aplicando migración 011 corregida...\n');

  try {
    // Leer el archivo de migración corregido
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '011_my_day_time_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📂 Migración leída:', migrationPath);
    console.log('📊 Tamaño:', migrationSQL.length, 'caracteres\n');
    
    // Dividir en statements individuales para mejor control de errores
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'BEGIN' && stmt !== 'COMMIT');
    
    console.log(`📋 Ejecutando ${statements.length} statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Identificar tipo de statement
      let type = 'UNKNOWN';
      if (statement.includes('CREATE TABLE')) type = 'TABLE';
      else if (statement.includes('CREATE INDEX')) type = 'INDEX';
      else if (statement.includes('CREATE POLICY')) type = 'POLICY';
      else if (statement.includes('CREATE FUNCTION')) type = 'FUNCTION';
      else if (statement.includes('CREATE TRIGGER')) type = 'TRIGGER';
      else if (statement.includes('ALTER TABLE')) type = 'ALTER';
      
      console.log(`${i + 1}/${statements.length} [${type}] Ejecutando...`);
      
      try {
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        
        if (error) {
          console.log(`❌ Error: ${error.message}`);
          errorCount++;
          
          // Si es un error de "already exists", continuar
          if (error.message.includes('already exists')) {
            console.log('   ℹ️  Objeto ya existe, continuando...');
          } else {
            console.log(`   🔍 Statement que falló: ${statement.substring(0, 100)}...`);
          }
        } else {
          console.log(`✅ Éxito`);
          successCount++;
        }
      } catch (err) {
        console.log(`💥 Excepción: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Resumen:`);
    console.log(`✅ Éxitos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📋 Total: ${statements.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 ¡Migración aplicada exitosamente!');
    } else {
      console.log('\n⚠️ Migración completada con algunos errores. Verificando resultados...');
    }
    
    // Verificar tablas creadas
    console.log('\n🔍 Verificando tablas creadas...');
    const tablesToCheck = ['axis6_time_blocks', 'axis6_activity_logs', 'axis6_daily_time_summary'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(0);
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Creada y accesible`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Error aplicando migración:', error.message);
    process.exit(1);
  }
}

// Función alternativa usando SQL directo
async function applyMigrationDirect() {
  console.log('🔄 Intentando método alternativo (SQL directo)...\n');
  
  try {
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '011_my_day_time_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Usar fetch directamente al API REST
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({ sql: migrationSQL })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error en petición:', errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Migración aplicada exitosamente!');
    return true;
    
  } catch (error) {
    console.error('💥 Error en método directo:', error.message);
    return false;
  }
}

// Ejecutar migración
async function main() {
  console.log('🗄️ AXIS6 Migration 011 - Aplicación Limpia');
  console.log('=' .repeat(50));
  
  // Intentar método RPC primero
  await applyMigration();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Proceso completado. Verifica el dashboard ahora!');
}

main().catch(console.error);