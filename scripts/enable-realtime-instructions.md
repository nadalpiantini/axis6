# Enable Supabase Realtime for AXIS6 Tables

## Steps to Enable Realtime in Supabase Dashboard

### 1. Go to Supabase Dashboard
Navigate to: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/database/replication

### 2. Enable Realtime for Required Tables

In the Replication section, ensure the following tables have Realtime enabled:

- [ ] **axis6_checkins** - For real-time check-in updates
- [ ] **axis6_streaks** - For real-time streak calculations
- [ ] **axis6_axis_activities** - For real-time activity updates
- [ ] **axis6_daily_stats** - For real-time statistics
- [ ] **axis6_mantras** - For real-time mantra updates

### 3. For each table:
1. Find the table in the list
2. Click the toggle switch to enable "Realtime"
3. Wait for the status to show "Active"

### 4. Verify Realtime is Working
After enabling, the WebSocket connections should establish successfully. You can verify this by:

1. Opening the browser developer console
2. Looking for successful WebSocket connections to `wss://nvpnhqhjttgwfwvkgmpk.supabase.co/realtime/`
3. No more "WebSocket connection failed" errors should appear

## Alternative: Enable via SQL
If you prefer, you can enable Realtime for all tables at once using SQL:

```sql
-- Enable Realtime for all axis6 tables
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_axis_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_daily_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_mantras;
```

Run this in the SQL Editor at:
https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new

## Troubleshooting WebSocket Issues

If WebSocket connections continue to fail after enabling Realtime:

1. **Check Authentication**: Ensure your `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
2. **Clear Browser Cache**: Force refresh with Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. **Check Network**: Ensure no firewall or proxy is blocking WebSocket connections
4. **Verify Project Status**: Check if the Supabase project is active and not paused

## Notes
- Realtime uses PostgreSQL's logical replication
- Changes are broadcast to all connected clients
- RLS policies still apply to Realtime subscriptions
- Each table with Realtime enabled consumes resources, so only enable for tables that need it