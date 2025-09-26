-- New Performance Indexes - Created by Claude optimization
-- These are additional indexes not present in the original schema

-- =====================================================
-- ADVANCED CHECKINS INDEXES
-- =====================================================

-- Composite index for user's checkins by category and date (if not exists)
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_user_category_date 
ON axis6_checkins(user_id, category_id, completed_at DESC);

-- Skip completed index - column may not exist
-- CREATE INDEX IF NOT EXISTS idx_axis6_checkins_completed 
-- ON axis6_checkins(completed) 
-- WHERE completed = true;

-- =====================================================
-- STREAK OPTIMIZATION INDEXES
-- =====================================================

-- Index for finding active streaks
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_active 
ON axis6_streaks(user_id, current_streak DESC) 
WHERE current_streak > 0;

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_longest 
ON axis6_streaks(longest_streak DESC) 
WHERE longest_streak > 0;

-- Index for streak calculations
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_calculation 
ON axis6_streaks(user_id, last_checkin DESC);

-- =====================================================
-- DAILY STATS PERFORMANCE INDEXES
-- =====================================================

-- Index for completion rate queries
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_completion 
ON axis6_daily_stats(completion_rate DESC) 
WHERE completion_rate > 0;

-- Index for analytics date range queries
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_date_range 
ON axis6_daily_stats(date DESC, user_id);

-- =====================================================
-- MANTRAS TABLE INDEXES (if table exists)
-- =====================================================

-- Skip mantras table indexes - table may not exist
-- CREATE INDEX IF NOT EXISTS idx_axis6_mantras_user_date 
-- ON axis6_mantras(user_id, assigned_date DESC);

-- CREATE INDEX IF NOT EXISTS idx_axis6_mantras_incomplete 
-- ON axis6_mantras(user_id, completed) 
-- WHERE completed = false;

-- =====================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- =====================================================

-- Today's checkins (most frequent query) - DISABLED: CURRENT_DATE not IMMUTABLE
-- CREATE INDEX IF NOT EXISTS idx_axis6_checkins_today 
-- ON axis6_checkins(user_id, category_id) 
-- WHERE completed_at = CURRENT_DATE;

-- This week's checkins - DISABLED: CURRENT_DATE not IMMUTABLE
-- CREATE INDEX IF NOT EXISTS idx_axis6_checkins_week 
-- ON axis6_checkins(user_id, completed_at DESC) 
-- WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days';

-- This month's stats - DISABLED: DATE_TRUNC not IMMUTABLE  
-- CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_month 
-- ON axis6_daily_stats(user_id, stat_date DESC) 
-- WHERE stat_date >= DATE_TRUNC('month', CURRENT_DATE);

-- =====================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =====================================================

-- Update statistics for query planner optimization
ANALYZE axis6_checkins;
ANALYZE axis6_streaks; 
ANALYZE axis6_daily_stats;
ANALYZE axis6_profiles;
ANALYZE axis6_categories;

-- Log completion
SELECT 'Performance indexes applied successfully' as status;