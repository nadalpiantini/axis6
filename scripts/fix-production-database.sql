-- Fix for missing axis6_get_day_summary function
-- This function is required for the My Day page to work

-- Create the missing function
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION axis6_get_day_summary(DATE) TO authenticated;

-- Also create the quick_add_block function if it doesn't exist
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION axis6_quick_add_block(SMALLINT, INT, TEXT) TO authenticated;

-- Ensure all required tables exist
CREATE TABLE IF NOT EXISTS axis6_blocks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  axis_id SMALLINT NOT NULL,
  subcat_id SMALLINT,
  start_ts TIMESTAMP WITH TIME ZONE NOT NULL,
  minutes INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS axis6_axes (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS axis6_subcats (
  id SERIAL PRIMARY KEY,
  axis_id SMALLINT REFERENCES axis6_axes(id),
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS axis6_reflections (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day)
);

-- Insert default axes if they don't exist
INSERT INTO axis6_axes (id, name, color, icon) VALUES
(1, 'Physical', '#8BE38F', '💪'),
(2, 'Mental', '#9DB2FF', '🧠'),
(3, 'Emotional', '#FF9DB0', '❤️'),
(4, 'Social', '#9DE1FF', '👥'),
(5, 'Spiritual', '#C9A5FF', '✨'),
(6, 'Material', '#FFD27A', '💰')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE axis6_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_reflections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own blocks" ON axis6_blocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blocks" ON axis6_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blocks" ON axis6_blocks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocks" ON axis6_blocks
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own reflections" ON axis6_reflections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections" ON axis6_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections" ON axis6_reflections
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_axis6_blocks_user_date 
ON axis6_blocks(user_id, (start_ts::date));

CREATE INDEX IF NOT EXISTS idx_axis6_blocks_user_axis 
ON axis6_blocks(user_id, axis_id);

CREATE INDEX IF NOT EXISTS idx_axis6_reflections_user_day 
ON axis6_reflections(user_id, day);
