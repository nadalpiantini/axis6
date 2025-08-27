-- ============================================
-- AXIS6 - CHAT SYSTEM FIXES SCRIPT
-- Copia TODO este contenido y pégalo en:
-- https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- Luego haz clic en RUN
-- ============================================

BEGIN;

-- 1. Add the missing is_private column to axis6_chat_rooms
ALTER TABLE axis6_chat_rooms 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 2. Fix Chat System Foreign Key Relationships
-- Update chat tables to properly reference axis6_profiles instead of auth.users
-- This fixes the PGRST200 error: "Could not find a relationship between 'axis6_chat_participants' and 'axis6_profiles'"

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

-- Update axis6_chat_mentions foreign keys (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_mentions') THEN
        ALTER TABLE axis6_chat_mentions 
        DROP CONSTRAINT IF EXISTS axis6_chat_mentions_mentioner_id_fkey;
        
        ALTER TABLE axis6_chat_mentions 
        ADD CONSTRAINT axis6_chat_mentions_mentioner_id_fkey 
        FOREIGN KEY (mentioner_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;
        
        ALTER TABLE axis6_chat_mentions 
        DROP CONSTRAINT IF EXISTS axis6_chat_mentions_mentioned_user_id_fkey;
        
        ALTER TABLE axis6_chat_mentions 
        ADD CONSTRAINT axis6_chat_mentions_mentioned_user_id_fkey 
        FOREIGN KEY (mentioned_user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- 3. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_privacy 
ON axis6_chat_rooms(is_private, is_active, created_at DESC);

-- 4. Update RLS policies to handle private rooms correctly
-- Drop old policy if exists
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON axis6_chat_rooms;

-- Create updated policy that handles both private and public rooms
CREATE POLICY "Users can view rooms they participate in" ON axis6_chat_rooms
  FOR SELECT USING (
    -- Users can see rooms they're participants in
    id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid()) OR
    -- Or public, active rooms
    (is_private = false AND is_active = true)
  );

-- Refresh the schema cache to ensure Supabase recognizes the new relationships
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'AXIS6 chat system fixes applied successfully!';
  RAISE NOTICE 'Fixed: 1) Added is_private column, 2) Fixed foreign key references to axis6_profiles, 3) Updated RLS policies';
END;
$$;

