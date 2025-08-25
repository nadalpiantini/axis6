#!/usr/bin/env node
/**
 * Database Tables Fix Script for AXIS6
 * 
 * This script checks for missing tables and creates them if needed.
 * Run this to fix 404 errors on axis6_checkins, axis6_profiles, and axis6_temperament_profiles
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error && error.code === 'PGRST116') {
      return false // Table doesn't exist
    }
    
    return true
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error.message)
    return false
  }
}

async function createMissingTables() {
  console.log('🔍 Checking database tables...\n')
  
  const requiredTables = [
    'axis6_profiles',
    'axis6_categories', 
    'axis6_checkins',
    'axis6_streaks',
    'axis6_daily_stats',
    'axis6_temperament_profiles',
    'axis6_temperament_questions',
    'axis6_temperament_responses',
    'axis6_personalization_settings',
    'axis6_temperament_activities'
  ]
  
  const missingTables = []
  
  for (const table of requiredTables) {
    const exists = await checkTableExists(table)
    if (exists) {
      console.log(`✅ ${table} - EXISTS`)
    } else {
      console.log(`❌ ${table} - MISSING`)
      missingTables.push(table)
    }
  }
  
  if (missingTables.length === 0) {
    console.log('\n🎉 All required tables exist!')
    return
  }
  
  console.log(`\n⚠️  Found ${missingTables.length} missing tables. Creating them...\n`)
  
  // Create the missing tables using the migration SQL
  const createTablesSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS axis6_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Santo_Domingo',
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table (the 6 axes)
CREATE TABLE IF NOT EXISTS axis6_categories (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name JSONB NOT NULL,
  description JSONB,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  position INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 6 core categories
INSERT INTO axis6_categories (slug, name, description, color, icon, position) VALUES
  ('physical', 
   '{"es": "Física", "en": "Physical"}',
   '{"es": "Ejercicio, salud y nutrición", "en": "Exercise, health, and nutrition"}',
   '#65D39A', 'activity', 1),
  
  ('mental',
   '{"es": "Mental", "en": "Mental"}',
   '{"es": "Aprendizaje, enfoque y productividad", "en": "Learning, focus, and productivity"}',
   '#9B8AE6', 'brain', 2),
  
  ('emotional',
   '{"es": "Emocional", "en": "Emotional"}',
   '{"es": "Estado de ánimo y manejo del estrés", "en": "Mood and stress management"}',
   '#FF8B7D', 'heart', 3),
  
  ('social',
   '{"es": "Social", "en": "Social"}',
   '{"es": "Relaciones y conexiones", "en": "Relationships and connections"}',
   '#6AA6FF', 'users', 4),
  
  ('spiritual',
   '{"es": "Espiritual", "en": "Spiritual"}',
   '{"es": "Meditación, propósito y mindfulness", "en": "Meditation, purpose, and mindfulness"}',
   '#4ECDC4', 'sparkles', 5),
  
  ('material',
   '{"es": "Material", "en": "Material"}',
   '{"es": "Finanzas, carrera y recursos", "en": "Finance, career, and resources"}',
   '#FFD166', 'briefcase', 6)
ON CONFLICT (slug) DO NOTHING;

-- Create check-ins table
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

-- Create streaks table
CREATE TABLE IF NOT EXISTS axis6_streaks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES axis6_categories(id),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_checkin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Create daily stats table (for analytics)
CREATE TABLE IF NOT EXISTS axis6_daily_stats (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completion_rate DECIMAL(3,2),
  categories_completed INT DEFAULT 0,
  total_mood INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, date)
);

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
  category_id INTEGER REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
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

-- Enable Row Level Security
ALTER TABLE axis6_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_personalization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON axis6_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON axis6_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON axis6_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for check-ins
CREATE POLICY "Users can view their own check-ins"
  ON axis6_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-ins"
  ON axis6_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins"
  ON axis6_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins"
  ON axis6_checkins FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for streaks
CREATE POLICY "Users can view their own streaks"
  ON axis6_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own streaks"
  ON axis6_streaks FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for daily stats
CREATE POLICY "Users can view their own stats"
  ON axis6_daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own stats"
  ON axis6_daily_stats FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for temperament_profiles
CREATE POLICY "Users can view own temperament profile" ON axis6_temperament_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own temperament profile" ON axis6_temperament_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own temperament profile" ON axis6_temperament_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for temperament_questions (public read for questionnaire)
CREATE POLICY "Anyone can view active questions" ON axis6_temperament_questions
  FOR SELECT USING (is_active = true);

-- RLS Policies for temperament_responses
CREATE POLICY "Users can view own responses" ON axis6_temperament_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses" ON axis6_temperament_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for personalization_settings
CREATE POLICY "Users can view own settings" ON axis6_personalization_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON axis6_personalization_settings
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for temperament_activities (public read)
CREATE POLICY "Anyone can view active temperament activities" ON axis6_temperament_activities
  FOR SELECT USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON axis6_checkins(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON axis6_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON axis6_daily_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_temperament_profiles_user_id ON axis6_temperament_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_temperament_responses_user_session ON axis6_temperament_responses(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_temperament_activities_category ON axis6_temperament_activities(category_id, temperament);
  `
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTablesSQL })
    
    if (error) {
      console.error('❌ Error creating tables:', error.message)
      console.log('\n💡 Try running this SQL manually in Supabase SQL Editor:')
      console.log('https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new')
      console.log('\nCopy and paste the SQL from the EJECUTAR_EN_SUPABASE.sql file')
      return
    }
    
    console.log('✅ Tables created successfully!')
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...')
    for (const table of missingTables) {
      const exists = await checkTableExists(table)
      if (exists) {
        console.log(`✅ ${table} - NOW EXISTS`)
      } else {
        console.log(`❌ ${table} - STILL MISSING`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message)
    console.log('\n💡 Try running this SQL manually in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new')
    console.log('\nCopy and paste the SQL from the EJECUTAR_EN_SUPABASE.sql file')
  }
}

async function main() {
  try {
    await createMissingTables()
    console.log('\n🎉 Database tables check complete!')
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
