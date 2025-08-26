-- Chat Mentions Enhancement Migration
-- Adds mention support to the chat system

BEGIN;

-- Create mentions tracking table
CREATE TABLE IF NOT EXISTS axis6_chat_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES axis6_chat_messages(id) ON DELETE CASCADE,
  mentioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Mention context
  mention_text TEXT NOT NULL, -- The @username text as it appears in message
  start_position INTEGER NOT NULL CHECK (start_position >= 0),
  end_position INTEGER NOT NULL CHECK (end_position > start_position),
  
  -- Notification tracking
  notified_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_mentions_message_id ON axis6_chat_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_mentioned_user ON axis6_chat_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_mentioner ON axis6_chat_mentions(mentioner_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_created_at ON axis6_chat_mentions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_unread ON axis6_chat_mentions(mentioned_user_id) WHERE read_at IS NULL;

-- Create composite index for notification queries
CREATE INDEX IF NOT EXISTS idx_chat_mentions_user_notifications 
ON axis6_chat_mentions(mentioned_user_id, created_at DESC) 
WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE axis6_chat_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentions
CREATE POLICY "Users can view mentions they are part of" 
ON axis6_chat_mentions FOR SELECT 
USING (
  auth.uid() = mentioner_id OR auth.uid() = mentioned_user_id
);

CREATE POLICY "Users can create mentions in accessible rooms"
ON axis6_chat_mentions FOR INSERT
WITH CHECK (
  auth.uid() = mentioner_id
  AND EXISTS (
    SELECT 1 FROM axis6_chat_messages msg
    JOIN axis6_chat_participants p ON p.room_id = msg.room_id
    WHERE msg.id = axis6_chat_mentions.message_id
    AND p.user_id = auth.uid()
    AND p.left_at IS NULL
  )
);

CREATE POLICY "Users can update their own mention status"
ON axis6_chat_mentions FOR UPDATE
USING (auth.uid() = mentioned_user_id)
WITH CHECK (auth.uid() = mentioned_user_id);

-- Add mentions support to messages table
ALTER TABLE axis6_chat_messages 
ADD COLUMN IF NOT EXISTS has_mentions BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mention_count INTEGER DEFAULT 0;

-- Create trigger to update has_mentions flag
CREATE OR REPLACE FUNCTION update_message_mentions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the message's mention flags
  UPDATE axis6_chat_messages 
  SET 
    has_mentions = (
      SELECT COUNT(*) > 0 
      FROM axis6_chat_mentions 
      WHERE message_id = COALESCE(NEW.message_id, OLD.message_id)
    ),
    mention_count = (
      SELECT COUNT(*)
      FROM axis6_chat_mentions 
      WHERE message_id = COALESCE(NEW.message_id, OLD.message_id)
    )
  WHERE id = COALESCE(NEW.message_id, OLD.message_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_mentions
  AFTER INSERT OR UPDATE OR DELETE ON axis6_chat_mentions
  FOR EACH ROW
  EXECUTE FUNCTION update_message_mentions();

-- Create notification table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS axis6_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mention', 'reaction', 'message', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON axis6_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON axis6_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON axis6_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON axis6_notifications(user_id) WHERE read_at IS NULL;

-- Enable RLS for notifications
ALTER TABLE axis6_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON axis6_notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON axis6_notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RPC function to process message mentions
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
  SELECT msg.*, p.room_id INTO v_message
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

-- Create RPC function to get user mentions
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

-- Create RPC function to mark mentions as read
CREATE OR REPLACE FUNCTION mark_mentions_read(
  p_mention_ids UUID[]
)
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

-- Create RPC function to get mention statistics
CREATE OR REPLACE FUNCTION get_mention_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_stats JSON;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User authentication required';
  END IF;
  
  SELECT json_build_object(
    'total_mentions', COUNT(*),
    'unread_mentions', COUNT(*) FILTER (WHERE read_at IS NULL),
    'today_mentions', COUNT(*) FILTER (WHERE created_at > CURRENT_DATE),
    'this_week_mentions', COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '7 days'),
    'most_active_mentioners', (
      SELECT json_agg(
        json_build_object(
          'user_id', m2.mentioner_id,
          'name', p2.name,
          'count', mention_count
        ) ORDER BY mention_count DESC
      )
      FROM (
        SELECT mentioner_id, COUNT(*) as mention_count
        FROM axis6_chat_mentions m3
        WHERE m3.mentioned_user_id = v_user_id
        AND m3.created_at > CURRENT_DATE - INTERVAL '30 days'
        GROUP BY mentioner_id
        LIMIT 5
      ) m2
      JOIN axis6_profiles p2 ON p2.id = m2.mentioner_id
    )
  ) INTO v_stats
  FROM axis6_chat_mentions m
  WHERE m.mentioned_user_id = v_user_id;
  
  RETURN COALESCE(v_stats, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the updated_at trigger for mentions
CREATE TRIGGER trigger_chat_mentions_updated_at
    BEFORE UPDATE ON axis6_chat_mentions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for mention analytics
CREATE VIEW chat_mention_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as daily_mentions,
  COUNT(DISTINCT mentioned_user_id) as unique_mentioned_users,
  COUNT(DISTINCT mentioner_id) as unique_mentioners,
  AVG(EXTRACT(EPOCH FROM (COALESCE(read_at, NOW()) - created_at))) as avg_response_time_seconds
FROM axis6_chat_mentions
WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Grant necessary permissions
GRANT SELECT ON chat_mention_analytics TO authenticated;

COMMIT;