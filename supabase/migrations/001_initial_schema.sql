-- AXIS6 Database Schema
-- All tables use prefix 'axis6_' for multi-tenant isolation

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
  name JSONB NOT NULL, -- Multilingual support {"es": "Física", "en": "Physical"}
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
  user_id UUID NOT NULL REFERENCES axis6_profiles(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES axis6_profiles(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES axis6_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completion_rate DECIMAL(3,2),
  categories_completed INT DEFAULT 0,
  total_mood INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON axis6_checkins(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_streaks_user ON axis6_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON axis6_daily_stats(user_id, date DESC);

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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_axis6_profiles_updated_at BEFORE UPDATE ON axis6_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_axis6_checkins_updated_at BEFORE UPDATE ON axis6_checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_axis6_streaks_updated_at BEFORE UPDATE ON axis6_streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate streaks (called after check-in)
CREATE OR REPLACE FUNCTION axis6_calculate_streak(p_user_id UUID, p_category_id INT)
RETURNS void AS $$
DECLARE
  v_dates DATE[];
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_temp_streak INT := 0;
  v_last_date DATE := NULL;
  v_date DATE;
BEGIN
  -- Get all check-in dates for this user and category
  SELECT ARRAY_AGG(completed_at ORDER BY completed_at)
  INTO v_dates
  FROM axis6_checkins
  WHERE user_id = p_user_id AND category_id = p_category_id;

  -- If no check-ins, reset the streak
  IF v_dates IS NULL THEN
    DELETE FROM axis6_streaks 
    WHERE user_id = p_user_id AND category_id = p_category_id;
    RETURN;
  END IF;

  -- Calculate streaks
  FOREACH v_date IN ARRAY v_dates
  LOOP
    IF v_last_date IS NULL OR v_date = v_last_date + INTERVAL '1 day' THEN
      v_temp_streak := v_temp_streak + 1;
    ELSE
      v_temp_streak := 1;
    END IF;
    
    IF v_temp_streak > v_longest_streak THEN
      v_longest_streak := v_temp_streak;
    END IF;
    
    v_last_date := v_date;
  END LOOP;

  -- Check if the streak is current (includes today or yesterday)
  IF v_last_date >= CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := v_temp_streak;
  ELSE
    v_current_streak := 0;
  END IF;

  -- Update or insert the streak record
  INSERT INTO axis6_streaks (user_id, category_id, current_streak, longest_streak, last_checkin)
  VALUES (p_user_id, p_category_id, v_current_streak, v_longest_streak, v_last_date)
  ON CONFLICT (user_id, category_id)
  DO UPDATE SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_checkin = v_last_date,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update daily stats
CREATE OR REPLACE FUNCTION axis6_update_daily_stats(p_user_id UUID, p_date DATE)
RETURNS void AS $$
DECLARE
  v_completed INT;
  v_total_mood INT;
  v_completion_rate DECIMAL(3,2);
BEGIN
  -- Count completed categories for the day
  SELECT COUNT(DISTINCT category_id), SUM(mood)
  INTO v_completed, v_total_mood
  FROM axis6_checkins
  WHERE user_id = p_user_id AND completed_at = p_date;

  -- Calculate completion rate (6 total categories)
  v_completion_rate := v_completed::DECIMAL / 6;

  -- Update or insert daily stats
  INSERT INTO axis6_daily_stats (user_id, date, completion_rate, categories_completed, total_mood)
  VALUES (p_user_id, p_date, v_completion_rate, v_completed, v_total_mood)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    completion_rate = v_completion_rate,
    categories_completed = v_completed,
    total_mood = v_total_mood,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql;