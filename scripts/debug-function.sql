-- Script de debug para la función get_my_day_data
-- Copia y pega esto en Supabase SQL Editor

-- 1. Primero verificamos si la función existe
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_my_day_data';

-- 2. Si no existe, la creamos
CREATE OR REPLACE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE)
RETURNS TABLE (
  time_block_id INTEGER,
  category_id INTEGER,
  category_name TEXT,
  category_color TEXT,
  category_icon TEXT,
  activity_id INTEGER,
  activity_name VARCHAR(255),
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  status VARCHAR(20),
  notes TEXT,
  actual_duration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tb.id as time_block_id,
    tb.category_id,
    c.name->>'en' as category_name,
    c.color as category_color,
    c.icon as category_icon,
    tb.activity_id,
    tb.activity_name,
    tb.start_time,
    tb.end_time,
    tb.duration_minutes,
    tb.status,
    tb.notes,
    COALESCE(
      (SELECT SUM(al.duration_minutes)::INTEGER 
       FROM axis6_activity_logs al 
       WHERE al.time_block_id = tb.id),
      0
    ) as actual_duration
  FROM axis6_time_blocks tb
  JOIN axis6_categories c ON c.id = tb.category_id
  WHERE tb.user_id = p_user_id 
    AND tb.date = p_date
  ORDER BY tb.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Otorgamos permisos
GRANT EXECUTE ON FUNCTION get_my_day_data(UUID, DATE) TO authenticated;

-- 4. Verificamos que se creó correctamente
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_my_day_data';

-- 5. Test básico de la función
SELECT * FROM get_my_day_data('00000000-0000-0000-0000-000000000000'::UUID, CURRENT_DATE) LIMIT 1;
