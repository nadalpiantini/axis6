-- =====================================================
-- AXIS6 DATABASE PERFORMANCE MONITORING SCRIPTS
-- =====================================================
-- Run these queries to monitor database performance,
-- verify index usage, and identify optimization opportunities

-- =====================================================
-- INDEX USAGE VERIFICATION
-- =====================================================

-- 1. Verify all AXIS6 indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename LIKE 'axis6_%' 
    AND schemaname = 'public'
    AND indexname LIKE 'idx_axis6_%'
ORDER BY tablename, indexname;

-- 2. Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read as "Index Reads",
    idx_tup_fetch as "Tuples Fetched",
    CASE 
        WHEN idx_tup_fetch = 0 THEN 'Unused'
        WHEN idx_tup_read / idx_tup_fetch > 100 THEN 'Highly Efficient'
        WHEN idx_tup_read / idx_tup_fetch > 10 THEN 'Efficient'
        ELSE 'Low Efficiency'
    END as "Efficiency Status"
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
    AND tablename LIKE 'axis6_%'
    AND indexname LIKE 'idx_axis6_%'
ORDER BY idx_tup_read DESC;

-- 3. Identify unused indexes (potential cleanup candidates)
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as "Index Size"
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
    AND tablename LIKE 'axis6_%'
    AND idx_tup_read = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- =====================================================
-- QUERY PERFORMANCE ANALYSIS
-- =====================================================

-- 4. Most time-consuming queries (requires pg_stat_statements)
-- Note: Enable pg_stat_statements extension first
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%axis6_%'
ORDER BY total_time DESC 
LIMIT 10;

-- 5. Table statistics and analysis
SELECT 
    schemaname,
    tablename,
    n_tup_ins as "Inserts",
    n_tup_upd as "Updates", 
    n_tup_del as "Deletes",
    n_live_tup as "Live Rows",
    n_dead_tup as "Dead Rows",
    CASE 
        WHEN n_live_tup > 0 
        THEN round(100 * n_dead_tup / n_live_tup, 2) 
        ELSE 0 
    END as "Dead Row %",
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE tablename LIKE 'axis6_%'
ORDER BY "Dead Row %" DESC;

-- =====================================================
-- DASHBOARD QUERY PERFORMANCE TESTS
-- =====================================================

-- 6. Test today's checkins query performance
-- This should use idx_axis6_checkins_today_lookup
EXPLAIN (ANALYZE, BUFFERS) 
SELECT ch.category_id, ch.completed_at
FROM axis6_checkins ch
WHERE ch.user_id = '00000000-0000-0000-0000-000000000001'::UUID  -- Replace with actual user ID
  AND ch.completed_at = CURRENT_DATE;

-- 7. Test user streaks query performance  
-- This should use idx_axis6_streaks_user_category
EXPLAIN (ANALYZE, BUFFERS)
SELECT s.category_id, s.current_streak, s.longest_streak, s.last_checkin
FROM axis6_streaks s
WHERE s.user_id = '00000000-0000-0000-0000-000000000001'::UUID;  -- Replace with actual user ID

-- 8. Test leaderboard query performance
-- This should use idx_axis6_streaks_leaderboard
EXPLAIN (ANALYZE, BUFFERS)
SELECT s.longest_streak, s.current_streak, s.user_id, s.category_id
FROM axis6_streaks s
WHERE s.longest_streak > 0
ORDER BY s.longest_streak DESC, s.current_streak DESC
LIMIT 10;

-- 9. Test weekly checkins query performance
-- This should use idx_axis6_checkins_week
EXPLAIN (ANALYZE, BUFFERS)
SELECT completed_at, category_id
FROM axis6_checkins
WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID  -- Replace with actual user ID
  AND completed_at >= CURRENT_DATE - INTERVAL '7 days';

-- 10. Test analytics date range query
-- This should use idx_axis6_daily_stats_date_range
EXPLAIN (ANALYZE, BUFFERS)
SELECT date, completion_rate, categories_completed, total_mood
FROM axis6_daily_stats
WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID  -- Replace with actual user ID
  AND date >= CURRENT_DATE - INTERVAL '30 days'
  AND date <= CURRENT_DATE
ORDER BY date DESC;

-- =====================================================
-- PERFORMANCE BENCHMARKS
-- =====================================================

-- 11. Dashboard load time benchmark (run multiple times)
-- Expected: < 200ms with new indexes (was ~700ms)
\timing on
SELECT get_dashboard_data_optimized('00000000-0000-0000-0000-000000000001'::UUID);
\timing off

-- 12. Streak calculation performance test
-- Expected: < 50ms with incremental calculation
\timing on
SELECT axis6_calculate_streak_optimized('00000000-0000-0000-0000-000000000001'::UUID, 1);
\timing off

-- =====================================================
-- DATABASE HEALTH CHECKS
-- =====================================================

-- 13. Table sizes and growth
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Total Size",
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as "Table Size", 
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as "Index Size"
FROM pg_tables 
WHERE tablename LIKE 'axis6_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 14. Connection and lock monitoring
SELECT 
    datname,
    usename, 
    application_name,
    state,
    query_start,
    state_change,
    left(query, 50) as query_preview
FROM pg_stat_activity 
WHERE datname = current_database()
  AND state != 'idle'
ORDER BY query_start;

-- 15. Long-running queries (> 1 second)
SELECT 
    pid,
    usename,
    application_name,
    state,
    now() - query_start as duration,
    left(query, 100) as query_preview
FROM pg_stat_activity 
WHERE now() - query_start > interval '1 second'
  AND state != 'idle'
ORDER BY duration DESC;

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- 16. Tables needing VACUUM (>10% dead rows)
SELECT 
    tablename,
    n_dead_tup,
    n_live_tup,
    round(100 * n_dead_tup / nullif(n_live_tup, 0), 2) as dead_percentage,
    'VACUUM ' || tablename || ';' as vacuum_command
FROM pg_stat_user_tables 
WHERE tablename LIKE 'axis6_%'
  AND n_dead_tup > 0
  AND round(100 * n_dead_tup / nullif(n_live_tup, 0), 2) > 10
ORDER BY dead_percentage DESC;

-- 17. Tables needing ANALYZE (outdated statistics)
SELECT 
    tablename,
    last_analyze,
    last_autoanalyze,
    CASE 
        WHEN last_analyze IS NULL AND last_autoanalyze IS NULL THEN 'Never analyzed'
        WHEN GREATEST(last_analyze, last_autoanalyze) < now() - interval '1 week' THEN 'Needs analysis'
        ELSE 'Recent'
    END as analysis_status,
    'ANALYZE ' || tablename || ';' as analyze_command
FROM pg_stat_user_tables 
WHERE tablename LIKE 'axis6_%'
ORDER BY GREATEST(last_analyze, last_autoanalyze) NULLS FIRST;

-- =====================================================
-- EXPECTED PERFORMANCE IMPROVEMENTS
-- =====================================================

/*
After applying the performance indexes, you should see:

✅ Dashboard load time: 70% reduction (from ~700ms to ~200ms)
    - get_dashboard_data_optimized() should complete in <200ms
    - Individual queries using composite indexes should be <50ms each

✅ Today's checkins query: 95% reduction (table scan → index lookup)  
    - Uses idx_axis6_checkins_today_lookup partial index
    - Should show "Index Scan" in EXPLAIN plan, not "Seq Scan"

✅ Leaderboard queries: 80% reduction
    - Uses idx_axis6_streaks_leaderboard composite index
    - Should handle 1000+ users with <100ms response time

✅ Streak calculations: 80% reduction  
    - Incremental calculation with idx_axis6_checkins_streak_calc
    - axis6_calculate_streak_optimized() should complete in <50ms

✅ Analytics queries: 60% reduction
    - Date range queries use idx_axis6_daily_stats_date_range
    - Monthly/weekly reports should load in <300ms

✅ Concurrent user capacity: 10x improvement
    - Support 1000+ concurrent users with same response times
    - Reduced lock contention and buffer cache pressure

Monitor these metrics after deployment to verify improvements.
*/

-- =====================================================
-- MONITORING AUTOMATION
-- =====================================================

-- 18. Create monitoring view for regular checks
CREATE OR REPLACE VIEW axis6_performance_summary AS
SELECT 
    'Database Health' as metric_category,
    'Table Count' as metric_name,
    COUNT(*)::text as metric_value,
    'tables' as unit
FROM pg_tables 
WHERE tablename LIKE 'axis6_%'

UNION ALL

SELECT 
    'Database Health',
    'Total Database Size', 
    pg_size_pretty(pg_database_size(current_database())),
    'bytes'

UNION ALL

SELECT 
    'Index Performance',
    'Active Indexes',
    COUNT(*)::text,
    'indexes'
FROM pg_stat_user_indexes 
WHERE tablename LIKE 'axis6_%' AND idx_tup_read > 0

UNION ALL

SELECT 
    'Query Performance',
    'Avg Dashboard Load Time',
    COALESCE(
        round(avg(mean_time)::numeric, 2)::text,
        'Not measured'
    ),
    'ms'
FROM pg_stat_statements 
WHERE query ILIKE '%get_dashboard_data_optimized%'

ORDER BY metric_category, metric_name;

-- Query the monitoring view
-- SELECT * FROM axis6_performance_summary;