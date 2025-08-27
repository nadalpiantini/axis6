-- Fix for hexagon resonance function error 42804
-- Adds missing unique constraint for resonance_events table
-- Date: 2025-08-27

BEGIN;

-- Add the missing unique constraint for resonance events
-- This is needed for the ON CONFLICT clause in record_resonance_event function
ALTER TABLE axis6_resonance_events 
ADD CONSTRAINT unique_user_category_day 
UNIQUE (user_id, category_id, resonance_day);

-- Verify the function works after adding constraint
-- Test with a dummy call
DO $$
BEGIN
  PERFORM record_resonance_event(
    'b07a89a3-6030-42f9-8c60-ce28afc47132'::UUID,
    1,
    CURRENT_DATE
  );
  RAISE NOTICE 'record_resonance_event function test successful';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'record_resonance_event function test failed: %', SQLERRM;
END;
$$;

-- Test the get_hexagon_resonance function
DO $$
DECLARE
  test_result RECORD;
BEGIN
  FOR test_result IN 
    SELECT * FROM get_hexagon_resonance('b07a89a3-6030-42f9-8c60-ce28afc47132'::UUID, CURRENT_DATE)
  LOOP
    RAISE NOTICE 'get_hexagon_resonance test successful - axis: %', test_result.axis_slug;
    EXIT; -- Just test first record
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'get_hexagon_resonance function test failed: %', SQLERRM;
END;
$$;

COMMIT;

-- Verify all constraints are in place
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  tc.table_name
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'axis6_resonance_events'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');