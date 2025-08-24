-- Critical Performance Indexes for AXIS6
-- Generated from performance audit recommendations

-- Index for dashboard queries - user's daily checkins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_axis6_checkins_user_date_completed 
ON axis6_checkins(user_id, completed_at DESC, category_id)
WHERE completed_at >= CURRENT_DATE;

-- Index for today's checkin lookups (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_axis6_checkins_today_lookup 
ON axis6_checkins(user_id, category_id, completed_at) 
WHERE completed_at >= CURRENT_DATE;

-- Index for streak calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_axis6_checkins_streak_calc 
ON axis6_checkins(user_id, category_id, completed_at DESC);

-- Index for user streaks table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_axis6_streaks_user_category 
ON axis6_streaks(user_id, category_id, updated_at DESC);

-- Index for user profile lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_axis6_profiles_user_updated 
ON axis6_profiles(user_id, updated_at DESC);

-- Partial index for active categories only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_axis6_categories_active 
ON axis6_categories(id, name, color) 
WHERE is_active = true;

-- Composite index for dashboard stats
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_axis6_daily_stats_user_date 
ON axis6_daily_stats(user_id, date DESC, total_completed);

-- Index for recent activity (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_axis6_checkins_recent 
ON axis6_checkins(user_id, completed_at DESC) 
WHERE completed_at >= (CURRENT_DATE - INTERVAL '30 days');

-- Analyze tables to update statistics after index creation
ANALYZE axis6_checkins;
ANALYZE axis6_streaks;
ANALYZE axis6_profiles;
ANALYZE axis6_categories;
ANALYZE axis6_daily_stats;