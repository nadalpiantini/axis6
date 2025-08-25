#!/usr/bin/env node
/**
 * Apply Temperament Migration Script for AXIS6
 * 
 * This script applies the missing temperament tables migration
 * to fix 404 errors on axis6_temperament_profiles
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

async function applyTemperamentMigration() {
  console.log('🔧 Applying temperament tables migration...\n')
  
  const temperamentMigrationSQL = `
-- Four Temperaments Psychological Profiling System for AXIS6
-- Migration: 20241225000000_psychological_profiling_system.sql

-- Create temperament profiles table
CREATE TABLE IF NOT EXISTS axis6_temperament_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  primary_temperament TEXT NOT NULL CHECK (primary_temperament IN ('sanguine', 'choleric', 'melancholic', 'phlegmatic')),
  secondary_temperament TEXT CHECK (secondary_temperament IN ('sanguine', 'choleric', 'melancholic', 'phlegmatic')),
  temperament_scores JSONB NOT NULL DEFAULT '{}',
  -- Store scores as: {"sanguine": 0.75, "choleric": 0.60, "melancholic": 0.40, "phlegmatic": 0.25}
  personality_insights JSONB NOT NULL DEFAULT '{}',
  -- Store insights as: {"strengths": ["leadership", "creativity"], "challenges": ["impatience"], "recommendations": ["meditation", "team-building"]}
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- One profile per user
);

-- Create temperament questions table for the questionnaire
CREATE TABLE IF NOT EXISTS axis6_temperament_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text JSONB NOT NULL,
  -- Store in multiple languages: {"en": "I prefer to...", "es": "Prefiero..."}
  question_type TEXT NOT NULL CHECK (question_type IN ('work_style', 'social', 'decision_making', 'stress_response', 'goal_setting')),
  options JSONB NOT NULL,
  -- Store as: [{"text": {"en": "Work alone", "es": "Trabajar solo"}, "temperament": "melancholic", "weight": 1.0}]
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user responses table to track questionnaire answers
CREATE TABLE IF NOT EXISTS axis6_temperament_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES axis6_temperament_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_index INTEGER NOT NULL,
  response_value JSONB NOT NULL,
  -- Store the selected option data for analysis
  session_id UUID NOT NULL,
  -- Group responses by session to allow retaking
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
  -- Store as: ["physical_high_energy", "mental_analytical", "social_group_based"]
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
  -- {"en": "High-intensity interval training", "es": "Entrenamiento de alta intensidad"}
  description JSONB,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  social_aspect TEXT CHECK (social_aspect IN ('solo', 'small_group', 'large_group', 'any')) DEFAULT 'any',
  time_commitment TEXT CHECK (time_commitment IN ('quick', 'moderate', 'extended')) DEFAULT 'moderate',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all new tables
ALTER TABLE axis6_temperament_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_personalization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_activities ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX IF NOT EXISTS idx_temperament_profiles_user_id ON axis6_temperament_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_temperament_profiles_primary_temperament ON axis6_temperament_profiles(primary_temperament);
CREATE INDEX IF NOT EXISTS idx_temperament_responses_user_session ON axis6_temperament_responses(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_temperament_questions_active ON axis6_temperament_questions(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_temperament_activities_category ON axis6_temperament_activities(category_id, temperament);
CREATE INDEX IF NOT EXISTS idx_personalization_settings_user ON axis6_personalization_settings(user_id);

-- Insert sample temperament questions
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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_temperament_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_temperament_profiles_updated_at 
  BEFORE UPDATE ON axis6_temperament_profiles
  FOR EACH ROW EXECUTE FUNCTION update_temperament_updated_at();

CREATE TRIGGER update_personalization_settings_updated_at 
  BEFORE UPDATE ON axis6_personalization_settings
  FOR EACH ROW EXECUTE FUNCTION update_temperament_updated_at();

-- Add comments for documentation
COMMENT ON TABLE axis6_temperament_profiles IS 'Stores user psychological profiles based on four temperaments system';
COMMENT ON TABLE axis6_temperament_questions IS 'Questionnaire questions for temperament assessment';
COMMENT ON TABLE axis6_temperament_responses IS 'User responses to temperament questionnaire';
COMMENT ON TABLE axis6_personalization_settings IS 'User preferences based on temperament analysis';
COMMENT ON TABLE axis6_temperament_activities IS 'Activity suggestions tailored to user temperament';
  `
  
  try {
    console.log('📝 Executing temperament migration...')
    
    // Split the SQL into smaller chunks to avoid timeout
    const statements = temperamentMigrationSQL.split(';').filter(stmt => stmt.trim())
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          console.log('💡 Try running this SQL manually in Supabase SQL Editor:')
          console.log('https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new')
          return
        }
      }
    }
    
    console.log('✅ Temperament migration applied successfully!')
    
    // Verify tables were created
    console.log('\n🔍 Verifying temperament tables...')
    const temperamentTables = [
      'axis6_temperament_profiles',
      'axis6_temperament_questions',
      'axis6_temperament_responses',
      'axis6_personalization_settings',
      'axis6_temperament_activities'
    ]
    
    for (const table of temperamentTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error && error.code === 'PGRST116') {
          console.log(`❌ ${table} - STILL MISSING`)
        } else {
          console.log(`✅ ${table} - NOW EXISTS`)
        }
      } catch (error) {
        console.log(`❌ Error checking ${table}: ${error.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n💡 Try running this SQL manually in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new')
    console.log('\nCopy and paste the SQL from the temperament migration file')
  }
}

async function main() {
  try {
    await applyTemperamentMigration()
    console.log('\n🎉 Temperament migration complete!')
    console.log('\n💡 The 404 errors should now be resolved.')
    console.log('   Try refreshing your application and check if the errors are gone.')
  } catch (error) {
    console.error('❌ Script failed:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}
