-- EMERGENCY FIX: Chat System Foreign Key Relationships
-- Run this directly in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new

-- Fix Chat System Foreign Key Relationships
-- Update chat tables to properly reference axis6_profiles instead of auth.users
-- This fixes the PGRST200 error: "Could not find a relationship between 'axis6_chat_participants' and 'axis6_profiles'"

BEGIN;

-- Drop existing foreign key constraints and recreate them to reference axis6_profiles
-- This ensures Supabase can properly join the tables

-- Update axis6_chat_rooms creator_id to reference axis6_profiles
ALTER TABLE axis6_chat_rooms 
DROP CONSTRAINT IF EXISTS axis6_chat_rooms_creator_id_fkey;

ALTER TABLE axis6_chat_rooms 
ADD CONSTRAINT axis6_chat_rooms_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES axis6_profiles(id) ON DELETE SET NULL;

-- Update axis6_chat_participants user_id to reference axis6_profiles  
ALTER TABLE axis6_chat_participants 
DROP CONSTRAINT IF EXISTS axis6_chat_participants_user_id_fkey;

ALTER TABLE axis6_chat_participants 
ADD CONSTRAINT axis6_chat_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

-- Update axis6_chat_messages sender_id to reference axis6_profiles
ALTER TABLE axis6_chat_messages 
DROP CONSTRAINT IF EXISTS axis6_chat_messages_sender_id_fkey;

ALTER TABLE axis6_chat_messages 
ADD CONSTRAINT axis6_chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

-- Update axis6_chat_reactions user_id to reference axis6_profiles
ALTER TABLE axis6_chat_reactions 
DROP CONSTRAINT IF EXISTS axis6_chat_reactions_user_id_fkey;

ALTER TABLE axis6_chat_reactions 
ADD CONSTRAINT axis6_chat_reactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

-- Refresh the schema cache to ensure Supabase recognizes the new relationships
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Verify the foreign key relationships are now in place
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
  AND ccu.table_name = 'axis6_profiles'
ORDER BY tc.table_name, kcu.column_name;
