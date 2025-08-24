-- Performance optimization indexes for AXIS6
-- These composite indexes significantly improve query performance for common access patterns

-- Index for efficient check-in queries by user and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkins_user_date 
ON axis6_checkins(user_id, completed_at DESC);

-- Composite index for user + category + date queries (most common pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkins_user_category_date 
ON axis6_checkins(user_id, category_id, completed_at DESC);

-- Index for streak calculations - find active streaks quickly
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaks_user_current 
ON axis6_streaks(user_id, current_streak DESC) 
WHERE current_streak > 0;

-- Index for finding user's streaks by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaks_user_category 
ON axis6_streaks(user_id, category_id);

-- Index for last completed date lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaks_last_completed 
ON axis6_streaks(user_id, last_completed_at DESC) 
WHERE last_completed_at IS NOT NULL;

-- Index for daily stats queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_stats_user_date 
ON axis6_daily_stats(user_id, stat_date DESC);

-- Index for profile lookups by user_id (if not already present)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user 
ON axis6_profiles(user_id);

-- Index for mantras by user and date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mantras_user_date 
ON axis6_mantras(user_id, created_at DESC);

-- Partial index for uncompleted mantras
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mantras_uncompleted 
ON axis6_mantras(user_id, mantra_date) 
WHERE completed = false;

-- Add table statistics for better query planning
ANALYZE axis6_checkins;
ANALYZE axis6_streaks;
ANALYZE axis6_daily_stats;
ANALYZE axis6_profiles;
ANALYZE axis6_categories;

-- Function to optimize streak calculation (replace the existing one)
CREATE OR REPLACE FUNCTION axis6_calculate_streak_optimized(
  p_user_id UUID,
  p_category_id UUID
) RETURNS TABLE(current_streak INT, longest_streak INT) AS $$
DECLARE
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_temp_streak INT := 0;
  v_last_date DATE := NULL;
  v_check_date DATE;
BEGIN
  -- Use cursor for efficient row-by-row processing with the new index
  FOR v_check_date IN
    SELECT DATE(completed_at) as check_date
    FROM axis6_checkins
    WHERE user_id = p_user_id 
      AND category_id = p_category_id
    ORDER BY completed_at DESC
    LIMIT 365 -- Only look at last year for performance
  LOOP
    IF v_last_date IS NULL OR v_last_date = v_check_date + INTERVAL '1 day' THEN
      -- Continue or start streak
      v_temp_streak := v_temp_streak + 1;
      
      -- Update current streak if we're still in it
      IF v_last_date IS NULL OR v_check_date >= CURRENT_DATE - INTERVAL '1 day' THEN
        v_current_streak := v_temp_streak;
      END IF;
      
      -- Update longest streak if needed
      IF v_temp_streak > v_longest_streak THEN
        v_longest_streak := v_temp_streak;
      END IF;
    ELSIF v_check_date < v_last_date - INTERVAL '1 day' THEN
      -- Streak broken, reset temp counter
      v_temp_streak := 1;
    END IF;
    
    v_last_date := v_check_date;
  END LOOP;
  
  RETURN QUERY SELECT v_current_streak, v_longest_streak;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a materialized view for weekly stats (refresh daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS axis6_weekly_stats AS
SELECT 
  user_id,
  DATE_TRUNC('week', completed_at) as week_start,
  category_id,
  COUNT(*) as checkin_count,
  COUNT(DISTINCT DATE(completed_at)) as days_checked
FROM axis6_checkins
WHERE completed_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY user_id, DATE_TRUNC('week', completed_at), category_id;

-- Index the materialized view
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_weekly_stats_user_week 
ON axis6_weekly_stats(user_id, week_start DESC);

-- Function to refresh the materialized view (call this daily via cron)
CREATE OR REPLACE FUNCTION axis6_refresh_weekly_stats() 
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY axis6_weekly_stats;
END;
$$ LANGUAGE plpgsql;

-- Add comment documentation
COMMENT ON INDEX idx_checkins_user_date IS 'Optimizes dashboard loading and daily check-in queries';
COMMENT ON INDEX idx_checkins_user_category_date IS 'Optimizes category-specific check-in lookups';
COMMENT ON INDEX idx_streaks_user_current IS 'Optimizes active streak queries for leaderboards';
COMMENT ON INDEX idx_weekly_stats_user_week IS 'Optimizes weekly progress charts';
COMMENT ON FUNCTION axis6_calculate_streak_optimized IS 'Optimized version of streak calculation with index usage';