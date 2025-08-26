-- AXIS6 Production RLS Policy Emergency Fix
-- Addresses the 400/404/406 errors in production

BEGIN;

-- =====================================================
-- 1. FIX AXIS6_PROFILES RLS POLICIES
-- =====================================================
-- axis6_profiles uses 'id' column directly as user reference

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON axis6_profiles; 
DROP POLICY IF EXISTS "Users can insert their own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON axis6_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON axis6_profiles;

-- Create correct policies for axis6_profiles (id = auth.users.id)
CREATE POLICY "Users can view own profile" ON axis6_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON axis6_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON axis6_profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- 2. FIX AXIS6_CHECKINS RLS POLICIES
-- =====================================================
-- axis6_checkins uses 'user_id' column as foreign key

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own check-ins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can create their own check-ins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can update their own check-ins" ON axis6_checkins;
DROP POLICY IF EXISTS "Users can delete their own check-ins" ON axis6_checkins;

-- Create correct policies for axis6_checkins (user_id = auth.users.id)
CREATE POLICY "Users can view own checkins" ON axis6_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own checkins" ON axis6_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON axis6_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON axis6_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. FIX AXIS6_STREAKS RLS POLICIES  
-- =====================================================
-- axis6_streaks uses 'user_id' column as foreign key

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own streaks" ON axis6_streaks;
DROP POLICY IF EXISTS "Users can manage their own streaks" ON axis6_streaks;

-- Create correct policies for axis6_streaks (user_id = auth.users.id)
CREATE POLICY "Users can view own streaks" ON axis6_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own streaks" ON axis6_streaks
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 4. FIX AXIS6_TEMPERAMENT_PROFILES RLS POLICIES
-- =====================================================
-- axis6_temperament_profiles uses 'user_id' column as foreign key

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own temperament profile" ON axis6_temperament_profiles;
DROP POLICY IF EXISTS "Users can insert own temperament profile" ON axis6_temperament_profiles;
DROP POLICY IF EXISTS "Users can update own temperament profile" ON axis6_temperament_profiles;

-- Create correct policies for axis6_temperament_profiles (user_id = auth.users.id)
CREATE POLICY "Users can view own temperament profile" ON axis6_temperament_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own temperament profile" ON axis6_temperament_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own temperament profile" ON axis6_temperament_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 5. FIX AXIS6_USER_MANTRAS RLS POLICIES
-- =====================================================
-- axis6_user_mantras uses 'user_id' column as foreign key

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own mantras" ON axis6_user_mantras;
DROP POLICY IF EXISTS "Users can manage own mantras" ON axis6_user_mantras;

-- Create correct policies for axis6_user_mantras (user_id = auth.users.id)
CREATE POLICY "Users can view own mantras" ON axis6_user_mantras
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own mantras" ON axis6_user_mantras
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 6. ENSURE CATEGORIES ARE PUBLIC (READ-ONLY)
-- =====================================================
-- Categories should be readable by all authenticated users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Categories are viewable by all" ON axis6_categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON axis6_categories;

-- Create public read policy for categories
CREATE POLICY "Categories are viewable by authenticated users" ON axis6_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. ENSURE MANTRAS ARE PUBLIC (READ-ONLY)
-- =====================================================
-- Mantras should be readable by all authenticated users

-- Drop existing policies if they exist  
DROP POLICY IF EXISTS "Mantras are viewable by all" ON axis6_mantras;
DROP POLICY IF EXISTS "Anyone can view mantras" ON axis6_mantras;

-- Create public read policy for mantras
CREATE POLICY "Mantras are viewable by authenticated users" ON axis6_mantras
  FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- 8. ENABLE RLS ON ALL TABLES (SAFETY CHECK)
-- =====================================================

ALTER TABLE axis6_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_temperament_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_user_mantras ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_mantras ENABLE ROW LEVEL SECURITY;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (INFORMATIONAL)
-- =====================================================
-- Test these after running the migration:
--
-- SELECT * FROM axis6_profiles WHERE id = auth.uid();
-- SELECT * FROM axis6_checkins WHERE user_id = auth.uid();
-- SELECT * FROM axis6_streaks WHERE user_id = auth.uid();
-- SELECT * FROM axis6_temperament_profiles WHERE user_id = auth.uid();
-- SELECT * FROM axis6_categories LIMIT 5;
-- SELECT * FROM axis6_mantras WHERE is_active = true LIMIT 5;