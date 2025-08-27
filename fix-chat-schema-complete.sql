-- COMPLETE CHAT SCHEMA FIX
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- This script fixes the foreign key relationships that are causing 400 errors

BEGIN;

-- First, let's see what tables and columns we actually have
-- Check if chat tables exist and what their current structure is

-- Step 1: Check if the chat tables exist at all
DO $$
BEGIN
    -- If axis6_chat_rooms doesn't exist, create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_rooms') THEN
        CREATE TABLE axis6_chat_rooms (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL CHECK (type IN ('direct', 'category', 'group', 'support')),
            category_id INTEGER REFERENCES axis6_categories(id) ON DELETE SET NULL,
            is_active BOOLEAN DEFAULT true,
            max_participants INTEGER DEFAULT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_type_active 
        ON axis6_chat_rooms(type, is_active, created_at DESC);
        
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_category 
        ON axis6_chat_rooms(category_id, is_active) 
        WHERE category_id IS NOT NULL;
    END IF;

    -- If axis6_chat_participants doesn't exist, create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_participants') THEN
        CREATE TABLE axis6_chat_participants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id UUID NOT NULL REFERENCES axis6_chat_rooms(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES axis6_profiles(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
            joined_at TIMESTAMPTZ DEFAULT NOW(),
            last_seen TIMESTAMPTZ DEFAULT NOW(),
            is_muted BOOLEAN DEFAULT false,
            notification_settings JSONB DEFAULT '{"mentions": true, "all": true}',
            UNIQUE(room_id, user_id)
        );
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_chat_participants_room 
        ON axis6_chat_participants(room_id, joined_at DESC);
        
        CREATE INDEX IF NOT EXISTS idx_chat_participants_user 
        ON axis6_chat_participants(user_id, last_seen DESC);
    END IF;

    -- If axis6_chat_messages doesn't exist, create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_messages') THEN
        CREATE TABLE axis6_chat_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            room_id UUID NOT NULL REFERENCES axis6_chat_rooms(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES axis6_profiles(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'achievement')),
            reply_to_id UUID REFERENCES axis6_chat_messages(id) ON DELETE SET NULL,
            metadata JSONB DEFAULT '{}',
            edited_at TIMESTAMPTZ,
            deleted_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time 
        ON axis6_chat_messages(room_id, created_at DESC) 
        WHERE deleted_at IS NULL;
        
        CREATE INDEX IF NOT EXISTS idx_chat_messages_sender 
        ON axis6_chat_messages(sender_id, created_at DESC) 
        WHERE deleted_at IS NULL;
    END IF;

    -- If axis6_chat_reactions doesn't exist, create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_reactions') THEN
        CREATE TABLE axis6_chat_reactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            message_id UUID NOT NULL REFERENCES axis6_chat_messages(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES axis6_profiles(id) ON DELETE CASCADE,
            emoji TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(message_id, user_id, emoji)
        );
        
        -- Add indexes
        CREATE INDEX IF NOT EXISTS idx_chat_reactions_message 
        ON axis6_chat_reactions(message_id, emoji);
    END IF;
END $$;

-- Step 2: Fix foreign key constraints for existing tables
-- Only update foreign keys for tables that exist and have wrong references

-- Fix axis6_chat_participants if it exists but has wrong foreign key
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_participants') THEN
        -- Drop existing constraint to auth.users if it exists
        ALTER TABLE axis6_chat_participants 
        DROP CONSTRAINT IF EXISTS axis6_chat_participants_user_id_fkey;
        
        -- Add correct constraint to axis6_profiles
        ALTER TABLE axis6_chat_participants 
        ADD CONSTRAINT axis6_chat_participants_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix axis6_chat_messages if it exists but has wrong foreign key
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_messages') THEN
        -- Drop existing constraint to auth.users if it exists
        ALTER TABLE axis6_chat_messages 
        DROP CONSTRAINT IF EXISTS axis6_chat_messages_sender_id_fkey;
        
        -- Add correct constraint to axis6_profiles
        ALTER TABLE axis6_chat_messages 
        ADD CONSTRAINT axis6_chat_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix axis6_chat_reactions if it exists but has wrong foreign key
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_reactions') THEN
        -- Drop existing constraint to auth.users if it exists
        ALTER TABLE axis6_chat_reactions 
        DROP CONSTRAINT IF EXISTS axis6_chat_reactions_user_id_fkey;
        
        -- Add correct constraint to axis6_profiles
        ALTER TABLE axis6_chat_reactions 
        ADD CONSTRAINT axis6_chat_reactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 3: Enable RLS policies
ALTER TABLE axis6_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_reactions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Chat rooms: Users can see rooms they're participants in
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON axis6_chat_rooms;
CREATE POLICY "Users can view rooms they participate in" ON axis6_chat_rooms
  FOR SELECT USING (
    id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
  );

-- Chat rooms: Authenticated users can create rooms
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON axis6_chat_rooms;
CREATE POLICY "Authenticated users can create rooms" ON axis6_chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Chat participants: Users can see participants in their rooms
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON axis6_chat_participants;
CREATE POLICY "Users can view participants in their rooms" ON axis6_chat_participants
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
  );

-- Chat participants: Users can join/leave rooms
DROP POLICY IF EXISTS "Users can manage their own participation" ON axis6_chat_participants;
CREATE POLICY "Users can manage their own participation" ON axis6_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave rooms" ON axis6_chat_participants;
CREATE POLICY "Users can leave rooms" ON axis6_chat_participants
  FOR DELETE USING (user_id = auth.uid());

-- Chat messages: Users can see messages in their rooms
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON axis6_chat_messages;
CREATE POLICY "Users can view messages in their rooms" ON axis6_chat_messages
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid()) AND
    deleted_at IS NULL
  );

-- Chat messages: Participants can send messages
DROP POLICY IF EXISTS "Participants can send messages" ON axis6_chat_messages;
CREATE POLICY "Participants can send messages" ON axis6_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
  );

-- Chat messages: Users can edit their own messages
DROP POLICY IF EXISTS "Users can edit their own messages" ON axis6_chat_messages;
CREATE POLICY "Users can edit their own messages" ON axis6_chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Chat reactions: Users can see reactions in their rooms
DROP POLICY IF EXISTS "Users can view reactions in their rooms" ON axis6_chat_reactions;
CREATE POLICY "Users can view reactions in their rooms" ON axis6_chat_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM axis6_chat_messages 
      WHERE room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
    )
  );

-- Chat reactions: Participants can manage reactions
DROP POLICY IF EXISTS "Participants can manage reactions" ON axis6_chat_reactions;
CREATE POLICY "Participants can manage reactions" ON axis6_chat_reactions
  FOR ALL USING (
    user_id = auth.uid() AND
    message_id IN (
      SELECT id FROM axis6_chat_messages 
      WHERE room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
    )
  );

-- Step 5: Create default category-based chat rooms if they don't exist
INSERT INTO axis6_chat_rooms (name, description, type, category_id) 
SELECT * FROM (
  VALUES 
    ('Physical Wellness', 'Share your fitness journey and healthy habits', 'category', (SELECT id FROM axis6_categories WHERE slug = 'physical')),
    ('Mental Growth', 'Discuss learning, productivity, and mental challenges', 'category', (SELECT id FROM axis6_categories WHERE slug = 'mental')),
    ('Emotional Support', 'A safe space for emotional well-being discussions', 'category', (SELECT id FROM axis6_categories WHERE slug = 'emotional')),
    ('Social Connections', 'Build relationships and share social experiences', 'category', (SELECT id FROM axis6_categories WHERE slug = 'social')),
    ('Spiritual Journey', 'Explore mindfulness, meditation, and purpose', 'category', (SELECT id FROM axis6_categories WHERE slug = 'spiritual')),
    ('Material Goals', 'Career, finances, and material aspirations', 'category', (SELECT id FROM axis6_categories WHERE slug = 'material')),
    ('General Support', 'General questions and platform support', 'support', NULL)
) AS v(name, description, type, category_id)
WHERE NOT EXISTS (
  SELECT 1 FROM axis6_chat_rooms WHERE axis6_chat_rooms.name = v.name
);

-- Step 6: Refresh schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Verification: Show the current foreign key relationships
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
