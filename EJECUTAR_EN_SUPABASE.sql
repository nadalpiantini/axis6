-- ============================================
-- AXIS6 - SCRIPT COMPLETO DE BASE DE DATOS
-- Copia TODO este contenido y pégalo en:
-- https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- Luego haz clic en RUN
-- ============================================

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
   '{"es": "Meditación, gratitud y propósito", "en": "Meditation, gratitude, and purpose"}',
   '#FFB366', 'sparkles', 5),
  
  ('purpose',
   '{"es": "Propósito", "en": "Purpose"}',
   '{"es": "Metas, logros y contribución", "en": "Goals, achievements, and contribution"}',
   '#F97B8B', 'target', 6)
ON CONFLICT (slug) DO NOTHING;

-- Create checkins table
CREATE TABLE IF NOT EXISTS axis6_checkins (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES axis6_categories(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, date)
);

-- Create streaks table
CREATE TABLE IF NOT EXISTS axis6_streaks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES axis6_categories(id),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Create daily stats view
CREATE TABLE IF NOT EXISTS axis6_daily_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_completed INT DEFAULT 0,
  categories_completed TEXT[],
  perfect_day BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE axis6_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_daily_stats ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for checkins
CREATE POLICY "Users can view their own checkins"
  ON axis6_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins"
  ON axis6_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checkins"
  ON axis6_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkins"
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
CREATE POLICY "Users can view their own daily stats"
  ON axis6_daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own daily stats"
  ON axis6_daily_stats FOR ALL
  USING (auth.uid() = user_id);

-- Function to update streaks
CREATE OR REPLACE FUNCTION axis6_update_streak(
  p_user_id UUID,
  p_category_id INT,
  p_completed BOOLEAN,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS void AS $$
DECLARE
  v_current_streak INT;
  v_longest_streak INT;
  v_last_date DATE;
BEGIN
  -- Get current streak data
  SELECT current_streak, longest_streak, last_checkin_date
  INTO v_current_streak, v_longest_streak, v_last_date
  FROM axis6_streaks
  WHERE user_id = p_user_id AND category_id = p_category_id;

  -- If no streak record exists, create one
  IF NOT FOUND THEN
    INSERT INTO axis6_streaks (user_id, category_id, current_streak, longest_streak, last_checkin_date)
    VALUES (p_user_id, p_category_id, CASE WHEN p_completed THEN 1 ELSE 0 END, CASE WHEN p_completed THEN 1 ELSE 0 END, p_date);
    RETURN;
  END IF;

  -- Update streak based on completion and date
  IF p_completed THEN
    IF v_last_date IS NULL OR p_date = v_last_date + INTERVAL '1 day' THEN
      -- Continue streak
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    ELSIF p_date > v_last_date THEN
      -- Reset streak if gap
      v_current_streak := 1;
    END IF;
    
    -- Update longest streak if needed
    v_longest_streak := GREATEST(COALESCE(v_longest_streak, 0), v_current_streak);
    
    -- Update the record
    UPDATE axis6_streaks
    SET current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_checkin_date = p_date,
        updated_at = NOW()
    WHERE user_id = p_user_id AND category_id = p_category_id;
  ELSE
    -- Break the streak if unchecking
    UPDATE axis6_streaks
    SET current_streak = 0,
        updated_at = NOW()
    WHERE user_id = p_user_id AND category_id = p_category_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating user profile
CREATE OR REPLACE FUNCTION axis6_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO axis6_profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'axis6_on_auth_user_created'
  ) THEN
    CREATE TRIGGER axis6_on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION axis6_handle_new_user();
  END IF;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'AXIS6 database setup completed successfully!';
END;
$$;