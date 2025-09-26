-- EMERGENCY FIX: Chat System 500 Errors
BEGIN;

-- 1. Ensure is_private column exists
ALTER TABLE axis6_chat_rooms 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 2. Drop ALL existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view participants in accessible rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can view participants in their rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can manage their own participation" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can leave rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can view own participation" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can view public room participants" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Room creators can view participants" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can join allowed rooms" ON axis6_chat_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON axis6_chat_participants;

DROP POLICY IF EXISTS "Users can view messages in accessible rooms" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can view public room messages" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can view own room messages" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to public rooms" ON axis6_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to own rooms" ON axis6_chat_messages;

DROP POLICY IF EXISTS "Users can view accessible rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can view rooms they participate in" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Room creators and admins can update rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can view public rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Users can view own rooms" ON axis6_chat_rooms;
DROP POLICY IF EXISTS "Room creators can update rooms" ON axis6_chat_rooms;

-- 3. Create SIMPLE, NON-RECURSIVE policies
CREATE POLICY "Allow users to view their own participation"
ON axis6_chat_participants FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Allow users to view participants in public rooms"
ON axis6_chat_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM axis6_chat_rooms 
    WHERE id = axis6_chat_participants.room_id 
    AND is_private = false 
    AND is_active = true
  )
);

CREATE POLICY "Allow users to join public rooms"
ON axis6_chat_participants FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM axis6_chat_rooms
    WHERE id = room_id
    AND is_active = true
    AND (is_private = false OR creator_id = auth.uid())
  )
);

CREATE POLICY "Allow users to update their own participation"
ON axis6_chat_participants FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Allow users to leave rooms"
ON axis6_chat_participants FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Allow users to view public rooms"
ON axis6_chat_rooms FOR SELECT
USING (is_active = true AND is_private = false);

CREATE POLICY "Allow users to view their own rooms"
ON axis6_chat_rooms FOR SELECT
USING (is_active = true AND creator_id = auth.uid());

CREATE POLICY "Allow authenticated users to create rooms"
ON axis6_chat_rooms FOR INSERT
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Allow room creators to update their rooms"
ON axis6_chat_rooms FOR UPDATE
USING (creator_id = auth.uid());

CREATE POLICY "Allow viewing messages in public rooms"
ON axis6_chat_messages FOR SELECT
USING (
  deleted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM axis6_chat_rooms 
    WHERE id = axis6_chat_messages.room_id 
    AND is_private = false 
    AND is_active = true
  )
);

CREATE POLICY "Allow viewing own messages"
ON axis6_chat_messages FOR SELECT
USING (deleted_at IS NULL AND sender_id = auth.uid());

CREATE POLICY "Allow sending messages to public rooms"
ON axis6_chat_messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM axis6_chat_rooms 
    WHERE id = room_id 
    AND is_private = false 
    AND is_active = true
  )
);

-- 4. Fix foreign key relationships
ALTER TABLE axis6_chat_participants 
DROP CONSTRAINT IF EXISTS axis6_chat_participants_user_id_fkey;

ALTER TABLE axis6_chat_participants 
ADD CONSTRAINT axis6_chat_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

ALTER TABLE axis6_chat_rooms 
DROP CONSTRAINT IF EXISTS axis6_chat_rooms_creator_id_fkey;

ALTER TABLE axis6_chat_rooms 
ADD CONSTRAINT axis6_chat_rooms_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES axis6_profiles(id) ON DELETE SET NULL;

ALTER TABLE axis6_chat_messages 
DROP CONSTRAINT IF EXISTS axis6_chat_messages_sender_id_fkey;

ALTER TABLE axis6_chat_messages 
ADD CONSTRAINT axis6_chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES axis6_profiles(id) ON DELETE CASCADE;

-- 5. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_room 
ON axis6_chat_participants(user_id, room_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_active_privacy 
ON axis6_chat_rooms(is_active, is_private, updated_at DESC);

-- 6. Refresh schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Test query
SELECT 'EMERGENCY FIX APPLIED SUCCESSFULLY!' as status;