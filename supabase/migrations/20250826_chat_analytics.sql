-- Chat Analytics Enhancement Migration
-- Adds comprehensive analytics capabilities to the chat system

BEGIN;

-- Create analytics views and functions for comprehensive chat analytics

-- Create RPC function for comprehensive chat analytics
CREATE OR REPLACE FUNCTION get_chat_analytics()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_analytics JSON;
  v_overview JSON;
  v_activity JSON;
  v_engagement JSON;
  v_social JSON;
  v_search JSON;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Overview metrics
  SELECT json_build_object(
    'total_messages', COUNT(DISTINCT m.id),
    'total_rooms', COUNT(DISTINCT r.id),
    'active_participants', COUNT(DISTINCT p.user_id),
    'messages_today', COUNT(DISTINCT m.id) FILTER (WHERE m.created_at >= CURRENT_DATE),
    'growth_rate', CASE 
      WHEN COUNT(DISTINCT m.id) FILTER (WHERE m.created_at >= CURRENT_DATE - INTERVAL '7 days' AND m.created_at < CURRENT_DATE) = 0 
      THEN 0 
      ELSE ROUND(
        ((COUNT(DISTINCT m.id) FILTER (WHERE m.created_at >= CURRENT_DATE - INTERVAL '7 days'))::FLOAT / 
         COUNT(DISTINCT m.id) FILTER (WHERE m.created_at >= CURRENT_DATE - INTERVAL '14 days' AND m.created_at < CURRENT_DATE - INTERVAL '7 days')::FLOAT - 1) * 100, 2
      )
    END
  ) INTO v_overview
  FROM axis6_chat_messages m
  JOIN axis6_chat_rooms r ON r.id = m.room_id
  JOIN axis6_chat_participants p ON p.room_id = r.id
  WHERE p.user_id = v_user_id AND p.left_at IS NULL
  AND m.deleted_at IS NULL;

  -- Activity metrics
  SELECT json_build_object(
    'messages_by_hour', (
      SELECT json_agg(
        json_build_object(
          'hour', hour_val,
          'count', COALESCE(msg_count, 0)
        ) ORDER BY hour_val
      )
      FROM generate_series(0, 23) as hour_val
      LEFT JOIN (
        SELECT EXTRACT(HOUR FROM m.created_at) as hour_val, COUNT(*) as msg_count
        FROM axis6_chat_messages m
        JOIN axis6_chat_participants p ON p.room_id = m.room_id
        WHERE p.user_id = v_user_id AND p.left_at IS NULL
        AND m.created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND m.deleted_at IS NULL
        GROUP BY EXTRACT(HOUR FROM m.created_at)
      ) hourly USING (hour_val)
    ),
    'messages_by_day', (
      SELECT json_agg(
        json_build_object(
          'date', day_val::TEXT,
          'count', COALESCE(msg_count, 0)
        ) ORDER BY day_val
      )
      FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, INTERVAL '1 day') as day_val
      LEFT JOIN (
        SELECT DATE(m.created_at) as day_val, COUNT(*) as msg_count
        FROM axis6_chat_messages m
        JOIN axis6_chat_participants p ON p.room_id = m.room_id
        WHERE p.user_id = v_user_id AND p.left_at IS NULL
        AND m.deleted_at IS NULL
        GROUP BY DATE(m.created_at)
      ) daily USING (day_val)
    ),
    'messages_by_room', (
      SELECT json_agg(
        json_build_object(
          'room_id', r.id,
          'room_name', r.name,
          'count', COUNT(m.id)
        ) ORDER BY COUNT(m.id) DESC
      )
      FROM axis6_chat_rooms r
      JOIN axis6_chat_participants p ON p.room_id = r.id
      LEFT JOIN axis6_chat_messages m ON m.room_id = r.id AND m.deleted_at IS NULL
      WHERE p.user_id = v_user_id AND p.left_at IS NULL
      GROUP BY r.id, r.name
      LIMIT 10
    ),
    'most_active_users', (
      SELECT json_agg(
        json_build_object(
          'user_id', sender.id,
          'user_name', sender.name,
          'message_count', COUNT(m.id)
        ) ORDER BY COUNT(m.id) DESC
      )
      FROM axis6_chat_messages m
      JOIN axis6_profiles sender ON sender.id = m.sender_id
      JOIN axis6_chat_participants p ON p.room_id = m.room_id
      WHERE p.user_id = v_user_id AND p.left_at IS NULL
      AND m.created_at >= CURRENT_DATE - INTERVAL '30 days'
      AND m.deleted_at IS NULL
      GROUP BY sender.id, sender.name
      LIMIT 10
    )
  ) INTO v_activity;

  -- Engagement metrics
  SELECT json_build_object(
    'avg_messages_per_user', ROUND(AVG(user_msg_count), 2),
    'avg_response_time_minutes', ROUND(AVG(
      EXTRACT(EPOCH FROM (m2.created_at - m1.created_at)) / 60
    ), 2),
    'most_active_rooms', (
      SELECT json_agg(
        json_build_object(
          'room_id', r.id,
          'room_name', r.name,
          'participant_count', COUNT(DISTINCT p.user_id),
          'message_count', COUNT(DISTINCT m.id)
        ) ORDER BY COUNT(DISTINCT m.id) DESC
      )
      FROM axis6_chat_rooms r
      JOIN axis6_chat_participants p ON p.room_id = r.id
      LEFT JOIN axis6_chat_messages m ON m.room_id = r.id AND m.deleted_at IS NULL
      WHERE EXISTS (
        SELECT 1 FROM axis6_chat_participants p2 
        WHERE p2.room_id = r.id AND p2.user_id = v_user_id AND p2.left_at IS NULL
      )
      GROUP BY r.id, r.name
      LIMIT 5
    ),
    'file_sharing_stats', (
      SELECT json_build_object(
        'total_files', COUNT(*),
        'files_by_type', (
          SELECT json_agg(
            json_build_object(
              'type', file_type,
              'count', type_count
            )
          )
          FROM (
            SELECT 
              COALESCE(metadata->>'file_type', 'unknown') as file_type,
              COUNT(*) as type_count
            FROM axis6_chat_file_attachments fa
            JOIN axis6_chat_messages m ON m.id = fa.message_id
            JOIN axis6_chat_participants p ON p.room_id = m.room_id
            WHERE p.user_id = v_user_id AND p.left_at IS NULL
            AND fa.deleted_at IS NULL
            GROUP BY metadata->>'file_type'
          ) type_stats
        ),
        'total_size_mb', ROUND(SUM(file_size) / 1024.0 / 1024.0, 2)
      )
      FROM axis6_chat_file_attachments fa
      JOIN axis6_chat_messages m ON m.id = fa.message_id
      JOIN axis6_chat_participants p ON p.room_id = m.room_id
      WHERE p.user_id = v_user_id AND p.left_at IS NULL
      AND fa.deleted_at IS NULL
    )
  ) INTO v_engagement
  FROM (
    SELECT sender_id, COUNT(*) as user_msg_count
    FROM axis6_chat_messages m
    JOIN axis6_chat_participants p ON p.room_id = m.room_id
    WHERE p.user_id = v_user_id AND p.left_at IS NULL
    AND m.deleted_at IS NULL
    GROUP BY sender_id
  ) user_stats
  LEFT JOIN axis6_chat_messages m1 ON true
  LEFT JOIN axis6_chat_messages m2 ON m2.room_id = m1.room_id 
    AND m2.created_at > m1.created_at 
    AND m2.sender_id != m1.sender_id
  WHERE m1.room_id IN (
    SELECT room_id FROM axis6_chat_participants 
    WHERE user_id = v_user_id AND left_at IS NULL
  );

  -- Social metrics
  SELECT json_build_object(
    'mentions_given', (
      SELECT COUNT(*)
      FROM axis6_chat_mentions
      WHERE mentioner_id = v_user_id
    ),
    'mentions_received', (
      SELECT COUNT(*)
      FROM axis6_chat_mentions
      WHERE mentioned_user_id = v_user_id
    ),
    'top_mentioners', (
      SELECT json_agg(
        json_build_object(
          'user_id', p.id,
          'user_name', p.name,
          'mentions_count', mention_count
        ) ORDER BY mention_count DESC
      )
      FROM (
        SELECT mentioner_id, COUNT(*) as mention_count
        FROM axis6_chat_mentions
        WHERE mentioned_user_id = v_user_id
        GROUP BY mentioner_id
        ORDER BY mention_count DESC
        LIMIT 5
      ) top_mentioners
      JOIN axis6_profiles p ON p.id = top_mentioners.mentioner_id
    ),
    'top_mentioned', (
      SELECT json_agg(
        json_build_object(
          'user_id', p.id,
          'user_name', p.name,
          'mentions_count', mention_count
        ) ORDER BY mention_count DESC
      )
      FROM (
        SELECT mentioned_user_id, COUNT(*) as mention_count
        FROM axis6_chat_mentions
        WHERE mentioner_id = v_user_id
        GROUP BY mentioned_user_id
        ORDER BY mention_count DESC
        LIMIT 5
      ) top_mentioned
      JOIN axis6_profiles p ON p.id = top_mentioned.mentioned_user_id
    )
  ) INTO v_social;

  -- Search metrics (if search analytics table exists)
  SELECT json_build_object(
    'total_searches', COALESCE(COUNT(*), 0),
    'avg_results_per_search', ROUND(COALESCE(AVG(results_count), 0), 2),
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
        GROUP BY search_query
        ORDER BY search_count DESC
        LIMIT 10
      ) top_searches
    ),
    'search_success_rate', ROUND(
      COALESCE(
        (COUNT(*) FILTER (WHERE results_count > 0)::FLOAT / COUNT(*)::FLOAT) * 100, 
        0
      ), 2
    )
  ) INTO v_search
  FROM axis6_chat_search_analytics
  WHERE user_id = v_user_id;

  -- Combine all metrics
  SELECT json_build_object(
    'overview', v_overview,
    'activity', v_activity,
    'engagement', v_engagement,
    'social', v_social,
    'search', v_search
  ) INTO v_analytics;

  RETURN COALESCE(v_analytics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for room analytics
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
    'room_id', r.id,
    'room_name', r.name,
    'overview', json_build_object(
      'total_messages', COUNT(DISTINCT m.id),
      'total_participants', COUNT(DISTINCT p.user_id),
      'messages_today', COUNT(DISTINCT m.id) FILTER (WHERE m.created_at >= CURRENT_DATE),
      'avg_messages_per_day', ROUND(
        COUNT(DISTINCT m.id)::FLOAT / 
        GREATEST(EXTRACT(DAYS FROM (NOW() - r.created_at)), 1), 2
      ),
      'room_age_days', EXTRACT(DAYS FROM (NOW() - r.created_at))
    ),
    'activity', json_build_object(
      'messages_by_day', (
        SELECT json_agg(
          json_build_object(
            'date', day_val::TEXT,
            'count', COALESCE(msg_count, 0)
          ) ORDER BY day_val
        )
        FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, INTERVAL '1 day') as day_val
        LEFT JOIN (
          SELECT DATE(created_at) as day_val, COUNT(*) as msg_count
          FROM axis6_chat_messages
          WHERE room_id = p_room_id AND deleted_at IS NULL
          GROUP BY DATE(created_at)
        ) daily USING (day_val)
      ),
      'messages_by_hour', (
        SELECT json_agg(
          json_build_object(
            'hour', hour_val,
            'count', COALESCE(msg_count, 0)
          ) ORDER BY hour_val
        )
        FROM generate_series(0, 23) as hour_val
        LEFT JOIN (
          SELECT EXTRACT(HOUR FROM created_at) as hour_val, COUNT(*) as msg_count
          FROM axis6_chat_messages
          WHERE room_id = p_room_id AND deleted_at IS NULL
          AND created_at >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY EXTRACT(HOUR FROM created_at)
        ) hourly USING (hour_val)
      ),
      'most_active_participants', (
        SELECT json_agg(
          json_build_object(
            'user_id', sender.id,
            'user_name', sender.name,
            'message_count', COUNT(m.id)
          ) ORDER BY COUNT(m.id) DESC
        )
        FROM axis6_chat_messages m
        JOIN axis6_profiles sender ON sender.id = m.sender_id
        WHERE m.room_id = p_room_id AND m.deleted_at IS NULL
        GROUP BY sender.id, sender.name
        LIMIT 10
      ),
      'peak_activity_hour', (
        SELECT EXTRACT(HOUR FROM created_at) as peak_hour
        FROM axis6_chat_messages
        WHERE room_id = p_room_id AND deleted_at IS NULL
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY COUNT(*) DESC
        LIMIT 1
      )
    ),
    'engagement', json_build_object(
      'avg_response_time_minutes', ROUND(AVG(
        EXTRACT(EPOCH FROM (m2.created_at - m1.created_at)) / 60
      ), 2),
      'file_attachments_count', (
        SELECT COUNT(*)
        FROM axis6_chat_file_attachments fa
        JOIN axis6_chat_messages m ON m.id = fa.message_id
        WHERE m.room_id = p_room_id AND fa.deleted_at IS NULL
      ),
      'mentions_count', (
        SELECT COUNT(*)
        FROM axis6_chat_mentions men
        JOIN axis6_chat_messages m ON m.id = men.message_id
        WHERE m.room_id = p_room_id
      ),
      'active_participants_30d', (
        SELECT COUNT(DISTINCT sender_id)
        FROM axis6_chat_messages
        WHERE room_id = p_room_id AND deleted_at IS NULL
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      )
    )
  ) INTO v_analytics
  FROM axis6_chat_rooms r
  LEFT JOIN axis6_chat_participants p ON p.room_id = r.id
  LEFT JOIN axis6_chat_messages m ON m.room_id = r.id AND m.deleted_at IS NULL
  LEFT JOIN axis6_chat_messages m1 ON m1.room_id = p_room_id
  LEFT JOIN axis6_chat_messages m2 ON m2.room_id = p_room_id 
    AND m2.created_at > m1.created_at 
    AND m2.sender_id != m1.sender_id
  WHERE r.id = p_room_id
  GROUP BY r.id, r.name, r.created_at;

  RETURN COALESCE(v_analytics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for user analytics
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
    'user_name', u.name,
    'overview', json_build_object(
      'total_messages_sent', COUNT(DISTINCT m.id),
      'total_rooms_joined', COUNT(DISTINCT p.room_id),
      'messages_today', COUNT(DISTINCT m.id) FILTER (WHERE m.created_at >= CURRENT_DATE),
      'avg_messages_per_day', ROUND(
        COUNT(DISTINCT m.id)::FLOAT / 
        GREATEST(EXTRACT(DAYS FROM (NOW() - u.created_at)), 1), 2
      ),
      'account_age_days', EXTRACT(DAYS FROM (NOW() - u.created_at))
    ),
    'activity', json_build_object(
      'messages_by_day', (
        SELECT json_agg(
          json_build_object(
            'date', day_val::TEXT,
            'count', COALESCE(msg_count, 0)
          ) ORDER BY day_val
        )
        FROM generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, INTERVAL '1 day') as day_val
        LEFT JOIN (
          SELECT DATE(created_at) as day_val, COUNT(*) as msg_count
          FROM axis6_chat_messages
          WHERE sender_id = v_user_id AND deleted_at IS NULL
          GROUP BY DATE(created_at)
        ) daily USING (day_val)
      ),
      'messages_by_hour', (
        SELECT json_agg(
          json_build_object(
            'hour', hour_val,
            'count', COALESCE(msg_count, 0)
          ) ORDER BY hour_val
        )
        FROM generate_series(0, 23) as hour_val
        LEFT JOIN (
          SELECT EXTRACT(HOUR FROM created_at) as hour_val, COUNT(*) as msg_count
          FROM axis6_chat_messages
          WHERE sender_id = v_user_id AND deleted_at IS NULL
          GROUP BY EXTRACT(HOUR FROM created_at)
        ) hourly USING (hour_val)
      ),
      'favorite_rooms', (
        SELECT json_agg(
          json_build_object(
            'room_id', r.id,
            'room_name', r.name,
            'message_count', COUNT(m.id)
          ) ORDER BY COUNT(m.id) DESC
        )
        FROM axis6_chat_messages m
        JOIN axis6_chat_rooms r ON r.id = m.room_id
        WHERE m.sender_id = v_user_id AND m.deleted_at IS NULL
        GROUP BY r.id, r.name
        LIMIT 5
      ),
      'most_active_day', (
        SELECT TO_CHAR(DATE(created_at), 'Day')
        FROM axis6_chat_messages
        WHERE sender_id = v_user_id AND deleted_at IS NULL
        GROUP BY DATE(created_at), TO_CHAR(DATE(created_at), 'Day')
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ),
      'most_active_hour', (
        SELECT EXTRACT(HOUR FROM created_at)
        FROM axis6_chat_messages
        WHERE sender_id = v_user_id AND deleted_at IS NULL
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY COUNT(*) DESC
        LIMIT 1
      )
    ),
    'social', json_build_object(
      'mentions_given', (
        SELECT COUNT(*) FROM axis6_chat_mentions WHERE mentioner_id = v_user_id
      ),
      'mentions_received', (
        SELECT COUNT(*) FROM axis6_chat_mentions WHERE mentioned_user_id = v_user_id
      ),
      'files_shared', (
        SELECT COUNT(*)
        FROM axis6_chat_file_attachments fa
        JOIN axis6_chat_messages m ON m.id = fa.message_id
        WHERE m.sender_id = v_user_id AND fa.deleted_at IS NULL
      ),
      'responses_received', (
        SELECT COUNT(DISTINCT m2.id)
        FROM axis6_chat_messages m1
        JOIN axis6_chat_messages m2 ON m2.room_id = m1.room_id 
          AND m2.created_at > m1.created_at
          AND m2.sender_id != m1.sender_id
        WHERE m1.sender_id = v_user_id 
        AND m2.created_at <= m1.created_at + INTERVAL '1 hour'
        AND m1.deleted_at IS NULL AND m2.deleted_at IS NULL
      ),
      'avg_response_time_minutes', (
        SELECT ROUND(AVG(
          EXTRACT(EPOCH FROM (m2.created_at - m1.created_at)) / 60
        ), 2)
        FROM axis6_chat_messages m1
        JOIN axis6_chat_messages m2 ON m2.room_id = m1.room_id 
          AND m2.created_at > m1.created_at
          AND m2.sender_id = v_user_id
        WHERE m1.sender_id != v_user_id 
        AND m2.created_at <= m1.created_at + INTERVAL '1 hour'
        AND m1.deleted_at IS NULL AND m2.deleted_at IS NULL
      )
    )
  ) INTO v_analytics
  FROM axis6_profiles u
  LEFT JOIN axis6_chat_participants p ON p.user_id = u.id AND p.left_at IS NULL
  LEFT JOIN axis6_chat_messages m ON m.sender_id = u.id AND m.deleted_at IS NULL
  WHERE u.id = v_user_id
  GROUP BY u.id, u.name, u.created_at;

  RETURN COALESCE(v_analytics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for realtime metrics
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
    'active_users_now', (
      SELECT COUNT(DISTINCT sender_id)
      FROM axis6_chat_messages m
      JOIN axis6_chat_participants p ON p.room_id = m.room_id
      WHERE p.user_id = v_user_id AND p.left_at IS NULL
      AND m.created_at >= NOW() - INTERVAL '15 minutes'
      AND m.deleted_at IS NULL
    ),
    'messages_last_hour', (
      SELECT COUNT(*)
      FROM axis6_chat_messages m
      JOIN axis6_chat_participants p ON p.room_id = m.room_id
      WHERE p.user_id = v_user_id AND p.left_at IS NULL
      AND m.created_at >= NOW() - INTERVAL '1 hour'
      AND m.deleted_at IS NULL
    ),
    'active_rooms', (
      SELECT COUNT(DISTINCT room_id)
      FROM axis6_chat_messages m
      JOIN axis6_chat_participants p ON p.room_id = m.room_id
      WHERE p.user_id = v_user_id AND p.left_at IS NULL
      AND m.created_at >= NOW() - INTERVAL '1 hour'
      AND m.deleted_at IS NULL
    ),
    'online_participants', (
      SELECT json_agg(
        json_build_object(
          'user_id', prof.id,
          'user_name', prof.name,
          'last_seen', COALESCE(last_msg.created_at, p.joined_at)
        ) ORDER BY COALESCE(last_msg.created_at, p.joined_at) DESC
      )
      FROM axis6_chat_participants p
      JOIN axis6_profiles prof ON prof.id = p.user_id
      LEFT JOIN (
        SELECT sender_id, MAX(created_at) as created_at
        FROM axis6_chat_messages
        WHERE created_at >= NOW() - INTERVAL '30 minutes'
        AND deleted_at IS NULL
        GROUP BY sender_id
      ) last_msg ON last_msg.sender_id = p.user_id
      WHERE p.room_id IN (
        SELECT room_id FROM axis6_chat_participants 
        WHERE user_id = v_user_id AND left_at IS NULL
      )
      AND p.left_at IS NULL
      AND (last_msg.created_at >= NOW() - INTERVAL '30 minutes' OR p.joined_at >= NOW() - INTERVAL '30 minutes')
      LIMIT 20
    )
  ) INTO v_metrics;

  RETURN COALESCE(v_metrics, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;