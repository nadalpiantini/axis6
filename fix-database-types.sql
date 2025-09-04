-- URGENT DATABASE TYPE FIX FOR AXIS6
-- This fixes UUID vs INTEGER type mismatches causing 500 errors

-- First, let's check current category structure
SELECT 'Checking categories...' as status;

-- Insert the 6 required categories if they don't exist
INSERT INTO axis6_categories (slug, name, description, color, icon, position) VALUES
  ('physical', '{"es": "Física", "en": "Physical"}', '{"es": "Ejercicio, salud y nutrición", "en": "Exercise, health, and nutrition"}', '#65D39A', 'activity', 1),
  ('mental', '{"es": "Mental", "en": "Mental"}', '{"es": "Aprendizaje, enfoque y productividad", "en": "Learning, focus, and productivity"}', '#9B8AE6', 'brain', 2),
  ('emotional', '{"es": "Emocional", "en": "Emotional"}', '{"es": "Estado de ánimo y manejo del estrés", "en": "Mood and stress management"}', '#FF8B7D', 'heart', 3),
  ('social', '{"es": "Social", "en": "Social"}', '{"es": "Relaciones y conexiones", "en": "Relationships and connections"}', '#6AA6FF', 'users', 4),
  ('spiritual', '{"es": "Espiritual", "en": "Spiritual"}', '{"es": "Meditación, propósito y mindfulness", "en": "Meditation, purpose, and mindfulness"}', '#4ECDC4', 'sparkles', 5),
  ('material', '{"es": "Material", "en": "Material"}', '{"es": "Finanzas, carrera y recursos", "en": "Finance, career, and resources"}', '#FFD166', 'briefcase', 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  position = EXCLUDED.position;

-- Fix the time_blocks table to use UUID for category_id if needed
-- Check current structure first
DO $$ 
DECLARE 
    rec RECORD;
BEGIN
    -- Check if category_id is INTEGER or UUID
    SELECT data_type INTO rec 
    FROM information_schema.columns 
    WHERE table_name = 'axis6_time_blocks' 
    AND column_name = 'category_id';
    
    IF rec.data_type = 'integer' THEN
        -- Need to modify to use UUID
        RAISE NOTICE 'Converting category_id from INTEGER to UUID...';
        
        -- Drop the foreign key constraint if it exists
        ALTER TABLE axis6_time_blocks DROP CONSTRAINT IF EXISTS axis6_time_blocks_category_id_fkey;
        
        -- Change column type to UUID
        ALTER TABLE axis6_time_blocks ALTER COLUMN category_id TYPE UUID USING category_id::text::uuid;
        
        -- Re-add foreign key constraint
        ALTER TABLE axis6_time_blocks ADD CONSTRAINT axis6_time_blocks_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES axis6_categories(id);
        
    END IF;
END $$;

-- Create the corrected get_my_day_data function with proper types
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
    tb.category_id::UUID,
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

-- Create the corrected calculate_daily_time_distribution function
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
      SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 60) as total_minutes
    FROM axis6_time_blocks
    WHERE user_id = p_user_id AND date = p_date
    GROUP BY category_id
  ) planned ON planned.category_id = c.id
  LEFT JOIN (
    SELECT 
      category_id,
      SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60) as total_minutes
    FROM axis6_activity_logs
    WHERE user_id = p_user_id 
    AND DATE(started_at) = p_date
    AND ended_at IS NOT NULL
    GROUP BY category_id
  ) actual ON actual.category_id = c.id
  ORDER BY c.position;

  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create activity logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS axis6_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON axis6_activity_logs(user_id, DATE(started_at));
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON axis6_activity_logs(category_id);

-- Enable RLS
ALTER TABLE axis6_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own activity logs" ON axis6_activity_logs;
CREATE POLICY "Users can view own activity logs" ON axis6_activity_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own activity logs" ON axis6_activity_logs;
CREATE POLICY "Users can create own activity logs" ON axis6_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activity logs" ON axis6_activity_logs;
CREATE POLICY "Users can update own activity logs" ON axis6_activity_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- Verification
SELECT 'Database types fixed!' as status;
SELECT count(*) as category_count FROM axis6_categories;