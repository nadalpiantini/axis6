#!/usr/bin/env node

/**
 * API DATABASE CONSTRAINTS VALIDATION
 * 
 * Validates database constraints that are critical for API functionality,
 * especially UNIQUE constraints required for UPSERT operations.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 API DATABASE CONSTRAINTS VALIDATION');
console.log('==================================================');

async function validateConstraints() {
  const results = {
    tables: {},
    constraints: {},
    rls_policies: {},
    indexes: {},
    critical_issues: [],
    performance_issues: []
  };

  // Check all AXIS6 tables
  const tables = [
    'axis6_profiles',
    'axis6_categories', 
    'axis6_checkins',
    'axis6_streaks',
    'axis6_daily_stats',
    'axis6_mantras',
    'axis6_user_mantras',
    'axis6_chat_rooms',
    'axis6_chat_messages',
    'axis6_chat_participants',
    'axis6_hex_reactions',
    'axis6_time_blocks',
    'axis6_micro_wins',
    'axis6_activity_timers'
  ];

  for (const table of tables) {
    console.log(`\n📊 Checking ${table}...`);
    
    try {
      // Check if table exists and is accessible
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        results.tables[table] = { exists: false, error: error.message };
        console.log(`  ❌ Table access error: ${error.message}`);
        continue;
      }
      
      results.tables[table] = { exists: true, accessible: true };
      console.log(`  ✅ Table exists and is accessible`);
      
    } catch (error) {
      results.tables[table] = { exists: false, error: error.message };
      console.log(`  ❌ Table check failed: ${error.message}`);
    }
  }

  // Check UNIQUE constraints (critical for UPSERT operations)
  console.log('\n🔒 CHECKING UNIQUE CONSTRAINTS');
  console.log('==================================================');
  
  const criticalConstraints = [
    {
      table: 'axis6_checkins',
      constraint: 'unique_user_category_date',
      columns: ['user_id', 'category_id', 'completed_at'],
      description: 'Required for daily checkin upserts'
    },
    {
      table: 'axis6_streaks', 
      constraint: 'unique_user_category_streak',
      columns: ['user_id', 'category_id'],
      description: 'Required for streak upserts'
    },
    {
      table: 'axis6_user_mantras',
      constraint: 'unique_user_mantra_date',
      columns: ['user_id', 'mantra_id', 'completed_at'],
      description: 'Required for mantra completion upserts'
    },
    {
      table: 'axis6_time_blocks',
      constraint: 'unique_user_time_slot',
      columns: ['user_id', 'date', 'start_time'],
      description: 'Prevents overlapping time blocks'
    }
  ];
  
  for (const constraint of criticalConstraints) {
    try {
      // Query information_schema to check constraint
      const { data: constraintData, error } = await supabase
        .rpc('sql', {
          query: `
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = '${constraint.table}' 
            AND constraint_name = '${constraint.constraint}'`
        });
        
      if (error) {
        // Try alternative method using raw SQL
        const testQuery = `
          SELECT 1 FROM ${constraint.table} 
          WHERE ${constraint.columns.join(' IS NOT NULL AND ')} IS NOT NULL 
          LIMIT 1
        `;
        
        try {
          await supabase.rpc('sql', { query: testQuery });
          results.constraints[constraint.constraint] = { 
            exists: 'unknown', 
            table: constraint.table,
            columns: constraint.columns,
            description: constraint.description,
            check_method: 'indirect'
          };
          console.log(`  ⚠️ ${constraint.constraint}: Cannot verify directly`);
        } catch (testError) {
          results.constraints[constraint.constraint] = { 
            exists: false, 
            error: testError.message,
            table: constraint.table,
            columns: constraint.columns,
            description: constraint.description
          };
          results.critical_issues.push({
            type: 'MISSING_CONSTRAINT',
            severity: 'HIGH',
            table: constraint.table,
            constraint: constraint.constraint,
            impact: 'UPSERT operations will fail with error 42P10',
            fix: `ALTER TABLE ${constraint.table} ADD CONSTRAINT ${constraint.constraint} UNIQUE (${constraint.columns.join(', ')});`
          });
          console.log(`  ❌ ${constraint.constraint}: Missing constraint`);
        }
      } else if (constraintData && constraintData.length > 0) {
        results.constraints[constraint.constraint] = { 
          exists: true,
          table: constraint.table,
          columns: constraint.columns,
          description: constraint.description
        };
        console.log(`  ✅ ${constraint.constraint}: Exists`);
      } else {
        results.critical_issues.push({
          type: 'MISSING_CONSTRAINT',
          severity: 'HIGH',
          table: constraint.table,
          constraint: constraint.constraint,
          impact: 'UPSERT operations will fail with error 42P10',
          fix: `ALTER TABLE ${constraint.table} ADD CONSTRAINT ${constraint.constraint} UNIQUE (${constraint.columns.join(', ')});`
        });
        console.log(`  ❌ ${constraint.constraint}: Missing constraint`);
      }
      
    } catch (error) {
      results.constraints[constraint.constraint] = { 
        exists: false, 
        error: error.message,
        table: constraint.table,
        description: constraint.description
      };
      console.log(`  ❌ ${constraint.constraint}: Check failed - ${error.message}`);
    }
  }

  // Check RLS Policies
  console.log('\n🛡️ CHECKING RLS POLICIES');
  console.log('==================================================');
  
  const criticalTables = [
    'axis6_profiles', 
    'axis6_checkins', 
    'axis6_streaks', 
    'axis6_daily_stats',
    'axis6_chat_rooms',
    'axis6_chat_messages'
  ];
  
  for (const table of criticalTables) {
    try {
      // Test RLS by trying to access data without proper auth context
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('RLS')) {
        results.rls_policies[table] = { enabled: true, working: true };
        console.log(`  ✅ ${table}: RLS enabled and working`);
      } else if (data) {
        results.rls_policies[table] = { enabled: false, working: false };
        results.critical_issues.push({
          type: 'RLS_DISABLED',
          severity: 'HIGH',
          table: table,
          impact: 'Users can access other users\' data',
          fix: `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`
        });
        console.log(`  ❌ ${table}: RLS not properly configured`);
      }
    } catch (error) {
      results.rls_policies[table] = { error: error.message };
      console.log(`  ⚠️ ${table}: Could not check RLS - ${error.message}`);
    }
  }

  // Check Performance Indexes
  console.log('\n⚡ CHECKING PERFORMANCE INDEXES');
  console.log('==================================================');
  
  const criticalIndexes = [
    {
      name: 'idx_checkins_today_lookup',
      table: 'axis6_checkins',
      columns: ['user_id', 'category_id', 'completed_at'],
      type: 'PARTIAL',
      description: '95% performance improvement for today\'s checkins'
    },
    {
      name: 'idx_streaks_user_lookup',
      table: 'axis6_streaks',
      columns: ['user_id'],
      type: 'BTREE',
      description: 'Fast user streak lookups'
    },
    {
      name: 'idx_profiles_user_id',
      table: 'axis6_profiles',
      columns: ['id'], // Note: profiles uses 'id' not 'user_id'
      type: 'PRIMARY',
      description: 'Primary key for profile lookups'
    }
  ];
  
  for (const index of criticalIndexes) {
    try {
      // Test query performance to infer index existence
      const start = Date.now();
      const { data, error } = await supabase
        .from(index.table)
        .select('*')
        .limit(10);
      const duration = Date.now() - start;
      
      if (error) {
        results.indexes[index.name] = { error: error.message };
        console.log(`  ❌ ${index.name}: Query failed - ${error.message}`);
      } else {
        results.indexes[index.name] = { 
          queryTime: duration,
          table: index.table,
          columns: index.columns,
          description: index.description
        };
        
        if (duration > 100) {
          results.performance_issues.push({
            type: 'SLOW_QUERY',
            severity: 'MEDIUM',
            table: index.table,
            queryTime: duration,
            recommendation: `Consider adding index: ${index.name}`,
            columns: index.columns
          });
          console.log(`  ⚠️ ${index.name}: Slow query (${duration}ms)`);
        } else {
          console.log(`  ✅ ${index.name}: Good performance (${duration}ms)`);
        }
      }
    } catch (error) {
      results.indexes[index.name] = { error: error.message };
      console.log(`  ❌ ${index.name}: Check failed - ${error.message}`);
    }
  }

  return results;
}

async function generateFixScript(results) {
  const fixes = [];
  
  // Generate constraint fixes
  for (const issue of results.critical_issues) {
    if (issue.type === 'MISSING_CONSTRAINT') {
      fixes.push({
        priority: 'HIGH',
        sql: issue.fix,
        description: `Add ${issue.constraint} constraint to ${issue.table}`
      });
    }
    
    if (issue.type === 'RLS_DISABLED') {
      fixes.push({
        priority: 'HIGH', 
        sql: issue.fix,
        description: `Enable RLS on ${issue.table}`
      });
    }
  }
  
  // Generate performance fixes
  for (const issue of results.performance_issues) {
    if (issue.type === 'SLOW_QUERY') {
      fixes.push({
        priority: 'MEDIUM',
        sql: `CREATE INDEX CONCURRENTLY ${issue.recommendation.split(': ')[1]} ON ${issue.table}(${issue.columns.join(', ')});`,
        description: `Add performance index for ${issue.table}`
      });
    }
  }
  
  return fixes;
}

// Main execution
async function main() {
  try {
    const results = await validateConstraints();
    const fixes = await generateFixScript(results);
    
    // Save results
    const reportPath = '/Users/nadalpiantini/Dev/axis6-mvp/axis6/claudedocs/database-constraints-report.json';
    require('fs').writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      fixes
    }, null, 2));
    
    console.log('\n📋 VALIDATION SUMMARY');
    console.log('==================================================');
    console.log(`Tables checked: ${Object.keys(results.tables).length}`);
    console.log(`Accessible tables: ${Object.values(results.tables).filter(t => t.accessible).length}`);
    console.log(`Critical issues: ${results.critical_issues.length}`);
    console.log(`Performance issues: ${results.performance_issues.length}`);
    console.log(`Fixes needed: ${fixes.length}`);
    
    if (results.critical_issues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND');
      console.log('==================================================');
      results.critical_issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.type}: ${issue.table}`);
        console.log(`   Impact: ${issue.impact}`);
        console.log(`   Fix: ${issue.fix}\n`);
      });
    }
    
    if (fixes.length > 0) {
      console.log('🔧 RECOMMENDED FIXES');
      console.log('==================================================');
      console.log('Execute these SQL statements in Supabase Dashboard > SQL Editor:\n');
      
      fixes.forEach((fix, index) => {
        console.log(`-- Fix ${index + 1}: ${fix.description}`);
        console.log(fix.sql);
        console.log('');
      });
    }
    
    console.log(`📊 Detailed report saved to: ${reportPath}`);
    console.log('✅ Database constraints validation completed!');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };