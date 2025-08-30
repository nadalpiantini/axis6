-- =====================================================
-- AXIS6 EMERGENCY FIX - ALL ISSUES
-- =====================================================
-- This script fixes ALL current issues:
-- 1. Sentry import errors (fixed in code)
-- 2. 404 errors for get_dashboard_data_optimized function
-- 3. 400 errors for axis6_profiles table queries
-- 4. Missing database functions and indexes
-- 
-- Execute this in Supabase SQL Editor: 
-- https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql
-- =====================================================

-- =====================================================
-- STEP 1: FIX TABLE STRUCTURES
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix axis6_profiles table structure
-- Ensure it has the correct columns that the application expects
DROP TABLE IF EXISTS axis6_profiles CASCADE;

CREATE TABLE axis6_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix axis6_categories table structure
DROP TABLE IF EXISTS axis6_categories CASCADE;

CREATE TABLE axis6_categories (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name JSONB NOT NULL, -- Multilingual support {"es": "Física", "en": "Physical"}
    description JSONB,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix axis6_checkins table structure
DROP TABLE IF EXISTS axis6_checkins CASCADE;

CREATE TABLE axis6_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id INTEGER REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
    completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, completed_at)
);

-- Fix axis6_streaks table structure
DROP TABLE IF EXISTS axis6_streaks CASCADE;

CREATE TABLE axis6_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id INTEGER REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_checkin DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- Fix axis6_daily_stats table structure
DROP TABLE IF EXISTS axis6_daily_stats CASCADE;

CREATE TABLE axis6_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    categories_completed INTEGER DEFAULT 0,
    total_mood INTEGER,
    completion_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =====================================================
-- STEP 2: INSERT DEFAULT DATA
-- =====================================================

-- Insert default categories
INSERT INTO axis6_categories (slug, name, description, color, icon, position) VALUES
('physical', '{"en": "Physical", "es": "Física"}', '{"en": "Physical health and fitness", "es": "Salud física y bienestar"}', '#FF6B6B', 'activity', 1),
('mental', '{"en": "Mental", "es": "Mental"}', '{"en": "Mental health and clarity", "es": "Salud mental y claridad"}', '#4ECDC4', 'brain', 2),
('social', '{"en": "Social", "es": "Social"}', '{"en": "Social connections and relationships", "es": "Conexiones sociales y relaciones"}', '#45B7D1', 'users', 3),
('spiritual', '{"en": "Spiritual", "es": "Espiritual"}', '{"en": "Spiritual growth and purpose", "es": "Crecimiento espiritual y propósito"}', '#96CEB4', 'heart', 4),
('financial', '{"en": "Financial", "es": "Financiero"}', '{"en": "Financial health and security", "es": "Salud financiera y seguridad"}', '#FFEAA7', 'dollar-sign', 5),
('professional', '{"en": "Professional", "es": "Profesional"}', '{"en": "Career growth and development", "es": "Crecimiento y desarrollo profesional"}', '#DDA0DD', 'briefcase', 6)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- STEP 3: CREATE MISSING FUNCTIONS
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_dashboard_data_optimized(UUID, DATE);
DROP FUNCTION IF EXISTS get_dashboard_data_optimized(UUID);
DROP FUNCTION IF EXISTS get_weekly_stats(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_recent_activity(UUID, INTEGER);

-- Create the main dashboard optimization function
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
    'email', email,
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
  )
  WHERE c.is_active = true;

  -- Combine results
  result := json_build_object(
    'user', user_data,
    'categories', categories_data
  );

  RETURN result;
END;
$$;

-- Create weekly stats function
CREATE OR REPLACE FUNCTION get_weekly_stats(
  p_user_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '7 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_checkins INT;
  perfect_days INT;
  completion_rate DECIMAL(5,2);
  max_possible_checkins INT := 6 * 7; -- 6 categories * 7 days
BEGIN
  -- Get total checkins for the week
  SELECT COUNT(*) INTO total_checkins
  FROM axis6_checkins
  WHERE user_id = p_user_id
    AND completed_at >= p_start_date
    AND completed_at <= p_end_date;

  -- Count perfect days (all 6 categories completed)
  SELECT COUNT(DISTINCT completed_at) INTO perfect_days
  FROM (
    SELECT completed_at, COUNT(*) as daily_checkins
    FROM axis6_checkins
    WHERE user_id = p_user_id
      AND completed_at >= p_start_date
      AND completed_at <= p_end_date
    GROUP BY completed_at
    HAVING COUNT(*) = 6
  ) perfect_days_data;

  -- Calculate completion rate
  completion_rate := (total_checkins::DECIMAL / max_possible_checkins) * 100;

  RETURN json_build_object(
    'totalCheckins', total_checkins,
    'perfectDays', perfect_days,
    'completionRate', completion_rate,
    'maxPossibleCheckins', max_possible_checkins
  );
END;
$$;

-- Create recent activity function
CREATE OR REPLACE FUNCTION get_recent_activity(
  p_user_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_data JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'date', date,
      'completionRate', completion_rate,
      'categoriesCompleted', categories_completed,
      'totalMood', total_mood
    ) ORDER BY date DESC
  ) INTO activity_data
  FROM axis6_daily_stats
  WHERE user_id = p_user_id
    AND date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    AND date <= CURRENT_DATE;

  RETURN activity_data;
END;
$$;

-- =====================================================
-- STEP 4: CREATE PERFORMANCE INDEXES
-- =====================================================

-- Create performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_user_date 
ON axis6_checkins(user_id, completed_at DESC)
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_axis6_streaks_user_category 
ON axis6_streaks(user_id, category_id, current_streak DESC);

CREATE INDEX IF NOT EXISTS idx_axis6_categories_position 
ON axis6_categories(position, id)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_user_date 
ON axis6_daily_stats(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_axis6_profiles_id 
ON axis6_profiles(id);

-- =====================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE axis6_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_daily_stats ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON axis6_profiles;
CREATE POLICY "Users can view own profile" ON axis6_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON axis6_profiles;
CREATE POLICY "Users can update own profile" ON axis6_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON axis6_profiles;
CREATE POLICY "Users can insert own profile" ON axis6_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies (read-only for all authenticated users)
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON axis6_categories;
CREATE POLICY "Categories are viewable by authenticated users" ON axis6_categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Checkins policies
DROP POLICY IF EXISTS "Users can view own checkins" ON axis6_checkins;
CREATE POLICY "Users can view own checkins" ON axis6_checkins
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own checkins" ON axis6_checkins;
CREATE POLICY "Users can insert own checkins" ON axis6_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own checkins" ON axis6_checkins;
CREATE POLICY "Users can update own checkins" ON axis6_checkins
    FOR UPDATE USING (auth.uid() = user_id);

-- Streaks policies
DROP POLICY IF EXISTS "Users can view own streaks" ON axis6_streaks;
CREATE POLICY "Users can view own streaks" ON axis6_streaks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own streaks" ON axis6_streaks;
CREATE POLICY "Users can insert own streaks" ON axis6_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own streaks" ON axis6_streaks;
CREATE POLICY "Users can update own streaks" ON axis6_streaks
    FOR UPDATE USING (auth.uid() = user_id);

-- Daily stats policies
DROP POLICY IF EXISTS "Users can view own daily stats" ON axis6_daily_stats;
CREATE POLICY "Users can view own daily stats" ON axis6_daily_stats
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily stats" ON axis6_daily_stats;
CREATE POLICY "Users can insert own daily stats" ON axis6_daily_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily stats" ON axis6_daily_stats;
CREATE POLICY "Users can update own daily stats" ON axis6_daily_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 7: GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_data_optimized(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_stats(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity(UUID, INTEGER) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON axis6_profiles TO authenticated;
GRANT SELECT ON axis6_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON axis6_checkins TO authenticated;
GRANT SELECT, INSERT, UPDATE ON axis6_streaks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON axis6_daily_stats TO authenticated;

-- =====================================================
-- STEP 8: ENABLE REALTIME
-- =====================================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_daily_stats;

-- =====================================================
-- STEP 9: VERIFICATION
-- =====================================================

-- Test the function (uncomment to test)
-- SELECT get_dashboard_data_optimized('00000000-0000-0000-0000-000000000001'::UUID);

-- Show function details
SELECT 
  proname as function_name,
  proargtypes::regtype[] as argument_types,
  prorettype::regtype as return_type
FROM pg_proc 
WHERE proname IN ('get_dashboard_data_optimized', 'get_weekly_stats', 'get_recent_activity');

-- Show tables
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'axis6_%'
ORDER BY table_name;

-- Show indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_axis6_%'
ORDER BY indexname;

-- Show RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename LIKE 'axis6_%'
ORDER BY tablename, policyname;
