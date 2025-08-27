-- FINAL CHAT SCHEMA FIX
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- This script fixes the foreign key relationships that are causing 400 errors

BEGIN;

-- Step 1: Diagnostic - Check what columns axis6_categories actually has
-- This will help us understand the current structure
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current axis6_categories structure:';
    FOR rec IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'axis6_categories'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: %, Type: %, Nullable: %', rec.column_name, rec.data_type, rec.is_nullable;
    END LOOP;
END $$;

-- Step 2: Check current data in categories table
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current axis6_categories data:';
    FOR rec IN 
        SELECT id, position, 
               CASE 
                   WHEN pg_typeof(slug) = 'text'::regtype THEN slug::text
                   WHEN pg_typeof(slug) = 'jsonb'::regtype THEN slug::text
                   ELSE 'unknown_type'
               END as slug_value
        FROM axis6_categories
        ORDER BY position
        LIMIT 10
    LOOP
        RAISE NOTICE 'ID: %, Position: %, Slug: %', rec.id, rec.position, rec.slug_value;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error reading categories: %', SQLERRM;
END $$;

-- Step 3: Create chat tables with proper foreign key references
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
        
        CREATE INDEX IF NOT EXISTS idx_chat_reactions_message 
        ON axis6_chat_reactions(message_id, emoji);
    END IF;
END $$;

-- Step 4: Fix foreign key constraints for existing tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_participants') THEN
        ALTER TABLE axis6_chat_participants 
        DROP CONSTRAINT IF EXISTS axis6_chat_participants_user_id_fkey;
        
        ALTER TABLE axis6_chat_participants 
        ADD CONSTRAINT axis6_chat_participants_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_messages') THEN
        ALTER TABLE axis6_chat_messages 
        DROP CONSTRAINT IF EXISTS axis6_chat_messages_sender_id_fkey;
        
        ALTER TABLE axis6_chat_messages 
        ADD CONSTRAINT axis6_chat_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'axis6_chat_reactions') THEN
        ALTER TABLE axis6_chat_reactions 
        DROP CONSTRAINT IF EXISTS axis6_chat_reactions_user_id_fkey;
        
        ALTER TABLE axis6_chat_reactions 
        ADD CONSTRAINT axis6_chat_reactions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 5: Enable RLS and create policies
ALTER TABLE axis6_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON axis6_chat_rooms;
CREATE POLICY "Users can view rooms they participate in" ON axis6_chat_rooms
  FOR SELECT USING (
    id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON axis6_chat_rooms;
CREATE POLICY "Authenticated users can create rooms" ON axis6_chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view participants in their rooms" ON axis6_chat_participants;
CREATE POLICY "Users can view participants in their rooms" ON axis6_chat_participants
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage their own participation" ON axis6_chat_participants;
CREATE POLICY "Users can manage their own participation" ON axis6_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave rooms" ON axis6_chat_participants;
CREATE POLICY "Users can leave rooms" ON axis6_chat_participants
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view messages in their rooms" ON axis6_chat_messages;
CREATE POLICY "Users can view messages in their rooms" ON axis6_chat_messages
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid()) AND
    deleted_at IS NULL
  );

DROP POLICY IF EXISTS "Participants can send messages" ON axis6_chat_messages;
CREATE POLICY "Participants can send messages" ON axis6_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can edit their own messages" ON axis6_chat_messages;
CREATE POLICY "Users can edit their own messages" ON axis6_chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can view reactions in their rooms" ON axis6_chat_reactions;
CREATE POLICY "Users can view reactions in their rooms" ON axis6_chat_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM axis6_chat_messages 
      WHERE room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can manage reactions" ON axis6_chat_reactions;
CREATE POLICY "Participants can manage reactions" ON axis6_chat_reactions
  FOR ALL USING (
    user_id = auth.uid() AND
    message_id IN (
      SELECT id FROM axis6_chat_messages 
      WHERE room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
    )
  );

-- Step 6: Create default chat rooms using position instead of slug
-- This avoids the JSON issue entirely by using position to identify categories
DO $$
BEGIN
    -- Insert default rooms if they don't exist, using position to identify categories
    IF NOT EXISTS (SELECT 1 FROM axis6_chat_rooms WHERE name = 'Physical Wellness') THEN
        INSERT INTO axis6_chat_rooms (name, description, type, category_id) 
        VALUES ('Physical Wellness', 'Share your fitness journey and healthy habits', 'category', 
                (SELECT id FROM axis6_categories WHERE position = 1)); -- Physical is position 1
    END IF;

    IF NOT EXISTS (SELECT 1 FROM axis6_chat_rooms WHERE name = 'Mental Growth') THEN
        INSERT INTO axis6_chat_rooms (name, description, type, category_id) 
        VALUES ('Mental Growth', 'Discuss learning, productivity, and mental challenges', 'category', 
                (SELECT id FROM axis6_categories WHERE position = 2)); -- Mental is position 2
    END IF;

    IF NOT EXISTS (SELECT 1 FROM axis6_chat_rooms WHERE name = 'Emotional Support') THEN
        INSERT INTO axis6_chat_rooms (name, description, type, category_id) 
        VALUES ('Emotional Support', 'A safe space for emotional well-being discussions', 'category', 
                (SELECT id FROM axis6_categories WHERE position = 3)); -- Emotional is position 3
    END IF;

    IF NOT EXISTS (SELECT 1 FROM axis6_chat_rooms WHERE name = 'Social Connections') THEN
        INSERT INTO axis6_chat_rooms (name, description, type, category_id) 
        VALUES ('Social Connections', 'Build relationships and share social experiences', 'category', 
                (SELECT id FROM axis6_categories WHERE position = 4)); -- Social is position 4
    END IF;

    IF NOT EXISTS (SELECT 1 FROM axis6_chat_rooms WHERE name = 'Spiritual Journey') THEN
        INSERT INTO axis6_chat_rooms (name, description, type, category_id) 
        VALUES ('Spiritual Journey', 'Explore mindfulness, meditation, and purpose', 'category', 
                (SELECT id FROM axis6_categories WHERE position = 5)); -- Spiritual is position 5
    END IF;

    IF NOT EXISTS (SELECT 1 FROM axis6_chat_rooms WHERE name = 'Material Goals') THEN
        INSERT INTO axis6_chat_rooms (name, description, type, category_id) 
        VALUES ('Material Goals', 'Career, finances, and material aspirations', 'category', 
                (SELECT id FROM axis6_categories WHERE position = 6)); -- Material is position 6
    END IF;

    IF NOT EXISTS (SELECT 1 FROM axis6_chat_rooms WHERE name = 'General Support') THEN
        INSERT INTO axis6_chat_rooms (name, description, type, category_id) 
        VALUES ('General Support', 'General questions and platform support', 'support', NULL);
    END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Show final results
SELECT 'Chat rooms created:' as status;
SELECT name, type, category_id FROM axis6_chat_rooms ORDER BY created_at;

SELECT 'Foreign key relationships:' as status;
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
