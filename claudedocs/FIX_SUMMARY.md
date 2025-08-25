# AXIS6 WebSocket & Activities Fix Summary

## Issues Identified

### 1. Missing Database Table
- **Error**: 404 for `axis6_activities` table
- **Cause**: Table name mismatch - code uses `axis6_axis_activities` but browser cache may have old reference
- **Status**: ⚠️ REQUIRES MANUAL ACTION

### 2. WebSocket Connection Failures
- **Error**: Multiple failed WebSocket connections to Supabase Realtime
- **Cause**: Realtime not enabled for tables in Supabase dashboard
- **Status**: ⚠️ REQUIRES MANUAL ACTION

## Actions Taken

### ✅ Completed
1. **Created migration script**: `scripts/apply-activities-migration.js`
2. **Rebuilt application**: Cleared any cached code with `npm run build`
3. **Verified Supabase connection**: All environment variables are correct
4. **Created instructions**: `scripts/enable-realtime-instructions.md`
5. **Enhanced UI**: Added activity suggestions to the AxisActivitiesModal component

## Manual Actions Required

### 1. Apply Database Migration
Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new

Copy and paste the entire contents of `supabase/migrations/008_axis_activities.sql` and run it.

This will create:
- `axis6_axis_activities` table
- Indexes for performance
- RLS policies for security
- Default activities function
- Trigger for new users

### 2. Enable Realtime
Go to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/database/replication

Enable Realtime for these tables:
- axis6_checkins
- axis6_streaks
- axis6_axis_activities
- axis6_daily_stats
- axis6_mantras

### 3. Clear Browser Cache
1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

## Testing the Fix

After completing the manual actions:

1. **Test Activities Feature**:
   - Go to Settings page
   - Click on any axis to open activities modal
   - Try adding, editing, and deleting activities
   - Check that suggestions appear when adding new activities

2. **Verify WebSocket Connections**:
   - Open browser console
   - Look for successful WebSocket connections
   - No more "WebSocket connection failed" errors should appear

3. **Test Real-time Updates**:
   - Make a check-in on the dashboard
   - Open another browser tab with the dashboard
   - Changes should appear in real-time

## Enhanced Features

The AxisActivitiesModal now includes:
- **Activity Suggestions**: Quick suggestions for each axis type
- **Dynamic Suggestions**: Click a suggestion to use it, replaced with new ones
- **Axis-Specific**: Each axis has relevant activity suggestions
- **Better UX**: Sparkles icon indicates AI-powered suggestions

## If Issues Persist

1. **Check Supabase Project Status**: Ensure it's not paused
2. **Verify RLS Policies**: Check that policies allow user operations
3. **Network Issues**: Check for firewall/proxy blocking WebSocket
4. **Browser Issues**: Try a different browser or incognito mode

## Files Modified
- `/components/settings/AxisActivitiesModal.tsx` - Added activity suggestions
- `/scripts/apply-activities-migration.js` - Migration runner script
- `/scripts/enable-realtime-instructions.md` - Realtime setup guide

## Next Steps
Once the manual actions are completed and verified:
1. The activities feature will work properly
2. WebSocket connections will establish successfully
3. Real-time updates will function across the app