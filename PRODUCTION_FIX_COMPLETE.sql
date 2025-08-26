-- =====================================================
-- AXIS6 PRODUCTION EMERGENCY FIX
-- =====================================================
-- Execute this ENTIRE file in Supabase Dashboard:
-- https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- =====================================================

BEGIN;

-- Step 1: Fix the checkins table schema (change DATE to TIMESTAMPTZ)
-- First check if we need to alter the existing table
DO $$
BEGIN
  -- Check if completed_at is DATE type (needs to be changed to TIMESTAMPTZ)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'axis6_checkins' 
    AND column_name = 'completed_at' 
    AND data_type = 'date'
  ) THEN
    -- Change DATE to TIMESTAMPTZ to match the code expectations
    ALTER TABLE axis6_checkins 
    ALTER COLUMN completed_at TYPE TIMESTAMPTZ 
    USING completed_at::TIMESTAMPTZ;
    
    RAISE NOTICE 'Fixed axis6_checkins.completed_at column type';
  END IF;
END $$;

-- Step 2: Create missing temperament tables (from 20241225000000_psychological_profiling_system.sql)

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

-- Create temperament activities table
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

-- Step 3: Enable Row Level Security
ALTER TABLE axis6_temperament_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_personalization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_activities ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies
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

CREATE POLICY "Users can view own settings" ON axis6_personalization_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON axis6_personalization_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active temperament activities" ON axis6_temperament_activities
  FOR SELECT USING (is_active = true);

-- Step 5: Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_temperament_profiles_user_id ON axis6_temperament_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_temperament_profiles_primary_temperament ON axis6_temperament_profiles(primary_temperament);
CREATE INDEX IF NOT EXISTS idx_temperament_questions_active ON axis6_temperament_questions(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_temperament_responses_user_session ON axis6_temperament_responses(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_temperament_activities_category ON axis6_temperament_activities(category_id, temperament);
CREATE INDEX IF NOT EXISTS idx_personalization_settings_user ON axis6_personalization_settings(user_id);

-- Step 6: Fix checkins table indexes for TIMESTAMPTZ queries
DROP INDEX IF EXISTS idx_checkins_user_date;
CREATE INDEX IF NOT EXISTS idx_checkins_user_completed_at ON axis6_checkins(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_checkins_today ON axis6_checkins(user_id) WHERE completed_at >= CURRENT_DATE;

-- Step 7: Insert sample temperament questions
INSERT INTO axis6_temperament_questions (question_text, question_type, options, order_index) VALUES
  (
    '{"en": "When working on a project, I prefer to:", "es": "Cuando trabajo en un proyecto, prefiero:"}',
    'work_style',
    '[
      {"text": {"en": "Work alone and focus deeply", "es": "Trabajar solo y enfocarme profundamente"}, "temperament": "melancholic", "weight": 1.0},
      {"text": {"en": "Collaborate with a small team", "es": "Colaborar con un equipo pequeño"}, "temperament": "phlegmatic", "weight": 1.0},
      {"text": {"en": "Lead a group and delegate tasks", "es": "Liderar un grupo y delegar tareas"}, "temperament": "choleric", "weight": 1.0},
      {"text": {"en": "Work with many people and brainstorm", "es": "Trabajar con muchas personas y hacer lluvia de ideas"}, "temperament": "sanguine", "weight": 1.0}
    ]',
    1
  ),
  (
    '{"en": "In social situations, I typically:", "es": "En situaciones sociales, típicamente:"}',
    'social',
    '[
      {"text": {"en": "Stay quiet and observe", "es": "Me mantengo callado y observo"}, "temperament": "melancholic", "weight": 1.0},
      {"text": {"en": "Listen and contribute when asked", "es": "Escucho y contribuyo cuando me preguntan"}, "temperament": "phlegmatic", "weight": 1.0},
      {"text": {"en": "Take charge and organize activities", "es": "Tomo el mando y organizo actividades"}, "temperament": "choleric", "weight": 1.0},
      {"text": {"en": "Talk to everyone and make jokes", "es": "Hablo con todos y hago chistes"}, "temperament": "sanguine", "weight": 1.0}
    ]',
    2
  ),
  (
    '{"en": "When making decisions, I usually:", "es": "Al tomar decisiones, usualmente:"}',
    'decision_making',
    '[
      {"text": {"en": "Analyze all options carefully", "es": "Analizo todas las opciones cuidadosamente"}, "temperament": "melancholic", "weight": 1.0},
      {"text": {"en": "Consider others'' opinions first", "es": "Considero las opiniones de otros primero"}, "temperament": "phlegmatic", "weight": 1.0},
      {"text": {"en": "Make quick, decisive choices", "es": "Hago elecciones rápidas y decisivas"}, "temperament": "choleric", "weight": 1.0},
      {"text": {"en": "Go with my gut feeling", "es": "Voy con mi intuición"}, "temperament": "sanguine", "weight": 1.0}
    ]',
    3
  )
ON CONFLICT DO NOTHING;

-- Step 8: Create trigger functions for updated_at
CREATE OR REPLACE FUNCTION update_temperament_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create triggers
CREATE TRIGGER IF NOT EXISTS update_temperament_profiles_updated_at 
  BEFORE UPDATE ON axis6_temperament_profiles
  FOR EACH ROW EXECUTE FUNCTION update_temperament_updated_at();

CREATE TRIGGER IF NOT EXISTS update_personalization_settings_updated_at 
  BEFORE UPDATE ON axis6_personalization_settings
  FOR EACH ROW EXECUTE FUNCTION update_temperament_updated_at();

-- Step 10: Fix categories data (ensure latest names)
UPDATE axis6_categories SET 
  name = '{"en": "Material"}'::jsonb,
  slug = 'material'
WHERE slug = 'purpose' OR (name->>'en' = 'Purpose');

-- Step 11: Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_personalization_settings;

COMMIT;

-- Step 12: Verification queries
SELECT 'Tables created successfully!' as status;

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name LIKE 'axis6_%'
ORDER BY table_name;

SELECT 'Temperament questions inserted: ' || COUNT(*)::text as questions_status
FROM axis6_temperament_questions;

SELECT 'Fix complete! All tables should now be accessible.' as final_status;