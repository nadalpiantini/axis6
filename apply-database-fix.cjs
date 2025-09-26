const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://nvpnhqhjttgwfwvkgmpk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52cG5ocWhqdHRnd2Z3dmtnbXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTcwOTI1NiwiZXhwIjoyMDcxMjg1MjU2fQ.GP7JmDzqShni-KeZ9oyyNeWj_jWGrQLLYKt8SHxkXNM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyDatabaseFix() {
  try {
    console.log('🔧 Applying database fix for axis6_get_day_summary function...')
    
    // Read the SQL file
    const fs = require('fs')
    const path = require('path')
    const sqlPath = path.join(__dirname, 'scripts', 'fix-production-database.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Error applying database fix:', error)
      return false
    }
    
    console.log('✅ Database fix applied successfully!')
    console.log('📊 Function axis6_get_day_summary created')
    console.log('📊 Function axis6_quick_add_block created')
    console.log('📊 Tables and policies configured')
    
    return true
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

// Run the fix
applyDatabaseFix().then(success => {
  if (success) {
    console.log('🎉 Database fix completed successfully!')
    process.exit(0)
  } else {
    console.log('💥 Database fix failed!')
    process.exit(1)
  }
})
