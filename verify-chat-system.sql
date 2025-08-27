-- VERIFICAR ESTADO DEL SISTEMA DE CHAT
-- Ejecutar en: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new

-- 1. Verificar si las tablas de chat existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name LIKE 'axis6_chat_%'
ORDER BY table_name;

-- 2. Verificar las relaciones de foreign key actuales
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
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

-- 3. Verificar si existen salas de chat
SELECT 
    COUNT(*) as total_rooms,
    STRING_AGG(name, ', ') as room_names
FROM axis6_chat_rooms 
WHERE is_active = true;

-- 4. Verificar si hay usuarios en las tablas de participantes
SELECT 
    COUNT(*) as total_participants
FROM axis6_chat_participants;

-- 5. Probar la consulta que causaba el error 400
-- Esta es la consulta que fallaba antes
SELECT 
    r.*,
    COUNT(p.id) as participant_count
FROM axis6_chat_rooms r
LEFT JOIN axis6_chat_participants p ON p.room_id = r.id
LEFT JOIN axis6_profiles prof ON prof.id = p.user_id
WHERE r.is_active = true
GROUP BY r.id
ORDER BY r.updated_at DESC
LIMIT 5;

-- 6. Verificar las políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename LIKE 'axis6_chat_%'
ORDER BY tablename, policyname;

-- 7. Estado final del sistema
SELECT 
    'CHAT SYSTEM STATUS' as status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_rooms') 
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_participants')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_messages')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_reactions')
        THEN '✅ ALL TABLES EXIST'
        ELSE '❌ MISSING TABLES'
    END as table_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'axis6_chat_participants'
            AND ccu.table_name = 'axis6_profiles'
        )
        THEN '✅ FOREIGN KEYS FIXED'
        ELSE '❌ FOREIGN KEYS MISSING'
    END as foreign_key_status;
