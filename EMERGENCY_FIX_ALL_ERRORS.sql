-- EMERGENCY FIX FOR ALL CURRENT ERRORS
-- Apply this in Supabase SQL Editor

-- 1. Create the missing get_my_day_data function
DROP FUNCTION IF EXISTS get_my_day_data(UUID, DATE);

CREATE OR REPLACE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  time_block_id INTEGER,
  category_id UUID,
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

GRANT EXECUTE ON FUNCTION get_my_day_data(UUID, DATE) TO authenticated;

-- 2. Ensure axis6_axis_activities table exists with correct structure
CREATE TABLE IF NOT EXISTS axis6_axis_activities (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id INTEGER REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_axis_activities_user_id ON axis6_axis_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_axis_activities_category_id ON axis6_axis_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_axis_activities_user_category ON axis6_axis_activities(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_axis_activities_active ON axis6_axis_activities(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE axis6_axis_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own activities" ON axis6_axis_activities;
DROP POLICY IF EXISTS "Users can create own activities" ON axis6_axis_activities;
DROP POLICY IF EXISTS "Users can update own activities" ON axis6_axis_activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON axis6_axis_activities;

-- Create RLS policies
CREATE POLICY "Users can view own activities" ON axis6_axis_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities" ON axis6_axis_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON axis6_axis_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON axis6_axis_activities
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Ensure time_blocks table has correct structure
CREATE TABLE IF NOT EXISTS axis6_time_blocks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  category_id UUID REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
  activity_id INTEGER REFERENCES axis6_axis_activities(id) ON DELETE SET NULL,
  activity_name VARCHAR(255),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for time_blocks
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON axis6_time_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_category ON axis6_time_blocks(category_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_activity ON axis6_time_blocks(activity_id);

-- Enable RLS for time_blocks
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can create own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can update own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can delete own time blocks" ON axis6_time_blocks;

-- Create RLS policies for time_blocks
CREATE POLICY "Users can view own time blocks" ON axis6_time_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time blocks" ON axis6_time_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time blocks" ON axis6_time_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time blocks" ON axis6_time_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Ensure categories table exists
CREATE TABLE IF NOT EXISTS axis6_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name JSONB NOT NULL DEFAULT '{"en": "Uncategorized"}'::jsonb,
  color VARCHAR(7) DEFAULT '#6b7280',
  icon VARCHAR(50) DEFAULT 'circle',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories if they don't exist
INSERT INTO axis6_categories (id, name, color, icon) VALUES
  ('00000000-0000-0000-0000-000000000001', '{"en": "Work"}', '#3b82f6', 'briefcase'),
  ('00000000-0000-0000-0000-000000000002', '{"en": "Personal"}', '#10b981', 'heart'),
  ('00000000-0000-0000-0000-000000000003', '{"en": "Health"}', '#ef4444', 'activity'),
  ('00000000-0000-0000-0000-000000000004', '{"en": "Learning"}', '#f59e0b', 'book'),
  ('00000000-0000-0000-0000-000000000005', '{"en": "Social"}', '#8b5cf6', 'users'),
  ('00000000-0000-0000-0000-000000000006', '{"en": "Rest"}', '#6b7280', 'moon')
ON CONFLICT (id) DO NOTHING;

-- 5. Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_axis_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_time_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_categories;

-- 6. Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Add updated_at triggers
DROP TRIGGER IF EXISTS update_axis6_axis_activities_updated_at ON axis6_axis_activities;
CREATE TRIGGER update_axis6_axis_activities_updated_at
  BEFORE UPDATE ON axis6_axis_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_axis6_time_blocks_updated_at ON axis6_time_blocks;
CREATE TRIGGER update_axis6_time_blocks_updated_at
  BEFORE UPDATE ON axis6_time_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_axis6_categories_updated_at ON axis6_categories;
CREATE TRIGGER update_axis6_categories_updated_at
  BEFORE UPDATE ON axis6_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Verify everything is working
SELECT 'get_my_day_data function created successfully' as status;

-- Test the function
SELECT COUNT(*) as categories_count FROM axis6_categories;
SELECT COUNT(*) as activities_count FROM axis6_axis_activities;
SELECT COUNT(*) as time_blocks_count FROM axis6_time_blocks;

-- Show function exists
SELECT proname, proargnames, proargtypes 
FROM pg_proc 
WHERE proname = 'get_my_day_data';
