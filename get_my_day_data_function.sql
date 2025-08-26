-- Función corregida con tipos de datos correctos para producción
-- Copia y pega esto en Supabase SQL Editor

-- Primero eliminamos la función existente si existe
DROP FUNCTION IF EXISTS get_my_day_data(UUID, DATE);

-- Luego creamos la función con los tipos correctos
CREATE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE)
RETURNS TABLE (
  time_block_id INTEGER,
  category_id UUID,
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

GRANT EXECUTE ON FUNCTION get_my_day_data(UUID, DATE) TO authenticated;

-- Test de la función con un usuario real
-- Primero encuentra usuarios existentes:
SELECT id, email FROM auth.users LIMIT 5;

-- Luego usa un UUID real para probar la función:
-- SELECT * FROM get_my_day_data('UUID-REAL-AQUI'::UUID, CURRENT_DATE);

-- Ejemplo para verificar que la función existe:
SELECT proname, proargnames, proargtypes 
FROM pg_proc 
WHERE proname = 'get_my_day_data';
