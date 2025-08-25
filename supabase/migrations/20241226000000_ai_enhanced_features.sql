-- AI-Enhanced Features Database Schema
-- Migration: 20241226000000_ai_enhanced_features.sql

-- Add AI-related columns to existing temperament profiles table
ALTER TABLE axis6_temperament_profiles
ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2) DEFAULT 0.60,
ADD COLUMN IF NOT EXISTS analysis_version TEXT DEFAULT '1.0-basic',
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

-- Create table for storing AI-generated recommendations
CREATE TABLE IF NOT EXISTS axis6_ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id INTEGER REFERENCES axis6_categories(id),
  recommendations JSONB NOT NULL,
  -- Store as array of activity objects with all properties
  context JSONB DEFAULT '{}',
  -- Store context used for generation (mood, preferences, etc.)
  model_version TEXT DEFAULT 'deepseek-chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_count INTEGER DEFAULT 0,
  feedback_score DECIMAL(3,2),
  -- User rating of recommendations (0-5)
  INDEX idx_ai_recommendations_user_category (user_id, category_id)
);

-- Create table for dynamic AI-generated questions
CREATE TABLE IF NOT EXISTS axis6_ai_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_text JSONB NOT NULL,
  -- {"en": "question", "es": "pregunta"}
  question_type TEXT NOT NULL,
  options JSONB NOT NULL,
  -- Array of answer options with temperament mappings
  context JSONB DEFAULT '{}',
  -- Previous responses that led to this question
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  answered BOOLEAN DEFAULT false,
  answer_id UUID,
  INDEX idx_ai_questions_session (session_id),
  INDEX idx_ai_questions_user (user_id)
);

-- Create table for AI conversation history (for chat assistant)
CREATE TABLE IF NOT EXISTS axis6_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('onboarding', 'support', 'coaching', 'assessment')),
  messages JSONB NOT NULL DEFAULT '[]',
  -- Array of {role, content, timestamp}
  context JSONB DEFAULT '{}',
  -- Conversation context and metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  INDEX idx_ai_conversations_user (user_id),
  INDEX idx_ai_conversations_type (conversation_type)
);

-- Create table for AI-enhanced insights
CREATE TABLE IF NOT EXISTS axis6_ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('daily', 'weekly', 'monthly', 'milestone', 'recommendation')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  -- Supporting data for the insight
  relevance_score DECIMAL(3,2) DEFAULT 0.80,
  -- How relevant this insight is (0-1)
  presented_at TIMESTAMPTZ,
  acknowledged BOOLEAN DEFAULT false,
  feedback TEXT CHECK (feedback IN ('helpful', 'not_helpful', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_ai_insights_user_type (user_id, insight_type)
);

-- Create table for tracking AI feature usage
CREATE TABLE IF NOT EXISTS axis6_ai_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('personality_analysis', 'activity_recommendation', 'dynamic_questions', 'chat_assistant', 'insights')),
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_ai_usage_user_feature (user_id, feature_type),
  INDEX idx_ai_usage_created (created_at)
);

-- Create view for AI feature analytics
CREATE OR REPLACE VIEW axis6_ai_analytics AS
SELECT 
  u.user_id,
  COUNT(DISTINCT r.id) as total_recommendations,
  COUNT(DISTINCT q.id) as dynamic_questions_generated,
  COUNT(DISTINCT c.id) as conversations_held,
  COUNT(DISTINCT i.id) as insights_generated,
  AVG(r.feedback_score) as avg_recommendation_rating,
  AVG(c.satisfaction_rating) as avg_conversation_rating,
  SUM(m.tokens_used) as total_tokens_used,
  COUNT(CASE WHEN m.success = true THEN 1 END)::FLOAT / 
    NULLIF(COUNT(m.id), 0) as success_rate
FROM auth.users u
LEFT JOIN axis6_ai_recommendations r ON u.id = r.user_id
LEFT JOIN axis6_ai_questions q ON u.id = q.user_id
LEFT JOIN axis6_ai_conversations c ON u.id = c.user_id
LEFT JOIN axis6_ai_insights i ON u.id = i.user_id
LEFT JOIN axis6_ai_usage_metrics m ON u.id = m.user_id
GROUP BY u.id;

-- Enable Row Level Security on new tables
ALTER TABLE axis6_ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_ai_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_ai_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for AI tables
-- Recommendations: Users can only see their own
CREATE POLICY "Users can view own AI recommendations" ON axis6_ai_recommendations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI recommendations" ON axis6_ai_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI recommendations" ON axis6_ai_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

-- Questions: Users can only see their own
CREATE POLICY "Users can view own AI questions" ON axis6_ai_questions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI questions" ON axis6_ai_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI questions" ON axis6_ai_questions
  FOR UPDATE USING (auth.uid() = user_id);

-- Conversations: Users can only see their own
CREATE POLICY "Users can view own AI conversations" ON axis6_ai_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI conversations" ON axis6_ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI conversations" ON axis6_ai_conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Insights: Users can only see their own
CREATE POLICY "Users can view own AI insights" ON axis6_ai_insights
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI insights" ON axis6_ai_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI insights" ON axis6_ai_insights
  FOR UPDATE USING (auth.uid() = user_id);

-- Usage metrics: Users can only see their own
CREATE POLICY "Users can view own AI usage" ON axis6_ai_usage_metrics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI usage" ON axis6_ai_usage_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to track AI feature usage
CREATE OR REPLACE FUNCTION track_ai_usage(
  p_user_id UUID,
  p_feature_type TEXT,
  p_tokens INTEGER DEFAULT 0,
  p_response_time INTEGER DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO axis6_ai_usage_metrics (
    user_id,
    feature_type,
    tokens_used,
    response_time_ms,
    success,
    error_message
  ) VALUES (
    p_user_id,
    p_feature_type,
    p_tokens,
    p_response_time,
    p_success,
    p_error
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get AI feature availability
CREATE OR REPLACE FUNCTION get_ai_features_status(p_user_id UUID)
RETURNS TABLE(
  personality_analysis_available BOOLEAN,
  recommendations_available BOOLEAN,
  dynamic_questions_available BOOLEAN,
  chat_assistant_available BOOLEAN,
  monthly_token_usage INTEGER,
  monthly_token_limit INTEGER
) AS $$
DECLARE
  v_monthly_usage INTEGER;
  v_has_profile BOOLEAN;
BEGIN
  -- Check if user has temperament profile
  SELECT EXISTS(
    SELECT 1 FROM axis6_temperament_profiles 
    WHERE user_id = p_user_id
  ) INTO v_has_profile;

  -- Calculate monthly token usage
  SELECT COALESCE(SUM(tokens_used), 0)
  FROM axis6_ai_usage_metrics
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
  INTO v_monthly_usage;

  RETURN QUERY
  SELECT 
    true as personality_analysis_available,
    v_has_profile as recommendations_available,
    true as dynamic_questions_available,
    true as chat_assistant_available,
    v_monthly_usage as monthly_token_usage,
    100000 as monthly_token_limit; -- 100k tokens per month
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_temperament_profiles_ai ON axis6_temperament_profiles(ai_generated, analysis_version);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created ON axis6_ai_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_questions_answered ON axis6_ai_questions(answered, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_presented ON axis6_ai_insights(presented_at, user_id);

-- Add comment for documentation
COMMENT ON TABLE axis6_ai_recommendations IS 'Stores AI-generated activity recommendations for users based on their temperament and preferences';
COMMENT ON TABLE axis6_ai_questions IS 'Stores dynamically generated assessment questions for adaptive personality profiling';
COMMENT ON TABLE axis6_ai_conversations IS 'Stores conversation history with AI assistant for context and improvement';
COMMENT ON TABLE axis6_ai_insights IS 'Stores AI-generated insights and observations about user wellness patterns';
COMMENT ON TABLE axis6_ai_usage_metrics IS 'Tracks AI feature usage for analytics and rate limiting';