-- AXIS6 Daily Mantras Feature
-- Implements a ritualized daily mantra system

-- Create mantras table
CREATE TABLE IF NOT EXISTS axis6_mantras (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES axis6_categories(id),
  content JSONB NOT NULL, -- Multilingual support {"es": "Mantra en español", "en": "English mantra"}
  author TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user mantra history table
CREATE TABLE IF NOT EXISTS axis6_user_mantras (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES axis6_profiles(id) ON DELETE CASCADE,
  mantra_id INT NOT NULL REFERENCES axis6_mantras(id),
  shown_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shown_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mantras_category ON axis6_mantras(category_id);
CREATE INDEX IF NOT EXISTS idx_mantras_active ON axis6_mantras(is_active);
CREATE INDEX IF NOT EXISTS idx_user_mantras_user_date ON axis6_user_mantras(user_id, shown_date DESC);

-- Enable Row Level Security
ALTER TABLE axis6_mantras ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_user_mantras ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mantras (everyone can read active mantras)
CREATE POLICY "Everyone can view active mantras"
  ON axis6_mantras FOR SELECT
  USING (is_active = true);

-- RLS Policies for user mantras
CREATE POLICY "Users can view their own mantra history"
  ON axis6_user_mantras FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mantra records"
  ON axis6_user_mantras FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mantra records"
  ON axis6_user_mantras FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_axis6_mantras_updated_at BEFORE UPDATE ON axis6_mantras
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get daily mantra for a user
CREATE OR REPLACE FUNCTION axis6_get_daily_mantra(p_user_id UUID)
RETURNS TABLE (
  id INT,
  category_id INT,
  content JSONB,
  author TEXT,
  category_name JSONB,
  category_color TEXT,
  is_completed BOOLEAN
) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_mantra_id INT;
  v_existing_record RECORD;
BEGIN
  -- Check if user already has a mantra for today
  SELECT um.*, m.category_id 
  INTO v_existing_record
  FROM axis6_user_mantras um
  JOIN axis6_mantras m ON m.id = um.mantra_id
  WHERE um.user_id = p_user_id 
  AND um.shown_date = v_today;

  IF v_existing_record.id IS NOT NULL THEN
    -- Return existing mantra
    RETURN QUERY
    SELECT 
      m.id,
      m.category_id,
      m.content,
      m.author,
      c.name as category_name,
      c.color as category_color,
      v_existing_record.completed as is_completed
    FROM axis6_mantras m
    JOIN axis6_categories c ON c.id = m.category_id
    WHERE m.id = v_existing_record.mantra_id;
  ELSE
    -- Get a random active mantra, prioritizing categories not completed recently
    SELECT m.id INTO v_mantra_id
    FROM axis6_mantras m
    WHERE m.is_active = true
    AND m.id NOT IN (
      -- Exclude mantras shown to this user in the last 7 days
      SELECT mantra_id 
      FROM axis6_user_mantras 
      WHERE user_id = p_user_id 
      AND shown_date > v_today - INTERVAL '7 days'
    )
    ORDER BY 
      -- Prioritize categories with fewer recent completions
      (SELECT COUNT(*) 
       FROM axis6_checkins 
       WHERE user_id = p_user_id 
       AND category_id = m.category_id 
       AND completed_at >= v_today - INTERVAL '3 days'
      ) ASC,
      RANDOM()
    LIMIT 1;

    -- If no unused mantra found, get any random active mantra
    IF v_mantra_id IS NULL THEN
      SELECT m.id INTO v_mantra_id
      FROM axis6_mantras m
      WHERE m.is_active = true
      ORDER BY RANDOM()
      LIMIT 1;
    END IF;

    -- Create user mantra record
    IF v_mantra_id IS NOT NULL THEN
      INSERT INTO axis6_user_mantras (user_id, mantra_id, shown_date)
      VALUES (p_user_id, v_mantra_id, v_today)
      ON CONFLICT (user_id, shown_date) DO NOTHING;

      -- Return the new mantra
      RETURN QUERY
      SELECT 
        m.id,
        m.category_id,
        m.content,
        m.author,
        c.name as category_name,
        c.color as category_color,
        false as is_completed
      FROM axis6_mantras m
      JOIN axis6_categories c ON c.id = m.category_id
      WHERE m.id = v_mantra_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark mantra as completed
CREATE OR REPLACE FUNCTION axis6_complete_mantra(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE axis6_user_mantras
  SET completed = true, completed_at = NOW()
  WHERE user_id = p_user_id 
  AND shown_date = CURRENT_DATE
  AND completed = false;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample mantras for each category
INSERT INTO axis6_mantras (category_id, content, author) VALUES
  -- Physical mantras
  (1, '{"es": "Mi cuerpo es mi templo sagrado, lo honro con movimiento y nutrición consciente", "en": "My body is my sacred temple, I honor it with mindful movement and nutrition"}', 'AXIS6'),
  (1, '{"es": "Cada paso que doy fortalece mi vitalidad y energía", "en": "Every step I take strengthens my vitality and energy"}', 'AXIS6'),
  (1, '{"es": "Respiro profundo y abrazo la fuerza que vive en mí", "en": "I breathe deeply and embrace the strength that lives within me"}', 'AXIS6'),
  
  -- Mental mantras
  (2, '{"es": "Mi mente es clara, enfocada y poderosa. Abrazo el aprendizaje continuo", "en": "My mind is clear, focused, and powerful. I embrace continuous learning"}', 'AXIS6'),
  (2, '{"es": "Cultivo pensamientos que nutren mi crecimiento y expansión", "en": "I cultivate thoughts that nourish my growth and expansion"}', 'AXIS6'),
  (2, '{"es": "Cada desafío es una oportunidad para fortalecer mi sabiduría", "en": "Every challenge is an opportunity to strengthen my wisdom"}', 'AXIS6'),
  
  -- Emotional mantras
  (3, '{"es": "Honro mis emociones como guías sabias hacia mi bienestar", "en": "I honor my emotions as wise guides to my wellbeing"}', 'AXIS6'),
  (3, '{"es": "Fluyo con gracia a través de todos los estados emocionales", "en": "I flow with grace through all emotional states"}', 'AXIS6'),
  (3, '{"es": "Mi corazón está abierto para dar y recibir amor abundante", "en": "My heart is open to give and receive abundant love"}', 'AXIS6'),
  
  -- Social mantras
  (4, '{"es": "Cultivo conexiones auténticas que nutren mi alma", "en": "I cultivate authentic connections that nourish my soul"}', 'AXIS6'),
  (4, '{"es": "Atraigo relaciones que reflejan mi valor y propósito", "en": "I attract relationships that reflect my worth and purpose"}', 'AXIS6'),
  (4, '{"es": "Doy y recibo apoyo con gratitud y generosidad", "en": "I give and receive support with gratitude and generosity"}', 'AXIS6'),
  
  -- Spiritual mantras
  (5, '{"es": "Estoy conectado con el flujo infinito del universo", "en": "I am connected to the infinite flow of the universe"}', 'AXIS6'),
  (5, '{"es": "Mi espíritu brilla con propósito y claridad divina", "en": "My spirit shines with purpose and divine clarity"}', 'AXIS6'),
  (5, '{"es": "En la quietud encuentro mi verdad más profunda", "en": "In stillness I find my deepest truth"}', 'AXIS6'),
  
  -- Material mantras
  (6, '{"es": "Construyo abundancia desde la integridad y el servicio", "en": "I build abundance through integrity and service"}', 'AXIS6'),
  (6, '{"es": "Mis recursos fluyen y se multiplican con propósito", "en": "My resources flow and multiply with purpose"}', 'AXIS6'),
  (6, '{"es": "Creo valor sostenible que beneficia a todos", "en": "I create sustainable value that benefits everyone"}', 'AXIS6');

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION axis6_get_daily_mantra(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION axis6_complete_mantra(UUID) TO authenticated;