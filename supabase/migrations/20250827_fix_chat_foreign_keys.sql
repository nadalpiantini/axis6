-- Fix Chat System Foreign Key Relationships
-- Update chat tables to properly reference axis6_profiles instead of auth.users
-- This fixes the PGRST200 error: "Could not find a relationship between 'axis6_chat_participants' and 'axis6_profiles'"

BEGIN;

-- First, let's check if the chat tables exist and have data
-- If they exist with data, we need to preserve it

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

-- Update RLS policies to ensure they work with the new foreign key structure
-- The policies should still work since axis6_profiles.id = auth.users.id

-- Refresh the schema cache to ensure Supabase recognizes the new relationships
NOTIFY pgrst, 'reload schema';

COMMIT;
