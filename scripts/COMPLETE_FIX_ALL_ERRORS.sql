-- =====================================================
-- AXIS6 COMPLETE FIX FOR ALL 400/500 ERRORS
-- =====================================================
-- Execute this in Supabase SQL Editor to fix ALL current errors:
-- https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- =====================================================

BEGIN;

-- STEP 1: Fix axis6_checkins table constraints and schema
-- =====================================================

-- First, ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS axis6_checkins (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing unique constraint if it exists (to recreate it properly)
ALTER TABLE axis6_checkins DROP CONSTRAINT IF EXISTS axis6_checkins_user_id_category_id_completed_at_key;

-- Add the proper unique constraint for ON CONFLICT operations
ALTER TABLE axis6_checkins ADD CONSTRAINT axis6_checkins_user_id_category_id_completed_at_key 
    UNIQUE (user_id, category_id, DATE(completed_at));

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_checkins_user_completed 
    ON axis6_checkins(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkins_category_completed 
    ON axis6_checkins(category_id, completed_at DESC);

-- STEP 2: Fix axis6_profiles table structure
-- =====================================================

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS axis6_profiles (
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

-- STEP 3: Create missing axis6_time_blocks table
-- =====================================================

CREATE TABLE IF NOT EXISTS axis6_time_blocks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
    activity_id INTEGER,
    activity_name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_time - start_time)) / 60
    ) STORED,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for time blocks
CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date 
    ON axis6_time_blocks(user_id, date);

CREATE INDEX IF NOT EXISTS idx_time_blocks_status 
    ON axis6_time_blocks(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_time_blocks_category 
    ON axis6_time_blocks(category_id);

-- STEP 4: Create missing axis6_activity_logs table
-- =====================================================

CREATE TABLE IF NOT EXISTS axis6_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
    time_block_id INTEGER REFERENCES axis6_time_blocks(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user 
    ON axis6_activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_started 
    ON axis6_activity_logs(started_at);

CREATE INDEX IF NOT EXISTS idx_activity_logs_active 
    ON axis6_activity_logs(user_id, ended_at) WHERE ended_at IS NULL;

-- STEP 5: Create missing axis6_daily_time_summary table
-- =====================================================

CREATE TABLE IF NOT EXISTS axis6_daily_time_summary (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
    planned_minutes INTEGER DEFAULT 0,
    actual_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date, category_id)
);

-- Add indexes for daily time summary
CREATE INDEX IF NOT EXISTS idx_daily_time_summary_user_date 
    ON axis6_daily_time_summary(user_id, date);

-- STEP 6: Enable Row Level Security on all tables
-- =====================================================

ALTER TABLE axis6_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_daily_time_summary ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create/Update RLS Policies
-- =====================================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can delete own checkins" ON axis6_checkins;

DROP POLICY IF EXISTS "Users can view own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON axis6_profiles;

DROP POLICY IF EXISTS "Users can view own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can create own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can update own time blocks" ON axis6_time_blocks;
DROP POLICY IF EXISTS "Users can delete own time blocks" ON axis6_time_blocks;

DROP POLICY IF EXISTS "Users can view own activity logs" ON axis6_activity_logs;
DROP POLICY IF EXISTS "Users can create own activity logs" ON axis6_activity_logs;
DROP POLICY IF EXISTS "Users can update own activity logs" ON axis6_activity_logs;
DROP POLICY IF EXISTS "Users can delete own activity logs" ON axis6_activity_logs;

DROP POLICY IF EXISTS "Users can view own daily time summary" ON axis6_daily_time_summary;
DROP POLICY IF EXISTS "Users can create own daily time summary" ON axis6_daily_time_summary;
DROP POLICY IF EXISTS "Users can update own daily time summary" ON axis6_daily_time_summary;
DROP POLICY IF EXISTS "Users can delete own daily time summary" ON axis6_daily_time_summary;

-- Create checkins policies
CREATE POLICY "Users can view own checkins" ON axis6_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON axis6_checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON axis6_checkins
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON axis6_checkins
    FOR DELETE USING (auth.uid() = user_id);

-- Create profiles policies
CREATE POLICY "Users can view own profile" ON axis6_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON axis6_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON axis6_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create time blocks policies
CREATE POLICY "Users can view own time blocks" ON axis6_time_blocks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time blocks" ON axis6_time_blocks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time blocks" ON axis6_time_blocks
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own time blocks" ON axis6_time_blocks
    FOR DELETE USING (auth.uid() = user_id);

-- Create activity logs policies
CREATE POLICY "Users can view own activity logs" ON axis6_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity logs" ON axis6_activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity logs" ON axis6_activity_logs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity logs" ON axis6_activity_logs
    FOR DELETE USING (auth.uid() = user_id);

-- Create daily time summary policies
CREATE POLICY "Users can view own daily time summary" ON axis6_daily_time_summary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily time summary" ON axis6_daily_time_summary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily time summary" ON axis6_daily_time_summary
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily time summary" ON axis6_daily_time_summary
    FOR DELETE USING (auth.uid() = user_id);

-- STEP 8: Create missing functions for time blocks
-- =====================================================

-- Create the get_my_day_data function that the API expects
CREATE OR REPLACE FUNCTION get_my_day_data(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    time_block_id INTEGER,
    category_id INTEGER,
    category_name TEXT,
    category_color TEXT,
    category_icon TEXT,
    activity_id INTEGER,
    activity_name TEXT,
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    status TEXT,
    notes TEXT,
    actual_duration INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tb.id as time_block_id,
        tb.category_id,
        c.name::text as category_name,
        c.color as category_color,
        c.icon as category_icon,
        tb.activity_id,
        tb.activity_name,
        tb.start_time,
        tb.end_time,
        tb.duration_minutes,
        tb.status,
        tb.notes,
        COALESCE(
            (SELECT SUM(al.duration_minutes)::INTEGER 
             FROM axis6_activity_logs al 
             WHERE al.time_block_id = tb.id),
            0
        ) as actual_duration
    FROM axis6_time_blocks tb
    LEFT JOIN axis6_categories c ON c.id = tb.category_id
    WHERE tb.user_id = p_user_id 
    AND tb.date = p_date
    ORDER BY tb.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the calculate_daily_time_distribution function
CREATE OR REPLACE FUNCTION calculate_daily_time_distribution(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    category_id INTEGER,
    category_name TEXT,
    category_color TEXT,
    planned_minutes INTEGER,
    actual_minutes INTEGER,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH time_data AS (
        SELECT 
            c.id as category_id,
            c.name::text as category_name,
            c.color as category_color,
            COALESCE(SUM(tb.duration_minutes), 0)::INTEGER as planned,
            COALESCE(
                (SELECT SUM(al.duration_minutes)::INTEGER 
                 FROM axis6_activity_logs al 
                 WHERE al.user_id = p_user_id 
                   AND al.category_id = c.id
                   AND DATE(al.started_at) = p_date),
                0
            ) as actual
        FROM axis6_categories c
        LEFT JOIN axis6_time_blocks tb ON tb.category_id = c.id 
            AND tb.user_id = p_user_id 
            AND tb.date = p_date
        GROUP BY c.id, c.name, c.color
    )
    SELECT 
        category_id,
        category_name,
        category_color,
        planned as planned_minutes,
        actual as actual_minutes,
        CASE 
            WHEN (SELECT SUM(actual) FROM time_data) > 0 
            THEN ROUND((actual::DECIMAL / (SELECT SUM(actual) FROM time_data) * 100), 2)
            ELSE 0
        END as percentage
    FROM time_data
    ORDER BY category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Add realtime subscriptions
-- =====================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_time_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_daily_time_summary;

-- STEP 10: Create updated_at triggers
-- =====================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables
DROP TRIGGER IF EXISTS update_checkins_updated_at ON axis6_checkins;
CREATE TRIGGER update_checkins_updated_at
    BEFORE UPDATE ON axis6_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON axis6_profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON axis6_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_blocks_updated_at ON axis6_time_blocks;
CREATE TRIGGER update_time_blocks_updated_at
    BEFORE UPDATE ON axis6_time_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON axis6_activity_logs;
CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON axis6_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_time_summary_updated_at ON axis6_daily_time_summary;
CREATE TRIGGER update_daily_time_summary_updated_at
    BEFORE UPDATE ON axis6_daily_time_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 11: Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION get_my_day_data(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_daily_time_distribution(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
SELECT 'axis6_checkins' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_checkins'
) as exists;

SELECT 'axis6_profiles' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_profiles'
) as exists;

SELECT 'axis6_time_blocks' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_time_blocks'
) as exists;

SELECT 'axis6_activity_logs' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_activity_logs'
) as exists;

SELECT 'axis6_daily_time_summary' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_daily_time_summary'
) as exists;

-- Verify constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'axis6_checkins' 
AND constraint_type = 'UNIQUE';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('axis6_checkins', 'axis6_profiles', 'axis6_time_blocks', 'axis6_activity_logs', 'axis6_daily_time_summary');

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_my_day_data', 'calculate_daily_time_distribution', 'update_updated_at_column');

-- Test functions (optional - uncomment to test)
-- SELECT * FROM get_my_day_data('00000000-0000-0000-0000-000000000000'::UUID, '2025-01-26'::DATE);
-- SELECT * FROM calculate_daily_time_distribution('00000000-0000-0000-0000-000000000000'::UUID, '2025-01-26'::DATE);
