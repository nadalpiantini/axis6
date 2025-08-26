-- AXIS6 Hexagon Resonance System Migration
-- Adding subtle social layer that enhances existing hexagon experience
-- Date: 2025-08-26

BEGIN;

-- Create hexagon resonance events table
-- Tracks when users complete axes to show "resonance dots" to others
CREATE TABLE IF NOT EXISTS axis6_resonance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id),
  axis_slug TEXT NOT NULL,
  resonance_day DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create micro posts table for optional sharing
-- Extends existing check-in system with optional social sharing
CREATE TABLE IF NOT EXISTS axis6_micro_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_id INTEGER REFERENCES axis6_checkins(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id),
  content TEXT CHECK (char_length(content) <= 140),
  minutes INTEGER CHECK (minutes BETWEEN 0 AND 600),
  privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'followers', 'private')),
  glow_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create hex-star reactions table 
-- Subtle reactions that add "glow" to posts and axes
CREATE TABLE IF NOT EXISTS axis6_hex_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES axis6_micro_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  axis_type TEXT NOT NULL CHECK (axis_type IN ('physical', 'mental', 'emotional', 'social', 'spiritual', 'material')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, axis_type)
);

-- Create constellation data table for optional community view
-- Abstract visualization data without exposing user identities  
CREATE TABLE IF NOT EXISTS axis6_constellation_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  axis_slug TEXT NOT NULL,
  completion_count INTEGER DEFAULT 1,
  resonance_intensity DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, axis_slug)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_resonance_events_day_axis 
ON axis6_resonance_events(resonance_day DESC, axis_slug);

CREATE INDEX IF NOT EXISTS idx_resonance_events_user_day 
ON axis6_resonance_events(user_id, resonance_day DESC);

CREATE INDEX IF NOT EXISTS idx_micro_posts_public 
ON axis6_micro_posts(created_at DESC) 
WHERE privacy = 'public' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_micro_posts_category_day 
ON axis6_micro_posts(category_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_hex_reactions_post 
ON axis6_hex_reactions(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_constellation_date_axis 
ON axis6_constellation_data(date DESC, axis_slug);

-- Function to get resonance data for a user's hexagon
-- Returns anonymous count of others who completed same axes today
CREATE OR REPLACE FUNCTION get_hexagon_resonance(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  axis_slug TEXT,
  resonance_count INTEGER,
  user_completed BOOLEAN
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cat.slug as axis_slug,
    COALESCE(re.others_count, 0) as resonance_count,
    CASE WHEN uc.user_id IS NOT NULL THEN true ELSE false END as user_completed
  FROM axis6_categories cat
  LEFT JOIN (
    -- Count others who completed this axis today (exclude current user)
    SELECT 
      r.axis_slug,
      COUNT(DISTINCT r.user_id) as others_count
    FROM axis6_resonance_events r
    WHERE r.resonance_day = p_date 
      AND r.user_id != p_user_id
    GROUP BY r.axis_slug
  ) re ON re.axis_slug = cat.slug
  LEFT JOIN (
    -- Check if current user completed this axis today
    SELECT DISTINCT c.category_id, c.user_id
    FROM axis6_checkins c
    WHERE c.user_id = p_user_id 
      AND c.completed_at = p_date
  ) uc ON uc.category_id = cat.id
  ORDER BY cat.position;
END;
$$;

-- Function to record resonance when user completes an axis
-- Called automatically when user checks in to an axis
CREATE OR REPLACE FUNCTION record_resonance_event(
  p_user_id UUID, 
  p_category_id INTEGER,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_axis_slug TEXT;
BEGIN
  -- Get axis slug from category
  SELECT slug INTO v_axis_slug 
  FROM axis6_categories 
  WHERE id = p_category_id;
  
  -- Record resonance event (idempotent - one per user per axis per day)
  INSERT INTO axis6_resonance_events (user_id, category_id, axis_slug, resonance_day)
  VALUES (p_user_id, p_category_id, v_axis_slug, p_date)
  ON CONFLICT (user_id, category_id, resonance_day) DO NOTHING;
  
  -- Update constellation data for abstract community view
  INSERT INTO axis6_constellation_data (date, axis_slug, completion_count, resonance_intensity)
  VALUES (p_date, v_axis_slug, 1, 1.0)
  ON CONFLICT (date, axis_slug) 
  DO UPDATE SET 
    completion_count = axis6_constellation_data.completion_count + 1,
    resonance_intensity = LEAST(axis6_constellation_data.resonance_intensity + 0.1, 2.0);
END;
$$;

-- Function to get constellation data for community visualization
-- Returns abstract data without exposing individual users
CREATE OR REPLACE FUNCTION get_constellation_data(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  axis_slug TEXT,
  completion_count INTEGER,
  resonance_intensity DECIMAL(3,2),
  axis_color TEXT,
  axis_name JSONB
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.axis_slug,
    cd.completion_count,
    cd.resonance_intensity,
    cat.color as axis_color,
    cat.name as axis_name
  FROM axis6_constellation_data cd
  JOIN axis6_categories cat ON cat.slug = cd.axis_slug
  WHERE cd.date = p_date
  ORDER BY cat.position;
END;
$$;

-- Enable Row Level Security
ALTER TABLE axis6_resonance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_micro_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_hex_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_constellation_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resonance events
CREATE POLICY "Users can view resonance events" ON axis6_resonance_events
  FOR SELECT USING (true); -- Anonymous resonance data is public

CREATE POLICY "Users can create their own resonance events" ON axis6_resonance_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for micro posts
CREATE POLICY "Users can view public micro posts" ON axis6_micro_posts
  FOR SELECT USING (
    privacy = 'public' AND deleted_at IS NULL
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can manage their own micro posts" ON axis6_micro_posts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for hex reactions
CREATE POLICY "Users can view reactions on visible posts" ON axis6_hex_reactions
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM axis6_micro_posts 
      WHERE (privacy = 'public' AND deleted_at IS NULL) OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own reactions" ON axis6_hex_reactions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for constellation data
CREATE POLICY "Constellation data is publicly viewable" ON axis6_constellation_data
  FOR SELECT USING (true);

-- Trigger to automatically record resonance when user checks in
CREATE OR REPLACE FUNCTION trigger_record_resonance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only record resonance for new check-ins (INSERT)
  PERFORM record_resonance_event(NEW.user_id, NEW.category_id, NEW.completed_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_checkin_record_resonance
  AFTER INSERT ON axis6_checkins
  FOR EACH ROW
  EXECUTE FUNCTION trigger_record_resonance();

COMMIT;