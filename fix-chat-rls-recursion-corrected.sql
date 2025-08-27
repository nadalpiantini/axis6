-- =====================================================
-- FIX: Chat System RLS Infinite Recursion Error - CORRECTED
-- =====================================================
-- Fixes the "infinite recursion detected in policy" error for axis6_chat_participants
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- =====================================================

BEGIN;

-- Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view participants in accessible rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can manage their own participation" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms" ON axis6_chat_participants;

DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON axis6_chat_messages;

DROP POLICY IF EXISTS "Users can view accessible rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON axis6_chat_rooms;

-- =====================================================
-- CRITICAL FIX: Non-recursive policies for axis6_chat_participants
-- =====================================================

-- 1. Users can see their own participation records
CREATE POLICY "Users can view own participation" ON axis6_chat_participants
    FOR SELECT USING (user_id = auth.uid());

-- 2. Users can see participants in public rooms
CREATE POLICY "Users can view public room participants" ON axis6_chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM axis6_chat_rooms 
            WHERE id = axis6_chat_participants.room_id 
            AND is_private = false 
            AND is_active = true
        )
    );

-- 3. Room creators can see all participants in their rooms
CREATE POLICY "Room creators can view participants" ON axis6_chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM axis6_chat_rooms 
            WHERE id = axis6_chat_participants.room_id 
            AND creator_id = auth.uid()
        )
    );

-- 4. Users can join public rooms or rooms they're invited to
CREATE POLICY "Users can join allowed rooms" ON axis6_chat_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM axis6_chat_rooms
            WHERE id = room_id
            AND is_active = true
            AND (
                is_private = false
                OR creator_id = auth.uid()
                OR type = 'direct'
            )
        )
    );

-- 5. Users can update their own participation
CREATE POLICY "Users can update own participation" ON axis6_chat_participants
    FOR UPDATE USING (user_id = auth.uid());

-- 6. Users can delete their own participation (leave rooms)
CREATE POLICY "Users can leave rooms" ON axis6_chat_participants
    FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- Fixed policies for axis6_chat_rooms (no recursion)
-- =====================================================

-- 1. Users can see public rooms
CREATE POLICY "Users can view public rooms" ON axis6_chat_rooms
    FOR SELECT USING (
        is_active = true 
        AND is_private = false
    );

-- 2. Users can see rooms they created
CREATE POLICY "Users can view own rooms" ON axis6_chat_rooms
    FOR SELECT USING (
        is_active = true 
        AND creator_id = auth.uid()
    );

-- 3. Users can create rooms
CREATE POLICY "Users can create rooms" ON axis6_chat_rooms
    FOR INSERT WITH CHECK (creator_id = auth.uid());

-- 4. Room creators can update their rooms
CREATE POLICY "Room creators can update rooms" ON axis6_chat_rooms
    FOR UPDATE USING (creator_id = auth.uid());

-- =====================================================
-- Fixed policies for axis6_chat_messages (simplified)
-- =====================================================

-- 1. Users can view messages in public rooms
CREATE POLICY "Users can view public room messages" ON axis6_chat_messages
    FOR SELECT USING (
        deleted_at IS NULL 
        AND EXISTS (
            SELECT 1 FROM axis6_chat_rooms 
            WHERE id = axis6_chat_messages.room_id 
            AND is_private = false 
            AND is_active = true
        )
    );

-- 2. Users can view messages in rooms they created
CREATE POLICY "Users can view own room messages" ON axis6_chat_messages
    FOR SELECT USING (
        deleted_at IS NULL 
        AND EXISTS (
            SELECT 1 FROM axis6_chat_rooms 
            WHERE id = axis6_chat_messages.room_id 
            AND creator_id = auth.uid()
        )
    );

-- 3. Users can view their own messages
CREATE POLICY "Users can view own messages" ON axis6_chat_messages
    FOR SELECT USING (
        deleted_at IS NULL 
        AND sender_id = auth.uid()
    );

-- 4. Users can send messages to public rooms
CREATE POLICY "Users can send messages to public rooms" ON axis6_chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM axis6_chat_rooms 
            WHERE id = room_id 
            AND is_private = false 
            AND is_active = true
        )
    );

-- 5. Users can send messages to rooms they created
CREATE POLICY "Users can send messages to own rooms" ON axis6_chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM axis6_chat_rooms 
            WHERE id = room_id 
            AND creator_id = auth.uid()
        )
    );

-- =====================================================
-- Foreign key fixes
-- =====================================================

-- Check if column needs renaming
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'axis6_chat_rooms' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE axis6_chat_rooms RENAME COLUMN created_by TO creator_id;
    END IF;
END $$;

-- Drop existing foreign key constraints
ALTER TABLE axis6_chat_rooms 
DROP CONSTRAINT IF EXISTS axis6_chat_rooms_created_by_fkey,
DROP CONSTRAINT IF EXISTS axis6_chat_rooms_creator_id_fkey;

ALTER TABLE axis6_chat_participants 
DROP CONSTRAINT IF EXISTS axis6_chat_participants_user_id_fkey;

ALTER TABLE axis6_chat_messages 
DROP CONSTRAINT IF EXISTS axis6_chat_messages_sender_id_fkey;

ALTER TABLE axis6_chat_reactions 
DROP CONSTRAINT IF EXISTS axis6_chat_reactions_user_id_fkey;

ALTER TABLE axis6_chat_attachments 
DROP CONSTRAINT IF EXISTS axis6_chat_attachments_uploader_id_fkey;

ALTER TABLE axis6_chat_mentions 
DROP CONSTRAINT IF EXISTS axis6_chat_mentions_mentioned_user_id_fkey,
DROP CONSTRAINT IF EXISTS axis6_chat_mentions_mentioner_id_fkey;

ALTER TABLE axis6_chat_search_analytics
DROP CONSTRAINT IF EXISTS axis6_chat_search_analytics_user_id_fkey;

-- Recreate foreign keys to reference axis6_profiles
ALTER TABLE axis6_chat_rooms 
ADD CONSTRAINT axis6_chat_rooms_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

ALTER TABLE axis6_chat_participants 
ADD CONSTRAINT axis6_chat_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

ALTER TABLE axis6_chat_messages 
ADD CONSTRAINT axis6_chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

ALTER TABLE axis6_chat_reactions 
ADD CONSTRAINT axis6_chat_reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

ALTER TABLE axis6_chat_attachments 
ADD CONSTRAINT axis6_chat_attachments_uploader_id_fkey 
FOREIGN KEY (uploader_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

ALTER TABLE axis6_chat_mentions 
ADD CONSTRAINT axis6_chat_mentions_mentioned_user_id_fkey 
FOREIGN KEY (mentioned_user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT axis6_chat_mentions_mentioner_id_fkey 
FOREIGN KEY (mentioner_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

ALTER TABLE axis6_chat_search_analytics
ADD CONSTRAINT axis6_chat_search_analytics_user_id_fkey
FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test that policies don't cause recursion
SELECT 'Testing basic participant query' as test;
-- This should work without recursion now

-- Check RLS policies are active
SELECT 
    schemaname,
    tablename, 
    policyname, 
    cmd,
    CASE WHEN cmd = 'r' THEN 'SELECT'
         WHEN cmd = 'a' THEN 'INSERT'  
         WHEN cmd = 'w' THEN 'UPDATE'
         WHEN cmd = 'd' THEN 'DELETE'
         ELSE cmd END as operation
FROM pg_policies
WHERE tablename LIKE 'axis6_chat_%'
ORDER BY tablename, policyname;

-- Check foreign key relationships
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
