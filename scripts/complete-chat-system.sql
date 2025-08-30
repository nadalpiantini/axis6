-- AXIS6 Chat System Completion Script
-- Implements the missing RPC functions and completes chat integration
-- Run this in Supabase SQL Editor to complete the chat system

BEGIN;

-- ============================================================================
-- SEARCH RPC FUNCTIONS
-- ============================================================================

-- Full-text search for chat messages
CREATE OR REPLACE FUNCTION search_messages(
  search_query TEXT,
  p_room_id UUID DEFAULT NULL,
  p_sender_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  search_results JSON;
BEGIN
  -- Validate inputs
  IF search_query IS NULL OR LENGTH(TRIM(search_query)) < 2 THEN
    RETURN '[]'::JSON;
  END IF;

  -- Build and execute search query
  WITH search_cte AS (
    SELECT 
      msg.id,
      msg.room_id,
      msg.sender_id,
      msg.content,
      msg.message_type,
      msg.created_at,
      -- Calculate relevance rank
      ts_rank(to_tsvector('english', msg.content), plainto_tsquery('english', search_query)) as rank,
      -- Get room name
      room.name as room_name,
      -- Get sender info
      profiles.name as sender_name,
      profiles.email as sender_email
    FROM axis6_chat_messages msg
    JOIN axis6_chat_rooms room ON room.id = msg.room_id
    JOIN axis6_profiles profiles ON profiles.id = msg.sender_id
    JOIN axis6_chat_participants p ON p.room_id = msg.room_id AND p.user_id = auth.uid()
    WHERE 
      msg.deleted_at IS NULL
      AND to_tsvector('english', msg.content) @@ plainto_tsquery('english', search_query)
      AND (p_room_id IS NULL OR msg.room_id = p_room_id)
      AND (p_sender_id IS NULL OR msg.sender_id = p_sender_id)
      AND (p_date_from IS NULL OR msg.created_at >= p_date_from)
      AND (p_date_to IS NULL OR msg.created_at <= p_date_to)
      AND p.left_at IS NULL
  ),
  ranked_results AS (
    SELECT *
    FROM search_cte
    ORDER BY rank DESC, created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT json_agg(
    json_build_object(
      'id', id,
      'room_id', room_id,
      'room_name', room_name,
      'sender_id', sender_id,
      'sender_name', sender_name,
      'sender_email', sender_email,
      'content', content,
      'message_type', message_type,
      'created_at', created_at,
      'relevance_score', rank
    )
  ) INTO search_results
  FROM ranked_results;

  RETURN COALESCE(search_results, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search suggestions based on partial query
CREATE OR REPLACE FUNCTION get_search_suggestions(partial_query TEXT)
RETURNS JSON AS $$
DECLARE
  suggestions JSON;
BEGIN
  WITH suggestion_cte AS (
    SELECT DISTINCT
      word,
      COUNT(*) as frequency
    FROM (
      SELECT 
        unnest(string_to_array(lower(content), ' ')) as word
      FROM axis6_chat_messages msg
      JOIN axis6_chat_participants p ON p.room_id = msg.room_id AND p.user_id = auth.uid()
      WHERE 
        msg.deleted_at IS NULL
        AND p.left_at IS NULL
        AND LENGTH(content) > 0
    ) words
    WHERE 
      word LIKE lower(partial_query) || '%'
      AND LENGTH(word) >= 2
      AND word !~ '^[0-9]+$' -- Exclude pure numbers
    GROUP BY word
    ORDER BY frequency DESC, word
    LIMIT 10
  )
  SELECT json_agg(
    json_build_object(
      'suggestion', word,
      'frequency', frequency
    )
  ) INTO suggestions
  FROM suggestion_cte;

  RETURN COALESCE(suggestions, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MENTIONS RPC FUNCTIONS
-- ============================================================================

-- Get user mentions with message context
CREATE OR REPLACE FUNCTION get_user_mentions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  mentions_result JSON;
BEGIN
  WITH mentions_cte AS (
    SELECT 
      msg.id as message_id,
      msg.content,
      msg.created_at,
      msg.room_id,
      room.name as room_name,
      sender_profile.name as sender_name,
      sender_profile.email as sender_email,
      -- Extract mention context (50 chars before and after)
      CASE 
        WHEN position('@' || target_profile.name in msg.content) > 0 THEN
          substring(
            msg.content,
            GREATEST(1, position('@' || target_profile.name in msg.content) - 50),
            100
          )
        ELSE msg.content
      END as mention_context,
      FALSE as is_read -- TODO: Add read tracking
    FROM axis6_chat_messages msg
    JOIN axis6_chat_rooms room ON room.id = msg.room_id
    JOIN axis6_profiles sender_profile ON sender_profile.id = msg.sender_id
    JOIN axis6_profiles target_profile ON target_profile.id = p_user_id
    JOIN axis6_chat_participants p ON p.room_id = msg.room_id AND p.user_id = p_user_id
    WHERE 
      msg.deleted_at IS NULL
      AND msg.sender_id != p_user_id -- Don't show self-mentions
      AND msg.content ILIKE '%@' || target_profile.name || '%'
      AND p.left_at IS NULL
    ORDER BY msg.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT json_agg(
    json_build_object(
      'message_id', message_id,
      'content', content,
      'mention_context', mention_context,
      'created_at', created_at,
      'room_id', room_id,
      'room_name', room_name,
      'sender_name', sender_name,
      'sender_email', sender_email,
      'is_read', is_read
    )
  ) INTO mentions_result
  FROM mentions_cte;

  RETURN COALESCE(mentions_result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process mentions in a message (extract and validate user references)
CREATE OR REPLACE FUNCTION process_message_mentions(
  p_message_id UUID,
  p_mentions TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  mention_text TEXT;
  mentioned_user_id UUID;
BEGIN
  -- Process each mention
  FOREACH mention_text IN ARRAY p_mentions
  LOOP
    -- Find user by name (case insensitive)
    SELECT id INTO mentioned_user_id
    FROM axis6_profiles
    WHERE LOWER(name) = LOWER(trim(mention_text, '@'));
    
    -- If user found, create mention notification (placeholder for future notification system)
    IF mentioned_user_id IS NOT NULL THEN
      -- TODO: Insert into notifications table when implemented
      -- For now, just log the mention was processed
      RAISE NOTICE 'Processed mention of user % in message %', mentioned_user_id, p_message_id;
    END IF;
  END LOOP;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get mention statistics for a user
CREATE OR REPLACE FUNCTION get_mention_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  stats_result JSON;
BEGIN
  WITH mention_stats AS (
    SELECT 
      COUNT(*) as total_mentions,
      COUNT(CASE WHEN msg.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as mentions_this_week,
      COUNT(CASE WHEN msg.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as mentions_this_month,
      COUNT(DISTINCT msg.room_id) as rooms_with_mentions,
      COUNT(DISTINCT msg.sender_id) as unique_mentioners
    FROM axis6_chat_messages msg
    JOIN axis6_profiles target_profile ON target_profile.id = p_user_id
    JOIN axis6_chat_participants p ON p.room_id = msg.room_id AND p.user_id = p_user_id
    WHERE 
      msg.deleted_at IS NULL
      AND msg.sender_id != p_user_id
      AND msg.content ILIKE '%@' || target_profile.name || '%'
      AND p.left_at IS NULL
  )
  SELECT json_build_object(
    'total_mentions', total_mentions,
    'mentions_this_week', mentions_this_week,
    'mentions_this_month', mentions_this_month,
    'rooms_with_mentions', rooms_with_mentions,
    'unique_mentioners', unique_mentioners
  ) INTO stats_result
  FROM mention_stats;

  RETURN COALESCE(stats_result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark mentions as read (placeholder for future implementation)
CREATE OR REPLACE FUNCTION mark_mentions_read(p_mention_ids UUID[])
RETURNS INTEGER AS $$
BEGIN
  -- TODO: Implement when mention tracking table is added
  -- For now, just return the count of mention IDs
  RETURN array_length(p_mention_ids, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ANALYTICS RPC FUNCTIONS  
-- ============================================================================

-- Comprehensive chat analytics
CREATE OR REPLACE FUNCTION get_chat_analytics()
RETURNS JSON AS $$
DECLARE
  analytics_result JSON;
BEGIN
  WITH analytics_cte AS (
    SELECT 
      -- Overall stats
      COUNT(DISTINCT msg.id) as total_messages,
      COUNT(DISTINCT msg.room_id) as active_rooms,
      COUNT(DISTINCT msg.sender_id) as active_users,
      COUNT(DISTINCT DATE(msg.created_at)) as active_days,
      
      -- Recent activity (7 days)
      COUNT(CASE WHEN msg.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as messages_this_week,
      COUNT(DISTINCT CASE WHEN msg.created_at >= NOW() - INTERVAL '7 days' THEN msg.sender_id END) as active_users_this_week,
      
      -- Message types
      COUNT(CASE WHEN msg.message_type = 'text' THEN 1 END) as text_messages,
      COUNT(CASE WHEN msg.message_type = 'image' THEN 1 END) as image_messages,
      COUNT(CASE WHEN msg.message_type = 'file' THEN 1 END) as file_messages,
      COUNT(CASE WHEN msg.message_type = 'system' THEN 1 END) as system_messages,
      
      -- Average message length
      AVG(LENGTH(msg.content)) as avg_message_length,
      
      -- Peak activity hour
      MODE() WITHIN GROUP (ORDER BY EXTRACT(hour FROM msg.created_at)) as peak_hour
    FROM axis6_chat_messages msg
    JOIN axis6_chat_participants p ON p.room_id = msg.room_id AND p.user_id = auth.uid()
    WHERE 
      msg.deleted_at IS NULL
      AND p.left_at IS NULL
  )
  SELECT json_build_object(
    'overview', json_build_object(
      'total_messages', total_messages,
      'active_rooms', active_rooms,
      'active_users', active_users,
      'active_days', active_days
    ),
    'recent_activity', json_build_object(
      'messages_this_week', messages_this_week,
      'active_users_this_week', active_users_this_week
    ),
    'message_breakdown', json_build_object(
      'text', text_messages,
      'image', image_messages,
      'file', file_messages,
      'system', system_messages
    ),
    'engagement', json_build_object(
      'avg_message_length', ROUND(avg_message_length, 2),
      'peak_hour', peak_hour
    ),
    'generated_at', NOW()
  ) INTO analytics_result
  FROM analytics_cte;

  RETURN COALESCE(analytics_result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Room-specific analytics
CREATE OR REPLACE FUNCTION get_room_analytics(p_room_id UUID)
RETURNS JSON AS $$
DECLARE
  room_analytics JSON;
BEGIN
  -- Verify user has access to this room
  IF NOT EXISTS (
    SELECT 1 FROM axis6_chat_participants 
    WHERE room_id = p_room_id AND user_id = auth.uid() AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Access denied to room analytics';
  END IF;

  WITH room_stats AS (
    SELECT 
      room.name as room_name,
      room.type as room_type,
      room.created_at as room_created_at,
      
      COUNT(DISTINCT msg.id) as total_messages,
      COUNT(DISTINCT msg.sender_id) as unique_senders,
      COUNT(DISTINCT p.user_id) as total_participants,
      
      COUNT(CASE WHEN msg.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as messages_this_week,
      COUNT(CASE WHEN msg.created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as messages_today,
      
      MAX(msg.created_at) as last_activity,
      MIN(msg.created_at) as first_message,
      
      AVG(LENGTH(msg.content)) as avg_message_length
    FROM axis6_chat_rooms room
    LEFT JOIN axis6_chat_messages msg ON msg.room_id = room.id AND msg.deleted_at IS NULL
    LEFT JOIN axis6_chat_participants p ON p.room_id = room.id
    WHERE room.id = p_room_id
    GROUP BY room.id, room.name, room.type, room.created_at
  )
  SELECT json_build_object(
    'room_info', json_build_object(
      'name', room_name,
      'type', room_type,
      'created_at', room_created_at
    ),
    'activity', json_build_object(
      'total_messages', total_messages,
      'messages_this_week', messages_this_week,
      'messages_today', messages_today,
      'last_activity', last_activity,
      'first_message', first_message
    ),
    'participants', json_build_object(
      'unique_senders', unique_senders,
      'total_participants', total_participants
    ),
    'engagement', json_build_object(
      'avg_message_length', ROUND(avg_message_length, 2)
    ),
    'generated_at', NOW()
  ) INTO room_analytics
  FROM room_stats;

  RETURN COALESCE(room_analytics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User analytics
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS JSON AS $$
DECLARE
  user_analytics JSON;
BEGIN
  WITH user_stats AS (
    SELECT 
      COUNT(DISTINCT msg.id) as messages_sent,
      COUNT(DISTINCT msg.room_id) as rooms_participated,
      COUNT(DISTINCT DATE(msg.created_at)) as active_days,
      
      COUNT(CASE WHEN msg.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as messages_this_week,
      COUNT(CASE WHEN msg.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as messages_this_month,
      
      MAX(msg.created_at) as last_message_sent,
      MIN(msg.created_at) as first_message_sent,
      
      AVG(LENGTH(msg.content)) as avg_message_length,
      
      -- Favorite hour to send messages
      MODE() WITHIN GROUP (ORDER BY EXTRACT(hour FROM msg.created_at)) as favorite_hour
    FROM axis6_chat_messages msg
    WHERE msg.sender_id = auth.uid() AND msg.deleted_at IS NULL
  )
  SELECT json_build_object(
    'activity', json_build_object(
      'messages_sent', messages_sent,
      'rooms_participated', rooms_participated,
      'active_days', active_days
    ),
    'recent_activity', json_build_object(
      'messages_this_week', messages_this_week,
      'messages_this_month', messages_this_month
    ),
    'engagement', json_build_object(
      'last_message_sent', last_message_sent,
      'first_message_sent', first_message_sent,
      'avg_message_length', ROUND(avg_message_length, 2),
      'favorite_hour', favorite_hour
    ),
    'generated_at', NOW()
  ) INTO user_analytics
  FROM user_stats;

  RETURN COALESCE(user_analytics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Real-time metrics
CREATE OR REPLACE FUNCTION get_realtime_metrics()
RETURNS JSON AS $$
DECLARE
  realtime_metrics JSON;
BEGIN
  WITH realtime_stats AS (
    SELECT 
      COUNT(DISTINCT p.user_id) as total_participants,
      COUNT(DISTINCT CASE WHEN p.last_seen >= NOW() - INTERVAL '5 minutes' THEN p.user_id END) as recently_active,
      COUNT(DISTINCT CASE WHEN p.last_seen >= NOW() - INTERVAL '1 hour' THEN p.user_id END) as active_last_hour,
      
      COUNT(DISTINCT msg.room_id) FILTER (WHERE msg.created_at >= NOW() - INTERVAL '1 hour') as active_rooms_last_hour,
      COUNT(msg.id) FILTER (WHERE msg.created_at >= NOW() - INTERVAL '1 hour') as messages_last_hour,
      COUNT(msg.id) FILTER (WHERE msg.created_at >= NOW() - INTERVAL '5 minutes') as messages_last_5_minutes
    FROM axis6_chat_participants p
    LEFT JOIN axis6_chat_messages msg ON msg.room_id = p.room_id AND msg.created_at >= NOW() - INTERVAL '1 hour'
    WHERE p.left_at IS NULL
  )
  SELECT json_build_object(
    'user_activity', json_build_object(
      'total_participants', total_participants,
      'recently_active', recently_active,
      'active_last_hour', active_last_hour
    ),
    'room_activity', json_build_object(
      'active_rooms_last_hour', active_rooms_last_hour,
      'messages_last_hour', messages_last_hour,
      'messages_last_5_minutes', messages_last_5_minutes
    ),
    'timestamp', NOW()
  ) INTO realtime_metrics
  FROM realtime_stats;

  RETURN COALESCE(realtime_metrics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Create full-text search index for message content
CREATE INDEX IF NOT EXISTS idx_chat_messages_search 
ON axis6_chat_messages USING GIN (to_tsvector('english', content));

-- Create additional search optimization indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_trigram 
ON axis6_chat_messages USING GIN (content gin_trgm_ops);

-- Ensure trigram extension is available
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_messages TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_mentions TO authenticated;
GRANT EXECUTE ON FUNCTION process_message_mentions TO authenticated;
GRANT EXECUTE ON FUNCTION get_mention_stats TO authenticated;
GRANT EXECUTE ON FUNCTION mark_mentions_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_chat_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_room_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_realtime_metrics TO authenticated;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run separately to test)
-- ============================================================================

-- Test search function
-- SELECT search_messages('hello', null, null, null, null, 5, 0);

-- Test user analytics
-- SELECT get_user_analytics();

-- Test room analytics (replace with actual room ID)
-- SELECT get_room_analytics('your-room-id-here');

-- Test mention stats
-- SELECT get_mention_stats(auth.uid());

-- Test comprehensive analytics
-- SELECT get_chat_analytics();