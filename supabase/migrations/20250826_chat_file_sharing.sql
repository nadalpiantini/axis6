-- Chat File Sharing Enhancement Migration
-- Adds file attachment support to the chat system

BEGIN;

-- Create chat file attachments table
CREATE TABLE IF NOT EXISTS axis6_chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES axis6_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 50 * 1024 * 1024), -- 50MB limit
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Supabase Storage paths
  storage_bucket TEXT NOT NULL DEFAULT 'chat-files',
  storage_path TEXT NOT NULL,
  
  -- File processing status
  upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploaded', 'processing', 'ready', 'error')),
  thumbnail_path TEXT, -- For images/videos
  
  -- Metadata
  width INTEGER, -- For images
  height INTEGER, -- For images  
  duration INTEGER, -- For videos/audio (seconds)
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON axis6_chat_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_user_id ON axis6_chat_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_created_at ON axis6_chat_attachments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_file_type ON axis6_chat_attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_status ON axis6_chat_attachments(upload_status) WHERE upload_status != 'ready';

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_status 
ON axis6_chat_attachments(message_id, upload_status) 
WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE axis6_chat_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attachments
CREATE POLICY "Users can view attachments in accessible rooms" 
ON axis6_chat_attachments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM axis6_chat_messages msg
    JOIN axis6_chat_participants p ON p.room_id = msg.room_id
    WHERE msg.id = axis6_chat_attachments.message_id
    AND p.user_id = auth.uid()
    AND p.left_at IS NULL
  )
);

CREATE POLICY "Users can upload attachments to accessible rooms"
ON axis6_chat_attachments FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM axis6_chat_messages msg
    JOIN axis6_chat_participants p ON p.room_id = msg.room_id
    WHERE msg.id = axis6_chat_attachments.message_id
    AND p.user_id = auth.uid()
    AND p.left_at IS NULL
  )
);

CREATE POLICY "Users can update their own attachment status"
ON axis6_chat_attachments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete their own attachments"
ON axis6_chat_attachments FOR UPDATE
USING (auth.uid() = user_id AND deleted_at IS NULL)
WITH CHECK (auth.uid() = user_id);

-- Add attachment support to messages table
ALTER TABLE axis6_chat_messages 
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE;

-- Create trigger to update has_attachments flag
CREATE OR REPLACE FUNCTION update_message_attachments()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the message's has_attachments flag
  UPDATE axis6_chat_messages 
  SET has_attachments = (
    SELECT COUNT(*) > 0 
    FROM axis6_chat_attachments 
    WHERE message_id = COALESCE(NEW.message_id, OLD.message_id)
    AND deleted_at IS NULL
    AND upload_status = 'ready'
  )
  WHERE id = COALESCE(NEW.message_id, OLD.message_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_attachments
  AFTER INSERT OR UPDATE OR DELETE ON axis6_chat_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_message_attachments();

-- Create storage bucket policy for chat files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-files', 
  'chat-files',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4',
    'application/pdf', 'text/plain', 'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip', 'application/x-zip-compressed'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can upload files to their own folders"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view files in rooms they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-files'
  AND (
    -- Own files
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Files in accessible rooms
    EXISTS (
      SELECT 1 FROM axis6_chat_attachments att
      JOIN axis6_chat_messages msg ON msg.id = att.message_id
      JOIN axis6_chat_participants p ON p.room_id = msg.room_id
      WHERE att.storage_path = name
      AND p.user_id = auth.uid()
      AND p.left_at IS NULL
    )
  )
);

CREATE POLICY "Users can update their own file metadata"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chat-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'chat-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RPC function for file upload initialization
CREATE OR REPLACE FUNCTION initialize_file_upload(
  p_message_id UUID,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_mime_type TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_file_type TEXT;
  v_storage_path TEXT;
  v_attachment_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Validate file size (50MB limit)
  IF p_file_size > 50 * 1024 * 1024 THEN
    RAISE EXCEPTION 'File size exceeds 50MB limit';
  END IF;
  
  -- Determine file type category
  v_file_type := CASE 
    WHEN p_mime_type LIKE 'image/%' THEN 'image'
    WHEN p_mime_type LIKE 'video/%' THEN 'video'  
    WHEN p_mime_type LIKE 'audio/%' THEN 'audio'
    WHEN p_mime_type = 'application/pdf' THEN 'document'
    WHEN p_mime_type LIKE 'application/vnd.openxmlformats-officedocument%' THEN 'document'
    WHEN p_mime_type LIKE 'text/%' THEN 'document'
    ELSE 'file'
  END;
  
  -- Generate storage path: {user_id}/{room_id}/{timestamp}_{filename}
  SELECT msg.room_id INTO v_storage_path
  FROM axis6_chat_messages msg 
  WHERE msg.id = p_message_id;
  
  v_storage_path := v_user_id::text || '/' || v_storage_path::text || '/' || 
                   EXTRACT(epoch FROM NOW())::BIGINT || '_' || p_file_name;
  
  -- Insert attachment record
  INSERT INTO axis6_chat_attachments (
    message_id, user_id, file_name, file_size, file_type, mime_type, storage_path
  ) VALUES (
    p_message_id, v_user_id, p_file_name, p_file_size, v_file_type, p_mime_type, v_storage_path
  ) RETURNING id INTO v_attachment_id;
  
  -- Return attachment info for client
  RETURN json_build_object(
    'attachment_id', v_attachment_id,
    'storage_path', v_storage_path,
    'upload_url', 'https://nvpnhqhjttgwfwvkgmpk.supabase.co/storage/v1/object/chat-files/' || v_storage_path
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to finalize file upload
CREATE OR REPLACE FUNCTION finalize_file_upload(
  p_attachment_id UUID,
  p_width INTEGER DEFAULT NULL,
  p_height INTEGER DEFAULT NULL,
  p_duration INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update attachment status to ready
  UPDATE axis6_chat_attachments 
  SET 
    upload_status = 'ready',
    width = p_width,
    height = p_height,  
    duration = p_duration,
    updated_at = NOW()
  WHERE id = p_attachment_id 
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function to get file analytics
CREATE OR REPLACE FUNCTION get_chat_file_stats(p_room_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_files', COUNT(*),
    'total_size_mb', ROUND(SUM(file_size) / 1024.0 / 1024.0, 2),
    'by_type', json_object_agg(file_type, type_count),
    'recent_uploads', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')
  ) INTO v_stats
  FROM (
    SELECT 
      att.file_type,
      att.file_size,
      att.created_at,
      COUNT(*) OVER (PARTITION BY att.file_type) as type_count
    FROM axis6_chat_attachments att
    JOIN axis6_chat_messages msg ON msg.id = att.message_id
    JOIN axis6_chat_participants p ON p.room_id = msg.room_id
    WHERE att.deleted_at IS NULL
    AND att.upload_status = 'ready'
    AND p.user_id = auth.uid()
    AND p.left_at IS NULL
    AND (p_room_id IS NULL OR msg.room_id = p_room_id)
  ) stats;
  
  RETURN COALESCE(v_stats, '{}'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the updated_at trigger for attachments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chat_attachments_updated_at
    BEFORE UPDATE ON axis6_chat_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for attachment analytics
CREATE VIEW chat_attachment_analytics AS
SELECT 
  att.file_type,
  COUNT(*) as file_count,
  SUM(att.file_size) as total_size,
  AVG(att.file_size) as avg_size,
  MIN(att.created_at) as first_upload,
  MAX(att.created_at) as latest_upload,
  COUNT(DISTINCT att.user_id) as unique_uploaders,
  COUNT(DISTINCT msg.room_id) as rooms_with_files
FROM axis6_chat_attachments att
JOIN axis6_chat_messages msg ON msg.id = att.message_id  
WHERE att.deleted_at IS NULL 
AND att.upload_status = 'ready'
GROUP BY att.file_type;

-- Grant necessary permissions
GRANT SELECT ON chat_attachment_analytics TO authenticated;

COMMIT;