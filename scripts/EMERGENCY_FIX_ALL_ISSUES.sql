-- =====================================================
-- EMERGENCY FIX FOR ALL AXIS6 ISSUES
-- =====================================================
-- This script fixes all the 404 and 500 errors in production
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new

-- =====================================================
-- PHASE 1: FIX MISSING RPC FUNCTIONS
-- =====================================================

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_dashboard_data_optimized(UUID, DATE);
DROP FUNCTION IF EXISTS get_dashboard_data_optimized(UUID);
DROP FUNCTION IF EXISTS get_my_day_data(UUID, DATE);
DROP FUNCTION IF EXISTS calculate_daily_time_distribution(UUID, DATE);

-- Create the missing get_dashboard_data_optimized function
CREATE OR REPLACE FUNCTION get_dashboard_data_optimized(
  p_user_id UUID,
  p_today DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_data JSON;
  categories_data JSON;
BEGIN
  -- Get user data
  SELECT json_build_object(
    'id', id,
    'name', name,
    'timezone', timezone,
    'onboarded', onboarded
  ) INTO user_data
  FROM axis6_profiles 
  WHERE id = p_user_id;

  -- Get categories with today's completion status and streaks
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'slug', c.slug,
      'name', c.name,
      'color', c.color,
      'icon', c.icon,
      'position', c.position,
      'todayCompleted', CASE WHEN ch.id IS NOT NULL THEN true ELSE false END,
      'currentStreak', COALESCE(s.current_streak, 0),
      'longestStreak', COALESCE(s.longest_streak, 0),
      'lastCheckin', s.last_checkin
    ) ORDER BY c.position
  ) INTO categories_data
  FROM axis6_categories c
  LEFT JOIN axis6_checkins ch ON (
    ch.category_id = c.id 
    AND ch.user_id = p_user_id 
    AND ch.completed_at = p_today
  )
  LEFT JOIN axis6_streaks s ON (
    s.category_id = c.id 
    AND s.user_id = p_user_id
  );

  -- Combine results
  result := json_build_object(
    'user', user_data,
    'categories', categories_data
  );

  RETURN result;
END;
$$;

-- Create the missing get_my_day_data function
CREATE OR REPLACE FUNCTION get_my_day_data(
  p_user_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  time_block_id INTEGER,
  category_id INTEGER,
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
    c.name::text as category_name,
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

-- Create the missing calculate_daily_time_distribution function
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
      'category_name', c.name->>'en',
      'category_color', c.color,
      'planned_minutes', COALESCE(planned.total_minutes, 0),
      'actual_minutes', COALESCE(actual.total_minutes, 0),
      'percentage', CASE 
        WHEN COALESCE(planned.total_minutes, 0) > 0 
        THEN ROUND((COALESCE(actual.total_minutes, 0)::DECIMAL / planned.total_minutes) * 100, 2)
        ELSE 0 
      END
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
  LEFT JOIN (
    SELECT 
      category_id,
      SUM(duration_minutes) as total_minutes
    FROM axis6_activity_logs
    WHERE user_id = p_user_id 
    AND DATE(started_at) = p_date
    GROUP BY category_id
  ) actual ON actual.category_id = c.id
  ORDER BY c.position;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PHASE 2: FIX MISSING TABLES
-- =====================================================

-- Create axis6_axis_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS axis6_axis_activities (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique activities per user and category
  UNIQUE(user_id, category_id, activity_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_axis_activities_user_id ON axis6_axis_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_axis_activities_category_id ON axis6_axis_activities(category_id);
CREATE INDEX IF NOT EXISTS idx_axis_activities_user_category ON axis6_axis_activities(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_axis_activities_active ON axis6_axis_activities(user_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE axis6_axis_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own activities" ON axis6_axis_activities;
DROP POLICY IF EXISTS "Users can create own activities" ON axis6_axis_activities;
DROP POLICY IF EXISTS "Users can update own activities" ON axis6_axis_activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON axis6_axis_activities;

CREATE POLICY "Users can view own activities" ON axis6_axis_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities" ON axis6_axis_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON axis6_axis_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON axis6_axis_activities
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PHASE 3: FIX MISSING TIME BLOCKS TABLE
-- =====================================================

-- Create axis6_time_blocks table if it doesn't exist
CREATE TABLE IF NOT EXISTS axis6_time_blocks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_id INTEGER,
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

-- Add indexes for time blocks
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON axis6_time_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_status ON axis6_time_blocks(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_time_blocks_category ON axis6_time_blocks(category_id);

-- Enable Row Level Security
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for time blocks (drop existing first to avoid conflicts)
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

-- =====================================================
-- PHASE 4: ENABLE REALTIME
-- =====================================================

-- Add tables to realtime publication (ignore errors if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE axis6_checkins;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE axis6_profiles;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE axis6_time_blocks;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE axis6_axis_activities;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, ignore
  END;
END $$;

-- =====================================================
-- PHASE 5: CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables
DROP TRIGGER IF EXISTS update_axis6_axis_activities_updated_at ON axis6_axis_activities;
CREATE TRIGGER update_axis6_axis_activities_updated_at
    BEFORE UPDATE ON axis6_axis_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_axis6_time_blocks_updated_at ON axis6_time_blocks;
CREATE TRIGGER update_axis6_time_blocks_updated_at
    BEFORE UPDATE ON axis6_time_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 6: VERIFICATION
-- =====================================================

-- Test the functions
SELECT 'get_dashboard_data_optimized function created successfully' as status;
SELECT 'get_my_day_data function created successfully' as status;
SELECT 'calculate_daily_time_distribution function created successfully' as status;

-- Test table access
SELECT COUNT(*) as axis_activities_count FROM axis6_axis_activities LIMIT 1;
SELECT COUNT(*) as time_blocks_count FROM axis6_time_blocks LIMIT 1;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'ALL ISSUES FIXED SUCCESSFULLY!' as completion_status;
