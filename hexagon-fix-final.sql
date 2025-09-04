-- Final Fix for Hexagon Resonance Function
-- Fixes the "operator does not exist: text ->> unknown" error
-- Date: 2025-08-30

BEGIN;

-- Create the resonance events table if it doesn't exist
CREATE TABLE IF NOT EXISTS axis6_resonance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES axis6_categories(id),
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

-- Fixed function that handles the slug field correctly
CREATE OR REPLACE FUNCTION get_hexagon_resonance(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  axis_slug TEXT,
  resonance_count INTEGER,
  user_completed BOOLEAN
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Handle slug field correctly - it's a TEXT field, not JSONB
    cat.slug as axis_slug,
    COALESCE(re.others_count, 0)::integer as resonance_count,
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
  WHERE cat.is_active = true AND cat.kind = 'axis'
  ORDER BY cat.position;
END;
$$;

-- Function to record resonance when user completes an axis
CREATE OR REPLACE FUNCTION record_resonance_event(
  p_user_id UUID, 
  p_category_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_axis_slug TEXT;
BEGIN
  -- Get axis slug from category (handle TEXT slug field)
  SELECT slug INTO v_axis_slug 
  FROM axis6_categories 
  WHERE id = p_category_id;
  
  -- Record resonance event (idempotent - one per user per axis per day)
  INSERT INTO axis6_resonance_events (user_id, category_id, axis_slug, resonance_day)
  VALUES (p_user_id, p_category_id, v_axis_slug, p_date)
  ON CONFLICT (user_id, category_id, resonance_day) DO NOTHING;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_hexagon_resonance(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION record_resonance_event(UUID, UUID, DATE) TO authenticated;

-- Test the function
DO $$
DECLARE
  test_result RECORD;
BEGIN
  -- Test get_hexagon_resonance function
  SELECT * INTO test_result 
  FROM get_hexagon_resonance('b07a89a3-6030-42f9-8c60-ce28afc47132'::UUID, CURRENT_DATE) 
  LIMIT 1;
  
  RAISE NOTICE 'get_hexagon_resonance function test successful - axis: %', test_result.axis_slug;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'get_hexagon_resonance function test failed: %', SQLERRM;
    RAISE;
END;
$$;

COMMIT;

-- Final verification
SELECT 
  'Hexagon resonance function installed successfully!' as status,
  COUNT(*) as axis_count
FROM get_hexagon_resonance('b07a89a3-6030-42f9-8c60-ce28afc47132'::UUID, CURRENT_DATE);
