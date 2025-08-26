-- Fix missing database functions for my-day and time-blocks APIs
-- Execute this in the Supabase SQL Editor

-- Function to get today's time blocks with activities
CREATE OR REPLACE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE)
RETURNS TABLE (
  time_block_id INTEGER,
  category_id INTEGER,
  category_name TEXT,
  category_color TEXT,
  category_icon TEXT,
  activity_id INTEGER,
  activity_name VARCHAR(255),
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status VARCHAR(20),
  notes TEXT,
  actual_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tb.id as time_block_id,
    tb.category_id,
    c.name->>'en' as category_name,
    c.color as category_color,
    c.icon as category_icon,
    tb.activity_id,
    tb.activity_name,
    tb.start_time,
    tb.end_time,
    tb.duration_minutes,
    tb.status,
    tb.notes,
    COALESCE(
      (SELECT SUM(al.duration_minutes)::INTEGER 
       FROM axis6_activity_logs al 
       WHERE al.time_block_id = tb.id),
      0
    ) as actual_duration
  FROM axis6_time_blocks tb
  JOIN axis6_categories c ON c.id = tb.category_id
  WHERE tb.user_id = p_user_id 
    AND tb.date = p_date
  ORDER BY tb.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate daily time distribution
CREATE OR REPLACE FUNCTION calculate_daily_time_distribution(p_user_id UUID, p_date DATE)
RETURNS TABLE (
  category_id INTEGER,
  category_name TEXT,
  category_color TEXT,
  planned_minutes INTEGER,
  actual_minutes INTEGER,
  percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH time_data AS (
    SELECT 
      c.id as category_id,
      c.name->>'en' as category_name,
      c.color as category_color,
      COALESCE(SUM(tb.duration_minutes), 0)::INTEGER as planned,
      COALESCE(
        (SELECT SUM(al.duration_minutes)::INTEGER 
         FROM axis6_activity_logs al 
         WHERE al.user_id = p_user_id 
           AND al.category_id = c.id
           AND DATE(al.started_at) = p_date),
        0
      ) as actual
    FROM axis6_categories c
    LEFT JOIN axis6_time_blocks tb ON tb.category_id = c.id 
      AND tb.user_id = p_user_id 
      AND tb.date = p_date
    GROUP BY c.id, c.name, c.color
  )
  SELECT 
    category_id,
    category_name,
    category_color,
    planned as planned_minutes,
    actual as actual_minutes,
    CASE 
      WHEN (SELECT SUM(actual) FROM time_data) > 0 
      THEN ROUND((actual::DECIMAL / (SELECT SUM(actual) FROM time_data) * 100), 2)
      ELSE 0
    END as percentage
  FROM time_data
  ORDER BY category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_my_day_data(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_daily_time_distribution(UUID, DATE) TO authenticated;

-- Test the functions (optional - remove these lines after testing)
-- SELECT * FROM get_my_day_data('00000000-0000-0000-0000-000000000000'::UUID, '2025-01-26'::DATE);
-- SELECT * FROM calculate_daily_time_distribution('00000000-0000-0000-0000-000000000000'::UUID, '2025-01-26'::DATE);

