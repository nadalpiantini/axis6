-- VERIFICATION: Check if axis6 simplified tables exist
SELECT 
  'axis6_axes' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'axis6_axes'
  ) as exists;

SELECT 
  'axis6_blocks' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'axis6_blocks'
  ) as exists;

-- Check if RPC functions exist
SELECT 
  'axis6_get_day_summary' as function_name,
  EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'axis6_get_day_summary'
  ) as exists;

SELECT 
  'axis6_quick_add_block' as function_name,
  EXISTS (
    SELECT FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'axis6_quick_add_block'
  ) as exists;