-- EMERGENCY FIX: My Day Time Tracking Functions
-- Deploy missing RPC functions for My Day functionality
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to get today's time blocks with activities (FIXED VERSION)
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

-- Function to start an activity timer
CREATE OR REPLACE FUNCTION start_activity_timer(
  p_user_id UUID,
  p_category_id INTEGER,
  p_time_block_id INTEGER,
  p_activity_name VARCHAR(255),
  p_activity_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_log_id INTEGER;
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
  RETURNING id INTO v_log_id;
  
  -- Update time block status if linked
  IF p_time_block_id IS NOT NULL THEN
    UPDATE axis6_time_blocks
    SET status = 'active'
    WHERE id = p_time_block_id AND user_id = p_user_id;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to stop an activity timer
CREATE OR REPLACE FUNCTION stop_activity_timer(
  p_user_id UUID,
  p_activity_log_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_duration INTEGER;
  v_time_block_id INTEGER;
BEGIN
  -- Stop the timer and calculate duration
  UPDATE axis6_activity_logs
  SET 
    ended_at = NOW(),
    duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
  WHERE id = p_activity_log_id 
    AND user_id = p_user_id
    AND ended_at IS NULL
  RETURNING duration_minutes, time_block_id INTO v_duration, v_time_block_id;
  
  -- Update time block status if linked
  IF v_time_block_id IS NOT NULL THEN
    UPDATE axis6_time_blocks
    SET status = 'completed'
    WHERE id = v_time_block_id AND user_id = p_user_id;
  END IF;
  
  RETURN v_duration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing daily time summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS axis6_daily_time_summary (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  planned_minutes INTEGER DEFAULT 0,
  actual_minutes INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, date, category_id)
);

-- Enable RLS on missing table
ALTER TABLE axis6_daily_time_summary ENABLE ROW LEVEL SECURITY;

-- Create missing RLS policies
CREATE POLICY "Users can view own time summary" ON axis6_daily_time_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own time summary" ON axis6_daily_time_summary
  FOR ALL USING (auth.uid() = user_id);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_daily_time_summary_user_date ON axis6_daily_time_summary(user_id, date);

-- Add missing triggers
CREATE TRIGGER IF NOT EXISTS update_daily_time_summary_updated_at
  BEFORE UPDATE ON axis6_daily_time_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();