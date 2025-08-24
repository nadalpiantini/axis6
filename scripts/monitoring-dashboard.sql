-- =====================================================
-- AXIS6 PERFORMANCE MONITORING DASHBOARD
-- =====================================================
-- Real-time monitoring queries for ongoing performance tracking
-- Run these regularly to ensure optimization is working

-- =====================================================
-- PERFORMANCE OVERVIEW DASHBOARD
-- =====================================================

-- Main performance summary (run this first)
SELECT 
    '🎯 AXIS6 PERFORMANCE DASHBOARD' as dashboard_title,
    current_timestamp as generated_at,
    'Run in Supabase Dashboard > SQL Editor' as instructions;

-- =====================================================
-- 1. INDEX HEALTH & USAGE
-- =====================================================

SELECT 
    '📊 INDEX PERFORMANCE SUMMARY' as section,
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE idx_tup_read > 100) as highly_used,
    COUNT(*) FILTER (WHERE idx_tup_read = 0) as unused,
    ROUND(AVG(idx_tup_read::numeric / NULLIF(idx_tup_fetch, 0)), 2) as avg_efficiency
FROM pg_stat_user_indexes 
WHERE relname LIKE 'axis6_%';

-- Top performing indexes
SELECT 
    '🚀 TOP PERFORMING INDEXES' as section,
    relname as table_name,
    indexrelname as index_name,
    idx_tup_read as reads,
    idx_tup_fetch as fetches,
    ROUND(idx_tup_read::numeric / NULLIF(idx_tup_fetch, 0), 2) as efficiency_ratio,
    CASE 
        WHEN idx_tup_read > 1000 THEN '🟢 EXCELLENT'
        WHEN idx_tup_read > 100 THEN '🟡 GOOD' 
        WHEN idx_tup_read > 10 THEN '🟠 MODERATE'
        ELSE '🔴 LOW'
    END as performance_status
FROM pg_stat_user_indexes 
WHERE relname LIKE 'axis6_%' 
  AND idx_tup_read > 0
ORDER BY idx_tup_read DESC 
LIMIT 10;

-- Unused indexes (potential cleanup candidates)
SELECT 
    '⚠️ UNUSED INDEXES' as section,
    relname as table_name,
    indexrelname as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    'Consider reviewing if truly unused' as recommendation
FROM pg_stat_user_indexes 
WHERE relname LIKE 'axis6_%' 
  AND idx_tup_read = 0
  AND indexrelname LIKE 'idx_axis6_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- =====================================================
-- 2. QUERY PERFORMANCE METRICS  
-- =====================================================

-- Database activity overview
SELECT 
    '💻 DATABASE ACTIVITY' as section,
    COUNT(*) as total_connections,
    COUNT(*) FILTER (WHERE state = 'active') as active_queries,
    COUNT(*) FILTER (WHERE state = 'idle') as idle_connections,
    COUNT(*) FILTER (WHERE query ILIKE '%axis6%') as axis6_queries
FROM pg_stat_activity 
WHERE datname = current_database();

-- Long running queries (potential issues)
SELECT 
    '⏱️ LONG RUNNING QUERIES' as section,
    pid,
    usename,
    now() - query_start as duration,
    state,
    LEFT(query, 100) as query_preview,
    CASE 
        WHEN now() - query_start > interval '10 seconds' THEN '🔴 CRITICAL'
        WHEN now() - query_start > interval '5 seconds' THEN '🟠 WARNING'
        ELSE '🟡 MONITOR'
    END as alert_level
FROM pg_stat_activity 
WHERE now() - query_start > interval '1 second'
  AND state != 'idle'
  AND query NOT ILIKE '%pg_stat_activity%'
ORDER BY duration DESC
LIMIT 5;

-- =====================================================
-- 3. TABLE HEALTH METRICS
-- =====================================================

-- Table statistics and maintenance needs
SELECT 
    '📋 TABLE HEALTH STATUS' as section,
    relname as table_name,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    CASE 
        WHEN n_live_tup > 0 THEN 
            ROUND(100.0 * n_dead_tup / n_live_tup, 2) 
        ELSE 0 
    END as dead_row_percentage,
    CASE 
        WHEN n_live_tup > 0 AND (100.0 * n_dead_tup / n_live_tup) > 20 THEN '🔴 NEEDS VACUUM'
        WHEN n_live_tup > 0 AND (100.0 * n_dead_tup / n_live_tup) > 10 THEN '🟠 CONSIDER VACUUM'
        ELSE '🟢 HEALTHY'
    END as maintenance_status,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables 
WHERE relname LIKE 'axis6_%'
ORDER BY 
    CASE WHEN n_live_tup > 0 THEN (100.0 * n_dead_tup / n_live_tup) ELSE 0 END DESC;

-- Database size and growth
SELECT 
    '💾 STORAGE UTILIZATION' as section,
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as table_size,
    pg_size_pretty(
        pg_total_relation_size(schemaname||'.'||relname) - 
        pg_relation_size(schemaname||'.'||relname)
    ) as indexes_size,
    ROUND(
        100.0 * (pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) 
        / NULLIF(pg_total_relation_size(schemaname||'.'||relname), 0), 
        1
    ) as index_ratio_percent
FROM pg_tables 
WHERE tablename LIKE 'axis6_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 4. PERFORMANCE BENCHMARKS
-- =====================================================

-- Test critical queries performance (replace USER_ID with actual ID)
SELECT 
    '⚡ PERFORMANCE BENCHMARKS' as section,
    'Replace USER_ID_HERE with actual user ID and run these tests:' as instructions;

-- Today's checkins test
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT category_id, completed_at
FROM axis6_checkins 
WHERE user_id = 'USER_ID_HERE'::UUID 
  AND completed_at = CURRENT_DATE;

-- User streaks test  
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT category_id, current_streak, longest_streak
FROM axis6_streaks
WHERE user_id = 'USER_ID_HERE'::UUID;

-- Leaderboard test
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT longest_streak, current_streak, user_id
FROM axis6_streaks
WHERE longest_streak > 0
ORDER BY longest_streak DESC, current_streak DESC
LIMIT 10;

-- =====================================================
-- 5. OPTIMIZATION IMPACT MEASUREMENT
-- =====================================================

-- Before/After comparison metrics
SELECT 
    '📈 OPTIMIZATION IMPACT' as section,
    'Expected improvements after optimization deployment:' as metric_type,
    E'
🎯 PERFORMANCE TARGETS:
• Dashboard load: < 200ms (was ~700ms) 
• Today\'s checkins: < 50ms (95% improvement)
• Leaderboard queries: < 100ms (80% improvement)  
• Streak calculations: < 50ms (80% improvement)
• Concurrent users: 10x capacity increase

✅ SUCCESS INDICATORS:
• Index scans instead of sequence scans in EXPLAIN
• High efficiency ratios (>10) on critical indexes
• Fast response times on RPC functions
• Low dead row percentages (<10%)
• Stable connection counts under load

⚠️ WARNING SIGNS:
• Query times > 1000ms consistently
• Efficiency ratios < 5 on used indexes  
• Dead row percentage > 20%
• Many unused indexes taking up space
• Connection pool exhaustion
    ' as details;

-- =====================================================
-- 6. AUTOMATED MONITORING SETUP
-- =====================================================

-- Performance monitoring view (already created)
SELECT 
    '🔍 MONITORING VIEW USAGE' as section,
    'SELECT * FROM dashboard_performance_metrics ORDER BY efficiency_ratio DESC;' as query_to_run;

-- Create alerts table for tracking performance issues
CREATE TABLE IF NOT EXISTS axis6_performance_alerts (
    id SERIAL PRIMARY KEY,
    alert_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    message TEXT NOT NULL,
    query_duration_ms NUMERIC,
    affected_table TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Sample alert insertion (customize thresholds as needed)
INSERT INTO axis6_performance_alerts (alert_type, severity, message, query_duration_ms)
SELECT 
    'SLOW_QUERY',
    CASE 
        WHEN 1000 > 5000 THEN 'CRITICAL'
        WHEN 1000 > 2000 THEN 'HIGH'
        WHEN 1000 > 1000 THEN 'MEDIUM'
        ELSE 'LOW'
    END,
    'Query exceeded performance threshold',
    1000
WHERE FALSE; -- Only example, adjust conditions

-- =====================================================
-- 7. MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- Generate maintenance commands based on current state
SELECT 
    '🔧 MAINTENANCE RECOMMENDATIONS' as section,
    table_name,
    dead_percentage,
    CASE 
        WHEN dead_percentage > 20 THEN 'VACUUM ANALYZE ' || table_name || ';'
        WHEN dead_percentage > 10 THEN 'Consider: VACUUM ' || table_name || ';'
        ELSE 'No maintenance needed'
    END as recommended_action,
    CASE
        WHEN last_analyze < NOW() - INTERVAL '1 week' THEN 'ANALYZE ' || table_name || ';'
        ELSE 'Statistics are current'
    END as analyze_recommendation
FROM (
    SELECT 
        relname as table_name,
        CASE 
            WHEN n_live_tup > 0 THEN 
                ROUND(100.0 * n_dead_tup / n_live_tup, 2) 
            ELSE 0 
        END as dead_percentage,
        last_analyze
    FROM pg_stat_user_tables 
    WHERE relname LIKE 'axis6_%'
) t
ORDER BY dead_percentage DESC;

-- =====================================================
-- 8. QUICK HEALTH CHECK SCRIPT
-- =====================================================

-- Single query health check (run this daily)
WITH performance_summary AS (
    SELECT 
        COUNT(*) FILTER (WHERE relname LIKE 'axis6_%') as total_tables,
        COUNT(*) FILTER (WHERE relname LIKE 'axis6_%' AND idx_tup_read > 0) as active_indexes,
        AVG(CASE WHEN n_live_tup > 0 THEN 100.0 * n_dead_tup / n_live_tup ELSE 0 END) as avg_dead_percentage
    FROM pg_stat_user_tables t
    LEFT JOIN pg_stat_user_indexes i ON t.relid = i.relid
),
connection_summary AS (
    SELECT 
        COUNT(*) as total_connections,
        COUNT(*) FILTER (WHERE state = 'active') as active_queries
    FROM pg_stat_activity 
    WHERE datname = current_database()
)
SELECT 
    '⚡ QUICK HEALTH CHECK' as check_type,
    p.total_tables as axis6_tables,
    p.active_indexes as active_indexes,
    ROUND(p.avg_dead_percentage, 1) as avg_dead_row_percent,
    c.total_connections as db_connections,
    c.active_queries as running_queries,
    CASE 
        WHEN p.avg_dead_percentage > 15 THEN '⚠️ MAINTENANCE NEEDED'
        WHEN c.active_queries > 10 THEN '⚠️ HIGH LOAD'
        WHEN p.active_indexes < 15 THEN '⚠️ INDEX ISSUES'
        ELSE '✅ HEALTHY'
    END as overall_status,
    now() as checked_at
FROM performance_summary p, connection_summary c;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
🚀 HOW TO USE THIS MONITORING DASHBOARD:

📅 DAILY (5 minutes):
1. Run the "QUICK HEALTH CHECK" query above
2. Check for any CRITICAL alerts in long running queries
3. Review overall_status for immediate issues

📅 WEEKLY (15 minutes):  
1. Run the full dashboard (entire SQL file)
2. Review "TOP PERFORMING INDEXES" section
3. Execute maintenance recommendations if needed
4. Check table health and storage utilization

📅 MONTHLY (30 minutes):
1. Review unused indexes for potential cleanup
2. Analyze query patterns for new optimization opportunities  
3. Update performance baselines and targets
4. Plan capacity upgrades if needed

🔍 INVESTIGATION TOOLS:
• Use EXPLAIN ANALYZE for slow queries
• Check dashboard_performance_metrics view
• Monitor pg_stat_user_indexes for index usage
• Review axis6_performance_alerts table

📈 SUCCESS METRICS:
• Dashboard load < 200ms
• Index efficiency ratios > 10
• Dead row percentage < 10%
• Zero critical performance alerts

🚨 ESCALATION TRIGGERS:
• Query times consistently > 2000ms
• Dead row percentage > 25%
• Connection pool > 80% utilization
• Multiple critical alerts per day
*/