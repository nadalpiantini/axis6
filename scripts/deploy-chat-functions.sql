-- AXIS6 Chat Enhancement RPC Functions
-- Deploy these functions after the main schema deployment

BEGIN;

-- ========================================
-- MESSAGE SEARCH FUNCTIONS
-- ========================================

-- Search messages function
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
  v_user_id UUID;
  v_results JSON;
  v_search_terms TEXT;
  v_start_time TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  v_start_time := NOW();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Prepare search terms for ranking
  v_search_terms := plainto_tsquery('english', search_query)::TEXT;
  
  -- Perform the search with ranking
  SELECT json_agg(
    json_build_object(
      'id', m.id,
      'room_id', m.room_id,
      'sender_id', m.sender_id,
      'content', m.content,
      'created_at', m.created_at,
      'match_rank', ts_rank(m.search_vector, plainto_tsquery('english', search_query)),
      'highlighted_content', ts_headline('english', m.content, plainto_tsquery('english', search_query)),
      'room', json_build_object(
        'id', r.id,
        'name', r.name,
        'type', r.type
      ),
      'sender', json_build_object(
        'id', sender.id,
        'name', sender.name
      )
    ) ORDER BY ts_rank(m.search_vector, plainto_tsquery('english', search_query)) DESC, m.created_at DESC
  ) INTO v_results
  FROM axis6_chat_messages m
  JOIN axis6_chat_rooms r ON r.id = m.room_id
  JOIN axis6_profiles sender ON sender.id = m.sender_id
  JOIN axis6_chat_participants p ON p.room_id = r.id
  WHERE 
    -- User must be a participant in the room
    p.user_id = v_user_id 
    AND p.left_at IS NULL
    -- Message not deleted
    AND m.deleted_at IS NULL
    -- Full-text search match
    AND m.search_vector @@ plainto_tsquery('english', search_query)
    -- Optional room filter
    AND (p_room_id IS NULL OR m.room_id = p_room_id)
    -- Optional sender filter
    AND (p_sender_id IS NULL OR m.sender_id = p_sender_id)
    -- Optional date range filter
    AND (p_date_from IS NULL OR m.created_at >= p_date_from)
    AND (p_date_to IS NULL OR m.created_at <= p_date_to)
  LIMIT p_limit
  OFFSET p_offset;

  -- Log search analytics
  INSERT INTO axis6_chat_search_analytics (
    user_id,
    search_query,
    results_count,
    search_time_ms,
    filters_used
  ) VALUES (
    v_user_id,
    search_query,
    COALESCE(json_array_length(v_results), 0),
    EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000,
    json_build_object(
      'room_id', p_room_id,
      'sender_id', p_sender_id,
      'date_from', p_date_from,
      'date_to', p_date_to
    )
  );

  RETURN COALESCE(v_results, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(partial_query TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_suggestions JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get suggestions from recent searches and common terms
  SELECT json_agg(DISTINCT suggestion ORDER BY frequency DESC) INTO v_suggestions
  FROM (
    -- Recent user searches
    SELECT search_query as suggestion, COUNT(*) as frequency
    FROM axis6_chat_search_analytics 
    WHERE user_id = v_user_id 
    AND search_query ILIKE partial_query || '%'
    AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY search_query
    
    UNION ALL
    
    -- Common words from user's recent messages
    SELECT word as suggestion, COUNT(*) as frequency
    FROM (
      SELECT unnest(string_to_array(lower(content), ' ')) as word
      FROM axis6_chat_messages m
      JOIN axis6_chat_participants p ON p.room_id = m.room_id
      WHERE p.user_id = v_user_id 
      AND p.left_at IS NULL
      AND m.created_at > NOW() - INTERVAL '7 days'
      AND m.deleted_at IS NULL
      AND char_length(content) > 0
    ) words
    WHERE word ILIKE partial_query || '%'
    AND char_length(word) >= 3
    GROUP BY word
  ) combined_suggestions
  WHERE char_length(suggestion) >= char_length(partial_query)
  LIMIT 8;

  RETURN COALESCE(v_suggestions, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- MENTIONS FUNCTIONS
-- ========================================

-- Process message mentions
CREATE OR REPLACE FUNCTION process_message_mentions(
  p_message_id UUID,
  p_mentions JSONB
)
RETURNS VOID AS $$
DECLARE
  v_message RECORD;
  v_mention JSONB;
  v_mentioned_user_id UUID;
BEGIN
  -- Get message details
  SELECT msg.*, msg.room_id INTO v_message
  FROM axis6_chat_messages msg
  JOIN axis6_chat_participants p ON p.room_id = msg.room_id
  WHERE msg.id = p_message_id AND p.user_id = auth.uid()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or access denied';
  END IF;
  
  -- Process each mention
  FOR v_mention IN SELECT * FROM jsonb_array_elements(p_mentions)
  LOOP
    -- Get mentioned user ID by name
    SELECT p.user_id INTO v_mentioned_user_id
    FROM axis6_chat_participants p
    JOIN axis6_profiles prof ON prof.id = p.user_id
    WHERE p.room_id = v_message.room_id 
    AND p.left_at IS NULL
    AND LOWER(prof.name) = LOWER(v_mention->>'username')
    LIMIT 1;
    
    IF v_mentioned_user_id IS NOT NULL AND v_mentioned_user_id != v_message.sender_id THEN
      -- Insert mention record
      INSERT INTO axis6_chat_mentions (
        message_id,
        mentioner_id,
        mentioned_user_id,
        mention_text,
        start_position,
        end_position
      ) VALUES (
        p_message_id,
        v_message.sender_id,
        v_mentioned_user_id,
        v_mention->>'text',
        (v_mention->>'start')::INTEGER,
        (v_mention->>'end')::INTEGER
      ) ON CONFLICT DO NOTHING;
      
      -- Create notification
      INSERT INTO axis6_notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        v_mentioned_user_id,
        'mention',
        'You were mentioned',
        'Someone mentioned you in a chat message',
        jsonb_build_object(
          'message_id', p_message_id,
          'room_id', v_message.room_id,
          'sender_id', v_message.sender_id,
          'sender_name', (
            SELECT name FROM axis6_profiles WHERE id = v_message.sender_id
          )
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user mentions
CREATE OR REPLACE FUNCTION get_user_mentions(
  p_user_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_mentions JSON;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User authentication required';
  END IF;
  
  SELECT json_agg(
    json_build_object(
      'id', m.id,
      'message_id', m.message_id,
      'message_content', msg.content,
      'mentioner', json_build_object(
        'id', mentioner.id,
        'name', mentioner.name
      ),
      'room', json_build_object(
        'id', room.id,
        'name', room.name,
        'type', room.type
      ),
      'created_at', m.created_at,
      'read_at', m.read_at,
      'notified_at', m.notified_at
    ) ORDER BY m.created_at DESC
  ) INTO v_mentions
  FROM axis6_chat_mentions m
  JOIN axis6_chat_messages msg ON msg.id = m.message_id
  JOIN axis6_chat_rooms room ON room.id = msg.room_id
  JOIN axis6_profiles mentioner ON mentioner.id = m.mentioner_id
  WHERE m.mentioned_user_id = v_user_id
  LIMIT p_limit
  OFFSET p_offset;
  
  RETURN COALESCE(v_mentions, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark mentions as read
CREATE OR REPLACE FUNCTION mark_mentions_read(p_mention_ids UUID[])
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE axis6_chat_mentions 
  SET read_at = NOW(), updated_at = NOW()
  WHERE id = ANY(p_mention_ids)
  AND mentioned_user_id = auth.uid()
  AND read_at IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ANALYTICS FUNCTIONS
-- ========================================

-- Get comprehensive chat analytics
CREATE OR REPLACE FUNCTION get_chat_analytics()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_analytics JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT json_build_object(
    'overview', json_build_object(
      'total_messages', COALESCE((
        SELECT COUNT(DISTINCT m.id)
        FROM axis6_chat_messages m
        JOIN axis6_chat_participants p ON p.room_id = m.room_id
        WHERE p.user_id = v_user_id AND p.left_at IS NULL AND m.deleted_at IS NULL
      ), 0),
      'total_rooms', COALESCE((
        SELECT COUNT(DISTINCT p.room_id)
        FROM axis6_chat_participants p
        WHERE p.user_id = v_user_id AND p.left_at IS NULL
      ), 0),
      'active_participants', COALESCE((
        SELECT COUNT(DISTINCT p2.user_id)
        FROM axis6_chat_participants p
        JOIN axis6_chat_participants p2 ON p2.room_id = p.room_id
        WHERE p.user_id = v_user_id AND p.left_at IS NULL AND p2.left_at IS NULL
      ), 0),
      'messages_today', COALESCE((
        SELECT COUNT(DISTINCT m.id)
        FROM axis6_chat_messages m
        JOIN axis6_chat_participants p ON p.room_id = m.room_id
        WHERE p.user_id = v_user_id AND p.left_at IS NULL 
        AND m.created_at >= CURRENT_DATE AND m.deleted_at IS NULL
      ), 0),
      'growth_rate', 0
    ),
    'activity', json_build_object(
      'messages_by_hour', '[]'::JSON,
      'messages_by_day', '[]'::JSON,
      'messages_by_room', '[]'::JSON,
      'most_active_users', '[]'::JSON
    ),
    'engagement', json_build_object(
      'avg_messages_per_user', 0,
      'avg_response_time_minutes', 0,
      'most_active_rooms', '[]'::JSON,
      'file_sharing_stats', json_build_object(
        'total_files', 0,
        'files_by_type', '[]'::JSON,
        'total_size_mb', 0
      )
    ),
    'social', json_build_object(
      'mentions_given', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_mentions WHERE mentioner_id = v_user_id
      ), 0),
      'mentions_received', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_mentions WHERE mentioned_user_id = v_user_id
      ), 0),
      'top_mentioners', '[]'::JSON,
      'top_mentioned', '[]'::JSON
    ),
    'search', json_build_object(
      'total_searches', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_search_analytics WHERE user_id = v_user_id
      ), 0),
      'avg_results_per_search', COALESCE((
        SELECT ROUND(AVG(results_count), 2) FROM axis6_chat_search_analytics WHERE user_id = v_user_id
      ), 0),
      'most_searched_terms', '[]'::JSON,
      'search_success_rate', 0
    )
  ) INTO v_analytics;

  RETURN COALESCE(v_analytics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_analytics JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT json_build_object(
    'user_id', v_user_id,
    'user_name', COALESCE((SELECT name FROM axis6_profiles WHERE id = v_user_id), 'Unknown'),
    'overview', json_build_object(
      'total_messages_sent', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_messages WHERE sender_id = v_user_id AND deleted_at IS NULL
      ), 0),
      'total_rooms_joined', COALESCE((
        SELECT COUNT(DISTINCT room_id) FROM axis6_chat_participants WHERE user_id = v_user_id AND left_at IS NULL
      ), 0),
      'messages_today', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_messages 
        WHERE sender_id = v_user_id AND created_at >= CURRENT_DATE AND deleted_at IS NULL
      ), 0),
      'avg_messages_per_day', 0,
      'account_age_days', 0
    ),
    'activity', json_build_object(
      'messages_by_day', '[]'::JSON,
      'messages_by_hour', '[]'::JSON,
      'favorite_rooms', '[]'::JSON,
      'most_active_day', '',
      'most_active_hour', 0
    ),
    'social', json_build_object(
      'mentions_given', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_mentions WHERE mentioner_id = v_user_id
      ), 0),
      'mentions_received', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_mentions WHERE mentioned_user_id = v_user_id
      ), 0),
      'files_shared', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_file_attachments WHERE uploader_id = v_user_id AND deleted_at IS NULL
      ), 0),
      'responses_received', 0,
      'avg_response_time_minutes', 0
    )
  ) INTO v_analytics;

  RETURN COALESCE(v_analytics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get room analytics
CREATE OR REPLACE FUNCTION get_room_analytics(p_room_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_analytics JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Check if user has access to this room
  IF NOT EXISTS (
    SELECT 1 FROM axis6_chat_participants 
    WHERE room_id = p_room_id AND user_id = v_user_id AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Access denied to room';
  END IF;

  SELECT json_build_object(
    'room_id', p_room_id,
    'room_name', COALESCE((SELECT name FROM axis6_chat_rooms WHERE id = p_room_id), 'Unknown'),
    'overview', json_build_object(
      'total_messages', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_messages WHERE room_id = p_room_id AND deleted_at IS NULL
      ), 0),
      'total_participants', COALESCE((
        SELECT COUNT(DISTINCT user_id) FROM axis6_chat_participants WHERE room_id = p_room_id AND left_at IS NULL
      ), 0),
      'messages_today', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_messages 
        WHERE room_id = p_room_id AND created_at >= CURRENT_DATE AND deleted_at IS NULL
      ), 0),
      'avg_messages_per_day', 0,
      'room_age_days', 0
    ),
    'activity', json_build_object(
      'messages_by_day', '[]'::JSON,
      'messages_by_hour', '[]'::JSON,
      'most_active_participants', '[]'::JSON,
      'peak_activity_hour', 0
    ),
    'engagement', json_build_object(
      'avg_response_time_minutes', 0,
      'file_attachments_count', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_file_attachments fa
        JOIN axis6_chat_messages m ON m.id = fa.message_id
        WHERE m.room_id = p_room_id AND fa.deleted_at IS NULL
      ), 0),
      'mentions_count', COALESCE((
        SELECT COUNT(*) FROM axis6_chat_mentions men
        JOIN axis6_chat_messages m ON m.id = men.message_id
        WHERE m.room_id = p_room_id
      ), 0),
      'active_participants_30d', COALESCE((
        SELECT COUNT(DISTINCT sender_id) FROM axis6_chat_messages
        WHERE room_id = p_room_id AND created_at >= CURRENT_DATE - INTERVAL '30 days' AND deleted_at IS NULL
      ), 0)
    )
  ) INTO v_analytics;

  RETURN COALESCE(v_analytics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get realtime metrics
CREATE OR REPLACE FUNCTION get_realtime_metrics()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_metrics JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT json_build_object(
    'active_users_now', 0,
    'messages_last_hour', COALESCE((
      SELECT COUNT(*) FROM axis6_chat_messages m
      JOIN axis6_chat_participants p ON p.room_id = m.room_id
      WHERE p.user_id = v_user_id AND p.left_at IS NULL
      AND m.created_at >= NOW() - INTERVAL '1 hour' AND m.deleted_at IS NULL
    ), 0),
    'active_rooms', COALESCE((
      SELECT COUNT(DISTINCT m.room_id) FROM axis6_chat_messages m
      JOIN axis6_chat_participants p ON p.room_id = m.room_id
      WHERE p.user_id = v_user_id AND p.left_at IS NULL
      AND m.created_at >= NOW() - INTERVAL '1 hour' AND m.deleted_at IS NULL
    ), 0),
    'online_participants', '[]'::JSON
  ) INTO v_metrics;

  RETURN COALESCE(v_metrics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user search analytics
CREATE OR REPLACE FUNCTION get_user_search_analytics()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_analytics JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User authentication required';
  END IF;
  
  SELECT json_build_object(
    'total_searches', COUNT(*),
    'most_searched_terms', (
      SELECT json_agg(
        json_build_object(
          'term', search_query,
          'count', search_count
        ) ORDER BY search_count DESC
      )
      FROM (
        SELECT search_query, COUNT(*) as search_count
        FROM axis6_chat_search_analytics
        WHERE user_id = v_user_id
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY search_query
        ORDER BY search_count DESC
        LIMIT 10
      ) top_searches
    ),
    'search_frequency_by_day', (
      SELECT json_agg(
        json_build_object(
          'date', search_date::TEXT,
          'count', daily_count
        ) ORDER BY search_date DESC
      )
      FROM (
        SELECT DATE(created_at) as search_date, COUNT(*) as daily_count
        FROM axis6_chat_search_analytics
        WHERE user_id = v_user_id
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY search_date DESC
      ) daily_searches
    ),
    'average_results_per_search', COALESCE(AVG(results_count), 0)
  ) INTO v_analytics
  FROM axis6_chat_search_analytics
  WHERE user_id = v_user_id
  AND created_at > NOW() - INTERVAL '30 days';

  RETURN COALESCE(v_analytics, json_build_object(
    'total_searches', 0,
    'most_searched_terms', '[]'::JSON,
    'search_frequency_by_day', '[]'::JSON,
    'average_results_per_search', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;