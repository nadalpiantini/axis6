#!/usr/bin/env node

/**
 * AXIS6 - Test de Conexión a Supabase
 * Ejecuta: node test-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(50)}${colors.reset}`)
};

async function testConnection() {
  log.header('🚀 AXIS6 - Test de Conexión a Supabase');

  // Verificar variables de entorno
  log.info('Verificando variables de entorno...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    log.error('Faltan credenciales de Supabase en .env.local');
    process.exit(1);
  }

  log.success('Variables de entorno encontradas');
  log.info(`URL: ${supabaseUrl}`);
  log.info(`Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
  
  // Crear cliente de Supabase
  log.info('\nConectando a Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

  try {
    // Test 1: Verificar conexión básica
    log.header('Test 1: Conexión Básica');
    const { data: healthCheck, error: healthError } = await supabase
      .from('axis6_categories')
      .select('count')
      .limit(1);

    if (healthError) {
      if (healthError.message.includes('relation') || healthError.message.includes('does not exist')) {
        log.warning('Las tablas no existen aún. Por favor ejecuta las migraciones primero.');
        log.info('Abre EXECUTE_MIGRATIONS.html en tu navegador para ejecutar las migraciones');
        return;
      }
      throw healthError;
    }
    log.success('Conexión establecida correctamente');

    // Test 2: Leer categorías
    log.header('Test 2: Leer Categorías');
    const { data: categories, error: catError } = await supabase
      .from('axis6_categories')
      .select('*')
      .order('position');

    if (catError) throw catError;

    if (categories && categories.length > 0) {
      log.success(`Se encontraron ${categories.length} categorías:`);
      categories.forEach(cat => {
        const name = typeof cat.name === 'object' ? cat.name.es || cat.name.en : cat.name;
        console.log(`  ${cat.color} ${cat.icon} - ${name}`);
      });
    } else {
      log.warning('No se encontraron categorías. Las migraciones pueden no haberse ejecutado.');
    }

    // Test 3: Verificar RLS
    log.header('Test 3: Verificar Row Level Security');
    
    // Intentar leer perfiles (debería fallar sin auth)
    const { data: profiles, error: profileError } = await supabase
      .from('axis6_profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      if (profileError.message.includes('JWT')) {
        log.success('RLS está activo (se requiere autenticación)');
      } else {
        log.warning(`RLS puede no estar configurado correctamente: ${profileError.message}`);
      }
    } else {
      log.info('Se pudieron leer perfiles sin autenticación (usando service key)');
    }

    // Test 4: Verificar funciones
    log.header('Test 4: Verificar Funciones SQL');
    
    // Verificar si las funciones existen
    const { data: functions, error: funcError } = await supabase
      .rpc('axis6_calculate_streak', { 
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_category_id: 1 
      });

    if (funcError) {
      if (funcError.message.includes('function') && funcError.message.includes('does not exist')) {
        log.warning('Las funciones SQL no se han creado. Ejecuta las migraciones completas.');
      } else if (funcError.message.includes('violates foreign key')) {
        log.success('Función axis6_calculate_streak existe y funciona correctamente');
      } else {
        log.info(`Función encontrada pero con error esperado: ${funcError.message.substring(0, 50)}...`);
      }
    } else {
      log.success('Funciones SQL verificadas');
    }

    // Resumen
    log.header('📊 Resumen de la Conexión');
    log.success('Conexión a Supabase: OK');
    log.success('Project ID: nqzhxukuvmdlpewqytpv');
    log.info('URL: https://nqzhxukuvmdlpewqytpv.supabase.co');
    
    if (categories && categories.length === 6) {
      log.success('Base de datos: Configurada correctamente');
      log.success('✨ ¡Todo listo para comenzar el desarrollo!');
    } else {
      log.warning('Base de datos: Requiere ejecutar migraciones');
      log.info('👉 Abre EXECUTE_MIGRATIONS.html en tu navegador');
    }

  } catch (error) {
    log.error(`Error durante el test: ${error.message}`);
    console.error(error);
    
    if (error.message.includes('Failed to fetch')) {
      log.warning('No se pudo conectar. Verifica tu conexión a internet.');
    } else if (error.message.includes('invalid API key')) {
      log.warning('API Key inválida. Verifica las credenciales en .env.local');
    }
  }
}

// Ejecutar test
testConnection().catch(console.error);