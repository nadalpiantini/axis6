-- AXIS6 Chat Enhancement Suite Deployment
-- Safe deployment script for production database
-- Execute this in Supabase Dashboard -> SQL Editor

BEGIN;

-- ========================================
-- 1. CHAT SYSTEM CORE TABLES
-- ========================================

-- Chat rooms table
CREATE TABLE IF NOT EXISTS axis6_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('direct', 'group', 'category', 'support')) DEFAULT 'group',
  category_id INTEGER REFERENCES axis6_categories(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  max_participants INTEGER DEFAULT 100,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- Chat participants table
CREATE TABLE IF NOT EXISTS axis6_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES axis6_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  last_read_message_id UUID,
  notification_settings JSONB DEFAULT '{"mentions": true, "all_messages": true}',
  
  UNIQUE(room_id, user_id)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS axis6_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES axis6_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  reply_to_id UUID REFERENCES axis6_chat_messages(id) ON DELETE SET NULL,
  thread_id UUID,
  metadata JSONB DEFAULT '{}',
  has_mentions BOOLEAN DEFAULT FALSE,
  mention_count INTEGER DEFAULT 0,
  search_vector tsvector,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ
);

-- ========================================
-- 2. FILE SHARING SYSTEM
-- ========================================

-- File attachments table
CREATE TABLE IF NOT EXISTS axis6_chat_file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES axis6_chat_messages(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File storage information
  file_path TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  file_type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  
  -- File metadata
  metadata JSONB DEFAULT '{}',
  
  -- Upload status
  upload_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
  upload_progress INTEGER DEFAULT 0 CHECK (upload_progress >= 0 AND upload_progress <= 100),
  
  -- File processing
  thumbnail_path TEXT,
  processed_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ========================================
-- 3. MENTIONS SYSTEM
-- ========================================

-- Mentions tracking table
CREATE TABLE IF NOT EXISTS axis6_chat_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES axis6_chat_messages(id) ON DELETE CASCADE,
  mentioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Mention context
  mention_text TEXT NOT NULL,
  start_position INTEGER NOT NULL CHECK (start_position >= 0),
  end_position INTEGER NOT NULL CHECK (end_position > start_position),
  
  -- Notification tracking
  notified_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
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

-- ========================================
-- 4. SEARCH SYSTEM
-- ========================================

-- Search analytics table
CREATE TABLE IF NOT EXISTS axis6_chat_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  search_time_ms INTEGER NOT NULL DEFAULT 0,
  filters_used JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 5. INDEXES FOR PERFORMANCE
-- ========================================

-- Chat rooms indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON axis6_chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_category ON axis6_chat_rooms(category_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON axis6_chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON axis6_chat_rooms(created_at DESC);

-- Chat participants indexes
CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON axis6_chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON axis6_chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_active ON axis6_chat_participants(room_id, user_id) WHERE left_at IS NULL;

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON axis6_chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON axis6_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON axis6_chat_messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON axis6_chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_search ON axis6_chat_messages USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_chat_messages_search_filters ON axis6_chat_messages(room_id, created_at DESC) WHERE deleted_at IS NULL;

-- File attachments indexes
CREATE INDEX IF NOT EXISTS idx_chat_file_attachments_message ON axis6_chat_file_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_file_attachments_uploader ON axis6_chat_file_attachments(uploader_id);
CREATE INDEX IF NOT EXISTS idx_chat_file_attachments_type ON axis6_chat_file_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_chat_file_attachments_status ON axis6_chat_file_attachments(upload_status);

-- Mentions indexes
CREATE INDEX IF NOT EXISTS idx_chat_mentions_message_id ON axis6_chat_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_mentioned_user ON axis6_chat_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_mentioner ON axis6_chat_mentions(mentioner_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_created_at ON axis6_chat_mentions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_unread ON axis6_chat_mentions(mentioned_user_id) WHERE read_at IS NULL;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON axis6_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON axis6_notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON axis6_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON axis6_notifications(user_id) WHERE read_at IS NULL;

-- Search analytics indexes
CREATE INDEX IF NOT EXISTS idx_chat_search_analytics_user ON axis6_chat_search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_search_analytics_created_at ON axis6_chat_search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_search_analytics_query ON axis6_chat_search_analytics(search_query);

-- ========================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE axis6_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_search_analytics ENABLE ROW LEVEL SECURITY;

-- Chat rooms policies
CREATE POLICY "Users can view accessible rooms" ON axis6_chat_rooms
FOR SELECT USING (
  NOT is_private OR 
  EXISTS (SELECT 1 FROM axis6_chat_participants WHERE room_id = id AND user_id = auth.uid() AND left_at IS NULL) OR
  created_by = auth.uid()
);

CREATE POLICY "Users can create rooms" ON axis6_chat_rooms
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators and admins can update rooms" ON axis6_chat_rooms
FOR UPDATE USING (
  created_by = auth.uid() OR
  EXISTS (SELECT 1 FROM axis6_chat_participants WHERE room_id = id AND user_id = auth.uid() AND role = 'admin' AND left_at IS NULL)
);

-- Chat participants policies
CREATE POLICY "Users can view participants in accessible rooms" ON axis6_chat_participants
FOR SELECT USING (
  EXISTS (SELECT 1 FROM axis6_chat_participants p2 WHERE p2.room_id = room_id AND p2.user_id = auth.uid() AND p2.left_at IS NULL)
);

CREATE POLICY "Users can join rooms" ON axis6_chat_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON axis6_chat_participants
FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view messages in accessible rooms" ON axis6_chat_messages
FOR SELECT USING (
  EXISTS (SELECT 1 FROM axis6_chat_participants WHERE room_id = axis6_chat_messages.room_id AND user_id = auth.uid() AND left_at IS NULL)
);

CREATE POLICY "Users can send messages to accessible rooms" ON axis6_chat_messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM axis6_chat_participants WHERE room_id = axis6_chat_messages.room_id AND user_id = auth.uid() AND left_at IS NULL)
);

CREATE POLICY "Users can update their own messages" ON axis6_chat_messages
FOR UPDATE USING (auth.uid() = sender_id);

-- File attachments policies
CREATE POLICY "Users can view attachments in accessible rooms" ON axis6_chat_file_attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM axis6_chat_messages m
    JOIN axis6_chat_participants p ON p.room_id = m.room_id
    WHERE m.id = message_id AND p.user_id = auth.uid() AND p.left_at IS NULL
  )
);

CREATE POLICY "Users can upload attachments to accessible rooms" ON axis6_chat_file_attachments
FOR INSERT WITH CHECK (
  auth.uid() = uploader_id AND
  EXISTS (
    SELECT 1 FROM axis6_chat_messages m
    JOIN axis6_chat_participants p ON p.room_id = m.room_id
    WHERE m.id = message_id AND p.user_id = auth.uid() AND p.left_at IS NULL
  )
);

-- Mentions policies
CREATE POLICY "Users can view mentions they are part of" ON axis6_chat_mentions
FOR SELECT USING (auth.uid() = mentioner_id OR auth.uid() = mentioned_user_id);

CREATE POLICY "Users can create mentions in accessible rooms" ON axis6_chat_mentions
FOR INSERT WITH CHECK (
  auth.uid() = mentioner_id AND
  EXISTS (
    SELECT 1 FROM axis6_chat_messages msg
    JOIN axis6_chat_participants p ON p.room_id = msg.room_id
    WHERE msg.id = axis6_chat_mentions.message_id AND p.user_id = auth.uid() AND p.left_at IS NULL
  )
);

CREATE POLICY "Users can update their own mention status" ON axis6_chat_mentions
FOR UPDATE USING (auth.uid() = mentioned_user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON axis6_notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON axis6_notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Search analytics policies
CREATE POLICY "Users can view their own search analytics" ON axis6_chat_search_analytics
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search analytics" ON axis6_chat_search_analytics
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================
-- 7. TRIGGERS AND FUNCTIONS
-- ========================================

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER trigger_chat_rooms_updated_at BEFORE UPDATE ON axis6_chat_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_chat_messages_updated_at BEFORE UPDATE ON axis6_chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_chat_file_attachments_updated_at BEFORE UPDATE ON axis6_chat_file_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_chat_mentions_updated_at BEFORE UPDATE ON axis6_chat_mentions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search vector update function
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.content, '') || ' ' || 
    COALESCE(NEW.metadata->>'file_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_search_vector
BEFORE INSERT OR UPDATE ON axis6_chat_messages
FOR EACH ROW EXECUTE FUNCTION update_message_search_vector();

-- Update message mentions function
CREATE OR REPLACE FUNCTION update_message_mentions()
RETURNS TRIGGER AS $$
BEGIN
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
FOR EACH ROW EXECUTE FUNCTION update_message_mentions();

COMMIT;

-- ========================================
-- 8. POST-DEPLOYMENT VERIFICATION
-- ========================================

-- Update existing messages with search vectors (if any exist)
UPDATE axis6_chat_messages 
SET search_vector = to_tsvector('english', COALESCE(content, ''))
WHERE search_vector IS NULL;