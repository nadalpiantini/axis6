-- =====================================================
-- FIX axis6_profiles TABLE STRUCTURE
-- =====================================================
-- This script safely migrates the axis6_profiles table to use 
-- id as the primary key referencing auth.users(id)
-- 
-- Run this BEFORE deploy-complete-database.sql if you have
-- an existing database with the wrong structure
-- =====================================================

-- Step 1: Check current structure
DO $$
BEGIN
    -- Check if user_id column exists (wrong structure)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'axis6_profiles' 
        AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE 'Found incorrect structure with user_id column. Starting migration...';
        
        -- Step 2: Backup existing data
        CREATE TEMP TABLE axis6_profiles_backup AS 
        SELECT * FROM axis6_profiles;
        
        -- Step 3: Drop all dependent policies
        DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON axis6_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON axis6_profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON axis6_profiles;
        
        -- Step 4: Drop the table
        DROP TABLE IF EXISTS axis6_profiles CASCADE;
        
        -- Step 5: Recreate with correct structure
        CREATE TABLE axis6_profiles (
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
        
        -- Step 6: Restore data with correct mapping
        INSERT INTO axis6_profiles (id, name, username, full_name, avatar_url, created_at, updated_at)
        SELECT user_id, full_name, username, full_name, avatar_url, created_at, updated_at
        FROM axis6_profiles_backup
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            username = EXCLUDED.username,
            full_name = EXCLUDED.full_name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW();
        
        -- Step 7: Enable RLS
        ALTER TABLE axis6_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Step 8: Recreate policies with correct column
        CREATE POLICY "Profiles are viewable by everyone" ON axis6_profiles
            FOR SELECT USING (true);
        
        CREATE POLICY "Users can update own profile" ON axis6_profiles
            FOR UPDATE USING (auth.uid() = id);
        
        CREATE POLICY "Users can insert own profile" ON axis6_profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        
        -- Step 9: Clean up
        DROP TABLE IF EXISTS axis6_profiles_backup;
        
        RAISE NOTICE 'Migration completed successfully!';
    ELSE
        RAISE NOTICE 'Table structure is already correct (no user_id column found).';
    END IF;
END $$;

-- Verify the new structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'axis6_profiles'
ORDER BY ordinal_position;

-- Show success message
SELECT 'axis6_profiles table structure fixed! ✅' as status;