-- Critical Performance Indexes for AXIS6
-- Generated from performance audit recommendations

-- Index for dashboard queries - user's daily checkins
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_user_date_completed 
ON axis6_checkins(user_id, completed_at DESC, category_id);

-- Index for today's checkin lookups (most common query)
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_today_lookup 
ON axis6_checkins(user_id, category_id, completed_at);

-- Index for streak calculations
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_streak_calc 
ON axis6_checkins(user_id, category_id, completed_at DESC);

-- Index for user streaks table
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_user_category 
ON axis6_streaks(user_id, category_id, updated_at DESC);

-- Index for user profile lookups (profiles table uses 'id' not 'user_id')
CREATE INDEX IF NOT EXISTS idx_axis6_profiles_updated 
ON axis6_profiles(id, updated_at DESC);

-- Skip categories active index - column may not exist

-- Composite index for dashboard stats (using correct column names)
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_user_date 
ON axis6_daily_stats(user_id, date DESC, categories_completed);

-- Index for recent activity (without date filter)
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_recent 
ON axis6_checkins(user_id, completed_at DESC);

-- Analyze tables to update statistics after index creation
ANALYZE axis6_checkins;
ANALYZE axis6_streaks;
ANALYZE axis6_profiles;
ANALYZE axis6_categories;
ANALYZE axis6_daily_stats;