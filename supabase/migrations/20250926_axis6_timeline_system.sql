-- AXIS6 Timeline System - Nueva implementación simplificada
-- Migration: 20250926_axis6_timeline_system.sql
-- Crea sistema de timeline sin afectar tablas existentes

BEGIN;

-- Tabla de ejes (sistema simplificado)
CREATE TABLE IF NOT EXISTS axis6_axes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

-- Tabla de subcategorías por eje
CREATE TABLE IF NOT EXISTS axis6_subcategories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  axis_id TEXT REFERENCES axis6_axes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de bloques de tiempo (actividades del día)
CREATE TABLE IF NOT EXISTS axis6_timeblocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  axis_id TEXT REFERENCES axis6_axes(id),
  subcategory_id UUID REFERENCES axis6_subcategories(id),
  date DATE NOT NULL,
  start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  start_quarter INTEGER NOT NULL CHECK (start_quarter IN (0, 15, 30, 45)),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de reflexiones diarias (reemplaza mantras)
CREATE TABLE IF NOT EXISTS axis6_daily_reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_timeblocks_user_date ON axis6_timeblocks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_timeblocks_date_time ON axis6_timeblocks(date, start_hour, start_quarter);
CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date ON axis6_daily_reflections(user_id, date);
CREATE INDEX IF NOT EXISTS idx_subcategories_axis ON axis6_subcategories(axis_id);

-- Enable Row Level Security
ALTER TABLE axis6_axes ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_timeblocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_daily_reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Ejes: público para lectura (todos los usuarios ven los mismos 6 ejes)
CREATE POLICY "Axes are publicly readable" ON axis6_axes
  FOR SELECT TO authenticated USING (true);

-- Subcategorías: público para lectura
CREATE POLICY "Subcategories are publicly readable" ON axis6_subcategories
  FOR SELECT TO authenticated USING (true);

-- Timeblocks: usuarios solo pueden CRUD sus propios datos
CREATE POLICY "Users can CRUD own timeblocks" ON axis6_timeblocks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reflexiones: usuarios solo pueden CRUD sus propias reflexiones
CREATE POLICY "Users can CRUD own reflections" ON axis6_daily_reflections
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Seed data para ejes (mismos colores del sistema actual)
INSERT INTO axis6_axes (id, name, color, icon, order_index) VALUES
  ('physical', 'Físico', '#65D39A', '💪', 0),
  ('mental', 'Mental', '#9B8AE6', '🧠', 1),
  ('emotional', 'Emocional', '#FF8B7D', '❤️', 2),
  ('social', 'Social', '#6AA6FF', '👥', 3),
  ('spiritual', 'Espiritual', '#4ECDC4', '🙏', 4),
  ('material', 'Material', '#FFD166', '💼', 5)
ON CONFLICT (id) DO NOTHING;

-- Seed data para subcategorías con actividades comunes
INSERT INTO axis6_subcategories (axis_id, name, is_default) VALUES
  -- Físico
  ('physical', 'Gym', true),
  ('physical', 'Pádel', false),
  ('physical', 'Caminata', false),
  ('physical', 'Yoga', false),
  ('physical', 'Correr', false),
  ('physical', 'Natación', false),
  
  -- Mental
  ('mental', 'Coding', true),
  ('mental', 'Lectura', false),
  ('mental', 'Estudio', false),
  ('mental', 'Planificación', false),
  ('mental', 'Investigación', false),
  ('mental', 'Cursos', false),
  
  -- Emocional
  ('emotional', 'Meditación', true),
  ('emotional', 'Journaling', false),
  ('emotional', 'Música', false),
  ('emotional', 'Arte', false),
  ('emotional', 'Terapia', false),
  ('emotional', 'Mindfulness', false),
  
  -- Social
  ('social', 'Familia', true),
  ('social', 'Amigos', false),
  ('social', 'Networking', false),
  ('social', 'Llamadas', false),
  ('social', 'Eventos', false),
  ('social', 'Citas', false),
  
  -- Espiritual
  ('spiritual', 'Oración', true),
  ('spiritual', 'Biblia', false),
  ('spiritual', 'Gratitud', false),
  ('spiritual', 'Reflexión', false),
  ('spiritual', 'Servicio', false),
  ('spiritual', 'Naturaleza', false),
  
  -- Material
  ('material', 'Trabajo', true),
  ('material', 'Finanzas', false),
  ('material', 'Proyectos', false),
  ('material', 'Admin', false),
  ('material', 'Compras', false),
  ('material', 'Organización', false)
ON CONFLICT DO NOTHING;

-- Función para actualizar updated_at en timeblocks
CREATE OR REPLACE FUNCTION axis6_update_timeblock_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para timeblocks
CREATE TRIGGER axis6_timeblocks_updated_at BEFORE UPDATE ON axis6_timeblocks
  FOR EACH ROW EXECUTE FUNCTION axis6_update_timeblock_updated_at();

-- Función para calcular minutos por eje en un día
CREATE OR REPLACE FUNCTION axis6_get_day_axis_minutes(
  p_user_id UUID,
  p_date DATE
) RETURNS TABLE(axis_id TEXT, total_minutes INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.axis_id,
    SUM(t.duration_minutes)::INTEGER as total_minutes
  FROM axis6_timeblocks t
  WHERE t.user_id = p_user_id 
    AND t.date = p_date
  GROUP BY t.axis_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener datos completos del día
CREATE OR REPLACE FUNCTION axis6_get_day_data(
  p_user_id UUID,
  p_date DATE
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT JSON_BUILD_OBJECT(
    'date', p_date,
    'timeblocks', (
      SELECT COALESCE(JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', t.id,
          'axis_id', t.axis_id,
          'subcategory_id', t.subcategory_id,
          'start_hour', t.start_hour,
          'start_quarter', t.start_quarter,
          'duration_minutes', t.duration_minutes,
          'note', t.note,
          'axis', JSON_BUILD_OBJECT(
            'id', a.id,
            'name', a.name,
            'color', a.color,
            'icon', a.icon
          ),
          'subcategory', JSON_BUILD_OBJECT(
            'id', s.id,
            'name', s.name,
            'icon', s.icon
          )
        )
      ), '[]'::JSON)
      FROM axis6_timeblocks t
      LEFT JOIN axis6_axes a ON t.axis_id = a.id
      LEFT JOIN axis6_subcategories s ON t.subcategory_id = s.id
      WHERE t.user_id = p_user_id AND t.date = p_date
      ORDER BY t.start_hour, t.start_quarter
    ),
    'reflection', (
      SELECT JSON_BUILD_OBJECT(
        'id', r.id,
        'text', r.text,
        'created_at', r.created_at
      )
      FROM axis6_daily_reflections r
      WHERE r.user_id = p_user_id AND r.date = p_date
    ),
    'axis_minutes', (
      SELECT COALESCE(JSON_OBJECT_AGG(axis_id, total_minutes), '{}'::JSON)
      FROM axis6_get_day_axis_minutes(p_user_id, p_date)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMIT;