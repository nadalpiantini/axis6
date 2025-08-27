-- FINAL MY DAY FIX: Corrected function signatures and return types
-- This fixes the exact issues found in verification

-- Drop existing functions if they have wrong signatures
DROP FUNCTION IF EXISTS get_my_day_data(UUID, DATE);
DROP FUNCTION IF EXISTS start_activity_timer(UUID, INTEGER, INTEGER, VARCHAR(255), INTEGER);
DROP FUNCTION IF EXISTS start_activity_timer(UUID, UUID, INTEGER, VARCHAR(255), INTEGER);
DROP FUNCTION IF EXISTS stop_activity_timer(UUID, INTEGER);

-- Create the exact function that matches the expected return structure
CREATE OR REPLACE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'timeBlocks', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', tb.id,
          'category_id', tb.category_id,
          'category_name', c.name->>'en',
          'category_color', c.color,
          'category_icon', c.icon,
          'activity_id', tb.activity_id,
          'activity_name', tb.activity_name,
          'start_time', tb.start_time::TEXT,
          'end_time', tb.end_time::TEXT,
          'duration_minutes', tb.duration_minutes,
          'status', COALESCE(tb.status, 'planned'),
          'notes', tb.notes,
          'actual_duration', COALESCE(
            (SELECT SUM(al.duration_minutes)::INTEGER 
             FROM axis6_activity_logs al 
             WHERE al.time_block_id = tb.id),
            0
          )
        ) ORDER BY tb.start_time
      )
      FROM axis6_time_blocks tb
      JOIN axis6_categories c ON c.id = tb.category_id
      WHERE tb.user_id = p_user_id 
        AND tb.date = p_date
    ), '[]'::json),
    'activeTimer', (
      SELECT json_build_object(
        'id', al.id,
        'activity_name', al.activity_name,
        'category_id', al.category_id,
        'started_at', al.started_at,
        'time_block_id', al.time_block_id
      )
      FROM axis6_activity_logs al
      WHERE al.user_id = p_user_id 
        AND al.ended_at IS NULL
      ORDER BY al.started_at DESC
      LIMIT 1
    )
  ) INTO result;

  RETURN COALESCE(result, '{"timeBlocks": [], "activeTimer": null}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create start_activity_timer with correct parameter order
CREATE OR REPLACE FUNCTION start_activity_timer(
  p_user_id UUID,
  p_category_id UUID,
  p_time_block_id INTEGER,
  p_activity_name VARCHAR(255),
  p_activity_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_log_id INTEGER;
  v_started_at TIMESTAMPTZ;
BEGIN
  -- End any active timers for this user
  UPDATE axis6_activity_logs
  SET 
    ended_at = NOW(),
    duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
  WHERE user_id = p_user_id 
    AND ended_at IS NULL;
  
  -- Start new timer
  INSERT INTO axis6_activity_logs (
    user_id, 
    activity_id, 
    category_id, 
    activity_name,
    started_at, 
    time_block_id
  )
  VALUES (
    p_user_id, 
    p_activity_id, 
    p_category_id, 
    p_activity_name,
    NOW(), 
    p_time_block_id
  )
  RETURNING id, started_at INTO v_log_id, v_started_at;
  
  -- Update time block status if linked
  IF p_time_block_id IS NOT NULL THEN
    UPDATE axis6_time_blocks
    SET status = 'active'
    WHERE id = p_time_block_id AND user_id = p_user_id;
  END IF;
  
  -- Return timer info as JSON
  RETURN json_build_object(
    'id', v_log_id,
    'activity_name', p_activity_name,
    'category_id', p_category_id,
    'started_at', v_started_at,
    'time_block_id', p_time_block_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create stop_activity_timer
CREATE OR REPLACE FUNCTION stop_activity_timer(
  p_user_id UUID,
  p_activity_log_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_duration INTEGER;
  v_time_block_id INTEGER;
  v_ended_at TIMESTAMPTZ;
BEGIN
  -- Stop the timer and calculate duration
  UPDATE axis6_activity_logs
  SET 
    ended_at = NOW(),
    duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
  WHERE id = p_activity_log_id 
    AND user_id = p_user_id
    AND ended_at IS NULL
  RETURNING duration_minutes, time_block_id, ended_at 
  INTO v_duration, v_time_block_id, v_ended_at;
  
  -- Update time block status if linked
  IF v_time_block_id IS NOT NULL THEN
    UPDATE axis6_time_blocks
    SET status = 'completed'
    WHERE id = v_time_block_id AND user_id = p_user_id;
  END IF;
  
  -- Return result as JSON
  RETURN json_build_object(
    'duration_minutes', v_duration,
    'ended_at', v_ended_at,
    'time_block_id', v_time_block_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure tables exist with proper structure
CREATE TABLE IF NOT EXISTS axis6_time_blocks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_id INTEGER,
  activity_name VARCHAR(255),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,
  status VARCHAR(20) DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS axis6_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id INTEGER,
  category_id UUID NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  time_block_id INTEGER REFERENCES axis6_time_blocks(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time_blocks
DROP POLICY IF EXISTS "Users can view own time blocks" ON axis6_time_blocks;
CREATE POLICY "Users can view own time blocks" ON axis6_time_blocks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own time blocks" ON axis6_time_blocks;
CREATE POLICY "Users can manage own time blocks" ON axis6_time_blocks
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for activity_logs
DROP POLICY IF EXISTS "Users can view own activity logs" ON axis6_activity_logs;
CREATE POLICY "Users can view own activity logs" ON axis6_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own activity logs" ON axis6_activity_logs;
CREATE POLICY "Users can manage own activity logs" ON axis6_activity_logs
  FOR ALL USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON axis6_time_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_active ON axis6_activity_logs(user_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_time_block ON axis6_activity_logs(time_block_id);