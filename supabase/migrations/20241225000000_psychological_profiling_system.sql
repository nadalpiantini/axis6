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

CREATE POLICY "Users can update own responses" ON axis6_temperament_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for personalization_settings
CREATE POLICY "Users can view own personalization settings" ON axis6_personalization_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personalization settings" ON axis6_personalization_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personalization settings" ON axis6_personalization_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for temperament_activities (public read)
CREATE POLICY "Anyone can view temperament activities" ON axis6_temperament_activities
  FOR SELECT USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX idx_temperament_profiles_user_id ON axis6_temperament_profiles(user_id);
CREATE INDEX idx_temperament_profiles_primary_temperament ON axis6_temperament_profiles(primary_temperament);

CREATE INDEX idx_temperament_questions_type ON axis6_temperament_questions(question_type);
CREATE INDEX idx_temperament_questions_order ON axis6_temperament_questions(order_index);
CREATE INDEX idx_temperament_questions_active ON axis6_temperament_questions(is_active);

CREATE INDEX idx_temperament_responses_user_session ON axis6_temperament_responses(user_id, session_id);
CREATE INDEX idx_temperament_responses_question ON axis6_temperament_responses(question_id);

CREATE INDEX idx_personalization_user_id ON axis6_personalization_settings(user_id);

CREATE INDEX idx_temperament_activities_category_temperament ON axis6_temperament_activities(category_id, temperament);
CREATE INDEX idx_temperament_activities_temperament ON axis6_temperament_activities(temperament);

-- Insert initial temperament questions (English first, can be extended with translations)
INSERT INTO axis6_temperament_questions (question_text, question_type, options, order_index) VALUES

-- Work Style Questions (1-5)
('{"en": "When working on a project, I prefer to:", "es": "Al trabajar en un proyecto, prefiero:"}', 'work_style', '[
  {"text": {"en": "Jump in immediately and figure things out as I go", "es": "Empezar inmediatamente y resolver las cosas sobre la marcha"}, "temperament": "sanguine", "weight": 1.0},
  {"text": {"en": "Create a detailed plan and timeline first", "es": "Crear primero un plan detallado y cronograma"}, "temperament": "melancholic", "weight": 1.0},
  {"text": {"en": "Take charge and delegate tasks efficiently", "es": "Tomar el control y delegar tareas eficientemente"}, "temperament": "choleric", "weight": 1.0},
  {"text": {"en": "Work steadily at my own pace", "es": "Trabajar constantemente a mi propio ritmo"}, "temperament": "phlegmatic", "weight": 1.0}
]', 1),

('{"en": "In team meetings, I tend to:", "es": "En reuniones de equipo, tiendo a:"}', 'work_style', '[
  {"text": {"en": "Share ideas enthusiastically and keep energy high", "es": "Compartir ideas con entusiasmo y mantener la energía alta"}, "temperament": "sanguine", "weight": 1.0},
  {"text": {"en": "Listen carefully and ask detailed questions", "es": "Escuchar atentamente y hacer preguntas detalladas"}, "temperament": "melancholic", "weight": 1.0},
  {"text": {"en": "Drive the agenda and push for quick decisions", "es": "Dirigir la agenda y presionar por decisiones rápidas"}, "temperament": "choleric", "weight": 1.0},
  {"text": {"en": "Contribute when asked and help maintain harmony", "es": "Contribuir cuando me piden y ayudar a mantener la armonía"}, "temperament": "phlegmatic", "weight": 1.0}
]', 2),

-- Social Questions (3-7)
('{"en": "At social gatherings, I:", "es": "En reuniones sociales, yo:"}', 'social', '[
  {"text": {"en": "Love being the center of attention and making new friends", "es": "Me encanta ser el centro de atención y hacer nuevos amigos"}, "temperament": "sanguine", "weight": 1.0},
  {"text": {"en": "Prefer deep conversations with a few close friends", "es": "Prefiero conversaciones profundas con pocos amigos cercanos"}, "temperament": "melancholic", "weight": 1.0},
  {"text": {"en": "Network strategically and discuss goals and achievements", "es": "Hago networking estratégicamente y discuto metas y logros"}, "temperament": "choleric", "weight": 1.0},
  {"text": {"en": "Enjoy relaxed conversations and helping others feel comfortable", "es": "Disfruto conversaciones relajadas y ayudo a otros a sentirse cómodos"}, "temperament": "phlegmatic", "weight": 1.0}
]', 3),

-- Decision Making Questions (4-8)
('{"en": "When making important decisions, I:", "es": "Al tomar decisiones importantes, yo:"}', 'decision_making', '[
  {"text": {"en": "Go with my gut feeling and what feels exciting", "es": "Sigo mi instinto y lo que me emociona"}, "temperament": "sanguine", "weight": 1.0},
  {"text": {"en": "Research thoroughly and analyze all possible outcomes", "es": "Investigo a fondo y analizo todos los resultados posibles"}, "temperament": "melancholic", "weight": 1.0},
  {"text": {"en": "Make quick decisions based on what will achieve my goals fastest", "es": "Tomo decisiones rápidas basadas en lo que logrará mis metas más rápido"}, "temperament": "choleric", "weight": 1.0},
  {"text": {"en": "Consider how it affects everyone and seek consensus", "es": "Considero cómo afecta a todos y busco consenso"}, "temperament": "phlegmatic", "weight": 1.0}
]', 4),

-- Stress Response Questions (5-9)
('{"en": "When I''m stressed, I typically:", "es": "Cuando estoy estresado, típicamente:"}', 'stress_response', '[
  {"text": {"en": "Talk it out with friends and look for fun distractions", "es": "Lo hablo con amigos y busco distracciones divertidas"}, "temperament": "sanguine", "weight": 1.0},
  {"text": {"en": "Withdraw and analyze what went wrong in detail", "es": "Me retiro y analizo en detalle qué salió mal"}, "temperament": "melancholic", "weight": 1.0},
  {"text": {"en": "Push through with determination and take immediate action", "es": "Sigo adelante con determinación y tomo acción inmediata"}, "temperament": "choleric", "weight": 1.0},
  {"text": {"en": "Stay calm and look for peaceful solutions", "es": "Me mantengo tranquilo y busco soluciones pacíficas"}, "temperament": "phlegmatic", "weight": 1.0}
]', 5),

-- Goal Setting Questions (6-10)
('{"en": "My approach to setting goals is:", "es": "Mi enfoque para establecer metas es:"}', 'goal_setting', '[
  {"text": {"en": "Set exciting, ambitious goals that inspire me", "es": "Establecer metas emocionantes y ambiciosas que me inspiren"}, "temperament": "sanguine", "weight": 1.0},
  {"text": {"en": "Set detailed, specific, and measurable objectives", "es": "Establecer objetivos detallados, específicos y medibles"}, "temperament": "melancholic", "weight": 1.0},
  {"text": {"en": "Set challenging goals and create aggressive timelines", "es": "Establecer metas desafiantes y crear cronogramas agresivos"}, "temperament": "choleric", "weight": 1.0},
  {"text": {"en": "Set realistic, sustainable goals that maintain balance", "es": "Establecer metas realistas y sostenibles que mantengan el equilibrio"}, "temperament": "phlegmatic", "weight": 1.0}
]', 6);

-- Insert temperament-based activity suggestions for each category
INSERT INTO axis6_temperament_activities (category_id, temperament, activity_name, description, difficulty_level, energy_level, social_aspect, time_commitment) VALUES

-- Physical Activities by Temperament
((SELECT id FROM axis6_categories WHERE slug = 'physical'), 'sanguine', '{"en": "Dance Fitness Class", "es": "Clase de baile fitness"}', '{"en": "High-energy group dance workout", "es": "Entrenamiento de baile grupal de alta energía"}', 3, 'high', 'large_group', 'moderate'),
((SELECT id FROM axis6_categories WHERE slug = 'physical'), 'choleric', '{"en": "HIIT Training", "es": "Entrenamiento HIIT"}', '{"en": "High-intensity interval training for maximum results", "es": "Entrenamiento de alta intensidad por intervalos para máximos resultados"}', 4, 'high', 'small_group', 'moderate'),
((SELECT id FROM axis6_categories WHERE slug = 'physical'), 'melancholic', '{"en": "Yoga Flow", "es": "Flujo de Yoga"}', '{"en": "Mindful yoga practice with focus on form", "es": "Práctica de yoga consciente con enfoque en la forma"}', 2, 'low', 'small_group', 'moderate'),
((SELECT id FROM axis6_categories WHERE slug = 'physical'), 'phlegmatic', '{"en": "Walking Meditation", "es": "Meditación Caminando"}', '{"en": "Gentle walking combined with mindfulness", "es": "Caminar suave combinado con atención plena"}', 1, 'low', 'solo', 'moderate'),

-- Mental Activities by Temperament  
((SELECT id FROM axis6_categories WHERE slug = 'mental'), 'sanguine', '{"en": "Creative Brainstorming", "es": "Lluvia de ideas creativa"}', '{"en": "Generate exciting new ideas and possibilities", "es": "Generar nuevas ideas emocionantes y posibilidades"}', 2, 'medium', 'small_group', 'quick'),
((SELECT id FROM axis6_categories WHERE slug = 'mental'), 'choleric', '{"en": "Strategic Planning", "es": "Planificación Estratégica"}', '{"en": "Set and plan achievement of ambitious goals", "es": "Establecer y planificar el logro de metas ambiciosas"}', 4, 'high', 'solo', 'extended'),
((SELECT id FROM axis6_categories WHERE slug = 'mental'), 'melancholic', '{"en": "Deep Learning Session", "es": "Sesión de Aprendizaje Profundo"}', '{"en": "Focused study of complex topics with detailed analysis", "es": "Estudio enfocado de temas complejos con análisis detallado"}', 4, 'medium', 'solo', 'extended'),
((SELECT id FROM axis6_categories WHERE slug = 'mental'), 'phlegmatic', '{"en": "Mindful Reading", "es": "Lectura Consciente"}', '{"en": "Peaceful reading and reflection time", "es": "Tiempo de lectura pacífica y reflexión"}', 2, 'low', 'solo', 'moderate');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_temperament_profiles_updated_at
    BEFORE UPDATE ON axis6_temperament_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalization_settings_updated_at
    BEFORE UPDATE ON axis6_personalization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert function to calculate temperament from responses
CREATE OR REPLACE FUNCTION calculate_temperament_from_responses(p_user_id UUID, p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
    temperament_scores JSONB := '{"sanguine": 0, "choleric": 0, "melancholic": 0, "phlegmatic": 0}';
    response_record RECORD;
    total_responses INTEGER := 0;
    primary_temperament TEXT;
    secondary_temperament TEXT;
    result JSONB;
BEGIN
    -- Calculate scores from responses
    FOR response_record IN
        SELECT r.response_value
        FROM axis6_temperament_responses r
        WHERE r.user_id = p_user_id AND r.session_id = p_session_id
    LOOP
        total_responses := total_responses + 1;
        
        -- Add the temperament weight to the corresponding score
        temperament_scores := jsonb_set(
            temperament_scores,
            ARRAY[(response_record.response_value->>'temperament')],
            to_jsonb((temperament_scores->>((response_record.response_value->>'temperament')))::numeric + 
                    (response_record.response_value->>'weight')::numeric)
        );
    END LOOP;
    
    -- Normalize scores to percentages
    IF total_responses > 0 THEN
        temperament_scores := jsonb_set(temperament_scores, '{sanguine}', to_jsonb((temperament_scores->>'sanguine')::numeric / total_responses));
        temperament_scores := jsonb_set(temperament_scores, '{choleric}', to_jsonb((temperament_scores->>'choleric')::numeric / total_responses));
        temperament_scores := jsonb_set(temperament_scores, '{melancholic}', to_jsonb((temperament_scores->>'melancholic')::numeric / total_responses));
        temperament_scores := jsonb_set(temperament_scores, '{phlegmatic}', to_jsonb((temperament_scores->>'phlegmatic')::numeric / total_responses));
    END IF;
    
    -- Determine primary and secondary temperaments
    WITH ranked_scores AS (
        SELECT temperament, score,
               ROW_NUMBER() OVER (ORDER BY score DESC) as rank
        FROM (
            SELECT 'sanguine' as temperament, (temperament_scores->>'sanguine')::numeric as score
            UNION ALL
            SELECT 'choleric', (temperament_scores->>'choleric')::numeric
            UNION ALL
            SELECT 'melancholic', (temperament_scores->>'melancholic')::numeric
            UNION ALL
            SELECT 'phlegmatic', (temperament_scores->>'phlegmatic')::numeric
        ) t
    )
    SELECT INTO primary_temperament, secondary_temperament
        MAX(CASE WHEN rank = 1 THEN temperament END),
        MAX(CASE WHEN rank = 2 THEN temperament END)
    FROM ranked_scores;
    
    result := jsonb_build_object(
        'primary_temperament', primary_temperament,
        'secondary_temperament', secondary_temperament,
        'scores', temperament_scores,
        'total_responses', total_responses
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE axis6_temperament_profiles IS 'Stores user psychological profiles based on four temperaments system';
COMMENT ON TABLE axis6_temperament_questions IS 'Questionnaire for determining user temperament';
COMMENT ON TABLE axis6_temperament_responses IS 'User responses to temperament questionnaire';
COMMENT ON TABLE axis6_personalization_settings IS 'User preferences for temperament-based personalization';
COMMENT ON TABLE axis6_temperament_activities IS 'Activity suggestions tailored to each temperament';