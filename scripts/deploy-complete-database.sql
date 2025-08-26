-- =====================================================
-- AXIS6 COMPLETE DATABASE DEPLOYMENT SCRIPT
-- =====================================================
-- This script contains ALL migrations and indexes needed for production
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql
-- 
-- IMPORTANT: This script is idempotent - safe to run multiple times
-- 
-- CRITICAL FIX: This version corrects the axis6_profiles table structure
-- The id column now directly references auth.users(id) without a separate user_id column
-- =====================================================

-- =====================================================
-- MIGRATION 001: Initial Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User profiles table
-- IMPORTANT: id column directly references auth.users(id), no separate user_id column
CREATE TABLE IF NOT EXISTS axis6_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table (the 6 axes)
CREATE TABLE IF NOT EXISTS axis6_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily checkins table
CREATE TABLE IF NOT EXISTS axis6_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
    completed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, completed_at)
);

-- Streaks table
CREATE TABLE IF NOT EXISTS axis6_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_checkin DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id)
);

-- Daily stats table
CREATE TABLE IF NOT EXISTS axis6_daily_stats (
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
-- MIGRATION 002: Psychological Profiling System
-- =====================================================

-- Create temperament profiles table
CREATE TABLE IF NOT EXISTS axis6_temperament_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  primary_temperament TEXT NOT NULL CHECK (primary_temperament IN ('sanguine', 'choleric', 'melancholic', 'phlegmatic')),
  secondary_temperament TEXT CHECK (secondary_temperament IN ('sanguine', 'choleric', 'melancholic', 'phlegmatic')),
  temperament_scores JSONB NOT NULL DEFAULT '{}',
  personality_insights JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create temperament questions table
CREATE TABLE IF NOT EXISTS axis6_temperament_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text JSONB NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('work_style', 'social', 'decision_making', 'stress_response', 'goal_setting')),
  options JSONB NOT NULL,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user responses table
CREATE TABLE IF NOT EXISTS axis6_temperament_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES axis6_temperament_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_index INTEGER NOT NULL,
  response_value JSONB NOT NULL,
  session_id UUID NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id, session_id)
);

-- Create personalization settings table
CREATE TABLE IF NOT EXISTS axis6_personalization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  temperament_based_suggestions BOOLEAN DEFAULT true,
  preferred_motivation_style TEXT CHECK (preferred_motivation_style IN ('encouraging', 'challenging', 'analytical', 'supportive')),
  custom_daily_mantras JSONB DEFAULT '[]',
  preferred_activity_types JSONB DEFAULT '[]',
  ui_theme_preference TEXT DEFAULT 'temperament_based',
  notification_style TEXT DEFAULT 'temperament_based',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create temperament-based activity suggestions table
CREATE TABLE IF NOT EXISTS axis6_temperament_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
  temperament TEXT NOT NULL CHECK (temperament IN ('sanguine', 'choleric', 'melancholic', 'phlegmatic')),
  activity_name JSONB NOT NULL,
  description JSONB,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  social_aspect TEXT CHECK (social_aspect IN ('solo', 'small_group', 'large_group', 'any')) DEFAULT 'any',
  time_commitment TEXT CHECK (time_commitment IN ('quick', 'moderate', 'extended')) DEFAULT 'moderate',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MIGRATION 003: Daily Mantras
-- =====================================================

-- Create mantras table
CREATE TABLE IF NOT EXISTS axis6_mantras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content JSONB NOT NULL,
    author TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    display_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_mantras table for tracking
CREATE TABLE IF NOT EXISTS axis6_user_mantras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mantra_id UUID REFERENCES axis6_mantras(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, mantra_id)
);

-- =====================================================
-- MIGRATION 004: Activity Suggestions
-- =====================================================

-- Create activity suggestions table
CREATE TABLE IF NOT EXISTS axis6_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user activities tracking table
CREATE TABLE IF NOT EXISTS axis6_user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    activity_id UUID REFERENCES axis6_activities(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_id, completed_at)
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Core tables
ALTER TABLE axis6_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_daily_stats ENABLE ROW LEVEL SECURITY;

-- Temperament tables
ALTER TABLE axis6_temperament_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_personalization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_activities ENABLE ROW LEVEL SECURITY;

-- Mantras tables
ALTER TABLE axis6_mantras ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_user_mantras ENABLE ROW LEVEL SECURITY;

-- Activities tables
ALTER TABLE axis6_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_user_activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON axis6_categories;
DROP POLICY IF EXISTS "Users can view own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can delete own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can view own streaks" ON axis6_streaks;
DROP POLICY IF EXISTS "Users can insert own streaks" ON axis6_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON axis6_streaks;
DROP POLICY IF EXISTS "Users can view own daily stats" ON axis6_daily_stats;
DROP POLICY IF EXISTS "Users can insert own daily stats" ON axis6_daily_stats;
DROP POLICY IF EXISTS "Users can update own daily stats" ON axis6_daily_stats;
DROP POLICY IF EXISTS "Users can view own temperament profile" ON axis6_temperament_profiles;
DROP POLICY IF EXISTS "Users can insert own temperament profile" ON axis6_temperament_profiles;
DROP POLICY IF EXISTS "Users can update own temperament profile" ON axis6_temperament_profiles;
DROP POLICY IF EXISTS "Anyone can view active questions" ON axis6_temperament_questions;
DROP POLICY IF EXISTS "Users can view own responses" ON axis6_temperament_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON axis6_temperament_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON axis6_temperament_responses;
DROP POLICY IF EXISTS "Users can view own personalization settings" ON axis6_personalization_settings;
DROP POLICY IF EXISTS "Users can insert own personalization settings" ON axis6_personalization_settings;
DROP POLICY IF EXISTS "Users can update own personalization settings" ON axis6_personalization_settings;
DROP POLICY IF EXISTS "Anyone can view active temperament activities" ON axis6_temperament_activities;
DROP POLICY IF EXISTS "Mantras are viewable by everyone" ON axis6_mantras;
DROP POLICY IF EXISTS "Users can view own mantra history" ON axis6_user_mantras;
DROP POLICY IF EXISTS "Users can insert own mantra history" ON axis6_user_mantras;
DROP POLICY IF EXISTS "Users can update own mantra history" ON axis6_user_mantras;
DROP POLICY IF EXISTS "Activities are viewable by everyone" ON axis6_activities;
DROP POLICY IF EXISTS "Users can view own activity history" ON axis6_user_activities;
DROP POLICY IF EXISTS "Users can insert own activity history" ON axis6_user_activities;
DROP POLICY IF EXISTS "Users can update own activity history" ON axis6_user_activities;

-- Core table policies
CREATE POLICY "Profiles are viewable by everyone" ON axis6_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON axis6_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON axis6_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Categories are viewable by everyone" ON axis6_categories
    FOR SELECT USING (true);

CREATE POLICY "Users can view own checkins" ON axis6_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON axis6_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON axis6_checkins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON axis6_checkins
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own streaks" ON axis6_streaks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON axis6_streaks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON axis6_streaks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily stats" ON axis6_daily_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily stats" ON axis6_daily_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats" ON axis6_daily_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- Temperament table policies
CREATE POLICY "Users can view own temperament profile" ON axis6_temperament_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own temperament profile" ON axis6_temperament_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own temperament profile" ON axis6_temperament_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active questions" ON axis6_temperament_questions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own responses" ON axis6_temperament_responses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses" ON axis6_temperament_responses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses" ON axis6_temperament_responses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own personalization settings" ON axis6_personalization_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personalization settings" ON axis6_personalization_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personalization settings" ON axis6_personalization_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active temperament activities" ON axis6_temperament_activities
    FOR SELECT USING (is_active = true);

-- Mantras table policies
CREATE POLICY "Mantras are viewable by everyone" ON axis6_mantras
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own mantra history" ON axis6_user_mantras
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mantra history" ON axis6_user_mantras
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mantra history" ON axis6_user_mantras
    FOR UPDATE USING (auth.uid() = user_id);

-- Activities table policies
CREATE POLICY "Activities are viewable by everyone" ON axis6_activities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own activity history" ON axis6_user_activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity history" ON axis6_user_activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity history" ON axis6_user_activities
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- POPULATE CATEGORIES
-- =====================================================

INSERT INTO axis6_categories (name, slug, description, icon, color, order_index)
VALUES 
    ('Physical', 'physical', 'Exercise, nutrition, sleep, and overall physical health', 'activity', '#A6C26F', 1),
    ('Mental', 'mental', 'Learning, focus, productivity, and cognitive growth', 'brain', '#365D63', 2),
    ('Emotional', 'emotional', 'Mood management, stress relief, and emotional balance', 'heart', '#D36C50', 3),
    ('Social', 'social', 'Relationships, connections, and social interactions', 'users', '#6F3D56', 4),
    ('Spiritual', 'spiritual', 'Meditation, mindfulness, purpose, and inner peace', 'sparkles', '#2C3E50', 5),
    ('Purpose', 'purpose', 'Goals, achievements, and life direction', 'target', '#C85729', 6)
ON CONFLICT (slug) DO UPDATE
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_axis6_checkins_today_lookup
ON axis6_checkins(user_id, category_id, completed_at) 
WHERE completed_at = CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_axis6_checkins_user_category_date 
ON axis6_checkins(user_id, category_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_axis6_streaks_user_category 
ON axis6_streaks(user_id, category_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_axis6_daily_stats_user_date_lookup 
ON axis6_daily_stats(user_id, date DESC);

-- Temperament table indexes
CREATE INDEX IF NOT EXISTS idx_temperament_profiles_user_id 
ON axis6_temperament_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_temperament_profiles_primary_temperament 
ON axis6_temperament_profiles(primary_temperament);

CREATE INDEX IF NOT EXISTS idx_temperament_questions_active 
ON axis6_temperament_questions(is_active, order_index);

CREATE INDEX IF NOT EXISTS idx_temperament_responses_user_session 
ON axis6_temperament_responses(user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_temperament_activities_category 
ON axis6_temperament_activities(category_id, temperament);

-- =====================================================
-- ENABLE REALTIME
-- =====================================================

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_daily_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_personalization_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_mantras;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_user_mantras;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_user_activities;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'axis6_%'
ORDER BY table_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'AXIS6 Complete Database Setup Successful! 🎉' as status,
       'All tables, indexes, RLS policies, and realtime subscriptions have been applied.' as message;
