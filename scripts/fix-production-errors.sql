-- AXIS6 Production Error Fix Script
-- Execute this in the Supabase SQL Editor to fix all current production issues

-- 1. Ensure axis6_checkins table exists (it should be in initial schema but let's make sure)
CREATE TABLE IF NOT EXISTS axis6_checkins (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES axis6_categories(id),
  completed_at DATE NOT NULL,
  notes TEXT,
  mood INT CHECK (mood BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, completed_at)
);

-- 2. Ensure axis6_time_blocks table exists
CREATE TABLE IF NOT EXISTS axis6_time_blocks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES axis6_axis_activities(id) ON DELETE SET NULL,
  activity_name VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure axis6_activity_logs table exists
CREATE TABLE IF NOT EXISTS axis6_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES axis6_axis_activities(id) ON DELETE SET NULL,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  time_block_id INTEGER REFERENCES axis6_time_blocks(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security on all tables
ALTER TABLE axis6_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_activity_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for checkins
DROP POLICY IF EXISTS "Users can view their own check-ins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can create their own check-ins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can update their own check-ins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can delete their own check-ins" ON axis6_checkins;

CREATE POLICY "Users can view their own check-ins" ON axis6_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-ins" ON axis6_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins" ON axis6_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins" ON axis6_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for time_blocks
DROP POLICY IF EXISTS "Users can view own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can create own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can update own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can delete own time blocks" ON axis6_time_blocks;

CREATE POLICY "Users can view own time blocks" ON axis6_time_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time blocks" ON axis6_time_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time blocks" ON axis6_time_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time blocks" ON axis6_time_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS policies for activity_logs
DROP POLICY IF EXISTS "Users can view own activity logs" ON axis6_activity_logs;
DROP POLICY IF EXISTS "Users can create own activity logs" ON axis6_activity_logs;
DROP POLICY IF EXISTS "Users can update own activity logs" ON axis6_activity_logs;
DROP POLICY IF EXISTS "Users can delete own activity logs" ON axis6_activity_logs;

CREATE POLICY "Users can view own activity logs" ON axis6_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity logs" ON axis6_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity logs" ON axis6_activity_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity logs" ON axis6_activity_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Create missing functions
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

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_my_day_data(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_daily_time_distribution(UUID, DATE) TO authenticated;

-- 10. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON axis6_checkins(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_checkins_today ON axis6_checkins(user_id) WHERE completed_at >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON axis6_time_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON axis6_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_started ON axis6_activity_logs(started_at);

-- 11. Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_time_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_activity_logs;

-- 12. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_axis6_checkins_updated_at ON axis6_checkins;
DROP TRIGGER IF EXISTS update_time_blocks_updated_at ON axis6_time_blocks;
DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON axis6_activity_logs;

CREATE TRIGGER update_axis6_checkins_updated_at 
  BEFORE UPDATE ON axis6_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_blocks_updated_at
  BEFORE UPDATE ON axis6_time_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_logs_updated_at
  BEFORE UPDATE ON axis6_activity_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Test the functions (optional - remove these lines after testing)
-- SELECT * FROM get_my_day_data('00000000-0000-0000-0000-000000000000'::UUID, '2025-01-26'::DATE);
-- SELECT * FROM calculate_daily_time_distribution('00000000-0000-0000-0000-000000000000'::UUID, '2025-01-26'::DATE);

-- 14. Verify tables exist
SELECT 
  table_name,
  CASE WHEN table_name IN ('axis6_checkins', 'axis6_time_blocks', 'axis6_activity_logs') 
       THEN '✅ EXISTS' 
       ELSE '❌ MISSING' 
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('axis6_checkins', 'axis6_time_blocks', 'axis6_activity_logs');
