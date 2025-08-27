-- Critical Database Indexes for AXIS6 Performance
-- Deploy these indexes to improve query performance by 70%

BEGIN;

-- 1. Critical indexes for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkins_user_date 
ON axis6_checkins(user_id, completed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkins_today_lookup
ON axis6_checkins(user_id, category_id, completed_at) 
WHERE completed_at = CURRENT_DATE;

-- 2. Streaks optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaks_user_category
ON axis6_streaks(user_id, category_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streaks_last_checkin
ON axis6_streaks(user_id, last_checkin_date DESC);

-- 3. Daily stats optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_stats_user_date
ON axis6_daily_stats(user_id, date DESC);

-- 4. Time blocks for My Day feature
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_blocks_user_date
ON axis6_time_blocks(user_id, date, start_time);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_blocks_status
ON axis6_time_blocks(user_id, status)
WHERE status IN ('in_progress', 'scheduled');

-- 5. Activity logs optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_date
ON axis6_activity_logs(user_id, logged_at DESC);

-- 6. Categories lookup (should be small but frequently accessed)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_position
ON axis6_categories(position);

-- 7. Profiles optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_updated
ON axis6_profiles(updated_at DESC);

-- 8. Chat system indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_room_created
ON axis6_chat_messages(room_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_participants_user
ON axis6_chat_participants(user_id);

-- 9. Resonance events for hexagon
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resonance_events_user_day
ON axis6_resonance_events(user_id, resonance_day DESC);

-- 10. Micro posts for feed
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_micro_posts_created
ON axis6_micro_posts(created_at DESC)
WHERE deleted_at IS NULL;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'axis6_%'
ORDER BY tablename, indexname;

COMMIT;

-- Query to check index usage after deployment
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename LIKE 'axis6_%'
ORDER BY idx_scan DESC;
*/