# 🚨 URGENT: Execute Database Fix for Production

## Current Issues (as of 2025-08-26)
- ❌ axis6_checkins returning 404 errors
- ❌ axis6_temperament_profiles returning 406 errors  
- ❌ axis6_temperament_responses returning 400 errors
- ❌ WebSocket connections failing

## Step-by-Step Fix Instructions

### 1. Open Supabase Dashboard
```
https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk
```

### 2. Navigate to SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New query" button

### 3. Copy and Execute the Fix Script
Copy the ENTIRE contents of:
```
scripts/PRODUCTION_FIX_SAFE.sql
```

Paste into the SQL editor and click "Run"

### 4. What This Script Does
✅ Creates missing temperament tables:
- axis6_temperament_profiles
- axis6_temperament_questions  
- axis6_temperament_responses
- axis6_personalization_settings
- axis6_temperament_activities

✅ Fixes RLS policies on all tables

✅ Adds performance indexes

✅ Inserts initial temperament questions

### 5. Verify the Fix Worked
Run this verification query in SQL Editor:
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'axis6_%'
ORDER BY table_name;

-- Should return:
-- axis6_categories
-- axis6_checkins  
-- axis6_daily_stats
-- axis6_mantras
-- axis6_personalization_settings
-- axis6_profiles
-- axis6_streaks
-- axis6_temperament_activities
-- axis6_temperament_profiles
-- axis6_temperament_questions
-- axis6_temperament_responses
-- axis6_user_mantras
```

### 6. Test in Browser
1. Go to https://axis6.app
2. Open browser console (F12)
3. Navigate to profile page
4. Verify no 404/406 errors appear

### 7. Monitor for 24 Hours
Check error logs in:
- Vercel Dashboard: Functions tab
- Supabase Dashboard: Logs section
- Browser console on production site

## If Issues Persist
Run the diagnostic script locally:
```bash
node scripts/maintenance/diagnose-production-database.js
```

## Emergency Rollback
If something goes wrong, the script is safe and idempotent - you can run it multiple times without issues.

---
**Created**: 2025-08-26
**Priority**: CRITICAL - Execute immediately to fix production errors