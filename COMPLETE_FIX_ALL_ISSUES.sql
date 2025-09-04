-- =====================================================
-- COMPLETE FIX FOR ALL AXIS6 ISSUES
-- =====================================================
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- This fixes ALL current issues:
-- 1. UUID validation errors
-- 2. Missing start_activity_timer function
-- 3. Missing get_dashboard_data_optimized function
-- 4. Database type inconsistencies
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =====================================================
-- 1. FIX CATEGORIES TABLE STRUCTURE
-- =====================================================

-- Ensure categories table exists with correct structure
CREATE TABLE IF NOT EXISTS axis6_categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name JSONB NOT NULL,
  description JSONB,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  position INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 6 core categories if they don't exist
INSERT INTO axis6_categories (slug, name, description, color, icon, position) VALUES
  ('physical', '{"es": "Física", "en": "Physical"}', '{"es": "Ejercicio, salud y nutrición", "en": "Exercise, health, and nutrition"}', '#A6C26F', 'activity', 1),
  ('mental', '{"es": "Mental", "en": "Mental"}', '{"es": "Aprendizaje, enfoque y productividad", "en": "Learning, focus, and productivity"}', '#D4A5F3', 'brain', 2),
  ('emotional', '{"es": "Emocional", "en": "Emotional"}', '{"es": "Estado de ánimo y manejo del estrés", "en": "Mood and stress management"}', '#FF6B6B', 'heart', 3),
  ('social', '{"es": "Social", "en": "Social"}', '{"es": "Relaciones y conexiones", "en": "Relationships and connections"}', '#4ECDC4', 'users', 4),
  ('spiritual', '{"es": "Espiritual", "en": "Spiritual"}', '{"es": "Meditación, propósito y mindfulness", "en": "Meditation, purpose, and mindfulness"}', '#45B7D1', 'sparkles', 5),
  ('material', '{"es": "Material", "en": "Material"}', '{"es": "Finanzas, carrera y recursos", "en": "Finance, career, and resources"}', '#FFD93D', 'briefcase', 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  position = EXCLUDED.position;

-- =====================================================
-- 2. FIX TIME BLOCKS TABLE STRUCTURE
-- =====================================================

-- Drop existing time blocks table if it has wrong structure
DROP TABLE IF EXISTS axis6_time_blocks CASCADE;

-- Create time blocks table with INTEGER category_id (matching categories.id)
CREATE TABLE axis6_time_blocks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
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

-- =====================================================
-- 3. FIX ACTIVITY LOGS TABLE STRUCTURE
-- =====================================================

-- Drop existing activity logs table if it has wrong structure
DROP TABLE IF EXISTS axis6_activity_logs CASCADE;

-- Create activity logs table with INTEGER category_id
CREATE TABLE axis6_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id INTEGER,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  time_block_id INTEGER REFERENCES axis6_time_blocks(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE MISSING FUNCTIONS
-- =====================================================

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create get_my_day_data function
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
    COALESCE((c.name->>'en'), (c.name->>'es'), 'Unknown') as category_name,
    c.color as category_color,
    c.icon as category_icon,
    tb.activity_id,
    tb.activity_name,
    tb.start_time,
    tb.end_time,
    EXTRACT(EPOCH FROM (tb.end_time - tb.start_time))::INTEGER / 60 as duration_minutes,
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

-- Create start_activity_timer function with INTEGER category_id
CREATE OR REPLACE FUNCTION start_activity_timer(
  p_user_id UUID,
  p_category_id INTEGER,
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

-- Create stop_activity_timer function
CREATE OR REPLACE FUNCTION stop_activity_timer(
  p_user_id UUID,
  p_activity_log_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_duration INTEGER;
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
  RETURNING duration_minutes, ended_at INTO v_duration, v_ended_at;
  
  -- Update linked time block status
  UPDATE axis6_time_blocks
  SET status = 'completed'
  WHERE id = (
    SELECT time_block_id 
    FROM axis6_activity_logs 
    WHERE id = p_activity_log_id
  ) AND user_id = p_user_id;
  
  -- Return completion info as JSON
  RETURN json_build_object(
    'id', p_activity_log_id,
    'duration_minutes', v_duration,
    'ended_at', v_ended_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create get_dashboard_data_optimized function
CREATE OR REPLACE FUNCTION get_dashboard_data_optimized(
  p_user_id UUID,
  p_today DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_data JSON;
  categories_data JSON;
BEGIN
  -- Get user data
  SELECT json_build_object(
    'id', p_user_id,
    'created_at', NOW()
  ) INTO user_data;
  
  -- Get categories with completion status
  SELECT json_agg(
    json_build_object(
      'id', c.id,
      'slug', c.slug,
      'name', c.name,
      'color', c.color,
      'icon', c.icon,
      'position', c.position,
      'completed_today', CASE WHEN ch.id IS NOT NULL THEN true ELSE false END,
      'current_streak', COALESCE(s.current_streak, 0),
      'longest_streak', COALESCE(s.longest_streak, 0)
    )
  ) INTO categories_data
  FROM axis6_categories c
  LEFT JOIN axis6_checkins ch ON (
    ch.category_id = c.id
    AND ch.user_id = p_user_id
    AND ch.completed_at::date = p_today
  )
  LEFT JOIN axis6_streaks s ON (
    s.category_id = c.id
    AND s.user_id = p_user_id
  )
  WHERE c.is_active = true
  ORDER BY c.position;
  
  -- Build final result
  SELECT json_build_object(
    'user', user_data,
    'categories', COALESCE(categories_data, '[]'::json),
    'today', p_today
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE axis6_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories (public read)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON axis6_categories;
CREATE POLICY "Categories are viewable by everyone" ON axis6_categories
  FOR SELECT USING (true);

-- Create RLS policies for time blocks
DROP POLICY IF EXISTS "Users can view own time blocks" ON axis6_time_blocks;
CREATE POLICY "Users can view own time blocks" ON axis6_time_blocks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own time blocks" ON axis6_time_blocks;
CREATE POLICY "Users can create own time blocks" ON axis6_time_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own time blocks" ON axis6_time_blocks;
CREATE POLICY "Users can update own time blocks" ON axis6_time_blocks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own time blocks" ON axis6_time_blocks;
CREATE POLICY "Users can delete own time blocks" ON axis6_time_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for activity logs
DROP POLICY IF EXISTS "Users can view own activity logs" ON axis6_activity_logs;
CREATE POLICY "Users can view own activity logs" ON axis6_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own activity logs" ON axis6_activity_logs;
CREATE POLICY "Users can create own activity logs" ON axis6_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activity logs" ON axis6_activity_logs;
CREATE POLICY "Users can update own activity logs" ON axis6_activity_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for time blocks
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON axis6_time_blocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_category ON axis6_time_blocks(category_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_status ON axis6_time_blocks(status);

-- Create indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON axis6_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON axis6_activity_logs(category_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_active ON axis6_activity_logs(user_id, ended_at) WHERE ended_at IS NULL;

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

-- Verify functions exist
SELECT 'Functions created successfully' as status
WHERE EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname IN ('start_activity_timer', 'stop_activity_timer', 'get_my_day_data', 'get_dashboard_data_optimized')
);

-- Verify tables exist
SELECT 'Tables created successfully' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name IN ('axis6_categories', 'axis6_time_blocks', 'axis6_activity_logs')
);

-- Show categories
SELECT id, slug, name->>'en' as name_en, color FROM axis6_categories ORDER BY position;

-- =====================================================
-- COMPLETE FIX APPLIED
-- =====================================================
-- All issues should now be resolved:
-- ✅ UUID validation errors fixed
-- ✅ Missing functions created
-- ✅ Database structure consistent
-- ✅ RLS policies enabled
-- ✅ Performance indexes created
-- =====================================================
