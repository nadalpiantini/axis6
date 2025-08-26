-- AXIS6 Chat System Migration
-- Adding real-time chat functionality to AXIS6 platform
-- Date: 2025-08-26

BEGIN;

-- Create chat rooms table
CREATE TABLE IF NOT EXISTS axis6_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('direct', 'category', 'group', 'support')),
  category_id INTEGER REFERENCES axis6_categories(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT NULL, -- NULL = unlimited
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat participants table (room membership)
CREATE TABLE IF NOT EXISTS axis6_chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES axis6_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT false,
  notification_settings JSONB DEFAULT '{"mentions": true, "all": true}',
  UNIQUE(room_id, user_id)
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS axis6_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES axis6_chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'achievement')),
  reply_to_id UUID REFERENCES axis6_chat_messages(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}', -- File attachments, achievement data, etc.
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat message reactions table (for emoji reactions)
CREATE TABLE IF NOT EXISTS axis6_chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES axis6_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type_active 
ON axis6_chat_rooms(type, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_category 
ON axis6_chat_rooms(category_id, is_active) 
WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_participants_room 
ON axis6_chat_participants(room_id, joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_participants_user 
ON axis6_chat_participants(user_id, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time 
ON axis6_chat_messages(room_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender 
ON axis6_chat_messages(sender_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message 
ON axis6_chat_reactions(message_id, emoji);

-- Create updated_at trigger for chat_rooms
CREATE OR REPLACE FUNCTION update_axis6_chat_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_rooms_updated_at
  BEFORE UPDATE ON axis6_chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_axis6_chat_rooms_updated_at();

-- RLS Policies
ALTER TABLE axis6_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_chat_reactions ENABLE ROW LEVEL SECURITY;

-- Chat rooms: Users can see rooms they're participants in
CREATE POLICY "Users can view rooms they participate in" ON axis6_chat_rooms
  FOR SELECT USING (
    id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
  );

-- Chat rooms: Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms" ON axis6_chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND creator_id = auth.uid());

-- Chat rooms: Room creators and admins can update rooms
CREATE POLICY "Room creators and admins can update rooms" ON axis6_chat_rooms
  FOR UPDATE USING (
    creator_id = auth.uid() OR
    id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Chat participants: Users can see participants in their rooms
CREATE POLICY "Users can view participants in their rooms" ON axis6_chat_participants
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
  );

-- Chat participants: Room admins can manage participants
CREATE POLICY "Room admins can manage participants" ON axis6_chat_participants
  FOR ALL USING (
    room_id IN (
      SELECT room_id FROM axis6_chat_participants 
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Chat participants: Users can join/leave rooms (insert/delete their own participation)
CREATE POLICY "Users can manage their own participation" ON axis6_chat_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave rooms" ON axis6_chat_participants
  FOR DELETE USING (user_id = auth.uid());

-- Chat messages: Users can see messages in their rooms
CREATE POLICY "Users can view messages in their rooms" ON axis6_chat_messages
  FOR SELECT USING (
    room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid()) AND
    deleted_at IS NULL
  );

-- Chat messages: Participants can send messages
CREATE POLICY "Participants can send messages" ON axis6_chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
  );

-- Chat messages: Users can edit/delete their own messages
CREATE POLICY "Users can edit their own messages" ON axis6_chat_messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Chat reactions: Users can see reactions in their rooms
CREATE POLICY "Users can view reactions in their rooms" ON axis6_chat_reactions
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM axis6_chat_messages 
      WHERE room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
    )
  );

-- Chat reactions: Participants can add/remove reactions
CREATE POLICY "Participants can manage reactions" ON axis6_chat_reactions
  FOR ALL USING (
    user_id = auth.uid() AND
    message_id IN (
      SELECT id FROM axis6_chat_messages 
      WHERE room_id IN (SELECT room_id FROM axis6_chat_participants WHERE user_id = auth.uid())
    )
  );

-- Create default category-based chat rooms
INSERT INTO axis6_chat_rooms (name, description, type, category_id, creator_id) VALUES
  ('Physical Wellness', 'Share your fitness journey and healthy habits', 'category', 
   (SELECT id FROM axis6_categories WHERE slug = 'physical'), NULL),
  ('Mental Growth', 'Discuss learning, productivity, and mental challenges', 'category', 
   (SELECT id FROM axis6_categories WHERE slug = 'mental'), NULL),
  ('Emotional Support', 'A safe space for emotional well-being discussions', 'category', 
   (SELECT id FROM axis6_categories WHERE slug = 'emotional'), NULL),
  ('Social Connections', 'Build relationships and share social experiences', 'category', 
   (SELECT id FROM axis6_categories WHERE slug = 'social'), NULL),
  ('Spiritual Journey', 'Explore mindfulness, meditation, and purpose', 'category', 
   (SELECT id FROM axis6_categories WHERE slug = 'spiritual'), NULL),
  ('Material Goals', 'Career, finances, and material aspirations', 'category', 
   (SELECT id FROM axis6_categories WHERE slug = 'material'), NULL),
  ('General Support', 'General questions and platform support', 'support', NULL, NULL);

COMMIT;