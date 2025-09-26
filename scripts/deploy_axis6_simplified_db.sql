-- MANUAL DEPLOYMENT: AXIS6 Simplified Database
-- Run this directly in Supabase SQL Editor

-- Simple axes table (the 6 life dimensions)
CREATE TABLE IF NOT EXISTS axis6_axes(
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Subcategories for each axis (user customizable)
CREATE TABLE IF NOT EXISTS axis6_subcats(
  id BIGSERIAL PRIMARY KEY,
  axis_id SMALLINT REFERENCES axis6_axes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time blocks (simplified activity tracking)
CREATE TABLE IF NOT EXISTS axis6_blocks(
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  axis_id SMALLINT NOT NULL REFERENCES axis6_axes(id),
  subcat_id BIGINT REFERENCES axis6_subcats(id) ON DELETE SET NULL,
  start_ts TIMESTAMPTZ NOT NULL,
  minutes INT NOT NULL CHECK (minutes > 0),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily reflections (140 char limit like old Twitter)
CREATE TABLE IF NOT EXISTS axis6_reflections(
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  text VARCHAR(140),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day)
);

-- Insert the 6 core axes (if not exists)
INSERT INTO axis6_axes(id, name, color) VALUES
  (1, 'Physical', '#8BE38F'),
  (2, 'Mental', '#9DB2FF'),
  (3, 'Emotional', '#FF9DB0'),
  (4, 'Social', '#9DE1FF'),
  (5, 'Spiritual', '#C9A5FF'),
  (6, 'Material', '#FFD27A')
ON CONFLICT (id) DO NOTHING;

-- Optimized RPC function to get day summary
CREATE OR REPLACE FUNCTION axis6_get_day_summary(d DATE)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH blocks AS (
    SELECT 
      b.id,
      b.axis_id,
      b.minutes,
      b.start_ts,
      b.note,
      a.name as axis_name,
      a.color as axis_color,
      s.name as subcat_name
    FROM axis6_blocks b
    JOIN axis6_axes a ON a.id = b.axis_id
    LEFT JOIN axis6_subcats s ON s.id = b.subcat_id
    WHERE b.start_ts::date = d 
    AND b.user_id = auth.uid()
    ORDER BY b.start_ts
  ),
  minutes_by_axis AS (
    SELECT 
      axis_id,
      SUM(minutes)::int as total_minutes
    FROM blocks
    GROUP BY axis_id
  ),
  reflection AS (
    SELECT text
    FROM axis6_reflections
    WHERE day = d
    AND user_id = auth.uid()
    LIMIT 1
  )
  SELECT json_build_object(
    'minutesByAxis', (
      SELECT json_object_agg(axis_id, total_minutes)
      FROM minutes_by_axis
    ),
    'blocks', (
      SELECT json_agg(row_to_json(b))
      FROM blocks b
    ),
    'reflection', (
      SELECT text FROM reflection
    ),
    'totalMinutes', (
      SELECT COALESCE(SUM(total_minutes), 0)
      FROM minutes_by_axis
    ),
    'axesActive', (
      SELECT COUNT(DISTINCT axis_id)
      FROM blocks
    )
  ) INTO result;
  
  RETURN COALESCE(result, '{"minutesByAxis": {}, "blocks": [], "reflection": null, "totalMinutes": 0, "axesActive": 0}'::json);
END;
$$;

-- RPC function to add time block quickly
CREATE OR REPLACE FUNCTION axis6_quick_add_block(
  p_axis_id SMALLINT,
  p_minutes INT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_block JSON;
BEGIN
  INSERT INTO axis6_blocks (user_id, axis_id, start_ts, minutes, note)
  VALUES (auth.uid(), p_axis_id, NOW(), p_minutes, p_note)
  RETURNING json_build_object(
    'id', id,
    'axis_id', axis_id,
    'minutes', minutes,
    'start_ts', start_ts
  ) INTO new_block;
  
  RETURN new_block;
END;
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_axis6_blocks_user_date 
ON axis6_blocks(user_id, (start_ts::date));

CREATE INDEX IF NOT EXISTS idx_axis6_subcats_user_axis 
ON axis6_subcats(user_id, axis_id);

CREATE INDEX IF NOT EXISTS idx_axis6_reflections_user_day 
ON axis6_reflections(user_id, day);

-- Enable RLS
ALTER TABLE axis6_subcats ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can manage own subcategories" ON axis6_subcats;
CREATE POLICY "Users can manage own subcategories" ON axis6_subcats
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own blocks" ON axis6_blocks;
CREATE POLICY "Users can manage own blocks" ON axis6_blocks
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own reflections" ON axis6_reflections;
CREATE POLICY "Users can manage own reflections" ON axis6_reflections
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON axis6_axes TO anon, authenticated;
GRANT ALL ON axis6_subcats TO authenticated;
GRANT ALL ON axis6_blocks TO authenticated;
GRANT ALL ON axis6_reflections TO authenticated;
GRANT EXECUTE ON FUNCTION axis6_get_day_summary(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION axis6_quick_add_block(SMALLINT, INT, TEXT) TO authenticated;