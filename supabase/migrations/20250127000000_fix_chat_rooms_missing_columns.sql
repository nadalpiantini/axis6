-- Fix Missing Columns in Chat Rooms Table
-- Migration: 20250127000000_fix_chat_rooms_missing_columns.sql
-- Fixes the 500 error when creating chat rooms by adding missing columns

BEGIN;

-- Add missing is_private column to axis6_chat_rooms table
ALTER TABLE axis6_chat_rooms 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add index for privacy filtering
CREATE INDEX IF NOT EXISTS idx_chat_rooms_privacy 
ON axis6_chat_rooms(is_private, is_active);

-- Update RLS policies to handle private rooms
-- Private rooms should only be visible to participants
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON axis6_chat_rooms;

CREATE POLICY "Users can view rooms they participate in" ON axis6_chat_rooms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM axis6_chat_participants 
    WHERE room_id = axis6_chat_rooms.id 
    AND user_id = auth.uid()
  )
);

-- Allow users to create rooms
DROP POLICY IF EXISTS "Users can create rooms" ON axis6_chat_rooms;

CREATE POLICY "Users can create rooms" ON axis6_chat_rooms
FOR INSERT
WITH CHECK (creator_id = auth.uid());

-- Allow room creators and admins to update rooms
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON axis6_chat_rooms;

CREATE POLICY "Room creators and admins can update rooms" ON axis6_chat_rooms
FOR UPDATE
USING (
  creator_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM axis6_chat_participants 
    WHERE room_id = axis6_chat_rooms.id 
    AND user_id = auth.uid() 
    AND role IN ('admin', 'moderator')
  )
);

COMMIT;
