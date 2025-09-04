-- RUN THIS AFTER DEPLOYING SECURITY SCRIPT
-- Verification queries for security deployment

-- 1. Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED' 
    ELSE '❌ DISABLED' 
  END as status
FROM pg_tables 
WHERE tablename LIKE 'axis6_%' 
ORDER BY tablename;

-- 2. Check unique constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type,
  '✅ DEPLOYED' as status
FROM information_schema.table_constraints
WHERE table_name LIKE 'axis6_%' 
AND constraint_type = 'UNIQUE'
ORDER BY table_name;

-- 3. Check security policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  '✅ ACTIVE' as status
FROM pg_policies 
WHERE tablename LIKE 'axis6_%'
ORDER BY tablename, policyname;

-- 4. Test unauthorized access (should return 0 rows)
SELECT COUNT(*) as unauthorized_access_test
FROM axis6_profiles 
WHERE id != auth.uid();