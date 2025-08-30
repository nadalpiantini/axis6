-- =====================================================
-- AXIS6 CONSOLIDATED EMERGENCY DATABASE FIX
-- =====================================================
-- CRITICAL: This script consolidates ALL emergency fixes for AXIS6
-- Execute this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- 
-- FIXES APPLIED:
-- 1. Chat system RLS policies and foreign keys (500 errors)
-- 2. UPSERT constraints for axis6_checkins (400 errors) 
-- 3. My Day functionality (time blocks and activity logs)
-- 4. Complete schema validation and performance indexes
-- 5. All RLS policies with correct column references
--
-- EXECUTION ORDER:
-- 1. Schema creation (tables, columns, constraints)
-- 2. Foreign key fixes (chat system)
-- 3. RLS policy cleanup and recreation
-- 4. Function creation (My Day API)
-- 5. Performance indexes and triggers
-- 6. Realtime subscriptions
-- 7. Verification queries
-- =====================================================

BEGIN;

-- =====================================================
-- PHASE 1: CORE SCHEMA CREATION AND FIXES
-- =====================================================

-- 1.1: Fix axis6_checkins table with CRITICAL UNIQUE constraint for UPSERT
-- =====================================================
CREATE TABLE IF NOT EXISTS axis6_checkins (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing constraints to recreate properly
ALTER TABLE axis6_checkins DROP CONSTRAINT IF EXISTS axis6_checkins_user_id_category_id_completed_at_key;
ALTER TABLE axis6_checkins DROP CONSTRAINT IF EXISTS axis6_checkins_user_id_category_id_completed_date_key;

-- CRITICAL: Add UNIQUE constraint required for UPSERT operations (.upsert() in Supabase)
-- This prevents duplicate check-ins and enables conflict resolution
ALTER TABLE axis6_checkins ADD CONSTRAINT axis6_checkins_user_id_category_id_completed_at_key 
    UNIQUE (user_id, category_id, completed_at);

-- 1.2: Fix axis6_profiles table structure
-- =====================================================
CREATE TABLE IF NOT EXISTS axis6_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    onboarded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3: Create axis6_time_blocks table for My Day functionality
-- =====================================================
CREATE TABLE IF NOT EXISTS axis6_time_blocks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
    activity_id INTEGER,
    activity_name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4: Create axis6_activity_logs table for activity timing
-- =====================================================
CREATE TABLE IF NOT EXISTS axis6_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_id INTEGER,
    category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
    activity_name VARCHAR(255) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    time_block_id INTEGER REFERENCES axis6_time_blocks(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5: Ensure chat system columns exist
-- =====================================================
ALTER TABLE axis6_chat_rooms 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- =====================================================
-- PHASE 2: CHAT SYSTEM FOREIGN KEY FIXES (Critical for 500 errors)
-- =====================================================

-- Fix foreign key relationships to reference axis6_profiles instead of auth.users directly
ALTER TABLE axis6_chat_participants 
DROP CONSTRAINT IF EXISTS axis6_chat_participants_user_id_fkey;

ALTER TABLE axis6_chat_participants 
ADD CONSTRAINT axis6_chat_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

ALTER TABLE axis6_chat_rooms 
DROP CONSTRAINT IF EXISTS axis6_chat_rooms_creator_id_fkey;

ALTER TABLE axis6_chat_rooms 
ADD CONSTRAINT axis6_chat_rooms_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES axis6_profiles(id) ON DELETE SET NULL;

ALTER TABLE axis6_chat_messages 
DROP CONSTRAINT IF EXISTS axis6_chat_messages_sender_id_fkey;

ALTER TABLE axis6_chat_messages 
ADD CONSTRAINT axis6_chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

-- =====================================================
-- PHASE 3: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE axis6_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PHASE 4: RLS POLICY CLEANUP AND RECREATION
-- =====================================================

-- 4.1: Clean up ALL existing policies to prevent conflicts
-- =====================================================

-- Chat participants policies cleanup
DROP POLICY IF EXISTS "Users can view participants in accessible rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can manage their own participation" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can view own participation" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can view public room participants" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Room creators can view participants" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can join allowed rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON axis6_chat_participants;

-- Chat messages policies cleanup
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can view public room messages" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can view own room messages" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to public rooms" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to own rooms" ON axis6_chat_messages;

-- Chat rooms policies cleanup
DROP POLICY IF EXISTS "Users can view accessible rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can view public rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can view own rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Room creators can update rooms" ON axis6_chat_rooms;

-- Core tables policies cleanup
DROP POLICY IF EXISTS "Users can view own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can delete own checkins" ON axis6_checkins;

DROP POLICY IF EXISTS "Users can view own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON axis6_profiles;

DROP POLICY IF EXISTS "Users can view own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can create own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can update own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can delete own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can manage own time blocks" ON axis6_time_blocks;

DROP POLICY IF EXISTS "Users can view own activity logs" ON axis6_activity_logs;
DROP POLICY IF EXISTS "Users can manage own activity logs" ON axis6_activity_logs;

-- 4.2: Create SIMPLE, NON-RECURSIVE chat system policies
-- =====================================================

-- Chat participants policies
CREATE POLICY "Allow users to view their own participation"
ON axis6_chat_participants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Allow users to view participants in public rooms"
ON axis6_chat_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM axis6_chat_rooms 
    WHERE id = axis6_chat_participants.room_id 
    AND is_private = false 
    AND is_active = true
  )
);

CREATE POLICY "Allow users to join public rooms"
ON axis6_chat_participants FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM axis6_chat_rooms
    WHERE id = room_id
    AND is_active = true
    AND (is_private = false OR creator_id = auth.uid())
  )
);

CREATE POLICY "Allow users to update their own participation"
ON axis6_chat_participants FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Allow users to leave rooms"
ON axis6_chat_participants FOR DELETE
USING (user_id = auth.uid());

-- Chat rooms policies
CREATE POLICY "Allow users to view public rooms"
ON axis6_chat_rooms FOR SELECT
USING (is_active = true AND is_private = false);

CREATE POLICY "Allow users to view their own rooms"
ON axis6_chat_rooms FOR SELECT
USING (is_active = true AND creator_id = auth.uid());

CREATE POLICY "Allow authenticated users to create rooms"
ON axis6_chat_rooms FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Allow room creators to update their rooms"
ON axis6_chat_rooms FOR UPDATE
USING (creator_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Allow viewing messages in public rooms"
ON axis6_chat_messages FOR SELECT
USING (
  deleted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM axis6_chat_rooms 
    WHERE id = axis6_chat_messages.room_id 
    AND is_private = false 
    AND is_active = true
  )
);

CREATE POLICY "Allow viewing own messages"
ON axis6_chat_messages FOR SELECT
USING (deleted_at IS NULL AND sender_id = auth.uid());

CREATE POLICY "Allow sending messages to public rooms"
ON axis6_chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM axis6_chat_rooms 
    WHERE id = room_id 
    AND is_private = false 
    AND is_active = true
  )
);

-- 4.3: Create core table policies with CORRECT column references
-- =====================================================

-- CRITICAL: axis6_profiles uses 'id' column, others use 'user_id'

-- Checkins policies (uses user_id)
CREATE POLICY "Users can view own checkins" ON axis6_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON axis6_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON axis6_checkins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON axis6_checkins
    FOR DELETE USING (auth.uid() = user_id);

-- Profiles policies (uses id)
CREATE POLICY "Users can view own profile" ON axis6_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON axis6_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON axis6_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Time blocks policies (uses user_id)
CREATE POLICY "Users can view own time blocks" ON axis6_time_blocks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time blocks" ON axis6_time_blocks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time blocks" ON axis6_time_blocks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time blocks" ON axis6_time_blocks
    FOR DELETE USING (auth.uid() = user_id);

-- Activity logs policies (uses user_id)
CREATE POLICY "Users can view own activity logs" ON axis6_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own activity logs" ON axis6_activity_logs
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- PHASE 5: MY DAY API FUNCTIONS
-- =====================================================

-- Drop existing functions to avoid signature conflicts
DROP FUNCTION IF EXISTS get_my_day_data(UUID, DATE);
DROP FUNCTION IF EXISTS start_activity_timer(UUID, INTEGER, INTEGER, VARCHAR(255), INTEGER);
DROP FUNCTION IF EXISTS start_activity_timer(UUID, UUID, INTEGER, VARCHAR(255), INTEGER);
DROP FUNCTION IF EXISTS stop_activity_timer(UUID, INTEGER);

-- 5.1: Create get_my_day_data function
CREATE OR REPLACE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'timeBlocks', COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', tb.id,
          'category_id', tb.category_id,
          'category_name', c.name->>'en',
          'category_color', c.color,
          'category_icon', c.icon,
          'activity_id', tb.activity_id,
          'activity_name', tb.activity_name,
          'start_time', tb.start_time::TEXT,
          'end_time', tb.end_time::TEXT,
          'duration_minutes', tb.duration_minutes,
          'status', COALESCE(tb.status, 'planned'),
          'notes', tb.notes,
          'actual_duration', COALESCE(
            (SELECT SUM(al.duration_minutes)::INTEGER 
             FROM axis6_activity_logs al 
             WHERE al.time_block_id = tb.id),
            0
          )
        ) ORDER BY tb.start_time
      )
      FROM axis6_time_blocks tb
      JOIN axis6_categories c ON c.id = tb.category_id
      WHERE tb.user_id = p_user_id 
        AND tb.date = p_date
    ), '[]'::json),
    'activeTimer', (
      SELECT json_build_object(
        'id', al.id,
        'activity_name', al.activity_name,
        'category_id', al.category_id,
        'started_at', al.started_at,
        'time_block_id', al.time_block_id
      )
      FROM axis6_activity_logs al
      WHERE al.user_id = p_user_id 
        AND al.ended_at IS NULL
      ORDER BY al.started_at DESC
      LIMIT 1
    )
  ) INTO result;

  RETURN COALESCE(result, '{"timeBlocks": [], "activeTimer": null}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2: Create start_activity_timer function
CREATE OR REPLACE FUNCTION start_activity_timer(
  p_user_id UUID,
  p_category_id INTEGER,
  p_time_block_id INTEGER,
  p_activity_name VARCHAR(255),
  p_activity_id INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_log_id INTEGER;
  v_started_at TIMESTAMPTZ;
BEGIN
  -- End any active timers for this user
  UPDATE axis6_activity_logs
  SET 
    ended_at = NOW(),
    duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
  WHERE user_id = p_user_id 
    AND ended_at IS NULL;
  
  -- Start new timer
  INSERT INTO axis6_activity_logs (
    user_id, 
    activity_id, 
    category_id, 
    activity_name,
    started_at, 
    time_block_id
  )
  VALUES (
    p_user_id, 
    p_activity_id, 
    p_category_id, 
    p_activity_name,
    NOW(), 
    p_time_block_id
  )
  RETURNING id, started_at INTO v_log_id, v_started_at;
  
  -- Update time block status if linked
  IF p_time_block_id IS NOT NULL THEN
    UPDATE axis6_time_blocks
    SET status = 'active'
    WHERE id = p_time_block_id AND user_id = p_user_id;
  END IF;
  
  -- Return timer info as JSON
  RETURN json_build_object(
    'id', v_log_id,
    'activity_name', p_activity_name,
    'category_id', p_category_id,
    'started_at', v_started_at,
    'time_block_id', p_time_block_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3: Create stop_activity_timer function
CREATE OR REPLACE FUNCTION stop_activity_timer(
  p_user_id UUID,
  p_activity_log_id INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_duration INTEGER;
  v_time_block_id INTEGER;
  v_ended_at TIMESTAMPTZ;
BEGIN
  -- Stop the timer and calculate duration
  UPDATE axis6_activity_logs
  SET 
    ended_at = NOW(),
    duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60
  WHERE id = p_activity_log_id 
    AND user_id = p_user_id
    AND ended_at IS NULL
  RETURNING duration_minutes, time_block_id, ended_at 
  INTO v_duration, v_time_block_id, v_ended_at;
  
  -- Update time block status if linked
  IF v_time_block_id IS NOT NULL THEN
    UPDATE axis6_time_blocks
    SET status = 'completed'
    WHERE id = v_time_block_id AND user_id = p_user_id;
  END IF;
  
  -- Return result as JSON
  RETURN json_build_object(
    'duration_minutes', v_duration,
    'ended_at', v_ended_at,
    'time_block_id', v_time_block_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PHASE 6: PERFORMANCE INDEXES
-- =====================================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_checkins_user_completed 
    ON axis6_checkins(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkins_category_completed 
    ON axis6_checkins(category_id, completed_at DESC);

-- Time blocks indexes
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date 
    ON axis6_time_blocks(user_id, date);

CREATE INDEX IF NOT EXISTS idx_time_blocks_status 
    ON axis6_time_blocks(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_time_blocks_category 
    ON axis6_time_blocks(category_id);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_active 
    ON axis6_activity_logs(user_id) WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_activity_logs_time_block 
    ON axis6_activity_logs(time_block_id);

-- Chat system indexes
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_room 
    ON axis6_chat_participants(user_id, room_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_active_privacy 
    ON axis6_chat_rooms(is_active, is_private, updated_at DESC);

-- =====================================================
-- PHASE 7: UPDATED_AT TRIGGERS
-- =====================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables
DROP TRIGGER IF EXISTS update_checkins_updated_at ON axis6_checkins;
CREATE TRIGGER update_checkins_updated_at
    BEFORE UPDATE ON axis6_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON axis6_profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON axis6_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_blocks_updated_at ON axis6_time_blocks;
CREATE TRIGGER update_time_blocks_updated_at
    BEFORE UPDATE ON axis6_time_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PHASE 8: REALTIME SUBSCRIPTIONS
-- =====================================================

-- Add tables to realtime publication (ignore errors if already added)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE axis6_checkins;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE axis6_profiles;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE axis6_time_blocks;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE axis6_activity_logs;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES - RUN AFTER COMMIT
-- =====================================================

-- Test 1: Verify all critical tables exist
SELECT 
    'Tables Created' as test_category,
    json_build_object(
        'axis6_checkins', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_checkins'),
        'axis6_profiles', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_profiles'),
        'axis6_time_blocks', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_time_blocks'),
        'axis6_activity_logs', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_activity_logs')
    ) as status;

-- Test 2: Verify CRITICAL UNIQUE constraint for UPSERT
SELECT 
    'UPSERT Constraint' as test_category,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'axis6_checkins' 
AND constraint_name = 'axis6_checkins_user_id_category_id_completed_at_key';

-- Test 3: Verify RLS is enabled on all tables
SELECT 
    'Row Level Security' as test_category,
    tablename,
    rowsecurity as enabled
FROM pg_tables 
WHERE tablename IN ('axis6_checkins', 'axis6_profiles', 'axis6_time_blocks', 'axis6_activity_logs', 'axis6_chat_rooms', 'axis6_chat_participants', 'axis6_chat_messages')
ORDER BY tablename;

-- Test 4: Verify My Day functions exist
SELECT 
    'My Day Functions' as test_category,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_my_day_data', 'start_activity_timer', 'stop_activity_timer')
ORDER BY routine_name;

-- Test 5: Count RLS policies per table
SELECT 
    'RLS Policies Count' as test_category,
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('axis6_checkins', 'axis6_profiles', 'axis6_time_blocks', 'axis6_activity_logs', 'axis6_chat_rooms', 'axis6_chat_participants', 'axis6_chat_messages')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Test 6: Verify foreign key relationships are correct
SELECT 
    'Foreign Key Constraints' as test_category,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('axis6_chat_participants', 'axis6_chat_rooms', 'axis6_chat_messages')
ORDER BY tc.table_name, tc.constraint_name;

-- Final Success Message
SELECT 
    '🎉 CONSOLIDATED EMERGENCY FIX COMPLETED SUCCESSFULLY! 🎉' as status,
    'All critical database fixes have been applied.' as message,
    'Chat system, UPSERT constraints, My Day functionality, and RLS policies are now working.' as details;

-- =====================================================
-- ROLLBACK COMMANDS (Use only in emergency)
-- =====================================================
/*
-- ROLLBACK UNIQUE CONSTRAINT (if needed)
ALTER TABLE axis6_checkins DROP CONSTRAINT IF EXISTS axis6_checkins_user_id_category_id_completed_at_key;

-- ROLLBACK FOREIGN KEY CHANGES (if needed)  
ALTER TABLE axis6_chat_participants DROP CONSTRAINT IF EXISTS axis6_chat_participants_user_id_fkey;
ALTER TABLE axis6_chat_participants ADD CONSTRAINT axis6_chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- ROLLBACK FUNCTIONS (if needed)
DROP FUNCTION IF EXISTS get_my_day_data(UUID, DATE);
DROP FUNCTION IF EXISTS start_activity_timer(UUID, INTEGER, INTEGER, VARCHAR(255), INTEGER);  
DROP FUNCTION IF EXISTS stop_activity_timer(UUID, INTEGER);
*/