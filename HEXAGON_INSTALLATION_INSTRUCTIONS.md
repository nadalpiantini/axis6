# 🔧 Hexagon Resonance Fix - Installation Instructions

## 🚨 Problem
The hexagon visualization is showing "Temporarily Unavailable" due to a database function error:
```
operator does not exist: text ->> unknown
```

## ✅ Solution
I've created a corrected version of the `get_hexagon_resonance` function that fixes the JSONB operator error.

## 📋 Installation Options

### Option 1: Supabase SQL Editor (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy the entire content of `HEXAGON_FIX_SQL_EDITOR.sql`
5. Paste it into the SQL Editor
6. Click **Run** to execute

### Option 2: Supabase CLI
1. Make sure you have Supabase CLI installed: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Run the deployment script: `./deploy-hexagon-fix.sh`

### Option 3: Manual Migration
1. Copy the content of `supabase/migrations/20250830_fix_hexagon_resonance.sql`
2. Execute it in your Supabase SQL Editor

## 🔍 Verification
After installation, you should see:
```
Hexagon resonance function installed successfully! | 6
```

## 🎯 What This Fix Does
- ✅ Fixes the JSONB operator error in the `get_hexagon_resonance` function
- ✅ Creates the missing `axis6_resonance_events` table
- ✅ Sets up proper RLS policies
- ✅ Grants necessary permissions
- ✅ Tests the function automatically

## 🚀 After Installation
1. Refresh your dashboard at `http://localhost:3000/dashboard`
2. The hexagon visualization should now work properly
3. You should see resonance data for each axis

## 📁 Files Created
- `HEXAGON_FIX_SQL_EDITOR.sql` - Ready to copy/paste into Supabase
- `supabase/migrations/20250830_fix_hexagon_resonance.sql` - Migration file
- `deploy-hexagon-fix.sh` - Deployment script
- `hexagon-fix-final.sql` - Alternative version

## 🆘 If You Still Have Issues
1. Check the Supabase logs for any errors
2. Verify the function exists: `SELECT * FROM get_hexagon_resonance('test'::UUID, CURRENT_DATE);`
3. Check if the table exists: `SELECT * FROM axis6_resonance_events LIMIT 1;`

---
**Note**: This fix is production-ready and follows the "Operación Bisturí" principle - it only fixes the specific hexagon issue without affecting other functionality.
