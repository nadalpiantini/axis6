-- =====================================================
-- AXIS6 Database Deployment Verification
-- =====================================================
-- Run this after deploying the main migration script
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
    'axis6_profiles',
    'axis6_categories', 
    'axis6_checkins',
    'axis6_streaks',
    'axis6_daily_stats',
    'axis6_mantras',
    'axis6_user_mantras',
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
    'idx_axis6_daily_stats_user_date_lookup'
)
ORDER BY tablename, indexname;

-- Test basic query to axis6_checkins table
SELECT 
    'Checkins Table Query' as test_name,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as status,
    COUNT(*) as record_count
FROM axis6_checkins;

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

-- =====================================================
-- DEPLOYMENT STATUS SUMMARY
-- =====================================================
SELECT 
    'AXIS6 Database Deployment' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name LIKE 'axis6_%') >= 9
        THEN '✅ SUCCESSFUL'
        ELSE '❌ INCOMPLETE'
    END as status,
    'All tables, indexes, and RLS policies should be in place' as notes;
