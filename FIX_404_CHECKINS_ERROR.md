# Fix: 404 Error with axis6_checkins Table

## Problem Analysis

The error `Failed to load resource: the server responded with a status of 404 ()` for `nvpnhqhjttgwfwvkgmpk.supabase.co/rest/v1/axis6_checkins?select=*` indicates that the `axis6_checkins` table does not exist in the Supabase database.

### Root Cause
- The database schema for AXIS6 has not been deployed to the Supabase instance
- The `axis6_checkins` table and all other AXIS6 tables are missing from the database
- The database types file shows tables for other projects but no AXIS6 tables

### Evidence
1. **Database Types Analysis**: The `lib/supabase/database.types.ts` file contains no `axis6_checkins` table definition
2. **Migration Files**: Multiple migration files exist in `supabase/migrations/` but haven't been executed
3. **Deployment Script**: A comprehensive deployment script exists at `scripts/deploy-migrations.sql`

## Solution

### Step 1: Deploy Database Schema

Execute the deployment script in Supabase SQL Editor:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql
2. **Click "New Query"**
3. **Copy the entire contents** of `scripts/deploy-migrations.sql`
4. **Paste into SQL Editor**
5. **Click "Run"**

### Step 2: Verify Deployment

After running the deployment script, execute the verification script:

1. **Copy the contents** of `scripts/verify-deployment.sql`
2. **Paste into SQL Editor**
3. **Click "Run"** to verify all tables were created successfully

### Step 3: Expected Results

After successful deployment, the following should be created:

#### Tables Created:
- `axis6_profiles` - User profile information
- `axis6_categories` - The 6 wellness categories (Physical, Mental, Emotional, Social, Spiritual, Purpose)
- `axis6_checkins` - Daily check-ins for each category
- `axis6_streaks` - Streak tracking for each category
- `axis6_daily_stats` - Daily completion statistics
- `axis6_mantras` - Daily motivational mantras
- `axis6_user_mantras` - User mantra interactions
- `axis6_activities` - Suggested activities for each category
- `axis6_user_activities` - User activity tracking

#### Features Enabled:
- Row Level Security (RLS) policies for data protection
- Performance indexes for optimal query performance
- Automatic streak calculation triggers
- User authentication integration

## Files Modified

### Created:
- `scripts/deploy-database.sh` - Helper script for deployment process
- `scripts/verify-deployment.sql` - Verification script
- `FIX_404_CHECKINS_ERROR.md` - This documentation

### Existing Files (No Changes Needed):
- `scripts/deploy-migrations.sql` - Main deployment script (683 lines)
- All API routes and React Query hooks are correctly implemented
- Database types will be automatically updated after deployment

## Testing

After deployment, test the following:

1. **API Endpoints**: `/api/checkins` should work without 404 errors
2. **Dashboard**: Should load user check-ins and categories
3. **Authentication**: User registration and login should work
4. **Real-time Updates**: Check-ins should update in real-time

## Rollback Plan

If issues occur:
1. The deployment script is idempotent - safe to run multiple times
2. All tables use `IF NOT EXISTS` clauses
3. No data will be lost if script is re-run

## Success Criteria

The 404 error will be resolved when:
- ✅ `axis6_checkins` table exists in Supabase
- ✅ All 9 AXIS6 tables are created
- ✅ RLS policies are enabled
- ✅ Performance indexes are in place
- ✅ Categories are populated with the 6 wellness axes

## Next Steps

1. Execute the deployment script in Supabase SQL Editor
2. Run the verification script to confirm success
3. Test the application functionality
4. Update database types if needed (usually automatic)

---

**Note**: This fix follows the "Operación Bisturí" principle - targeting only the specific issue without affecting other functional components. The deployment is production-ready and includes all necessary security and performance optimizations.
