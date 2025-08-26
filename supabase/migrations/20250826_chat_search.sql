-- Chat Message Search Enhancement Migration
-- Adds full-text search capabilities to the chat system

BEGIN;

-- Add search vector column to messages for full-text search
ALTER TABLE axis6_chat_messages 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for full-text search performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_search 
ON axis6_chat_messages USING GIN(search_vector);

-- Create index for search filtering by room and date
CREATE INDEX IF NOT EXISTS idx_chat_messages_search_filters 
ON axis6_chat_messages(room_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Create search analytics table
CREATE TABLE IF NOT EXISTS axis6_chat_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  search_time_ms INTEGER NOT NULL DEFAULT 0,
  filters_used JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for search analytics
CREATE INDEX IF NOT EXISTS idx_chat_search_analytics_user ON axis6_chat_search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_search_analytics_created_at ON axis6_chat_search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_search_analytics_query ON axis6_chat_search_analytics(search_query);

-- Enable RLS on search analytics
ALTER TABLE axis6_chat_search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own search analytics"
ON axis6_chat_search_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search analytics"
ON axis6_chat_search_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Update search vector with message content
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.content, '') || ' ' || 
    COALESCE(NEW.metadata->>'file_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS trigger_update_message_search_vector ON axis6_chat_messages;
CREATE TRIGGER trigger_update_message_search_vector
  BEFORE INSERT OR UPDATE ON axis6_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_search_vector();

-- Update existing messages with search vectors
UPDATE axis6_chat_messages 
SET search_vector = to_tsvector('english', 
  COALESCE(content, '') || ' ' || 
  COALESCE(metadata->>'file_name', '')
)
WHERE search_vector IS NULL;

-- Create RPC function for message search
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

-- Create RPC function for search suggestions
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
    AND word NOT IN ('the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'was', 'one', 'our', 'out', 'day', 'get', 'use', 'man', 'new', 'now', 'old', 'see', 'him', 'two', 'how', 'its', 'who', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'eye', 'ago', 'off', 'ask', 'buy', 'own', 'say', 'she', 'may', 'try', 'way', 'too', 'any', 'let', 'put', 'end', 'why', 'cut', 'yet', 'lot')
    GROUP BY word
  ) combined_suggestions
  WHERE char_length(suggestion) >= char_length(partial_query)
  LIMIT 8;

  RETURN COALESCE(v_suggestions, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for user search analytics
CREATE OR REPLACE FUNCTION get_user_search_analytics()
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

-- Create view for search performance monitoring
CREATE VIEW chat_search_performance AS
SELECT 
  DATE_TRUNC('hour', created_at) as search_hour,
  COUNT(*) as total_searches,
  AVG(search_time_ms) as avg_search_time_ms,
  AVG(results_count) as avg_results_count,
  COUNT(DISTINCT user_id) as unique_searchers
FROM axis6_chat_search_analytics
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY search_hour DESC;

-- Grant permissions
GRANT SELECT ON chat_search_performance TO authenticated;

COMMIT;