-- Setup Profile Image Storage in Supabase
-- Run this in Supabase Dashboard > SQL Editor

-- Create the profile-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true, -- Public bucket for profile images
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create RLS policies for profile images
CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1] -- name format: profiles/user_id_timestamp.ext
);

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile images are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- Add profile_image_url column to axis6_profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='axis6_profiles' AND column_name='profile_image_url') THEN
    ALTER TABLE axis6_profiles ADD COLUMN profile_image_url TEXT;
  END IF;
END $$;

-- Update RLS policy for axis6_profiles to include new column
DROP POLICY IF EXISTS "Users can update own profile" ON axis6_profiles;
CREATE POLICY "Users can update own profile" ON axis6_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON axis6_profiles;
CREATE POLICY "Users can insert own profile" ON axis6_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create index for profile image URL for faster queries
CREATE INDEX IF NOT EXISTS idx_axis6_profiles_image_url 
ON axis6_profiles(profile_image_url) WHERE profile_image_url IS NOT NULL;

-- Grant necessary permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;