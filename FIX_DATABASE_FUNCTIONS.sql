-- Fix database function errors
-- This script fixes the GROUP BY clause and return type mismatches

-- 1. Fix the get_dashboard_data_optimized function
CREATE OR REPLACE FUNCTION get_dashboard_data_optimized(p_user_id UUID)
RETURNS TABLE (
  categories JSON,
  time_blocks JSON,
  activity_logs JSON,
  stats JSON
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return categories
  RETURN QUERY
  SELECT 
    (
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug,
          'color', c.color,
          'position', c.position
        )
      )
      FROM axis6_categories c
      ORDER BY c.position
    ) as categories,
    
    -- Return time blocks for today
    (
      SELECT json_agg(
        json_build_object(
          'id', tb.id,
          'user_id', tb.user_id,
          'category_id', tb.category_id,
          'activity_name', tb.activity_name,
          'start_time', tb.start_time,
          'end_time', tb.end_time,
          'duration_minutes', tb.duration_minutes,
          'created_at', tb.created_at,
          'updated_at', tb.updated_at
        )
      )
      FROM axis6_time_blocks tb
      WHERE tb.user_id = p_user_id
        AND DATE(tb.start_time) = CURRENT_DATE
      ORDER BY tb.start_time
    ) as time_blocks,
    
    -- Return activity logs for today
    (
      SELECT json_agg(
        json_build_object(
          'id', al.id,
          'user_id', al.user_id,
          'category_id', al.category_id,
          'activity_id', al.activity_id,
          'time_block_id', al.time_block_id,
          'start_time', al.start_time,
          'end_time', al.end_time,
          'duration_minutes', al.duration_minutes,
          'created_at', al.created_at
        )
      )
      FROM axis6_activity_logs al
      WHERE al.user_id = p_user_id
        AND DATE(al.start_time) = CURRENT_DATE
      ORDER BY al.start_time
    ) as activity_logs,
    
    -- Return stats
    (
      SELECT json_build_object(
        'total_time_blocks', (
          SELECT COUNT(*)
          FROM axis6_time_blocks tb
          WHERE tb.user_id = p_user_id
            AND DATE(tb.start_time) = CURRENT_DATE
        ),
        'total_activity_time', (
          SELECT COALESCE(SUM(al.duration_minutes), 0)
          FROM axis6_activity_logs al
          WHERE al.user_id = p_user_id
            AND DATE(al.start_time) = CURRENT_DATE
        ),
        'categories_with_activity', (
          SELECT COUNT(DISTINCT al.category_id)
          FROM axis6_activity_logs al
          WHERE al.user_id = p_user_id
            AND DATE(al.start_time) = CURRENT_DATE
        )
      )
    ) as stats;
END;
$$;

-- 2. Fix the time distribution function (fix GROUP BY clause)
CREATE OR REPLACE FUNCTION get_time_distribution(p_user_id UUID, p_date DATE)
RETURNS TABLE (
  category_id INTEGER,
  category_name TEXT,
  category_color TEXT,
  planned_minutes INTEGER,
  actual_minutes INTEGER,
  category_slug TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.name as category_name,
    c.color as category_color,
    COALESCE(SUM(tb.duration_minutes), 0)::INTEGER as planned_minutes,
    COALESCE(SUM(al.duration_minutes), 0)::INTEGER as actual_minutes,
    c.slug as category_slug
  FROM axis6_categories c
  LEFT JOIN axis6_time_blocks tb ON c.id = tb.category_id 
    AND tb.user_id = p_user_id 
    AND DATE(tb.start_time) = p_date
  LEFT JOIN axis6_activity_logs al ON c.id = al.category_id 
    AND al.user_id = p_user_id 
    AND DATE(al.start_time) = p_date
  GROUP BY c.id, c.name, c.color, c.slug, c.position
  ORDER BY c.position;
END;
$$;

-- 3. Fix the get_my_day_data function to match expected return types
CREATE OR REPLACE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  category_id INTEGER,
  activity_name TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tb.id,
    tb.user_id,
    tb.category_id,
    tb.activity_name,
    tb.start_time,
    tb.end_time,
    tb.duration_minutes,
    tb.created_at,
    tb.updated_at
  FROM axis6_time_blocks tb
  WHERE tb.user_id = p_user_id
    AND DATE(tb.start_time) = p_date
  ORDER BY tb.start_time;
END;
$$;

-- 4. Ensure RLS policies are correct
ALTER TABLE axis6_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_axis_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all categories" ON axis6_categories;
DROP POLICY IF EXISTS "Users can view their own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can insert their own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can update their own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can delete their own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON axis6_activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON axis6_activity_logs;
DROP POLICY IF EXISTS "Users can view their own axis activities" ON axis6_axis_activities;
DROP POLICY IF EXISTS "Users can insert their own axis activities" ON axis6_axis_activities;

-- Create new policies
CREATE POLICY "Users can view all categories" ON axis6_categories
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own time blocks" ON axis6_time_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time blocks" ON axis6_time_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time blocks" ON axis6_time_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks" ON axis6_time_blocks
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activity logs" ON axis6_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs" ON axis6_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own axis activities" ON axis6_axis_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own axis activities" ON axis6_axis_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON axis6_time_blocks(user_id, DATE(start_time));
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON axis6_activity_logs(user_id, DATE(start_time));
CREATE INDEX IF NOT EXISTS idx_axis_activities_user_category ON axis6_axis_activities(user_id, category_id);

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_dashboard_data_optimized(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_time_distribution(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_day_data(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION start_activity_timer(UUID, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION stop_activity_timer(UUID, INTEGER) TO authenticated;
