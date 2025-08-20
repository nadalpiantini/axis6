#!/usr/bin/env node

/**
 * AXIS6 - Ejecutor Directo de Migraciones
 * Este script ejecuta las migraciones usando el SDK de Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(50)}${colors.reset}`)
};

async function executeMigrations() {
  log.header('🚀 AXIS6 - Ejecutando Migraciones');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    log.error('Faltan credenciales de Supabase en .env.local');
    log.warning('Se requiere SUPABASE_SERVICE_ROLE_KEY para ejecutar migraciones');
    process.exit(1);
  }

  log.success('Credenciales encontradas');
  log.info('Conectando a Supabase...\n');

  // Usar fetch directamente para ejecutar SQL
  const executeSQL = async (sql, description) => {
    log.info(`Ejecutando: ${description}...`);
    
    try {
      // Intentar con el endpoint de SQL Editor
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          query: sql
        })
      });

      if (!response.ok) {
        // Si falla, mostrar alternativa
        throw new Error(`Status ${response.status}`);
      }

      log.success(`✅ ${description}`);
      return true;
    } catch (error) {
      log.warning(`No se pudo ejecutar automáticamente: ${description}`);
      return false;
    }
  };

  // Leer archivos de migración
  const migration1Path = path.join(__dirname, 'supabase', 'migrations', '001_initial_schema.sql');
  const migration2Path = path.join(__dirname, 'supabase', 'migrations', '002_auth_trigger.sql');

  if (!fs.existsSync(migration1Path)) {
    log.error('No se encontraron los archivos de migración');
    process.exit(1);
  }

  const migration1 = fs.readFileSync(migration1Path, 'utf8');
  const migration2 = fs.readFileSync(migration2Path, 'utf8');

  log.header('Instrucciones para Ejecutar Migraciones');

  log.info('Como las migraciones no se pueden ejecutar directamente via API,');
  log.info('necesitas ejecutarlas manualmente en el SQL Editor de Supabase:\n');

  log.success('OPCIÓN 1: Usar el archivo HTML helper');
  log.info('1. Abre en tu navegador: EXECUTE_MIGRATIONS.html');
  log.info('2. Sigue las instrucciones paso a paso');
  log.info('3. Copia y pega el SQL en el editor\n');

  log.success('OPCIÓN 2: Ir directamente al SQL Editor');
  log.info('1. Abre: https://supabase.com/dashboard/project/nqzhxukuvmdlpewqytpv/sql/new');
  log.info('2. Copia el contenido de:');
  log.info('   - supabase/migrations/001_initial_schema.sql');
  log.info('   - supabase/migrations/002_auth_trigger.sql');
  log.info('3. Ejecuta cada archivo por separado\n');

  // Crear un archivo con las migraciones combinadas
  log.header('Generando Archivo Combinado');
  
  const combinedSQL = `-- AXIS6 Combined Migrations
-- Generated: ${new Date().toISOString()}

-- ========================================
-- Migration 1: Initial Schema
-- ========================================

${migration1}

-- ========================================
-- Migration 2: Auth Trigger
-- ========================================

${migration2}
`;

  const outputPath = path.join(__dirname, 'AXIS6_MIGRATIONS_COMBINED.sql');
  fs.writeFileSync(outputPath, combinedSQL);
  
  log.success(`Archivo combinado creado: ${outputPath}`);
  log.info('Puedes copiar todo el contenido de este archivo y pegarlo en el SQL Editor\n');

  // Verificar conexión
  log.header('Verificando Estado Actual');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabase
      .from('axis6_categories')
      .select('count');
    
    if (error) {
      if (error.message.includes('does not exist')) {
        log.warning('❌ Las tablas NO existen - Necesitas ejecutar las migraciones');
      } else {
        log.error(`Error: ${error.message}`);
      }
    } else {
      log.success('✅ Las tablas YA existen - Las migraciones ya se ejecutaron');
    }
  } catch (err) {
    log.error('No se pudo verificar el estado de las tablas');
  }

  log.header('Próximos Pasos');
  log.info('1. Ejecuta las migraciones en el SQL Editor');
  log.info('2. Ejecuta: node test-connection.js');
  log.info('3. Ejecuta: npm run dev');
  log.info('4. Abre: http://localhost:3000');
}

// Ejecutar
executeMigrations().catch(console.error);