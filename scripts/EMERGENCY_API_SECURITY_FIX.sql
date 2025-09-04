-- EMERGENCY API SECURITY FIXES
-- Execute these SQL commands in Supabase Dashboard > SQL Editor
-- 
-- WARNING: These changes will temporarily break API functionality
-- until proper RLS policies are implemented.
--
-- Generated: August 30, 2025
-- Priority: CRITICAL

BEGIN;

-- =====================================================
-- PHASE 1: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all user tables
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
-- PHASE 2: ADD CRITICAL UNIQUE CONSTRAINTS
-- =====================================================

-- Fix UPSERT operations (prevents 42P10 errors)
ALTER TABLE axis6_checkins 
ADD CONSTRAINT IF NOT EXISTS unique_user_category_date 
UNIQUE (user_id, category_id, completed_at);

ALTER TABLE axis6_streaks 
ADD CONSTRAINT IF NOT EXISTS unique_user_category_streak 
UNIQUE (user_id, category_id);

ALTER TABLE axis6_user_mantras 
ADD CONSTRAINT IF NOT EXISTS unique_user_mantra_date 
UNIQUE (user_id, mantra_id, completed_at);

ALTER TABLE axis6_time_blocks 
ADD CONSTRAINT IF NOT EXISTS unique_user_time_slot 
UNIQUE (user_id, date, start_time);

-- =====================================================
-- PHASE 3: BASIC RLS POLICIES FOR API FUNCTIONALITY
-- =====================================================

-- Profiles table (uses 'id' column, not 'user_id')
CREATE POLICY "Users can view own profile" ON axis6_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON axis6_profiles  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON axis6_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Checkins table (uses 'user_id' column)
CREATE POLICY "Users can view own checkins" ON axis6_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON axis6_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON axis6_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON axis6_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- Streaks table
CREATE POLICY "Users can view own streaks" ON axis6_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON axis6_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON axis6_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Daily stats table
CREATE POLICY "Users can view own daily stats" ON axis6_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily stats" ON axis6_daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats" ON axis6_daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Time blocks table
CREATE POLICY "Users can manage own time blocks" ON axis6_time_blocks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Hex reactions table
CREATE POLICY "Users can manage own hex reactions" ON axis6_hex_reactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User mantras table  
CREATE POLICY "Users can manage own mantras" ON axis6_user_mantras
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PHASE 4: CHAT SYSTEM RLS POLICIES
-- =====================================================

-- Chat rooms - users can see rooms they participate in
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

-- Chat messages - users can see messages in rooms they participate in
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
-- PHASE 5: PUBLIC ACCESS POLICIES
-- =====================================================

-- Categories table - public read access
CREATE POLICY "Categories are public" ON axis6_categories
  FOR SELECT TO public USING (true);

-- Mantras table - public read access for active mantras
CREATE POLICY "Active mantras are public" ON axis6_mantras
  FOR SELECT TO public USING (is_active = true);

-- =====================================================
-- PHASE 6: PERFORMANCE INDEXES
-- =====================================================

-- Critical indexes for API performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkins_user_today 
ON axis6_checkins(user_id, completed_at) 
WHERE completed_at = CURRENT_DATE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkins_user_date_category 
ON axis6_checkins(user_id, completed_at DESC, category_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaks_user_lookup 
ON axis6_streaks(user_id, category_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_stats_user_date 
ON axis6_daily_stats(user_id, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_id_lookup 
ON axis6_profiles(id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_blocks_user_date 
ON axis6_time_blocks(user_id, date DESC);

-- Chat system indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_room_created 
ON axis6_chat_messages(room_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_participants_room_user 
ON axis6_chat_participants(room_id, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_created_by 
ON axis6_chat_rooms(created_by);

-- =====================================================
-- PHASE 7: ESSENTIAL RPC FUNCTIONS
-- =====================================================

-- Create get_my_day_data function for dashboard
CREATE OR REPLACE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify user can only access their own data
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
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
    AND c.completed_at = p_date
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
  daily_summary AS (
    SELECT 
      COUNT(*) as total_checkins,
      AVG(mood) as average_mood,
      COUNT(DISTINCT category_id) as categories_completed
    FROM axis6_checkins
    WHERE user_id = p_user_id 
    AND completed_at = p_date
  )
  SELECT json_build_object(
    'checkins', COALESCE((SELECT json_agg(row_to_json(user_checkins)) FROM user_checkins), '[]'::json),
    'streaks', COALESCE((SELECT json_agg(row_to_json(user_streaks)) FROM user_streaks), '[]'::json),
    'summary', (SELECT row_to_json(daily_summary) FROM daily_summary),
    'date', p_date
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_my_day_data(UUID, DATE) TO authenticated;

-- =====================================================
-- PHASE 8: VALIDATION & CLEANUP
-- =====================================================

-- Ensure all tables have proper ownership
ALTER TABLE axis6_profiles OWNER TO postgres;
ALTER TABLE axis6_categories OWNER TO postgres;
ALTER TABLE axis6_checkins OWNER TO postgres;
ALTER TABLE axis6_streaks OWNER TO postgres;
ALTER TABLE axis6_daily_stats OWNER TO postgres;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;

-- =====================================================
-- POST-EXECUTION VERIFICATION
-- =====================================================

-- Run these queries to verify the fix worked:
/*

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'axis6_%' 
ORDER BY tablename;

-- Check constraints exist
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'axis6_checkins'::regclass;

-- Check policies exist  
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies 
WHERE tablename LIKE 'axis6_%'
ORDER BY tablename, policyname;

-- Test the RPC function
SELECT get_my_day_data(auth.uid(), CURRENT_DATE);

*/

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
1. After running this script, test all API endpoints thoroughly
2. Some API endpoints may temporarily fail until proper auth is added
3. Chat system will require additional participant validation
4. Monitor performance impact of new indexes
5. Consider running ANALYZE on all modified tables

To monitor the impact:
SELECT * FROM pg_stat_user_tables WHERE relname LIKE 'axis6_%';
*/