-- AXIS6 CRITICAL DATABASE SECURITY DEPLOYMENT
-- Execute in Supabase Dashboard > SQL Editor
-- Priority: CRITICAL - Fixes 20 critical vulnerabilities
-- Generated: August 30, 2025

BEGIN;

-- =====================================================
-- PHASE 1: ENABLE ROW LEVEL SECURITY (CRITICAL)
-- =====================================================

-- Enable RLS on all user data tables
ALTER TABLE axis6_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_mantras ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_user_mantras ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_hex_reactions ENABLE ROW LEVEL SECURITY;

-- Chat system tables
ALTER TABLE axis6_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_participants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 2: CRITICAL UNIQUE CONSTRAINTS FOR UPSERTS
-- =====================================================

-- Prevent 42P10 errors and ensure data integrity
ALTER TABLE axis6_checkins 
ADD CONSTRAINT IF NOT EXISTS unique_user_category_date 
UNIQUE (user_id, category_id, completed_at);

ALTER TABLE axis6_streaks 
ADD CONSTRAINT IF NOT EXISTS unique_user_category_streak 
UNIQUE (user_id, category_id);

ALTER TABLE axis6_user_mantras 
ADD CONSTRAINT IF NOT EXISTS unique_user_mantra_date 
UNIQUE (user_id, mantra_id, shown_date);

ALTER TABLE axis6_time_blocks 
ADD CONSTRAINT IF NOT EXISTS unique_user_time_slot 
UNIQUE (user_id, date, start_time);

ALTER TABLE axis6_hex_reactions 
ADD CONSTRAINT IF NOT EXISTS unique_user_hex_reaction 
UNIQUE (user_id, category_id, reaction_type, created_at);

-- =====================================================
-- PHASE 3: SECURE RLS POLICIES WITH CORRECT COLUMNS
-- =====================================================

-- DROP existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON axis6_profiles;

-- Profiles table (SPECIAL CASE: uses 'id' column, not 'user_id')
CREATE POLICY "Users can view own profile" ON axis6_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON axis6_profiles  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON axis6_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Checkins table (uses 'user_id' column)
DROP POLICY IF EXISTS "Users can view own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can delete own checkins" ON axis6_checkins;

CREATE POLICY "Users can view own checkins" ON axis6_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON axis6_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON axis6_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON axis6_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- Streaks table
DROP POLICY IF EXISTS "Users can view own streaks" ON axis6_streaks;
DROP POLICY IF EXISTS "Users can insert own streaks" ON axis6_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON axis6_streaks;

CREATE POLICY "Users can view own streaks" ON axis6_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON axis6_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON axis6_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Daily stats table
DROP POLICY IF EXISTS "Users can view own daily stats" ON axis6_daily_stats;
DROP POLICY IF EXISTS "Users can insert own daily stats" ON axis6_daily_stats;
DROP POLICY IF EXISTS "Users can update own daily stats" ON axis6_daily_stats;

CREATE POLICY "Users can view own daily stats" ON axis6_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily stats" ON axis6_daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats" ON axis6_daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Time blocks table
DROP POLICY IF EXISTS "Users can manage own time blocks" ON axis6_time_blocks;

CREATE POLICY "Users can manage own time blocks" ON axis6_time_blocks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hex reactions table
DROP POLICY IF EXISTS "Users can manage own hex reactions" ON axis6_hex_reactions;

CREATE POLICY "Users can manage own hex reactions" ON axis6_hex_reactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User mantras table  
DROP POLICY IF EXISTS "Users can manage own mantras" ON axis6_user_mantras;

CREATE POLICY "Users can manage own mantras" ON axis6_user_mantras
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PHASE 4: CHAT SYSTEM SECURITY
-- =====================================================

-- Chat rooms - secure participant-based access
DROP POLICY IF EXISTS "Users can view participating chat rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Room creators can update rooms" ON axis6_chat_rooms;

CREATE POLICY "Users can view participating chat rooms" ON axis6_chat_rooms
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM axis6_chat_participants 
      WHERE room_id = axis6_chat_rooms.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chat rooms" ON axis6_chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update rooms" ON axis6_chat_rooms
  FOR UPDATE USING (auth.uid() = created_by);

-- Chat messages - secure message access
DROP POLICY IF EXISTS "Users can view messages in participating rooms" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to participating rooms" ON axis6_chat_messages;

CREATE POLICY "Users can view messages in participating rooms" ON axis6_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM axis6_chat_participants 
      WHERE room_id = axis6_chat_messages.room_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to participating rooms" ON axis6_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM axis6_chat_participants 
      WHERE room_id = axis6_chat_messages.room_id 
      AND user_id = auth.uid()
    )
  );

-- Chat participants
DROP POLICY IF EXISTS "Users can view room participants" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON axis6_chat_participants;

CREATE POLICY "Users can view room participants" ON axis6_chat_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM axis6_chat_participants cp
      WHERE cp.room_id = axis6_chat_participants.room_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join rooms" ON axis6_chat_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PHASE 5: PUBLIC ACCESS POLICIES (READ-ONLY)
-- =====================================================

-- Categories table - public read access for all users
DROP POLICY IF EXISTS "Categories are public" ON axis6_categories;

CREATE POLICY "Categories are public" ON axis6_categories
  FOR SELECT TO public USING (true);

-- Mantras table - public read access for active mantras only
DROP POLICY IF EXISTS "Active mantras are public" ON axis6_mantras;

CREATE POLICY "Active mantras are public" ON axis6_mantras
  FOR SELECT TO public USING (is_active = true);

-- =====================================================
-- PHASE 6: SECURITY INDEXES FOR PERFORMANCE
-- =====================================================

-- User lookup indexes (critical for RLS performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_auth_lookup 
ON axis6_profiles(id) WHERE id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkins_user_auth 
ON axis6_checkins(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaks_user_auth 
ON axis6_streaks(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_stats_user_auth 
ON axis6_daily_stats(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_blocks_user_auth 
ON axis6_time_blocks(user_id) WHERE user_id IS NOT NULL;

-- Chat security indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_participants_auth 
ON axis6_chat_participants(user_id, room_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_auth 
ON axis6_chat_messages(user_id, room_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_auth 
ON axis6_chat_rooms(created_by) WHERE created_by IS NOT NULL;

-- =====================================================
-- PHASE 7: SECURITY FUNCTIONS
-- =====================================================

-- Secure dashboard data function with user verification
CREATE OR REPLACE FUNCTION get_secure_dashboard_data(p_user_id UUID DEFAULT auth.uid())
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- CRITICAL: Verify caller owns the data
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot access other users data';
  END IF;
  
  -- Execute with security context
  WITH user_checkins AS (
    SELECT 
      c.category_id,
      c.mood,
      c.notes,
      c.completed_at,
      cat.name as category_name,
      cat.icon,
      cat.color
    FROM axis6_checkins c
    JOIN axis6_categories cat ON c.category_id = cat.id
    WHERE c.user_id = p_user_id 
    AND c.completed_at = CURRENT_DATE
  ),
  user_streaks AS (
    SELECT 
      s.category_id,
      s.current_streak,
      s.longest_streak,
      s.last_checkin,
      cat.name as category_name
    FROM axis6_streaks s
    JOIN axis6_categories cat ON s.category_id = cat.id
    WHERE s.user_id = p_user_id
  ),
  secure_summary AS (
    SELECT 
      COUNT(*) as total_checkins,
      COALESCE(AVG(mood), 0) as average_mood,
      COUNT(DISTINCT category_id) as categories_completed
    FROM axis6_checkins
    WHERE user_id = p_user_id 
    AND completed_at = CURRENT_DATE
  )
  SELECT json_build_object(
    'checkins', COALESCE((SELECT json_agg(row_to_json(user_checkins)) FROM user_checkins), '[]'::json),
    'streaks', COALESCE((SELECT json_agg(row_to_json(user_streaks)) FROM user_streaks), '[]'::json),
    'summary', (SELECT row_to_json(secure_summary) FROM secure_summary),
    'user_id', p_user_id,
    'date', CURRENT_DATE,
    'access_verified', true
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION get_secure_dashboard_data(UUID) FROM public;
GRANT EXECUTE ON FUNCTION get_secure_dashboard_data(UUID) TO authenticated;

-- =====================================================
-- PHASE 8: SECURITY VALIDATION
-- =====================================================

-- Create security audit view
CREATE OR REPLACE VIEW security_audit_status AS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE tablename LIKE 'axis6_%'
ORDER BY tablename;

-- Create constraint validation view
CREATE OR REPLACE VIEW constraint_validation AS
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name LIKE 'axis6_%' 
AND constraint_type IN ('UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY')
ORDER BY table_name, constraint_type;

COMMIT;

-- =====================================================
-- POST-DEPLOYMENT VERIFICATION QUERIES
-- =====================================================

-- Run these to verify deployment success:

-- 1. Check RLS is enabled on all tables
-- SELECT * FROM security_audit_status;

-- 2. Verify UNIQUE constraints exist
-- SELECT * FROM constraint_validation WHERE constraint_type = 'UNIQUE';

-- 3. Test security function
-- SELECT get_secure_dashboard_data(auth.uid());

-- 4. Verify policies protect against unauthorized access
-- SET role authenticated;
-- SELECT * FROM axis6_profiles WHERE id != auth.uid(); -- Should return no rows

-- =====================================================
-- EMERGENCY ROLLBACK (IF NEEDED)
-- =====================================================

/*
-- Only use if critical issues arise
BEGIN;

-- Disable RLS temporarily (EMERGENCY ONLY)
-- ALTER TABLE axis6_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE axis6_checkins DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE axis6_streaks DISABLE ROW LEVEL SECURITY;

-- Drop problematic constraints (EMERGENCY ONLY)
-- ALTER TABLE axis6_checkins DROP CONSTRAINT IF EXISTS unique_user_category_date;

COMMIT;
*/