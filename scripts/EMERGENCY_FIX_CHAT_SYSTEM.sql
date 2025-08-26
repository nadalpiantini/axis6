-- =====================================================
-- AXIS6 EMERGENCY FIX FOR CHAT SYSTEM 404 ERRORS
-- =====================================================
-- Execute this in Supabase SQL Editor to fix all chat-related 404 errors:
-- https://supabase.com/dashboard/project/nvpnhqhjttgwfwvkgmpk/sql/new
-- =====================================================

BEGIN;

-- STEP 1: Create missing chat system tables
-- =====================================================

-- Create chat rooms table
CREATE TABLE IF NOT EXISTS axis6_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'group' CHECK (type IN ('direct', 'category', 'group', 'support')),
    category_id INTEGER REFERENCES axis6_categories(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    max_participants INTEGER DEFAULT 100,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat participants table
CREATE TABLE IF NOT EXISTS axis6_chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES axis6_chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT false,
    notification_settings JSONB DEFAULT '{"mentions": true, "messages": true, "reactions": true}',
    UNIQUE(room_id, user_id)
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS axis6_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES axis6_chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'achievement')),
    reply_to_id UUID REFERENCES axis6_chat_messages(id) ON DELETE SET NULL,
    thread_id UUID REFERENCES axis6_chat_messages(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat reactions table
CREATE TABLE IF NOT EXISTS axis6_chat_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES axis6_chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Create chat attachments table
CREATE TABLE IF NOT EXISTS axis6_chat_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES axis6_chat_messages(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    upload_status VARCHAR(20) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'ready', 'failed')),
    metadata JSONB DEFAULT '{}',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat mentions table
CREATE TABLE IF NOT EXISTS axis6_chat_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES axis6_chat_messages(id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mentioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat search analytics table
CREATE TABLE IF NOT EXISTS axis6_chat_search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    search_time_ms INTEGER DEFAULT 0,
    rooms_searched INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 2: Create indexes for performance
-- =====================================================

-- Chat rooms indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON axis6_chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_category ON axis6_chat_rooms(category_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON axis6_chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON axis6_chat_rooms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active ON axis6_chat_rooms(is_active) WHERE is_active = true;

-- Chat participants indexes
CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON axis6_chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON axis6_chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_active ON axis6_chat_participants(room_id, user_id) WHERE left_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_chat_participants_role ON axis6_chat_participants(room_id, role);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON axis6_chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON axis6_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON axis6_chat_messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON axis6_chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON axis6_chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_active ON axis6_chat_messages(room_id, created_at DESC) WHERE deleted_at IS NULL;

-- Chat reactions indexes
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message ON axis6_chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user ON axis6_chat_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_emoji ON axis6_chat_reactions(emoji);

-- Chat attachments indexes
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message ON axis6_chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_uploader ON axis6_chat_attachments(uploader_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_type ON axis6_chat_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_status ON axis6_chat_attachments(upload_status);

-- Chat mentions indexes
CREATE INDEX IF NOT EXISTS idx_chat_mentions_message_id ON axis6_chat_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_mentioned_user ON axis6_chat_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_mentioner ON axis6_chat_mentions(mentioner_id);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_created_at ON axis6_chat_mentions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_mentions_unread ON axis6_chat_mentions(mentioned_user_id) WHERE read_at IS NULL;

-- Chat search analytics indexes
CREATE INDEX IF NOT EXISTS idx_chat_search_analytics_user ON axis6_chat_search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_search_analytics_created_at ON axis6_chat_search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_search_analytics_query ON axis6_chat_search_analytics(search_query);

-- STEP 3: Enable Row Level Security
-- =====================================================

ALTER TABLE axis6_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_search_analytics ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create RLS Policies
-- =====================================================

-- Chat rooms policies
CREATE POLICY "Users can view accessible rooms" ON axis6_chat_rooms
    FOR SELECT USING (
        is_active = true AND (
            is_private = false OR
            EXISTS (SELECT 1 FROM axis6_chat_participants WHERE room_id = id AND user_id = auth.uid() AND left_at IS NULL) OR
            created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create rooms" ON axis6_chat_rooms
    FOR INSERT WITH CHECK (created_by = auth.uid());

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
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation" ON axis6_chat_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Users can view messages in accessible rooms" ON axis6_chat_messages
    FOR SELECT USING (
        deleted_at IS NULL AND
        EXISTS (SELECT 1 FROM axis6_chat_participants WHERE room_id = axis6_chat_messages.room_id AND user_id = auth.uid() AND left_at IS NULL)
    );

CREATE POLICY "Users can send messages to accessible rooms" ON axis6_chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (SELECT 1 FROM axis6_chat_participants WHERE room_id = axis6_chat_messages.room_id AND user_id = auth.uid() AND left_at IS NULL)
    );

CREATE POLICY "Users can edit their own messages" ON axis6_chat_messages
    FOR UPDATE USING (sender_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can delete their own messages" ON axis6_chat_messages
    FOR UPDATE USING (sender_id = auth.uid());

-- Chat reactions policies
CREATE POLICY "Users can view reactions in accessible rooms" ON axis6_chat_reactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM axis6_chat_participants p 
                JOIN axis6_chat_messages m ON p.room_id = m.room_id 
                WHERE m.id = axis6_chat_reactions.message_id AND p.user_id = auth.uid() AND p.left_at IS NULL)
    );

CREATE POLICY "Users can add reactions to accessible messages" ON axis6_chat_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM axis6_chat_participants p 
                JOIN axis6_chat_messages m ON p.room_id = m.room_id 
                WHERE m.id = axis6_chat_reactions.message_id AND p.user_id = auth.uid() AND p.left_at IS NULL)
    );

CREATE POLICY "Users can remove their own reactions" ON axis6_chat_reactions
    FOR DELETE USING (user_id = auth.uid());

-- Chat attachments policies
CREATE POLICY "Users can view attachments in accessible rooms" ON axis6_chat_attachments
    FOR SELECT USING (
        deleted_at IS NULL AND
        EXISTS (SELECT 1 FROM axis6_chat_participants p 
                JOIN axis6_chat_messages m ON p.room_id = m.room_id 
                WHERE m.id = axis6_chat_attachments.message_id AND p.user_id = auth.uid() AND p.left_at IS NULL)
    );

CREATE POLICY "Users can upload attachments to accessible rooms" ON axis6_chat_attachments
    FOR INSERT WITH CHECK (
        uploader_id = auth.uid() AND
        EXISTS (SELECT 1 FROM axis6_chat_participants p 
                JOIN axis6_chat_messages m ON p.room_id = m.room_id 
                WHERE m.id = axis6_chat_attachments.message_id AND p.user_id = auth.uid() AND p.left_at IS NULL)
    );

-- Chat mentions policies
CREATE POLICY "Users can view their own mentions" ON axis6_chat_mentions
    FOR SELECT USING (mentioned_user_id = auth.uid());

CREATE POLICY "Users can create mentions in accessible rooms" ON axis6_chat_mentions
    FOR INSERT WITH CHECK (
        mentioner_id = auth.uid() AND
        EXISTS (SELECT 1 FROM axis6_chat_participants p 
                JOIN axis6_chat_messages m ON p.room_id = m.room_id 
                WHERE m.id = axis6_chat_mentions.message_id AND p.user_id = auth.uid() AND p.left_at IS NULL)
    );

-- Chat search analytics policies
CREATE POLICY "Users can view their own search analytics" ON axis6_chat_search_analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own search analytics" ON axis6_chat_search_analytics
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- STEP 5: Create missing functions
-- =====================================================

-- Function to get chat analytics
CREATE OR REPLACE FUNCTION get_chat_analytics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_rooms', (SELECT COUNT(*) FROM axis6_chat_rooms WHERE is_active = true),
        'total_messages', (SELECT COUNT(*) FROM axis6_chat_messages WHERE deleted_at IS NULL),
        'total_participants', (SELECT COUNT(*) FROM axis6_chat_participants WHERE left_at IS NULL),
        'active_rooms', (SELECT COUNT(DISTINCT room_id) FROM axis6_chat_participants WHERE left_at IS NULL)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get room analytics
CREATE OR REPLACE FUNCTION get_room_analytics(p_room_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'room_id', p_room_id,
        'total_messages', (SELECT COUNT(*) FROM axis6_chat_messages WHERE room_id = p_room_id AND deleted_at IS NULL),
        'total_participants', (SELECT COUNT(*) FROM axis6_chat_participants WHERE room_id = p_room_id AND left_at IS NULL),
        'last_activity', (SELECT MAX(created_at) FROM axis6_chat_messages WHERE room_id = p_room_id AND deleted_at IS NULL)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user_id', auth.uid(),
        'rooms_joined', (SELECT COUNT(*) FROM axis6_chat_participants WHERE user_id = auth.uid() AND left_at IS NULL),
        'messages_sent', (SELECT COUNT(*) FROM axis6_chat_messages WHERE sender_id = auth.uid() AND deleted_at IS NULL),
        'reactions_given', (SELECT COUNT(*) FROM axis6_chat_reactions WHERE user_id = auth.uid())
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search messages
CREATE OR REPLACE FUNCTION search_messages(
    search_query TEXT,
    p_room_id UUID DEFAULT NULL,
    p_sender_id UUID DEFAULT NULL,
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', m.id,
            'content', m.content,
            'message_type', m.message_type,
            'created_at', m.created_at,
            'sender_name', p.name,
            'room_name', r.name
        )
    ) INTO result
    FROM axis6_chat_messages m
    JOIN axis6_chat_rooms r ON m.room_id = r.id
    JOIN axis6_profiles p ON m.sender_id = p.id
    WHERE m.deleted_at IS NULL
    AND m.content ILIKE '%' || search_query || '%'
    AND (p_room_id IS NULL OR m.room_id = p_room_id)
    AND (p_sender_id IS NULL OR m.sender_id = p_sender_id)
    AND (p_date_from IS NULL OR m.created_at >= p_date_from)
    AND (p_date_to IS NULL OR m.created_at <= p_date_to)
    AND EXISTS (
        SELECT 1 FROM axis6_chat_participants 
        WHERE room_id = m.room_id AND user_id = auth.uid() AND left_at IS NULL
    )
    ORDER BY m.created_at DESC
    LIMIT p_limit OFFSET p_offset;
    
    RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 6: Add realtime subscriptions
-- =====================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_chat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_chat_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE axis6_chat_mentions;

-- STEP 7: Create updated_at triggers
-- =====================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to chat tables
DROP TRIGGER IF EXISTS update_chat_rooms_updated_at ON axis6_chat_rooms;
CREATE TRIGGER update_chat_rooms_updated_at
    BEFORE UPDATE ON axis6_chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON axis6_chat_messages;
CREATE TRIGGER update_chat_messages_updated_at
    BEFORE UPDATE ON axis6_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_attachments_updated_at ON axis6_chat_attachments;
CREATE TRIGGER update_chat_attachments_updated_at
    BEFORE UPDATE ON axis6_chat_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
SELECT 'axis6_chat_rooms' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_chat_rooms'
) as exists;

SELECT 'axis6_chat_participants' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_chat_participants'
) as exists;

SELECT 'axis6_chat_messages' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_chat_messages'
) as exists;

SELECT 'axis6_chat_reactions' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_chat_reactions'
) as exists;

SELECT 'axis6_chat_attachments' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'axis6_chat_attachments'
) as exists;

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('get_chat_analytics', 'get_room_analytics', 'get_user_analytics', 'search_messages');

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'axis6_chat_%';
