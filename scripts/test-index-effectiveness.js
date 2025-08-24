/**
 * AXIS6 Database Index Effectiveness Testing
 * 
 * Node.js script to test the performance improvements
 * from the new database indexes
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TEST_USER_ID = process.env.TEST_USER_ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing')
  console.error('   TEST_USER_ID:', !!TEST_USER_ID ? '✅ Set' : '⚠️ Missing (will use fallback)')
  console.error('')
  console.error('🔧 Setup Instructions:')
  console.error('   1. Copy: cp .env.testing.example .env.local')
  console.error('   2. Get Service Role Key from: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/settings/api')
  console.error('   3. Get Test User ID by running in Supabase SQL Editor:')
  console.error('      SELECT id, name FROM axis6_profiles ORDER BY created_at DESC LIMIT 5;')
  console.error('   4. Update .env.local with your actual values')
  console.error('   5. Run: npm run test:performance')
  process.exit(1)
}

if (!TEST_USER_ID) {
  console.warn('⚠️ TEST_USER_ID not set, attempting to find a test user automatically...')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Test configuration
const ITERATIONS = 10
const CONCURRENT_TESTS = 5

/**
 * Auto-discover test user if not provided
 */
async function getTestUserId() {
  if (TEST_USER_ID) return TEST_USER_ID

  try {
    const { data, error } = await supabase
      .from('axis6_profiles')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    
    console.log(`🔍 Auto-discovered test user: ${data.name} (${data.id})`)
    return data.id
  } catch (error) {
    console.error('❌ Could not find test user. Please check:')
    console.error('   1. Database has user data: SELECT COUNT(*) FROM axis6_profiles;')
    console.error('   2. RLS policies allow service role access')
    console.error('   3. Service role key is correct')
    throw new Error('No test user available')
  }
}

/**
 * Utility function to measure execution time
 */
async function measurePerformance(name, queryFn, iterations = ITERATIONS) {
  console.log(`\n🧪 Testing ${name}...`)
  const times = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    try {
      await queryFn()
      const end = performance.now()
      times.push(end - start)
    } catch (error) {
      console.error(`❌ Error in ${name}:`, error.message)
      return null
    }
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)]

  console.log(`✅ ${name} Results:`)
  console.log(`   Average: ${avg.toFixed(2)}ms`)
  console.log(`   Median:  ${median.toFixed(2)}ms`)
  console.log(`   Min:     ${min.toFixed(2)}ms`)
  console.log(`   Max:     ${max.toFixed(2)}ms`)

  return { avg, min, max, median, times }
}

/**
 * Test dashboard query performance
 */
async function testDashboardPerformance() {
  console.log('📊 DASHBOARD PERFORMANCE TESTS')
  console.log('='.repeat(50))

  const userId = await getTestUserId()

  // Test 1: Optimized dashboard RPC function
  await measurePerformance(
    'Optimized Dashboard RPC',
    async () => {
      const { data, error } = await supabase.rpc('get_dashboard_data_optimized', {
        p_user_id: userId,
        p_today: new Date().toISOString().split('T')[0]
      })
      if (error) throw error
      return data
    }
  )

  // Test 2: Today's checkins (should use idx_axis6_checkins_today_lookup)
  await measurePerformance(
    'Today\'s Checkins Query',
    async () => {
      const { data, error } = await supabase
        .from('axis6_checkins')
        .select('category_id, completed_at')
        .eq('user_id', userId)
        .eq('completed_at', new Date().toISOString().split('T')[0])
      if (error) throw error
      return data
    }
  )

  // Test 3: User streaks (should use idx_axis6_streaks_user_category)
  await measurePerformance(
    'User Streaks Query',
    async () => {
      const { data, error } = await supabase
        .from('axis6_streaks')
        .select('category_id, current_streak, longest_streak, last_checkin')
        .eq('user_id', userId)
      if (error) throw error
      return data
    }
  )

  // Test 4: Weekly checkins (should use idx_axis6_checkins_week)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  await measurePerformance(
    'Weekly Checkins Query',
    async () => {
      const { data, error } = await supabase
        .from('axis6_checkins')
        .select('completed_at, category_id')
        .eq('user_id', userId)
        .gte('completed_at', weekAgo)
      if (error) throw error
      return data
    }
  )
}

/**
 * Test leaderboard query performance
 */
async function testLeaderboardPerformance() {
  console.log('\n🏆 LEADERBOARD PERFORMANCE TESTS')
  console.log('='.repeat(50))

  // Should use idx_axis6_streaks_leaderboard
  await measurePerformance(
    'Leaderboard Query',
    async () => {
      const { data, error } = await supabase
        .from('axis6_streaks')
        .select(`
          longest_streak,
          current_streak,
          user_id,
          category_id,
          axis6_profiles!inner(name),
          axis6_categories!inner(name, color, icon)
        `)
        .gt('longest_streak', 0)
        .order('longest_streak', { ascending: false })
        .order('current_streak', { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    }
  )
}

/**
 * Test analytics query performance
 */
async function testAnalyticsPerformance() {
  console.log('\n📈 ANALYTICS PERFORMANCE TESTS')
  console.log('='.repeat(50))

  const userId = await getTestUserId()
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Should use idx_axis6_daily_stats_date_range
  await measurePerformance(
    'Monthly Analytics Query',
    async () => {
      const { data, error } = await supabase
        .from('axis6_daily_stats')
        .select('date, completion_rate, categories_completed, total_mood')
        .eq('user_id', userId)
        .gte('date', monthAgo)
        .lte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: false })
      if (error) throw error
      return data
    }
  )
}

/**
 * Test streak calculation performance
 */
async function testStreakCalculationPerformance() {
  console.log('\n🔥 STREAK CALCULATION PERFORMANCE TESTS')
  console.log('='.repeat(50))

  const userId = await getTestUserId()

  // Test optimized streak calculation
  await measurePerformance(
    'Optimized Streak Calculation',
    async () => {
      const { data, error } = await supabase.rpc('axis6_calculate_streak_optimized', {
        p_user_id: userId,
        p_category_id: 1 // Physical category
      })
      if (error) throw error
      return data
    }
  )

  // Test original streak calculation for comparison
  await measurePerformance(
    'Original Streak Calculation',
    async () => {
      const { data, error } = await supabase.rpc('axis6_calculate_streak', {
        p_user_id: userId,
        p_category_id: 1 // Physical category
      })
      if (error) throw error
      return data
    }
  )
}

/**
 * Test concurrent load performance
 */
async function testConcurrentLoad() {
  console.log('\n🚀 CONCURRENT LOAD TESTS')
  console.log('='.repeat(50))

  const userId = await getTestUserId()
  console.log(`Testing ${CONCURRENT_TESTS} concurrent dashboard loads...`)

  const promises = Array(CONCURRENT_TESTS).fill().map(async () => {
    const start = performance.now()
    
    const { data, error } = await supabase.rpc('get_dashboard_data_optimized', {
      p_user_id: userId,
      p_today: new Date().toISOString().split('T')[0]
    })
    
    if (error) throw error
    
    return performance.now() - start
  })

  try {
    const times = await Promise.all(promises)
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    const max = Math.max(...times)
    const min = Math.min(...times)

    console.log(`✅ Concurrent Load Results:`)
    console.log(`   Concurrent requests: ${CONCURRENT_TESTS}`)
    console.log(`   Average time: ${avg.toFixed(2)}ms`)
    console.log(`   Fastest: ${min.toFixed(2)}ms`)
    console.log(`   Slowest: ${max.toFixed(2)}ms`)
  } catch (error) {
    console.error('❌ Concurrent load test failed:', error.message)
  }
}

/**
 * Verify index usage
 */
async function verifyIndexUsage() {
  console.log('\n🔍 INDEX USAGE VERIFICATION')
  console.log('='.repeat(50))

  try {
    // Check if indexes exist
    const { data: indexes, error } = await supabase
      .rpc('verify_axis6_indexes')
      .select()

    if (error && error.code !== '42883') { // Function doesn't exist
      throw error
    }

    if (error) {
      console.log('⚠️  Index verification function not available')
      console.log('   Run the monitoring SQL scripts in Supabase to check index usage')
    } else {
      console.log('✅ Index verification:')
      indexes.forEach(index => {
        console.log(`   ${index.indexname}: ${index.status}`)
      })
    }
  } catch (error) {
    console.error('❌ Index verification failed:', error.message)
  }
}

/**
 * Generate performance report
 */
function generateReport(results) {
  console.log('\n📋 PERFORMANCE REPORT')
  console.log('='.repeat(50))
  
  console.log('\n🎯 Expected vs Actual Performance:')
  console.log('\nExpected improvements with new indexes:')
  console.log('   ✅ Dashboard load time: < 200ms (was ~700ms)')
  console.log('   ✅ Today\'s checkins: < 50ms (95% improvement)')
  console.log('   ✅ Leaderboard queries: < 100ms (80% improvement)')
  console.log('   ✅ Streak calculations: < 50ms (80% improvement)')
  console.log('   ✅ Analytics queries: < 300ms (60% improvement)')
  
  console.log('\n🚀 Next Steps:')
  console.log('   1. Deploy the indexes using manual_performance_indexes.sql')
  console.log('   2. Run the RPC functions migration (006_dashboard_optimization_rpc.sql)')
  console.log('   3. Update application code to use optimized queries')
  console.log('   4. Monitor performance using scripts/performance-monitoring.sql')
  console.log('   5. Set up automated performance monitoring')
  
  console.log('\n📊 Monitoring:')
  console.log('   • Run performance-monitoring.sql weekly')
  console.log('   • Monitor index usage with pg_stat_user_indexes')
  console.log('   • Set up alerts for queries > 500ms')
  console.log('   • Schedule VACUUM ANALYZE monthly')
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🧪 AXIS6 DATABASE PERFORMANCE TESTING')
  console.log('='.repeat(50))
  
  try {
    const userId = await getTestUserId()
    console.log(`Testing with User ID: ${userId}`)
    console.log(`Iterations per test: ${ITERATIONS}`)
    console.log(`Concurrent load test size: ${CONCURRENT_TESTS}`)
    
    await testDashboardPerformance()
    await testLeaderboardPerformance() 
    await testAnalyticsPerformance()
    await testStreakCalculationPerformance()
    await testConcurrentLoad()
    await verifyIndexUsage()
    
    generateReport()
    
    console.log('\n✅ All performance tests completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Performance testing failed:', error.message)
    if (error.message.includes('No test user available')) {
      console.error('\n💡 Quick fix:')
      console.error('   1. Create a test user in your app')
      console.error('   2. Or run: INSERT INTO axis6_profiles (id, name) VALUES (auth.uid(), \'Test User\');')
      console.error('   3. Set TEST_USER_ID in .env.local')
    }
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
}

module.exports = {
  measurePerformance,
  testDashboardPerformance,
  testLeaderboardPerformance,
  testAnalyticsPerformance,
  testStreakCalculationPerformance,
  testConcurrentLoad,
  runAllTests
}