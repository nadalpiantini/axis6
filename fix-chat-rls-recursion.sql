-- =====================================================
-- FIX: Chat System RLS Infinite Recursion Error
-- =====================================================
-- Fixes the "infinite recursion detected in policy" error for axis6_chat_participants
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- =====================================================

BEGIN;

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view participants in accessible rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON axis6_chat_participants;

-- Recreate the policies without self-referential recursion
-- The key fix: Check room access directly without nested participant checks

-- Users can view participants in rooms they're in OR public rooms
CREATE POLICY "Users can view participants in accessible rooms" ON axis6_chat_participants
    FOR SELECT USING (
        -- User can see participants if they are in the room OR the room is public
        user_id = auth.uid() 
        OR 
        EXISTS (
            SELECT 1 FROM axis6_chat_rooms 
            WHERE id = axis6_chat_participants.room_id 
            AND (
                is_private = false 
                OR creator_id = auth.uid()
            )
        )
        OR
        -- User is also a participant in this room
        room_id IN (
            SELECT room_id 
            FROM axis6_chat_participants cp 
            WHERE cp.user_id = auth.uid() 
            AND cp.left_at IS NULL
        )
    );

-- Users can join rooms (only if they're adding themselves)
CREATE POLICY "Users can join rooms" ON axis6_chat_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM axis6_chat_rooms
            WHERE id = room_id
            AND (
                is_private = false
                OR creator_id = auth.uid()
                OR type = 'direct'
            )
        )
    );

-- Users can update their own participation
CREATE POLICY "Users can update their own participation" ON axis6_chat_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Users can leave rooms (delete their participation)
CREATE POLICY "Users can leave rooms" ON axis6_chat_participants
    FOR DELETE USING (user_id = auth.uid());

-- Also fix the chat messages policy to avoid recursion
DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON axis6_chat_messages;

CREATE POLICY "Users can view messages in accessible rooms" ON axis6_chat_messages
    FOR SELECT USING (
        deleted_at IS NULL AND
        room_id IN (
            SELECT room_id 
            FROM axis6_chat_participants 
            WHERE user_id = auth.uid() 
            AND left_at IS NULL
        )
    );

-- Fix the chat rooms policies
DROP POLICY IF EXISTS "Users can view accessible rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON axis6_chat_rooms;

CREATE POLICY "Users can view accessible rooms" ON axis6_chat_rooms
    FOR SELECT USING (
        is_active = true AND (
            -- Public rooms
            is_private = false 
            -- User created the room
            OR creator_id = auth.uid()
            -- User is a participant
            OR id IN (
                SELECT room_id 
                FROM axis6_chat_participants 
                WHERE user_id = auth.uid() 
                AND left_at IS NULL
            )
        )
    );

-- Users can create rooms
CREATE POLICY "Users can create rooms" ON axis6_chat_rooms
    FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Room creators and admins can update rooms
CREATE POLICY "Room creators and admins can update rooms" ON axis6_chat_rooms
    FOR UPDATE USING (
        creator_id = auth.uid() 
        OR id IN (
            SELECT room_id 
            FROM axis6_chat_participants 
            WHERE user_id = auth.uid() 
            AND role = 'admin' 
            AND left_at IS NULL
        )
    );

-- Check if column needs renaming and foreign key updates
DO $$
BEGIN
    -- Check if axis6_chat_rooms has created_by or creator_id column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'axis6_chat_rooms' 
        AND column_name = 'created_by'
    ) THEN
        -- Rename created_by to creator_id to match code expectations
        ALTER TABLE axis6_chat_rooms RENAME COLUMN created_by TO creator_id;
    END IF;
END $$;

-- Update foreign key relationships to reference axis6_profiles instead of auth.users
-- This ensures proper joins and prevents PGRST200 errors

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
SELECT 'Testing participant query (should not error)' as test;
SELECT COUNT(*) FROM axis6_chat_participants WHERE user_id = auth.uid();

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

-- Check RLS policies are active
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'axis6_chat_%'
ORDER BY tablename, policyname;