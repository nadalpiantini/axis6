#!/usr/bin/env node

/**
 * Verify Production Fixes
 * Check if all database fixes have been applied correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvpnhqhjttgwfwvkgmpk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MDkyNTYsImV4cCI6MjA3MTI4NTI1Nn0.yVgnHzflgpX_CMY4VB62ndZlsrfeH0Mlhl026HT06C0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyFixes() {
  console.log('🔍 Verificando fixes de producción...\n');

  const checks = [
    {
      name: 'Tabla axis6_checkins',
      test: async () => {
        const { data, error } = await supabase
          .from('axis6_checkins')
          .select('count')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'Tabla axis6_time_blocks',
      test: async () => {
        const { data, error } = await supabase
          .from('axis6_time_blocks')
          .select('count')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'Tabla axis6_activity_logs',
      test: async () => {
        const { data, error } = await supabase
          .from('axis6_activity_logs')
          .select('count')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'Función get_my_day_data',
      test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('get_my_day_data', {
              p_user_id: '00000000-0000-0000-0000-000000000000',
              p_date: '2025-01-26'
            });
          return !error;
        } catch (e) {
          return false;
        }
      }
    },
    {
      name: 'Función calculate_daily_time_distribution',
      test: async () => {
        try {
          const { data, error } = await supabase
            .rpc('calculate_daily_time_distribution', {
              p_user_id: '00000000-0000-0000-0000-000000000000',
              p_date: '2025-01-26'
            });
          return !error;
        } catch (e) {
          return false;
        }
      }
    },
    {
      name: 'Conexión a axis6_categories',
      test: async () => {
        const { data, error } = await supabase
          .from('axis6_categories')
          .select('count')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'Conexión a axis6_streaks',
      test: async () => {
        const { data, error } = await supabase
          .from('axis6_streaks')
          .select('count')
          .limit(1);
        return !error;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const result = await check.test();
      if (result) {
        console.log(`✅ ${check.name} - FUNCIONANDO`);
        passed++;
      } else {
        console.log(`❌ ${check.name} - FALLA`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${check.name} - ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log('\n📊 Resumen de verificación:');
  console.log(`✅ Pasaron: ${passed}`);
  console.log(`❌ Fallaron: ${failed}`);
  console.log(`📈 Tasa de éxito: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 ¡Todos los fixes han sido aplicados correctamente!');
    console.log('✅ La aplicación está lista para producción');
  } else {
    console.log('\n⚠️  Algunos fixes aún necesitan ser aplicados');
    console.log('🔧 Ejecuta scripts/fix-production-errors.sql en Supabase SQL Editor');
  }

  return failed === 0;
}

// Run verification
verifyFixes()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error durante la verificación:', error);
    process.exit(1);
  });
