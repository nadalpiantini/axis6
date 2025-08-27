-- DIAGNÓSTICO COMPLETO DEL SISTEMA DE CHAT
-- Ejecutar en: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new

SELECT '=== DIAGNÓSTICO DEL SISTEMA DE CHAT ===' as titulo;

-- 1. VERIFICAR EXISTENCIA DE TABLAS
SELECT '1. EXISTENCIA DE TABLAS' as seccion;

SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    VALUES 
        ('axis6_chat_rooms'),
        ('axis6_chat_participants'), 
        ('axis6_chat_messages'),
        ('axis6_chat_reactions'),
        ('axis6_profiles')
) AS expected_tables(table_name)
LEFT JOIN information_schema.tables t ON t.table_name = expected_tables.table_name
ORDER BY expected_tables.table_name;

-- 2. VERIFICAR FOREIGN KEYS
SELECT '2. FOREIGN KEY RELATIONSHIPS' as seccion;

SELECT 
    tc.table_name as tabla, 
    kcu.column_name as columna, 
    ccu.table_name as referencia_tabla,
    ccu.column_name as referencia_columna
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name LIKE 'axis6_chat_%'
ORDER BY tc.table_name, kcu.column_name;

-- 3. CONTAR REGISTROS
SELECT '3. CANTIDAD DE DATOS' as seccion;

SELECT 
    'axis6_chat_rooms' as tabla,
    COUNT(*) as total_registros
FROM axis6_chat_rooms
UNION ALL
SELECT 
    'axis6_chat_participants' as tabla,
    COUNT(*) as total_registros  
FROM axis6_chat_participants
UNION ALL
SELECT 
    'axis6_chat_messages' as tabla,
    COUNT(*) as total_registros
FROM axis6_chat_messages
UNION ALL
SELECT 
    'axis6_profiles' as tabla,
    COUNT(*) as total_registros
FROM axis6_profiles;

-- 4. PROBAR LA CONSULTA QUE CAUSABA ERROR 400
SELECT '4. PRUEBA DE CONSULTA PROBLEMÁTICA' as seccion;

-- Esta era la consulta que causaba el error original
SELECT 
    r.id,
    r.name,
    r.type,
    r.is_active,
    COUNT(p.id) as participant_count
FROM axis6_chat_rooms r
LEFT JOIN axis6_chat_participants p ON p.room_id = r.id
LEFT JOIN axis6_profiles prof ON prof.id = p.user_id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.type, r.is_active
ORDER BY r.updated_at DESC
LIMIT 5;

-- 5. VERIFICAR RLS POLICIES
SELECT '5. ROW LEVEL SECURITY POLICIES' as seccion;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd as operacion
FROM pg_policies 
WHERE tablename LIKE 'axis6_chat_%'
ORDER BY tablename, policyname;

-- 6. ESTADO FINAL
SELECT '6. RESUMEN FINAL' as seccion;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_rooms') 
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_participants')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_messages')
        THEN '✅ TODAS LAS TABLAS EXISTEN'
        ELSE '❌ FALTAN TABLAS'
    END as estado_tablas,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'axis6_chat_participants'
            AND ccu.table_name = 'axis6_profiles'
        )
        THEN '✅ FOREIGN KEYS CONFIGURADOS'
        ELSE '❌ FOREIGN KEYS FALTANTES'
    END as estado_foreign_keys,
    
    (SELECT COUNT(*) FROM axis6_chat_rooms WHERE is_active = true) as salas_activas,
    (SELECT COUNT(*) FROM axis6_chat_participants) as total_participantes,
    (SELECT COUNT(*) FROM axis6_profiles) as total_usuarios;

