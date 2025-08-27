-- VERIFICACIÓN RÁPIDA DEL ESTADO DEL CHAT
-- Ejecutar en: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new

-- 1. ¿Existe la columna is_private que acabamos de agregar?
SELECT 
    'COLUMNA is_private' as verificacion,
    CASE 
        WHEN EXISTS (
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'axis6_chat_rooms' AND column_name = 'is_private'
        ) 
        THEN '✅ YA EXISTE' 
        ELSE '❌ FALTA'
    END as resultado;

-- 2. ¿Están los foreign keys apuntando a axis6_profiles?
SELECT 
    'FOREIGN KEYS A PROFILES' as verificacion,
    COUNT(*) as cantidad_correcta
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('axis6_chat_participants', 'axis6_chat_messages', 'axis6_chat_reactions')
    AND ccu.table_name = 'axis6_profiles';

-- 3. ¿Funciona la consulta que causaba error 400?
SELECT 
    'CONSULTA DE PRUEBA' as verificacion,
    COUNT(*) as salas_encontradas
FROM axis6_chat_rooms r
LEFT JOIN axis6_chat_participants p ON p.room_id = r.id
LEFT JOIN axis6_profiles prof ON prof.id = p.user_id
WHERE r.is_active = true;

-- 4. Resultado final
SELECT 
    CASE 
        WHEN EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name = 'axis6_chat_rooms' AND column_name = 'is_private')
             AND EXISTS (SELECT 1 FROM information_schema.table_constraints tc JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'axis6_chat_participants' AND ccu.table_name = 'axis6_profiles')
        THEN '🎉 CHAT SYSTEM FIXED!' 
        ELSE '⚠️ NEEDS FIXES'
    END as estado_final;
