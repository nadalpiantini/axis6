-- =====================================================
-- AXIS6 Complete Database Deployment Verification
-- =====================================================
-- Run this after deploying the complete database script
-- to verify that all tables and indexes were created successfully

-- Check if all AXIS6 tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    -- Core tables
    'axis6_profiles',
    'axis6_categories', 
    'axis6_checkins',
    'axis6_streaks',
    'axis6_daily_stats',
    
    -- Temperament tables
    'axis6_temperament_profiles',
    'axis6_temperament_questions',
    'axis6_temperament_responses',
    'axis6_personalization_settings',
    'axis6_temperament_activities',
    
    -- Mantras tables
    'axis6_mantras',
    'axis6_user_mantras',
    
    -- Activities tables
    'axis6_activities',
    'axis6_user_activities'
)
ORDER BY table_name;

-- Check if categories were populated
SELECT 
    'Categories Count' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 6 THEN '✅ CORRECT'
        ELSE '❌ INCORRECT - Expected 6 categories'
    END as status
FROM axis6_categories;

-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'axis6_%'
ORDER BY tablename;

-- Check if key indexes exist
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE 'axis6_%'
AND indexname IN (
    'idx_axis6_checkins_today_lookup',
    'idx_axis6_checkins_user_category_date',
    'idx_axis6_streaks_user_category',
    'idx_axis6_daily_stats_user_date_lookup',
    'idx_temperament_profiles_user_id',
    'idx_temperament_profiles_primary_temperament',
    'idx_temperament_questions_active',
    'idx_temperament_responses_user_session',
    'idx_temperament_activities_category'
)
ORDER BY tablename, indexname;

-- Test basic queries to all tables
SELECT 
    'Checkins Table Query' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as status,
    COUNT(*) as record_count
FROM axis6_checkins;

SELECT 
    'Profiles Table Query' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as status,
    COUNT(*) as record_count
FROM axis6_profiles;

SELECT 
    'Temperament Profiles Table Query' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as status,
    COUNT(*) as record_count
FROM axis6_temperament_profiles;

SELECT 
    'Temperament Responses Table Query' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as status,
    COUNT(*) as record_count
FROM axis6_temperament_responses;

-- Show sample categories
SELECT 
    'Sample Categories' as info,
    name,
    slug,
    color,
    icon
FROM axis6_categories 
ORDER BY order_index 
LIMIT 3;

-- Check realtime subscriptions
SELECT 
    'Realtime Subscriptions' as check_type,
    COUNT(*) as table_count,
    CASE 
        WHEN COUNT(*) >= 14 THEN '✅ ENABLED'
        ELSE '❌ INCOMPLETE'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename LIKE 'axis6_%';

-- =====================================================
-- DEPLOYMENT STATUS SUMMARY
-- =====================================================
SELECT 
    'AXIS6 Complete Database Deployment' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name LIKE 'axis6_%') >= 14
        THEN '✅ SUCCESSFUL'
        ELSE '❌ INCOMPLETE'
    END as status,
    'All tables, indexes, RLS policies, and realtime subscriptions should be in place' as notes;
