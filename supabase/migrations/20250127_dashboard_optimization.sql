-- Dashboard Performance Optimization Migration
-- This migration creates optimized RPC functions and indexes for the dashboard

-- Create optimized composite indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_checkins_user_date 
ON axis6_checkins(user_id, completed_at DESC)
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_streaks_user_category 
ON axis6_streaks(user_id, category_id, current_streak DESC);

CREATE INDEX IF NOT EXISTS idx_categories_position 
ON axis6_categories(position, id);

-- Create optimized RPC function for fetching all dashboard data in a single query
CREATE OR REPLACE FUNCTION get_dashboard_data_optimized(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  today_start TIMESTAMPTZ;
  today_end TIMESTAMPTZ;
BEGIN
  -- Calculate today's date range in user's timezone (default UTC)
  today_start := CURRENT_DATE::TIMESTAMPTZ;
  today_end := (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ - INTERVAL '1 microsecond';
  
  -- Build the result JSON with all dashboard data
  result := json_build_object(
    'user', (
      SELECT json_build_object(
        'id', id,
        'email', email,
        'created_at', created_at
      )
      FROM auth.users
      WHERE id = p_user_id
    ),
    'categories', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'name', name,
          'slug', slug,
          'icon', icon,
          'color', color,
          'position', position,
          'description', description
        ) ORDER BY position, id
      ), '[]'::json)
      FROM axis6_categories
      WHERE is_active = true
    ),
    'todayCheckins', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'user_id', user_id,
          'category_id', category_id,
          'completed_at', completed_at,
          'created_at', created_at
        )
      ), '[]'::json)
      FROM axis6_checkins
      WHERE user_id = p_user_id
        AND completed_at >= today_start
        AND completed_at <= today_end
    ),
    'streaks', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'user_id', user_id,
          'category_id', category_id,
          'current_streak', current_streak,
          'longest_streak', longest_streak,
          'last_checkin', last_checkin
        )
      ), '[]'::json)
      FROM axis6_streaks
      WHERE user_id = p_user_id
    ),
    'stats', (
      SELECT json_build_object(
        'totalCheckins', (
          SELECT COUNT(*)
          FROM axis6_checkins
          WHERE user_id = p_user_id
        ),
        'currentOverallStreak', (
          SELECT COALESCE(MAX(current_streak), 0)
          FROM axis6_streaks
          WHERE user_id = p_user_id
        ),
        'longestOverallStreak', (
          SELECT COALESCE(MAX(longest_streak), 0)
          FROM axis6_streaks
          WHERE user_id = p_user_id
        ),
        'todayProgress', (
          SELECT COUNT(DISTINCT category_id)::FLOAT / 6 * 100
          FROM axis6_checkins
          WHERE user_id = p_user_id
            AND completed_at >= today_start
            AND completed_at <= today_end
        ),
        'weeklyAverage', (
          SELECT AVG(daily_count)::FLOAT
          FROM (
            SELECT DATE(completed_at) as day, COUNT(DISTINCT category_id) as daily_count
            FROM axis6_checkins
            WHERE user_id = p_user_id
              AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(completed_at)
          ) daily_counts
        )
      )
    )
  );
  
  RETURN result;
END;
$$;

-- Create function for batch checkin operations
CREATE OR REPLACE FUNCTION batch_toggle_checkins(
  p_user_id UUID,
  p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  update_record JSONB;
  category_id_val INTEGER;
  completed_val BOOLEAN;
  result_array JSONB := '[]'::JSONB;
  operation_result JSONB;
  today_start TIMESTAMPTZ;
  today_end TIMESTAMPTZ;
BEGIN
  -- Calculate today's date range
  today_start := CURRENT_DATE::TIMESTAMPTZ;
  today_end := (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ - INTERVAL '1 microsecond';
  
  -- Process each update
  FOR update_record IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    category_id_val := (update_record->>'categoryId')::INTEGER;
    completed_val := (update_record->>'completed')::BOOLEAN;
    
    IF completed_val THEN
      -- Add checkin
      INSERT INTO axis6_checkins (user_id, category_id, completed_at)
      VALUES (p_user_id, category_id_val, NOW())
      ON CONFLICT (user_id, category_id, DATE(completed_at))
      DO UPDATE SET completed_at = NOW()
      RETURNING jsonb_build_object(
        'categoryId', category_id,
        'success', true,
        'action', 'added'
      ) INTO operation_result;
    ELSE
      -- Remove checkin
      DELETE FROM axis6_checkins
      WHERE user_id = p_user_id
        AND category_id = category_id_val
        AND completed_at >= today_start
        AND completed_at <= today_end;
      
      operation_result := jsonb_build_object(
        'categoryId', category_id_val,
        'success', true,
        'action', 'removed'
      );
    END IF;
    
    result_array := result_array || operation_result;
    
    -- Update streaks
    PERFORM axis6_calculate_streak_optimized(p_user_id, category_id_val);
  END LOOP;
  
  RETURN jsonb_build_object(
    'results', result_array,
    'timestamp', NOW()
  );
END;
$$;

-- Create materialized view for dashboard analytics (refreshed hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_analytics_mv AS
SELECT 
  user_id,
  DATE(completed_at) as date,
  COUNT(DISTINCT category_id) as categories_completed,
  COUNT(*) as total_checkins,
  ARRAY_AGG(DISTINCT category_id ORDER BY category_id) as completed_categories
FROM axis6_checkins
WHERE completed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE(completed_at);

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_dashboard_analytics_mv_user_date 
ON dashboard_analytics_mv(user_id, date DESC);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_analytics_mv;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_dashboard_data_optimized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_toggle_checkins(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_analytics() TO authenticated;
GRANT SELECT ON dashboard_analytics_mv TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_dashboard_data_optimized(UUID) IS 
'Optimized function to fetch all dashboard data in a single query. Returns user info, categories, today checkins, streaks, and stats.';

COMMENT ON FUNCTION batch_toggle_checkins(UUID, JSONB) IS 
'Batch operation for toggling multiple checkins at once. Accepts array of {categoryId, completed} objects.';

COMMENT ON MATERIALIZED VIEW dashboard_analytics_mv IS 
'Pre-computed dashboard analytics data, refreshed hourly for performance.';