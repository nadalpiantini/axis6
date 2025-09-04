-- =====================================================
-- EMERGENCY DEPLOYMENT: Missing get_dashboard_data_optimized Function
-- =====================================================
-- Execute this in Supabase SQL Editor immediately to fix 404 errors
-- URL: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_dashboard_data_optimized(UUID, DATE);
DROP FUNCTION IF EXISTS get_dashboard_data_optimized(UUID);

-- =====================================================
-- Create the missing get_dashboard_data_optimized function
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
-- Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_dashboard_data_optimized(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data_optimized(UUID, DATE) TO anon;

-- =====================================================
-- Add function documentation
-- =====================================================
COMMENT ON FUNCTION get_dashboard_data_optimized(UUID, DATE) IS 
'Optimized dashboard data function that returns user data and categories with completion status in a single query. 
Replaces multiple separate queries for better performance.';

-- =====================================================
-- Test the function
-- =====================================================
-- Uncomment the line below to test with a sample user ID
-- SELECT get_dashboard_data_optimized('00000000-0000-0000-0000-000000000001'::UUID);

-- =====================================================
-- Verify function exists
-- =====================================================
SELECT 
  proname as function_name,
  proargtypes::regtype[] as parameters,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_dashboard_data_optimized';

-- =====================================================
-- Deployment complete
-- =====================================================
SELECT 'get_dashboard_data_optimized function deployed successfully' as status;



