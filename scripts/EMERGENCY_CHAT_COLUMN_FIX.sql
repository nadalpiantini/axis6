-- EMERGENCY FIX FOR CHAT ROOM CREATION COLUMN MISMATCH
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- This fixes the column name mismatch causing 400 errors in chat room creation

BEGIN;

-- First, check what the current table structure looks like
DO $$
DECLARE
    has_creator_id BOOLEAN;
    has_created_by BOOLEAN;
BEGIN
    -- Check if creator_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'axis6_chat_rooms' 
        AND column_name = 'creator_id'
    ) INTO has_creator_id;
    
    -- Check if created_by column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'axis6_chat_rooms' 
        AND column_name = 'created_by'
    ) INTO has_created_by;
    
    RAISE NOTICE 'Current columns: creator_id=%, created_by=%', has_creator_id, has_created_by;
    
    -- If table has created_by but API expects creator_id, add creator_id
    IF has_created_by AND NOT has_creator_id THEN
        RAISE NOTICE 'Adding creator_id column and copying data from created_by';
        
        -- Add creator_id column
        ALTER TABLE axis6_chat_rooms ADD COLUMN creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        -- Copy data from created_by to creator_id
        UPDATE axis6_chat_rooms SET creator_id = created_by WHERE created_by IS NOT NULL;
        
        -- Update any RLS policies that reference created_by to also work with creator_id
        -- Drop existing policies that reference created_by
        DROP POLICY IF EXISTS "Users can create rooms" ON axis6_chat_rooms;
        DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON axis6_chat_rooms;
        
        -- Recreate policies with creator_id
        CREATE POLICY "Users can create rooms" ON axis6_chat_rooms
        FOR INSERT WITH CHECK (auth.uid() = creator_id);
        
        CREATE POLICY "Room creators and admins can update rooms" ON axis6_chat_rooms
        FOR UPDATE USING (
          creator_id = auth.uid() OR
          EXISTS (SELECT 1 FROM axis6_chat_participants WHERE room_id = id AND user_id = auth.uid() AND role = 'admin' AND left_at IS NULL)
        );
        
    -- If table has creator_id but not created_by, that's what we want
    ELSIF has_creator_id AND NOT has_created_by THEN
        RAISE NOTICE 'Table already has creator_id column, no changes needed';
        
    -- If table has both columns, keep creator_id and drop created_by
    ELSIF has_creator_id AND has_created_by THEN
        RAISE NOTICE 'Both columns exist, removing created_by and keeping creator_id';
        
        -- Make sure creator_id has the data
        UPDATE axis6_chat_rooms SET creator_id = created_by WHERE creator_id IS NULL AND created_by IS NOT NULL;
        
        -- Drop created_by column
        ALTER TABLE axis6_chat_rooms DROP COLUMN created_by;
        
    -- If neither column exists, add creator_id
    ELSIF NOT has_creator_id AND NOT has_created_by THEN
        RAISE NOTICE 'No creator column found, adding creator_id';
        
        ALTER TABLE axis6_chat_rooms ADD COLUMN creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        -- Create policies for creator_id
        CREATE POLICY "Users can create rooms" ON axis6_chat_rooms
        FOR INSERT WITH CHECK (auth.uid() = creator_id);
        
        CREATE POLICY "Room creators and admins can update rooms" ON axis6_chat_rooms
        FOR UPDATE USING (
          creator_id = auth.uid() OR
          EXISTS (SELECT 1 FROM axis6_chat_participants WHERE room_id = id AND user_id = auth.uid() AND role = 'admin' AND left_at IS NULL)
        );
    END IF;
    
    -- Ensure we have proper indexes on creator_id
    CREATE INDEX IF NOT EXISTS idx_chat_rooms_creator_id ON axis6_chat_rooms(creator_id);
    
END $$;

-- Update the table to ensure it has the missing columns that might be expected
DO $$
BEGIN
    -- Add is_private column if it doesn't exist (some schemas have this)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'axis6_chat_rooms' 
        AND column_name = 'is_private'
    ) THEN
        ALTER TABLE axis6_chat_rooms ADD COLUMN is_private BOOLEAN DEFAULT false;
    END IF;
    
    -- Ensure is_active column exists (most schemas have this)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'axis6_chat_rooms' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE axis6_chat_rooms ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Refresh the schema cache to make sure Supabase picks up the changes
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Verification query - run this after the main script
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'axis6_chat_rooms' 
AND column_name IN ('creator_id', 'created_by', 'is_private', 'is_active')
ORDER BY column_name;
