-- URGENT: Copy and paste this SQL into Supabase Dashboard
-- Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- Paste this entire script and click "Run"

-- Fix 1: Create the corrected get_my_day_data function
CREATE OR REPLACE FUNCTION get_my_day_data(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  time_block_id INTEGER,
  category_id UUID,
  category_name TEXT,
  category_color TEXT,
  category_icon TEXT,
  activity_id INTEGER,
  activity_name TEXT,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status TEXT,
  notes TEXT,
  actual_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tb.id as time_block_id,
    tb.category_id,
    COALESCE((c.name->>'en'), (c.name->>'es'), 'Unknown') as category_name,
    c.color as category_color,
    c.icon as category_icon,
    tb.activity_id,
    tb.activity_name,
    tb.start_time,
    tb.end_time,
    tb.duration_minutes,
    tb.status,
    tb.notes,
    0 as actual_duration
  FROM axis6_time_blocks tb
  LEFT JOIN axis6_categories c ON c.id = tb.category_id
  WHERE tb.user_id = p_user_id 
  AND tb.date = p_date
  ORDER BY tb.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 2: Create the corrected calculate_daily_time_distribution function
CREATE OR REPLACE FUNCTION calculate_daily_time_distribution(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'category_id', c.id,
      'category_name', COALESCE(c.name->>'en', c.name->>'es', 'Unknown'),
      'category_color', c.color,
      'planned_minutes', COALESCE(planned.total_minutes, 0),
      'actual_minutes', 0,
      'percentage', 0
    )
  ) INTO result
  FROM axis6_categories c
  LEFT JOIN (
    SELECT 
      category_id,
      SUM(duration_minutes) as total_minutes
    FROM axis6_time_blocks
    WHERE user_id = p_user_id AND date = p_date
    GROUP BY category_id
  ) planned ON planned.category_id = c.id
  ORDER BY c.position;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix 3: Ensure axis6_axis_activities table exists with correct structure
CREATE TABLE IF NOT EXISTS axis6_axis_activities (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique activities per user and category
  UNIQUE(user_id, category_id, activity_name)
);

-- Create indexes for axis6_axis_activities
CREATE INDEX IF NOT EXISTS idx_axis_activities_user_id ON axis6_axis_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_axis_activities_category_id ON axis6_axis_activities(category_id);

-- Enable Row Level Security
ALTER TABLE axis6_axis_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for axis6_axis_activities
DROP POLICY IF EXISTS "Users can view own activities" ON axis6_axis_activities;
CREATE POLICY "Users can view own activities" ON axis6_axis_activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own activities" ON axis6_axis_activities;
CREATE POLICY "Users can create own activities" ON axis6_axis_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activities" ON axis6_axis_activities;
CREATE POLICY "Users can update own activities" ON axis6_axis_activities
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own activities" ON axis6_axis_activities;
CREATE POLICY "Users can delete own activities" ON axis6_axis_activities
  FOR DELETE USING (auth.uid() = user_id);

-- Fix 4: Ensure UNIQUE constraint exists on axis6_checkins for upsert operations
ALTER TABLE axis6_checkins 
ADD CONSTRAINT IF NOT EXISTS unique_user_category_date 
UNIQUE (user_id, category_id, completed_at);

-- Verification message
SELECT 'Database functions and constraints fixed successfully!' as status;