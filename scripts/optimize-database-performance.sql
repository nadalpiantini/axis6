-- =====================================================
-- AXIS6 Database Performance Optimization
-- =====================================================
-- Run this in Supabase SQL Editor to optimize query performance
-- URL: https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Chat System Performance Indexes
-- =====================================================

-- Optimize chat message queries (70% improvement expected)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_optimized 
ON axis6_chat_messages(room_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Optimize participant lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_participants_optimized 
ON axis6_chat_participants(room_id, user_id) 
WHERE left_at IS NULL;

-- Optimize room queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_rooms_optimized 
ON axis6_chat_rooms(id, is_active, is_private) 
WHERE is_active = true;

-- Optimize reaction queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_reactions_message_optimized 
ON axis6_chat_reactions(message_id, user_id);

-- Optimize mention queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_mentions_optimized 
ON axis6_chat_mentions(mentioned_user_id, created_at DESC) 
WHERE read_at IS NULL;

-- =====================================================
-- STEP 2: Optimized RPC Functions for Chat
-- =====================================================

-- Get chat rooms with all related data in single query
CREATE OR REPLACE FUNCTION get_chat_rooms_optimized(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH user_rooms AS (
        SELECT DISTINCT r.*
        FROM axis6_chat_rooms r
        LEFT JOIN axis6_chat_participants p ON r.id = p.room_id
        WHERE r.is_active = true
        AND (
            r.is_private = false 
            OR r.creator_id = p_user_id
            OR (p.user_id = p_user_id AND p.left_at IS NULL)
        )
    ),
    room_data AS (
        SELECT 
            r.id,
            r.name,
            r.description,
            r.type,
            r.is_private,
            r.created_at,
            r.updated_at,
            -- Get participants count
            (SELECT COUNT(*) FROM axis6_chat_participants 
             WHERE room_id = r.id AND left_at IS NULL) as participant_count,
            -- Get last message
            (SELECT jsonb_build_object(
                'id', m.id,
                'content', m.content,
                'created_at', m.created_at,
                'sender_name', p.name
             )
             FROM axis6_chat_messages m
             JOIN axis6_profiles p ON m.sender_id = p.id
             WHERE m.room_id = r.id AND m.deleted_at IS NULL
             ORDER BY m.created_at DESC
             LIMIT 1
            ) as last_message,
            -- Get category info if exists
            CASE WHEN r.category_id IS NOT NULL THEN
                (SELECT jsonb_build_object(
                    'id', c.id,
                    'name', c.name,
                    'color', c.color,
                    'icon', c.icon
                 )
                 FROM axis6_categories c
                 WHERE c.id = r.category_id
                )
            ELSE NULL END as category
        FROM user_rooms r
    )
    SELECT jsonb_agg(room_data ORDER BY 
        CASE 
            WHEN last_message IS NOT NULL 
            THEN (last_message->>'created_at')::timestamptz 
            ELSE updated_at 
        END DESC
    ) INTO result
    FROM room_data;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get chat messages with sender info in single query
CREATE OR REPLACE FUNCTION get_chat_messages_optimized(
    p_room_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_before_timestamp TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    WITH messages AS (
        SELECT 
            m.id,
            m.content,
            m.message_type,
            m.created_at,
            m.edited_at,
            m.reply_to_id,
            m.metadata,
            -- Get sender info
            jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'avatar_url', p.avatar_url
            ) as sender,
            -- Get reactions
            (SELECT jsonb_agg(jsonb_build_object(
                'emoji', r.emoji,
                'user_id', r.user_id,
                'created_at', r.created_at
             ))
             FROM axis6_chat_reactions r
             WHERE r.message_id = m.id
            ) as reactions,
            -- Get reply-to message if exists
            CASE WHEN m.reply_to_id IS NOT NULL THEN
                (SELECT jsonb_build_object(
                    'id', rm.id,
                    'content', rm.content,
                    'sender_name', rp.name
                 )
                 FROM axis6_chat_messages rm
                 JOIN axis6_profiles rp ON rm.sender_id = rp.id
                 WHERE rm.id = m.reply_to_id
                )
            ELSE NULL END as reply_to
        FROM axis6_chat_messages m
        JOIN axis6_profiles p ON m.sender_id = p.id
        WHERE m.room_id = p_room_id
        AND m.deleted_at IS NULL
        AND (p_before_timestamp IS NULL OR m.created_at < p_before_timestamp)
        ORDER BY m.created_at DESC
        LIMIT p_limit
    )
    SELECT jsonb_agg(messages ORDER BY created_at ASC) INTO result
    FROM messages;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 3: Dashboard Performance Optimization
-- =====================================================

-- Comprehensive dashboard data in single query
CREATE OR REPLACE FUNCTION get_dashboard_data_ultra_optimized(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        -- Today's checkins with category details
        'checkins', (
            SELECT jsonb_agg(jsonb_build_object(
                'category_id', ch.category_id,
                'category_name', c.name,
                'category_color', c.color,
                'category_icon', c.icon,
                'mood', ch.mood,
                'notes', ch.notes,
                'completed_at', ch.completed_at
            ))
            FROM axis6_checkins ch
            JOIN axis6_categories c ON ch.category_id = c.id
            WHERE ch.user_id = p_user_id 
            AND ch.completed_at = CURRENT_DATE
        ),
        -- Current streaks
        'streaks', (
            SELECT jsonb_agg(jsonb_build_object(
                'category_id', s.category_id,
                'current_streak', s.current_streak,
                'longest_streak', s.longest_streak,
                'last_checkin', s.last_checkin
            ))
            FROM axis6_streaks s
            WHERE s.user_id = p_user_id
        ),
        -- Weekly statistics
        'weekly_stats', (
            SELECT jsonb_build_object(
                'days_active', COUNT(DISTINCT completed_at),
                'total_checkins', COUNT(*),
                'avg_mood', AVG(mood)::numeric(3,1),
                'categories_completed', COUNT(DISTINCT category_id)
            )
            FROM axis6_checkins
            WHERE user_id = p_user_id 
            AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
        ),
        -- Daily mantra
        'daily_mantra', (
            SELECT jsonb_build_object(
                'id', id,
                'content', content,
                'author', author
            )
            FROM axis6_mantras
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT 1
        ),
        -- Profile info
        'profile', (
            SELECT jsonb_build_object(
                'name', name,
                'timezone', timezone,
                'onboarded', onboarded
            )
            FROM axis6_profiles
            WHERE id = p_user_id
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: Analytics Performance Optimization
-- =====================================================

-- Optimized weekly activity heatmap
CREATE OR REPLACE FUNCTION get_activity_heatmap_optimized(
    p_user_id UUID,
    p_weeks INTEGER DEFAULT 12
)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(jsonb_build_object(
            'date', date,
            'count', checkin_count,
            'categories', category_list
        ) ORDER BY date)
        FROM (
            SELECT 
                completed_at as date,
                COUNT(*) as checkin_count,
                array_agg(DISTINCT category_id) as category_list
            FROM axis6_checkins
            WHERE user_id = p_user_id
            AND completed_at >= CURRENT_DATE - (p_weeks * 7 || ' days')::INTERVAL
            GROUP BY completed_at
        ) daily_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 5: Create Materialized Views for Complex Queries
-- =====================================================

-- Materialized view for user statistics (refresh daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_statistics AS
SELECT 
    user_id,
    COUNT(DISTINCT completed_at) as total_days,
    COUNT(*) as total_checkins,
    AVG(mood)::numeric(3,1) as avg_mood,
    MAX(completed_at) as last_active,
    COUNT(DISTINCT category_id) as unique_categories
FROM axis6_checkins
GROUP BY user_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_statistics_user_id 
ON mv_user_statistics(user_id);

-- Create refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_statistics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 6: Query Performance Monitoring
-- =====================================================

-- Create table for query performance tracking
CREATE TABLE IF NOT EXISTS axis6_query_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_name VARCHAR(255) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    query_params JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_performance_name_time 
ON axis6_query_performance(query_name, created_at DESC);

-- Function to log query performance
CREATE OR REPLACE FUNCTION log_query_performance(
    p_query_name VARCHAR(255),
    p_start_time TIMESTAMPTZ,
    p_params JSONB DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO axis6_query_performance (query_name, execution_time_ms, query_params)
    VALUES (
        p_query_name,
        EXTRACT(MILLISECOND FROM (NOW() - p_start_time))::INTEGER,
        p_params
    );
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check index creation
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename LIKE 'axis6_%'
AND indexname LIKE '%optimized%'
ORDER BY tablename, indexname;

-- Check function creation
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%optimized%'
ORDER BY routine_name;

-- Analyze query performance improvements
ANALYZE axis6_chat_messages;
ANALYZE axis6_chat_participants;
ANALYZE axis6_chat_rooms;
ANALYZE axis6_checkins;
ANALYZE axis6_streaks;