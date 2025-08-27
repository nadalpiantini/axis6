-- Fix for Hexagon Visualization: Deploy Missing Database Function
-- This function gets resonance data for the hexagon visualization
-- Run this in Supabase SQL Editor if hexagon shows "Temporarily Unavailable"

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_hexagon_resonance(UUID, DATE) TO authenticated;

-- Create the resonance events table if it doesn't exist
CREATE TABLE IF NOT EXISTS axis6_resonance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id),
  axis_slug TEXT NOT NULL,
  resonance_day DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_category_day UNIQUE (user_id, category_id, resonance_day)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resonance_events_day_axis 
ON axis6_resonance_events(resonance_day DESC, axis_slug);

CREATE INDEX IF NOT EXISTS idx_resonance_events_user_day 
ON axis6_resonance_events(user_id, resonance_day DESC);

-- Enable RLS
ALTER TABLE axis6_resonance_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view resonance events" ON axis6_resonance_events
  FOR SELECT USING (true); -- Anonymous resonance data is public

CREATE POLICY "Users can create their own resonance events" ON axis6_resonance_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);