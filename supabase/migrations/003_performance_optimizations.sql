-- Performance Optimization Indexes for AXIS6
-- Created: 2024
-- Purpose: Improve query performance across the application

-- =====================================================
-- CHECKINS TABLE INDEXES
-- =====================================================

-- Composite index for most common query pattern: user's checkins by date
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_user_date 
ON axis6_checkins(user_id, checkin_date DESC);

-- Index for fetching checkins by category
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_category_date 
ON axis6_checkins(category_id, checkin_date DESC);

-- Composite index for user's checkins by category and date
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_user_category_date 
ON axis6_checkins(user_id, category_id, checkin_date DESC);

-- Index for completed checkins (for statistics)
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_completed 
ON axis6_checkins(completed) 
WHERE completed = true;

-- =====================================================
-- STREAKS TABLE INDEXES
-- =====================================================

-- Composite index for user's streaks by category
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_user_category 
ON axis6_streaks(user_id, category_id);

-- Index for finding active streaks
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_active 
ON axis6_streaks(user_id, current_streak DESC) 
WHERE current_streak > 0;

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_longest 
ON axis6_streaks(longest_streak DESC) 
WHERE longest_streak > 0;

-- =====================================================
-- DAILY STATS TABLE INDEXES
-- =====================================================

-- Composite index for user's daily stats
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_user_date 
ON axis6_daily_stats(user_id, stat_date DESC);

-- Index for completion percentage queries
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_completion 
ON axis6_daily_stats(completion_percentage DESC) 
WHERE completion_percentage > 0;

-- Index for analytics date range queries
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_date_range 
ON axis6_daily_stats(stat_date DESC, user_id);

-- =====================================================
-- MANTRAS TABLE INDEXES
-- =====================================================

-- Index for finding user's daily mantras
CREATE INDEX IF NOT EXISTS idx_axis6_mantras_user_date 
ON axis6_mantras(user_id, assigned_date DESC);

-- Index for incomplete mantras
CREATE INDEX IF NOT EXISTS idx_axis6_mantras_incomplete 
ON axis6_mantras(user_id, completed) 
WHERE completed = false;

-- =====================================================
-- PROFILES TABLE INDEXES
-- =====================================================

-- Index for user lookups by email (if needed)
CREATE INDEX IF NOT EXISTS idx_axis6_profiles_email 
ON axis6_profiles(email);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_axis6_profiles_active 
ON axis6_profiles(created_at DESC) 
WHERE deleted_at IS NULL;

-- =====================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- =====================================================

-- Today's checkins (most frequent query)
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_today 
ON axis6_checkins(user_id, category_id) 
WHERE checkin_date = CURRENT_DATE;

-- This week's checkins
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_week 
ON axis6_checkins(user_id, checkin_date DESC) 
WHERE checkin_date >= CURRENT_DATE - INTERVAL '7 days';

-- This month's stats
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_month 
ON axis6_daily_stats(user_id, stat_date DESC) 
WHERE stat_date >= DATE_TRUNC('month', CURRENT_DATE);

-- =====================================================
-- FUNCTION INDEXES FOR COMPUTED VALUES
-- =====================================================

-- Index for streak calculations
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_calculation 
ON axis6_streaks(user_id, last_checkin_date DESC);

-- =====================================================
-- FOREIGN KEY INDEXES (if not already created)
-- =====================================================

-- These are usually created automatically but ensuring they exist
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_user_fk 
ON axis6_checkins(user_id);

CREATE INDEX IF NOT EXISTS idx_axis6_checkins_category_fk 
ON axis6_checkins(category_id);

CREATE INDEX IF NOT EXISTS idx_axis6_streaks_user_fk 
ON axis6_streaks(user_id);

CREATE INDEX IF NOT EXISTS idx_axis6_streaks_category_fk 
ON axis6_streaks(category_id);

CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_user_fk 
ON axis6_daily_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_axis6_mantras_user_fk 
ON axis6_mantras(user_id);

-- =====================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =====================================================

-- Update statistics for query planner optimization
ANALYZE axis6_checkins;
ANALYZE axis6_streaks;
ANALYZE axis6_daily_stats;
ANALYZE axis6_mantras;
ANALYZE axis6_profiles;
ANALYZE axis6_categories;

-- =====================================================
-- PERFORMANCE MONITORING VIEWS
-- =====================================================

-- Create a view for monitoring index usage
CREATE OR REPLACE VIEW axis6_index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' 
    AND tablename LIKE 'axis6_%'
ORDER BY idx_scan DESC;

-- Create a view for monitoring slow queries
CREATE OR REPLACE VIEW axis6_slow_queries AS
SELECT
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time,
    rows,
    query
FROM pg_stat_statements
WHERE query LIKE '%axis6_%'
    AND mean_exec_time > 10  -- Queries taking more than 10ms on average
ORDER BY mean_exec_time DESC
LIMIT 20;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON INDEX idx_axis6_checkins_user_date IS 'Primary index for user dashboard queries';
COMMENT ON INDEX idx_axis6_checkins_today IS 'Partial index for today''s checkins - most frequent query';
COMMENT ON INDEX idx_axis6_streaks_active IS 'Index for finding active streaks for leaderboards';
COMMENT ON INDEX idx_axis6_daily_stats_user_date IS 'Index for user analytics and progress tracking';

-- =====================================================
-- MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- Note: Run these maintenance commands periodically:
-- REINDEX TABLE axis6_checkins;  -- Monthly
-- VACUUM ANALYZE axis6_checkins; -- Weekly
-- VACUUM FULL axis6_checkins;    -- Quarterly (during low traffic)