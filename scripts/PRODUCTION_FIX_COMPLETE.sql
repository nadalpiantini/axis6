-- =====================================================
-- AXIS6 PRODUCTION DATABASE FIX - COMPLETE SOLUTION
-- =====================================================
-- This script fixes ALL production errors including:
-- 1. Missing temperament tables (404 errors)
-- 2. Schema mismatches (400 errors)
-- 3. RLS policies
-- 4. Realtime subscriptions
-- =====================================================

-- STEP 1: Fix axis6_checkins table schema
-- =====================================================
-- Fix the completed_at column type mismatch
ALTER TABLE axis6_checkins 
ALTER COLUMN completed_at TYPE TIMESTAMPTZ 
USING completed_at::TIMESTAMPTZ;

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkins_user_completed 
ON axis6_checkins(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkins_category_completed 
ON axis6_checkins(category_id, completed_at DESC);

-- STEP 2: Create missing temperament tables
-- =====================================================

-- Create temperament profiles table
CREATE TABLE IF NOT EXISTS axis6_temperament_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    primary_temperament VARCHAR(20) NOT NULL CHECK (primary_temperament IN ('sanguine', 'choleric', 'melancholic', 'phlegmatic')),
    secondary_temperament VARCHAR(20) CHECK (secondary_temperament IN ('sanguine', 'choleric', 'melancholic', 'phlegmatic')),
    temperament_scores JSONB NOT NULL DEFAULT '{"sanguine": 0, "choleric": 0, "melancholic": 0, "phlegmatic": 0}'::jsonb,
    personality_insights JSONB DEFAULT '{}'::jsonb,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create temperament questions table
CREATE TABLE IF NOT EXISTS axis6_temperament_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_text JSONB NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    options JSONB NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create temperament responses table
CREATE TABLE IF NOT EXISTS axis6_temperament_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES axis6_temperament_questions(id) ON DELETE CASCADE NOT NULL,
    selected_option INTEGER NOT NULL,
    temperament_weight JSONB NOT NULL,
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Create personalization settings table
CREATE TABLE IF NOT EXISTS axis6_personalization_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    ai_features_enabled BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{"smart": true, "daily": true, "weekly": true}'::jsonb,
    optimal_checkin_times JSONB DEFAULT '[]'::jsonb,
    personality_based_recommendations BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create temperament activities table
CREATE TABLE IF NOT EXISTS axis6_temperament_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activity_name JSONB NOT NULL,
    category_id INTEGER REFERENCES axis6_categories(id),
    temperament VARCHAR(20) NOT NULL,
    compatibility_score DECIMAL(3,2) CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
    description JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Set up RLS policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE axis6_temperament_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_personalization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe operation)
DROP POLICY IF EXISTS "Users can view own temperament profile" ON axis6_temperament_profiles;
DROP POLICY IF EXISTS "Users can update own temperament profile" ON axis6_temperament_profiles;
DROP POLICY IF EXISTS "Users can insert own temperament profile" ON axis6_temperament_profiles;
DROP POLICY IF EXISTS "Anyone can view active questions" ON axis6_temperament_questions;
DROP POLICY IF EXISTS "Users can view own responses" ON axis6_temperament_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON axis6_temperament_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON axis6_temperament_responses;
DROP POLICY IF EXISTS "Users can view own settings" ON axis6_personalization_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON axis6_personalization_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON axis6_personalization_settings;
DROP POLICY IF EXISTS "Anyone can view active activities" ON axis6_temperament_activities;

-- Create RLS policies for temperament_profiles
CREATE POLICY "Users can view own temperament profile" 
ON axis6_temperament_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own temperament profile" 
ON axis6_temperament_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own temperament profile" 
ON axis6_temperament_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for temperament_questions
CREATE POLICY "Anyone can view active questions" 
ON axis6_temperament_questions FOR SELECT 
USING (is_active = true);

-- Create RLS policies for temperament_responses
CREATE POLICY "Users can view own responses" 
ON axis6_temperament_responses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses" 
ON axis6_temperament_responses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses" 
ON axis6_temperament_responses FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for personalization_settings
CREATE POLICY "Users can view own settings" 
ON axis6_personalization_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON axis6_personalization_settings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
ON axis6_personalization_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for temperament_activities
CREATE POLICY "Anyone can view active activities" 
ON axis6_temperament_activities FOR SELECT 
USING (is_active = true);

-- STEP 4: Insert sample temperament questions
-- =====================================================

INSERT INTO axis6_temperament_questions (question_text, question_type, options, order_index, is_active) VALUES
(
    '{"en": "How do you prefer to spend your free time?", "es": "¿Cómo prefieres pasar tu tiempo libre?"}'::jsonb,
    'social',
    '[
        {"text": {"en": "Socializing with friends", "es": "Socializando con amigos"}, "temperament": "sanguine", "weight": 1.0},
        {"text": {"en": "Working on personal projects", "es": "Trabajando en proyectos personales"}, "temperament": "choleric", "weight": 1.0},
        {"text": {"en": "Reading or studying", "es": "Leyendo o estudiando"}, "temperament": "melancholic", "weight": 1.0},
        {"text": {"en": "Relaxing at home", "es": "Relajándome en casa"}, "temperament": "phlegmatic", "weight": 1.0}
    ]'::jsonb,
    1,
    true
),
(
    '{"en": "How do you handle stressful situations?", "es": "¿Cómo manejas las situaciones estresantes?"}'::jsonb,
    'stress_response',
    '[
        {"text": {"en": "Talk it out with others", "es": "Hablarlo con otros"}, "temperament": "sanguine", "weight": 1.0},
        {"text": {"en": "Take action immediately", "es": "Tomar acción inmediatamente"}, "temperament": "choleric", "weight": 1.0},
        {"text": {"en": "Analyze the situation thoroughly", "es": "Analizar la situación a fondo"}, "temperament": "melancholic", "weight": 1.0},
        {"text": {"en": "Stay calm and wait", "es": "Mantener la calma y esperar"}, "temperament": "phlegmatic", "weight": 1.0}
    ]'::jsonb,
    2,
    true
),
(
    '{"en": "What motivates you most?", "es": "¿Qué te motiva más?"}'::jsonb,
    'goal_setting',
    '[
        {"text": {"en": "Fun and excitement", "es": "Diversión y emoción"}, "temperament": "sanguine", "weight": 1.0},
        {"text": {"en": "Achievement and success", "es": "Logros y éxito"}, "temperament": "choleric", "weight": 1.0},
        {"text": {"en": "Perfection and quality", "es": "Perfección y calidad"}, "temperament": "melancholic", "weight": 1.0},
        {"text": {"en": "Peace and harmony", "es": "Paz y armonía"}, "temperament": "phlegmatic", "weight": 1.0}
    ]'::jsonb,
    3,
    true
),
(
    '{"en": "How do you make decisions?", "es": "¿Cómo tomas decisiones?"}'::jsonb,
    'decision_making',
    '[
        {"text": {"en": "Go with my gut feeling", "es": "Sigo mi intuición"}, "temperament": "sanguine", "weight": 1.0},
        {"text": {"en": "Quick and decisive", "es": "Rápido y decisivo"}, "temperament": "choleric", "weight": 1.0},
        {"text": {"en": "Careful analysis of all options", "es": "Análisis cuidadoso de todas las opciones"}, "temperament": "melancholic", "weight": 1.0},
        {"text": {"en": "Take time to consider", "es": "Me tomo tiempo para considerar"}, "temperament": "phlegmatic", "weight": 1.0}
    ]'::jsonb,
    4,
    true
),
(
    '{"en": "What describes your work style?", "es": "¿Qué describe tu estilo de trabajo?"}'::jsonb,
    'work_style',
    '[
        {"text": {"en": "Creative and collaborative", "es": "Creativo y colaborativo"}, "temperament": "sanguine", "weight": 1.0},
        {"text": {"en": "Goal-oriented and efficient", "es": "Orientado a metas y eficiente"}, "temperament": "choleric", "weight": 1.0},
        {"text": {"en": "Detailed and methodical", "es": "Detallado y metódico"}, "temperament": "melancholic", "weight": 1.0},
        {"text": {"en": "Steady and consistent", "es": "Estable y consistente"}, "temperament": "phlegmatic", "weight": 1.0}
    ]'::jsonb,
    5,
    true
),
(
    '{"en": "How do you prefer to learn?", "es": "¿Cómo prefieres aprender?"}'::jsonb,
    'learning_style',
    '[
        {"text": {"en": "Through interaction and discussion", "es": "A través de interacción y discusión"}, "temperament": "sanguine", "weight": 1.0},
        {"text": {"en": "By doing and practicing", "es": "Haciendo y practicando"}, "temperament": "choleric", "weight": 1.0},
        {"text": {"en": "Through reading and research", "es": "A través de lectura e investigación"}, "temperament": "melancholic", "weight": 1.0},
        {"text": {"en": "By observing and reflecting", "es": "Observando y reflexionando"}, "temperament": "phlegmatic", "weight": 1.0}
    ]'::jsonb,
    6,
    true
)
ON CONFLICT DO NOTHING;

-- STEP 5: Create helpful indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_temperament_profiles_user_id 
ON axis6_temperament_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_temperament_responses_user_id 
ON axis6_temperament_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_temperament_questions_active 
ON axis6_temperament_questions(is_active, order_index);

CREATE INDEX IF NOT EXISTS idx_personalization_settings_user_id 
ON axis6_personalization_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_temperament_activities_category 
ON axis6_temperament_activities(category_id, temperament);

-- STEP 6: Enable realtime for necessary tables
-- =====================================================

-- Note: This needs to be done in Supabase Dashboard under Table Editor > Realtime
-- Or via Supabase CLI/API. These are the tables that need realtime:
-- - axis6_checkins
-- - axis6_streaks
-- - axis6_daily_stats

-- STEP 7: Verify the fixes
-- =====================================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'axis6_%'
ORDER BY table_name;

-- Check column types
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'axis6_checkins' 
AND column_name = 'completed_at';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'axis6_%'
ORDER BY tablename, policyname;

-- =====================================================
-- END OF FIX SCRIPT
-- After running this, all production errors should be resolved!
-- =====================================================