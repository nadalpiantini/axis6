-- VERIFICACIÓN SIMPLE DEL SISTEMA DE CHAT
-- Ejecutar en: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new

-- 1. ¿Existen las tablas de chat?
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_rooms') 
        THEN '✅ axis6_chat_rooms EXISTS'
        ELSE '❌ axis6_chat_rooms MISSING'
    END as chat_rooms_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_participants') 
        THEN '✅ axis6_chat_participants EXISTS'
        ELSE '❌ axis6_chat_participants MISSING'
    END as chat_participants_status,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_chat_messages') 
        THEN '✅ axis6_chat_messages EXISTS'
        ELSE '❌ axis6_chat_messages MISSING'
    END as chat_messages_status;

-- 2. ¿Están configuradas las foreign keys correctamente?
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS references_table
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name LIKE 'axis6_chat_%'
    AND ccu.table_name = 'axis6_profiles'
ORDER BY tc.table_name;

-- 3. ¿Hay salas de chat creadas?
SELECT COUNT(*) as total_rooms FROM axis6_chat_rooms WHERE is_active = true;

-- 4. Probar la consulta que causaba el error 400 original
SELECT 
    r.id,
    r.name,
    r.type,
    COUNT(p.id) as participant_count
FROM axis6_chat_rooms r
LEFT JOIN axis6_chat_participants p ON p.room_id = r.id
WHERE r.is_active = true
GROUP BY r.id, r.name, r.type
LIMIT 3;
