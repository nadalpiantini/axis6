-- Enhanced Psychology System Database Migration
-- Run this in Supabase Dashboard > SQL Editor

-- Add assessment_version and total_questions to temperament_profiles
ALTER TABLE axis6_temperament_profiles 
ADD COLUMN IF NOT EXISTS assessment_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 6;

-- Add profile_image_url to profiles table if not exists
ALTER TABLE axis6_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Create storage bucket for profile images (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create enhanced temperament responses table for detailed tracking
CREATE TABLE IF NOT EXISTS axis6_temperament_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  selected_temperament TEXT NOT NULL CHECK (selected_temperament IN ('sanguine', 'choleric', 'melancholic', 'phlegmatic')),
  response_time_ms INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  assessment_session UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_temperament_responses_user_id 
ON axis6_temperament_responses(user_id);

CREATE INDEX IF NOT EXISTS idx_temperament_responses_session 
ON axis6_temperament_responses(assessment_session);

CREATE INDEX IF NOT EXISTS idx_temperament_responses_user_created 
ON axis6_temperament_responses(user_id, created_at DESC);

-- RLS policies for temperament responses
ALTER TABLE axis6_temperament_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own temperament responses" ON axis6_temperament_responses
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own temperament responses" ON axis6_temperament_responses
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage policies for profile images
CREATE POLICY "Users can upload their own profile images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(name, '_', 2) -- name format: profile_userid_timestamp.ext
);

CREATE POLICY "Users can update their own profile images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(name, '_', 2)
);

CREATE POLICY "Users can delete their own profile images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(name, '_', 2)
);

CREATE POLICY "Profile images are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

-- Create function to get enhanced temperament insights
CREATE OR REPLACE FUNCTION get_temperament_insights(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  profile_data RECORD;
  response_patterns JSONB;
  insights JSONB;
BEGIN
  -- Get temperament profile
  SELECT * INTO profile_data
  FROM axis6_temperament_profiles
  WHERE user_id = p_user_id
  ORDER BY completed_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'No temperament profile found');
  END IF;

  -- Analyze response patterns
  SELECT jsonb_agg(
    jsonb_build_object(
      'temperament', selected_temperament,
      'difficulty', difficulty,
      'response_time', response_time_ms
    )
  ) INTO response_patterns
  FROM axis6_temperament_responses
  WHERE user_id = p_user_id
  AND created_at >= profile_data.completed_at - INTERVAL '1 hour'
  ORDER BY created_at;

  -- Build comprehensive insights
  SELECT jsonb_build_object(
    'profile', row_to_json(profile_data),
    'response_patterns', COALESCE(response_patterns, '[]'::jsonb),
    'recommendations', jsonb_build_object(
      'primary_focus', CASE profile_data.primary_temperament
        WHEN 'sanguine' THEN 'Channel your enthusiasm into structured goals'
        WHEN 'choleric' THEN 'Balance drive with empathy for others'
        WHEN 'melancholic' THEN 'Trust your intuition alongside analysis'
        WHEN 'phlegmatic' THEN 'Take initiative while maintaining your peaceful nature'
        ELSE 'Continue developing self-awareness'
      END,
      'growth_areas', CASE profile_data.primary_temperament
        WHEN 'sanguine' THEN jsonb_build_array('Organization', 'Follow-through', 'Detail focus')
        WHEN 'choleric' THEN jsonb_build_array('Patience', 'Listening skills', 'Work-life balance')
        WHEN 'melancholic' THEN jsonb_build_array('Flexibility', 'Quick decisions', 'Optimism')
        WHEN 'phlegmatic' THEN jsonb_build_array('Assertiveness', 'Change adaptation', 'Initiative')
        ELSE jsonb_build_array('Self-discovery')
      END
    )
  ) INTO insights;

  RETURN insights;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_temperament_insights TO authenticated;

-- Create function for AI question generation support
CREATE OR REPLACE FUNCTION analyze_response_patterns(p_user_id UUID, p_responses JSONB)
RETURNS JSONB AS $$
DECLARE
  dominant_temperament TEXT;
  response_count INTEGER;
  avg_response_time NUMERIC;
  difficulty_preference TEXT;
  result JSONB;
BEGIN
  -- Analyze dominant temperament from responses
  SELECT selected_temperament, COUNT(*) as cnt
  INTO dominant_temperament, response_count
  FROM jsonb_to_recordset(p_responses) AS x(selected_temperament TEXT)
  GROUP BY selected_temperament
  ORDER BY cnt DESC
  LIMIT 1;

  -- Calculate average response time
  SELECT AVG((value->>'response_time')::INTEGER)
  INTO avg_response_time
  FROM jsonb_array_elements(p_responses);

  -- Determine difficulty preference
  SELECT difficulty
  INTO difficulty_preference
  FROM jsonb_to_recordset(p_responses) AS x(difficulty TEXT, response_time INTEGER)
  WHERE response_time IS NOT NULL
  ORDER BY response_time ASC
  LIMIT 1;

  -- Build analysis result
  SELECT jsonb_build_object(
    'dominant_temperament', dominant_temperament,
    'confidence_level', CASE 
      WHEN response_count >= 4 THEN 'high'
      WHEN response_count >= 2 THEN 'medium'
      ELSE 'low'
    END,
    'avg_response_time', COALESCE(avg_response_time, 0),
    'preferred_difficulty', COALESCE(difficulty_preference, 'medium'),
    'suggested_focus', CASE dominant_temperament
      WHEN 'sanguine' THEN 'social_scenarios'
      WHEN 'choleric' THEN 'leadership_situations'
      WHEN 'melancholic' THEN 'analytical_problems'
      WHEN 'phlegmatic' THEN 'harmony_conflicts'
      ELSE 'general_assessment'
    END
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION analyze_response_patterns TO authenticated;

-- Update RLS policies for profiles table to include new column
DROP POLICY IF EXISTS "Users can update own profile" ON axis6_profiles;
CREATE POLICY "Users can update own profile" ON axis6_profiles
FOR UPDATE USING (auth.uid() = id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to profiles table
DROP TRIGGER IF EXISTS update_axis6_profiles_updated_at ON axis6_profiles;
CREATE TRIGGER update_axis6_profiles_updated_at
  BEFORE UPDATE ON axis6_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();