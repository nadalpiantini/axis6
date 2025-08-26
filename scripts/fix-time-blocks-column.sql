-- Fix missing block_ts column if it doesn't exist
-- This column appears to exist in production but not in the migration

-- Add block_ts column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'axis6_time_blocks' 
        AND column_name = 'block_ts'
    ) THEN
        ALTER TABLE axis6_time_blocks 
        ADD COLUMN block_ts TIMESTAMPTZ DEFAULT NOW();
        
        -- Update existing rows to have block_ts based on date + start_time
        UPDATE axis6_time_blocks 
        SET block_ts = date + start_time
        WHERE block_ts IS NULL;
    END IF;
END $$;

-- Ensure the RPC functions exist and work correctly
-- Drop and recreate them to ensure they're up to date

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
    COALESCE(c.name->>'en', c.name::text) as category_name,
    c.color as category_color,
    c.icon as category_icon,
    tb.activity_id,
    tb.activity_name,
    tb.start_time,
    tb.end_time,
    COALESCE(tb.duration_minutes, 0) as duration_minutes,
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
      COALESCE(c.name->>'en', c.name::text) as category_name,
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
    planned,
    actual,
    CASE 
      WHEN planned > 0 THEN ROUND((actual::DECIMAL / planned) * 100, 2)
      ELSE 0
    END as percentage
  FROM time_data
  ORDER BY category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_my_day_data(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_daily_time_distribution(UUID, DATE) TO authenticated;