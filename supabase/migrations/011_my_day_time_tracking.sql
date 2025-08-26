-- My Day Time Tracking Feature
-- Tables for time blocking and activity time tracking

-- Enable btree_gist extension for EXCLUDE constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Time blocks for daily planning
CREATE TABLE IF NOT EXISTS axis6_time_blocks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES axis6_axis_activities(id) ON DELETE SET NULL,
  activity_name VARCHAR(255) NOT NULL, -- Store name in case activity is deleted
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure time blocks don't overlap for the same user on the same day
  CONSTRAINT no_overlapping_blocks EXCLUDE USING gist (
    user_id WITH =,
    date WITH =,
    tstzrange(
      date + start_time,
      date + end_time
    ) WITH &&
  ) WHERE (status != 'skipped')
);

-- Activity time logs for actual time tracking
CREATE TABLE IF NOT EXISTS axis6_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES axis6_axis_activities(id) ON DELETE SET NULL,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL, -- Store name in case activity is deleted
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  time_block_id INTEGER REFERENCES axis6_time_blocks(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily time summary for analytics
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

-- Create indexes for performance
CREATE INDEX idx_time_blocks_user_date ON axis6_time_blocks(user_id, date);
CREATE INDEX idx_time_blocks_status ON axis6_time_blocks(status) WHERE status = 'active';
CREATE INDEX idx_time_blocks_category ON axis6_time_blocks(category_id);
CREATE INDEX idx_activity_logs_user ON axis6_activity_logs(user_id);
CREATE INDEX idx_activity_logs_started ON axis6_activity_logs(started_at);
CREATE INDEX idx_activity_logs_active ON axis6_activity_logs(user_id, ended_at) WHERE ended_at IS NULL;
CREATE INDEX idx_daily_time_summary_user_date ON axis6_daily_time_summary(user_id, date);

-- Enable Row Level Security
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_daily_time_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_blocks
CREATE POLICY "Users can view own time blocks" ON axis6_time_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time blocks" ON axis6_time_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time blocks" ON axis6_time_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time blocks" ON axis6_time_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view own activity logs" ON axis6_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity logs" ON axis6_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity logs" ON axis6_activity_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity logs" ON axis6_activity_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for daily_time_summary
CREATE POLICY "Users can view own time summary" ON axis6_daily_time_summary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own time summary" ON axis6_daily_time_summary
  FOR ALL USING (auth.uid() = user_id);

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

-- Function to start an activity timer
CREATE OR REPLACE FUNCTION start_activity_timer(
  p_user_id UUID,
  p_activity_id INTEGER,
  p_category_id INTEGER,
  p_activity_name VARCHAR(255),
  p_time_block_id INTEGER DEFAULT NULL
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
  p_log_id INTEGER
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
  WHERE id = p_log_id 
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

-- Add updated_at triggers
CREATE TRIGGER update_time_blocks_updated_at
  BEFORE UPDATE ON axis6_time_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_logs_updated_at
  BEFORE UPDATE ON axis6_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_time_summary_updated_at
  BEFORE UPDATE ON axis6_daily_time_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();