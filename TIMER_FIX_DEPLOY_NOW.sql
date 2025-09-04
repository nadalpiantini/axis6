-- URGENT TIMER FIX: Deploy missing start_activity_timer and stop_activity_timer functions
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- This fixes the "Could not find the function public.start_activity_timer" error

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing functions if they have wrong signatures
DROP FUNCTION IF EXISTS start_activity_timer(UUID, INTEGER, INTEGER, VARCHAR(255), INTEGER);
DROP FUNCTION IF EXISTS start_activity_timer(UUID, UUID, INTEGER, VARCHAR(255), INTEGER);
DROP FUNCTION IF EXISTS stop_activity_timer(UUID, INTEGER);

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

-- Add updated_at triggers
CREATE TRIGGER update_time_blocks_updated_at
  BEFORE UPDATE ON axis6_time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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

-- Verify functions were created
SELECT 
  routine_name, 
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN ('start_activity_timer', 'stop_activity_timer', 'update_updated_at_column')
  AND routine_schema = 'public';

-- Verify tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name IN ('axis6_time_blocks', 'axis6_activity_logs')
  AND table_schema = 'public';
