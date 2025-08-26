-- =====================================================
-- AXIS6 WEBSOCKET REALTIME FIX
-- =====================================================
-- Copy and paste this entire file into:
-- https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- Then click RUN
-- =====================================================

-- Enable Realtime for all axis6 tables
-- This will fix the WebSocket connection failures

-- Core tables
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_daily_stats;

-- Temperament tables
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_personalization_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_temperament_activities;

-- Additional tables (if they exist)
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_mantras;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_user_mantras;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_user_activities;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check which tables have realtime enabled
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN tablename IN (
      SELECT tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime'
    ) THEN 'ENABLED'
    ELSE 'DISABLED'
  END as realtime_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'axis6_%'
ORDER BY tablename;

-- Check publication status
SELECT 
  pubname,
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename LIKE 'axis6_%'
ORDER BY tablename;

-- =====================================================
-- REALTIME CONFIGURATION COMPLETE
-- =====================================================
-- After running this script:
-- 1. WebSocket connections should work
-- 2. Real-time updates will be available
-- 3. No more "WebSocket connection failed" errors

