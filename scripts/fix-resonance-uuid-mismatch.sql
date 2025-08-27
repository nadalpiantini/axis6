-- Fix for hexagon resonance UUID type mismatch
-- Updates resonance tables and functions to use UUID for category_id
-- Date: 2025-08-27

BEGIN;

-- Drop existing constraints and columns that use wrong type
ALTER TABLE axis6_resonance_events 
DROP CONSTRAINT IF EXISTS unique_user_category_day;

ALTER TABLE axis6_resonance_events 
DROP CONSTRAINT IF EXISTS axis6_resonance_events_user_id_category_id_resonance_day_key;

-- Update the category_id column to UUID type
ALTER TABLE axis6_resonance_events 
ALTER COLUMN category_id TYPE UUID USING category_id::text::uuid;

ALTER TABLE axis6_micro_posts
ALTER COLUMN category_id TYPE UUID USING category_id::text::uuid;

-- Re-add the unique constraint with correct types
ALTER TABLE axis6_resonance_events
ADD CONSTRAINT unique_user_category_day 
UNIQUE (user_id, category_id, resonance_day);

-- Update the get_hexagon_resonance function to handle UUID categories
CREATE OR REPLACE FUNCTION get_hexagon_resonance(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  axis_slug TEXT,
  resonance_count INTEGER,
  user_completed BOOLEAN
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(cat.slug->>'en', cat.slug_en) as axis_slug,
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
  ) re ON re.axis_slug = COALESCE(cat.slug->>'en', cat.slug_en)
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

-- Update the record_resonance_event function to handle UUID categories
CREATE OR REPLACE FUNCTION record_resonance_event(
  p_user_id UUID, 
  p_category_id UUID,  -- Changed from INTEGER to UUID
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_axis_slug TEXT;
BEGIN
  -- Get axis slug from category (handle JSONB slug field)
  SELECT COALESCE(slug->>'en', slug_en) INTO v_axis_slug 
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

-- Update the trigger function to work with new types
CREATE OR REPLACE FUNCTION trigger_record_resonance()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only record resonance for new check-ins (INSERT)
  PERFORM record_resonance_event(NEW.user_id, NEW.category_id, NEW.completed_at);
  RETURN NEW;
END;
$$;

-- Test the functions with proper UUID
DO $$
DECLARE
  test_category_id UUID;
BEGIN
  -- Get first category ID for testing
  SELECT id INTO test_category_id FROM axis6_categories WHERE is_active = true LIMIT 1;
  
  -- Test record_resonance_event
  PERFORM record_resonance_event(
    'b07a89a3-6030-42f9-8c60-ce28afc47132'::UUID,
    test_category_id,
    CURRENT_DATE
  );
  RAISE NOTICE 'record_resonance_event test successful with UUID category';
  
  -- Test get_hexagon_resonance
  PERFORM * FROM get_hexagon_resonance('b07a89a3-6030-42f9-8c60-ce28afc47132'::UUID, CURRENT_DATE);
  RAISE NOTICE 'get_hexagon_resonance test successful';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Function test failed: %', SQLERRM;
    RAISE;
END;
$$;

COMMIT;

-- Verify the fix
SELECT 
  'Fixed!' as status,
  COUNT(*) as test_count
FROM get_hexagon_resonance('b07a89a3-6030-42f9-8c60-ce28afc47132'::UUID, CURRENT_DATE);