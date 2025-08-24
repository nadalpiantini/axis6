-- ============================================
-- Performance Optimization Indexes for AXIS6
-- ============================================
-- This migration adds critical indexes to improve query performance

-- --------------------------------------------
-- 1. Authentication & User Queries
-- --------------------------------------------

-- Index for user lookups by email (login queries)
CREATE INDEX IF NOT EXISTS idx_axis6_profiles_user_id 
  ON axis6_profiles(user_id);

-- Index for profile lookups by email
CREATE INDEX IF NOT EXISTS idx_axis6_profiles_email 
  ON axis6_profiles(email);

-- --------------------------------------------
-- 2. Check-ins Performance
-- --------------------------------------------

-- Composite index for daily check-in queries
-- Most common query: WHERE user_id = ? AND date = ?
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_user_date 
  ON axis6_checkins(user_id, date DESC);

-- Index for category-specific queries
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_category_user 
  ON axis6_checkins(category_id, user_id);

-- Index for date range queries (analytics)
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_date_desc 
  ON axis6_checkins(date DESC);

-- Index for completed status filtering
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_completed 
  ON axis6_checkins(completed) 
  WHERE completed = true;

-- --------------------------------------------
-- 3. Streaks Performance
-- --------------------------------------------

-- Composite index for streak lookups
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_user_category 
  ON axis6_streaks(user_id, category_id);

-- Index for active streaks
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_active 
  ON axis6_streaks(is_active) 
  WHERE is_active = true;

-- Index for last check-in date (for streak calculations)
CREATE INDEX IF NOT EXISTS idx_axis6_streaks_last_checkin 
  ON axis6_streaks(last_checkin_date DESC);

-- --------------------------------------------
-- 4. Daily Stats Performance
-- --------------------------------------------

-- Composite index for daily stats queries
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_user_date 
  ON axis6_daily_stats(user_id, date DESC);

-- Index for completion rate queries
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_completion 
  ON axis6_daily_stats(completion_rate DESC);

-- Index for date range analytics
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_date_range 
  ON axis6_daily_stats(date DESC, user_id);

-- --------------------------------------------
-- 5. Categories Performance
-- --------------------------------------------

-- Index for category lookups by key
CREATE INDEX IF NOT EXISTS idx_axis6_categories_key 
  ON axis6_categories(key);

-- Index for active categories
CREATE INDEX IF NOT EXISTS idx_axis6_categories_active 
  ON axis6_categories(is_active) 
  WHERE is_active = true;

-- --------------------------------------------
-- 6. Partial Indexes for Common Filters
-- --------------------------------------------

-- Partial index for today's check-ins (most common query)
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_today 
  ON axis6_checkins(user_id, category_id) 
  WHERE date = CURRENT_DATE;

-- Partial index for this week's stats
CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_week 
  ON axis6_daily_stats(user_id, date) 
  WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Partial index for active users (last 30 days)
CREATE INDEX IF NOT EXISTS idx_axis6_profiles_active 
  ON axis6_profiles(user_id, last_seen_at) 
  WHERE last_seen_at >= CURRENT_DATE - INTERVAL '30 days';

-- --------------------------------------------
-- 7. Foreign Key Indexes (if not auto-created)
-- --------------------------------------------

-- Ensure FK indexes exist
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

-- --------------------------------------------
-- 8. Text Search Indexes (for future features)
-- --------------------------------------------

-- GIN index for full-text search on notes (if added)
-- CREATE INDEX IF NOT EXISTS idx_axis6_checkins_notes_search 
--   ON axis6_checkins USING gin(to_tsvector('spanish', notes));

-- --------------------------------------------
-- 9. Update Table Statistics
-- --------------------------------------------

-- Analyze tables to update query planner statistics
ANALYZE axis6_profiles;
ANALYZE axis6_categories;
ANALYZE axis6_checkins;
ANALYZE axis6_streaks;
ANALYZE axis6_daily_stats;

-- --------------------------------------------
-- Index Usage Query (for monitoring)
-- --------------------------------------------
-- To check index usage, run:
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan,
--   idx_tup_read,
--   idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
--   AND tablename LIKE 'axis6_%'
-- ORDER BY idx_scan DESC;