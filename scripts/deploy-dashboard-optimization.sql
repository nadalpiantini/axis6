-- =====================================================
-- AXIS6 DASHBOARD OPTIMIZATION DEPLOYMENT
-- =====================================================
-- This script deploys the missing dashboard optimization functions
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql
-- 
-- This fixes the 404 errors for get_dashboard_data_optimized function
-- =====================================================

-- =====================================================
-- DASHBOARD OPTIMIZATION FUNCTIONS
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_dashboard_data_optimized(UUID, DATE);
DROP FUNCTION IF EXISTS get_dashboard_data_optimized(UUID);

-- =====================================================
-- Main dashboard data function
-- =====================================================
CREATE OR REPLACE FUNCTION get_dashboard_data_optimized(
  p_user_id UUID,
  p_today DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_data JSON;
  categories_data JSON;
BEGIN
  -- Get user data
  SELECT json_build_object(
    'id', id,
    'name', name,
    'timezone', timezone,
    'onboarded', onboarded
  ) INTO user_data
  FROM axis6_profiles 
  WHERE id = p_user_id;

  -- Get categories with today's completion status and streaks
  -- This single query replaces 3 separate queries (categories, checkins, streaks)
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'slug', c.slug,
      'name', c.name,
      'color', c.color,
      'icon', c.icon,
      'position', c.order_index,
      'todayCompleted', CASE WHEN ch.id IS NOT NULL THEN true ELSE false END,
      'currentStreak', COALESCE(s.current_streak, 0),
      'longestStreak', COALESCE(s.longest_streak, 0),
      'lastCheckin', s.last_checkin
    ) ORDER BY c.order_index
  ) INTO categories_data
  FROM axis6_categories c
  LEFT JOIN axis6_checkins ch ON (
    ch.category_id = c.id 
    AND ch.user_id = p_user_id 
    AND ch.completed_at = p_today
  )
  LEFT JOIN axis6_streaks s ON (
    s.category_id = c.id 
    AND s.user_id = p_user_id
  );

  -- Combine results
  result := json_build_object(
    'user', user_data,
    'categories', categories_data
  );

  RETURN result;
END;
$$;

-- =====================================================
-- Weekly statistics function
-- =====================================================
CREATE OR REPLACE FUNCTION get_weekly_stats(
  p_user_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_checkins INT;
  perfect_days INT;
  completion_rate DECIMAL(5,2);
  max_possible_checkins INT := 6 * 7; -- 6 categories * 7 days
BEGIN
  -- Get total checkins for the week
  SELECT COUNT(*) INTO total_checkins
  FROM axis6_checkins
  WHERE user_id = p_user_id
    AND completed_at >= p_start_date
    AND completed_at <= p_end_date;

  -- Count perfect days (all 6 categories completed)
  SELECT COUNT(DISTINCT completed_at) INTO perfect_days
  FROM (
    SELECT completed_at, COUNT(*) as daily_checkins
    FROM axis6_checkins
    WHERE user_id = p_user_id
      AND completed_at >= p_start_date
      AND completed_at <= p_end_date
    GROUP BY completed_at
    HAVING COUNT(*) = 6
  ) perfect_days_data;

  -- Calculate completion rate
  completion_rate := (total_checkins::DECIMAL / max_possible_checkins) * 100;

  RETURN json_build_object(
    'totalCheckins', total_checkins,
    'perfectDays', perfect_days,
    'completionRate', completion_rate,
    'maxPossibleCheckins', max_possible_checkins
  );
END;
$$;

-- =====================================================
-- Recent activity function
-- =====================================================
CREATE OR REPLACE FUNCTION get_recent_activity(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_data JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'date', date,
      'completionRate', completion_rate,
      'categoriesCompleted', categories_completed,
      'totalMood', total_mood
    ) ORDER BY date DESC
  ) INTO activity_data
  FROM axis6_daily_stats
  WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    AND date <= CURRENT_DATE;

  RETURN activity_data;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_data_optimized(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_stats(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity(UUID, INTEGER) TO authenticated;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Create performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_user_date 
ON axis6_checkins(user_id, completed_at DESC)
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_axis6_streaks_user_category 
ON axis6_streaks(user_id, category_id, current_streak DESC);

CREATE INDEX IF NOT EXISTS idx_axis6_categories_order 
ON axis6_categories(order_index, id);

CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_user_date 
ON axis6_daily_stats(user_id, date DESC);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION get_dashboard_data_optimized(UUID, DATE) IS 
'Optimized dashboard data function that returns user profile, categories with completion status, and streaks in a single query. Replaces multiple individual queries for better performance.';

COMMENT ON FUNCTION get_weekly_stats(UUID, DATE, DATE) IS 
'Returns weekly statistics including total checkins, perfect days, and completion rate for the specified date range.';

COMMENT ON FUNCTION get_recent_activity(UUID, INTEGER) IS 
'Returns recent activity data from daily_stats table for the specified number of days.';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test the function (uncomment to test)
-- SELECT get_dashboard_data_optimized('00000000-0000-0000-0000-000000000001'::UUID);

-- Show function details
SELECT 
  proname as function_name,
  proargtypes::regtype[] as argument_types,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('get_dashboard_data_optimized', 'get_weekly_stats', 'get_recent_activity');

-- Show indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_axis6_%'
ORDER BY indexname;
