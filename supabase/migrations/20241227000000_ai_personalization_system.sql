-- AI Personalization System Migration
-- Creates comprehensive database schema for AI-powered personalization features

BEGIN;

-- Create table for user behavior profiles
CREATE TABLE IF NOT EXISTS axis6_user_behavior_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Active hour patterns (when user is most active)
  active_hours JSONB NOT NULL DEFAULT '[]',
  -- Format: [{"hour": 8, "frequency": 0.7}, {"hour": 18, "frequency": 0.9}]
  
  -- Category preferences based on check-in frequency
  preferred_categories JSONB NOT NULL DEFAULT '[]',
  -- Format: [{"category_id": 1, "preference_score": 0.8}]
  
  -- Completion pattern analysis
  completion_patterns JSONB NOT NULL DEFAULT '{}',
  -- Format: {"best_days": ["monday", "tuesday"], "peak_hours": [8, 18], "streak_potential": 0.7, "consistency_score": 0.6}
  
  -- Behavioral traits determined from patterns
  behavioral_traits JSONB NOT NULL DEFAULT '{}',
  -- Format: {"motivation_type": "intrinsic", "goal_orientation": "process", "social_tendency": "collaborative", "stress_response": "adaptive"}
  
  -- Identified behavioral patterns with confidence scores
  patterns JSONB NOT NULL DEFAULT '[]',
  -- Format: [{"pattern_type": "checkin_timing", "confidence_score": 0.8, "description": "...", "insights": [...], "recommendations": [...]}]
  
  -- Analysis metadata
  last_analyzed TIMESTAMPTZ DEFAULT NOW(),
  analysis_version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create table for smart notifications
CREATE TABLE IF NOT EXISTS axis6_smart_notifications (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN ('reminder', 'encouragement', 'milestone', 'tip', 'challenge')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  
  -- Personalization
  category_focus INTEGER[] DEFAULT NULL, -- Array of category IDs
  personalization_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  
  -- Triggers that generated this notification
  triggers JSONB NOT NULL DEFAULT '{}',
  -- Format: {"time_based": true, "behavior_based": false, "milestone_based": false, "contextual": true}
  
  -- Delivery configuration
  delivery_channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  -- Array of: 'push', 'email', 'in_app', 'sms'
  
  -- Additional context metadata
  metadata JSONB DEFAULT '{}',
  -- Format: {"streak_day": 7, "completion_rate": 0.8, "mood_context": 4, "optimal_time": true}
  
  -- Delivery tracking
  delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ DEFAULT NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ DEFAULT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NULL
);

-- Create table for AI coaching insights
CREATE TABLE IF NOT EXISTS axis6_coaching_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Insight details
  insight_type TEXT NOT NULL CHECK (insight_type IN ('behavioral', 'performance', 'motivational', 'strategic', 'wellness')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Actionable recommendations
  action_items JSONB NOT NULL DEFAULT '[]',
  -- Format: ["Set reminders for 8 AM", "Focus on Physical category this week"]
  
  -- Relevance and personalization
  relevance_score DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  category_focus INTEGER[] DEFAULT NULL,
  
  -- Coaching context
  based_on_data JSONB NOT NULL DEFAULT '{}',
  -- Format: {"patterns": ["timing", "completion"], "timeframe_days": 30, "confidence": 0.8}
  
  -- Lifecycle management
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('active', 'dismissed', 'acted_on', 'expired')) DEFAULT 'active',
  expires_at TIMESTAMPTZ DEFAULT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for personalized goal recommendations
CREATE TABLE IF NOT EXISTS axis6_personalized_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id INTEGER REFERENCES axis6_categories(id) ON DELETE CASCADE NOT NULL,
  
  -- Goal details
  goal_type TEXT NOT NULL CHECK (goal_type IN ('streak', 'frequency', 'completion', 'consistency', 'balance')),
  target_value INTEGER NOT NULL,
  target_unit TEXT NOT NULL, -- 'days', 'times_per_week', 'percentage', etc.
  timeframe TEXT NOT NULL CHECK (timeframe IN ('daily', 'weekly', 'monthly')),
  
  -- Difficulty and success prediction
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'challenging', 'expert')),
  success_probability DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  
  -- AI reasoning
  reasoning TEXT NOT NULL,
  based_on_data JSONB NOT NULL DEFAULT '{}',
  -- Format: {"historical_performance": 0.7, "consistency_score": 0.6, "temperament_fit": 0.8}
  
  -- Goal status
  status TEXT NOT NULL CHECK (status IN ('suggested', 'accepted', 'active', 'completed', 'paused', 'abandoned')) DEFAULT 'suggested',
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  started_at TIMESTAMPTZ DEFAULT NULL,
  completed_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Progress tracking
  current_progress INTEGER DEFAULT 0,
  last_progress_update TIMESTAMPTZ DEFAULT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for adaptive reminders
CREATE TABLE IF NOT EXISTS axis6_adaptive_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Reminder configuration
  type TEXT NOT NULL CHECK (type IN ('daily_checkin', 'category_focus', 'streak_maintenance', 'comeback', 'milestone')),
  category_id INTEGER REFERENCES axis6_categories(id) DEFAULT NULL,
  
  -- Smart scheduling based on behavior patterns
  optimal_time_hour INTEGER NOT NULL CHECK (optimal_time_hour >= 0 AND optimal_time_hour <= 23),
  optimal_days_of_week INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=Monday, 7=Sunday
  
  -- Personalization
  message_template TEXT NOT NULL,
  personalization_tokens JSONB DEFAULT '{}',
  -- Format: {"user_name": "John", "streak_count": 5, "preferred_category": "Physical"}
  
  -- Adaptation parameters
  success_rate DECIMAL(3,2) DEFAULT 0.5, -- How often user responds to this reminder
  last_triggered TIMESTAMPTZ DEFAULT NULL,
  trigger_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  
  -- Status and lifecycle
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for AI feature usage analytics
CREATE TABLE IF NOT EXISTS axis6_ai_feature_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Feature tracking
  feature_type TEXT NOT NULL CHECK (feature_type IN (
    'behavioral_analysis', 'smart_notifications', 'personalized_insights', 
    'adaptive_goals', 'coaching_tips', 'pattern_recognition'
  )),
  
  -- Usage metrics
  usage_count INTEGER DEFAULT 1,
  success_count INTEGER DEFAULT 0, -- How many times feature provided value
  last_used TIMESTAMPTZ DEFAULT NOW(),
  
  -- Performance metrics
  average_response_time_ms INTEGER DEFAULT 0,
  user_satisfaction_score DECIMAL(3,2) DEFAULT NULL, -- 1-5 rating
  
  -- AI model performance
  ai_confidence_scores JSONB DEFAULT '[]', -- Array of confidence scores over time
  feature_effectiveness DECIMAL(3,2) DEFAULT NULL, -- How well this feature works for this user
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, feature_type)
);

-- Create table for user feedback on AI recommendations
CREATE TABLE IF NOT EXISTS axis6_ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Reference to the AI feature/recommendation
  feature_type TEXT NOT NULL,
  feature_id TEXT, -- Could reference notification ID, insight ID, etc.
  
  -- User feedback
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('rating', 'thumbs', 'detailed', 'implicit')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 stars
  thumbs BOOLEAN DEFAULT NULL, -- true = thumbs up, false = thumbs down
  comment TEXT DEFAULT NULL,
  
  -- Implicit feedback (derived from user behavior)
  action_taken BOOLEAN DEFAULT FALSE, -- Did user act on the recommendation?
  time_to_action INTEGER DEFAULT NULL, -- Seconds until user acted
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_behavior_profiles_user_id ON axis6_user_behavior_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_profiles_last_analyzed ON axis6_user_behavior_profiles(last_analyzed);

CREATE INDEX IF NOT EXISTS idx_smart_notifications_user_id ON axis6_smart_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_notifications_scheduled ON axis6_smart_notifications(scheduled_for) WHERE NOT delivered;
CREATE INDEX IF NOT EXISTS idx_smart_notifications_priority ON axis6_smart_notifications(priority, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_coaching_insights_user_id ON axis6_coaching_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_insights_status ON axis6_coaching_insights(status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_personalized_goals_user_id ON axis6_personalized_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_goals_status ON axis6_personalized_goals(status) WHERE status IN ('suggested', 'active');

CREATE INDEX IF NOT EXISTS idx_adaptive_reminders_user_id ON axis6_adaptive_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_reminders_active ON axis6_adaptive_reminders(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_ai_analytics_user_feature ON axis6_ai_feature_analytics(user_id, feature_type);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON axis6_ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_feature ON axis6_ai_feedback(feature_type, feature_id);

-- Enable Row Level Security
ALTER TABLE axis6_user_behavior_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_coaching_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_personalized_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_adaptive_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_ai_feature_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_ai_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user data access
CREATE POLICY "Users can view own behavior profile" ON axis6_user_behavior_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own behavior profile" ON axis6_user_behavior_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own behavior profile" ON axis6_user_behavior_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON axis6_smart_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON axis6_smart_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON axis6_smart_notifications
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can view own insights" ON axis6_coaching_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON axis6_coaching_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert insights" ON axis6_coaching_insights
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can view own goals" ON axis6_personalized_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON axis6_personalized_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert goals" ON axis6_personalized_goals
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can view own reminders" ON axis6_adaptive_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON axis6_adaptive_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert reminders" ON axis6_adaptive_reminders
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Users can view own analytics" ON axis6_ai_feature_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage analytics" ON axis6_ai_feature_analytics
  FOR ALL WITH CHECK (TRUE);

CREATE POLICY "Users can view own feedback" ON axis6_ai_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback" ON axis6_ai_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for AI personalization features
CREATE OR REPLACE FUNCTION axis6_update_behavior_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION axis6_update_coaching_insight_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION axis6_update_goal_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION axis6_update_reminder_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_behavior_profile_timestamp
  BEFORE UPDATE ON axis6_user_behavior_profiles
  FOR EACH ROW EXECUTE FUNCTION axis6_update_behavior_profile_timestamp();

CREATE TRIGGER update_coaching_insight_timestamp
  BEFORE UPDATE ON axis6_coaching_insights
  FOR EACH ROW EXECUTE FUNCTION axis6_update_coaching_insight_timestamp();

CREATE TRIGGER update_goal_timestamp
  BEFORE UPDATE ON axis6_personalized_goals
  FOR EACH ROW EXECUTE FUNCTION axis6_update_goal_timestamp();

CREATE TRIGGER update_reminder_timestamp
  BEFORE UPDATE ON axis6_adaptive_reminders
  FOR EACH ROW EXECUTE FUNCTION axis6_update_reminder_timestamp();

-- Create RPC function for getting comprehensive AI insights
CREATE OR REPLACE FUNCTION get_ai_personalization_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'behavior_profile', (
      SELECT row_to_json(bp) FROM axis6_user_behavior_profiles bp 
      WHERE bp.user_id = target_user_id
    ),
    'active_notifications', (
      SELECT json_agg(row_to_json(sn)) FROM axis6_smart_notifications sn 
      WHERE sn.user_id = target_user_id AND NOT sn.delivered
      ORDER BY sn.priority DESC, sn.scheduled_for ASC
    ),
    'coaching_insights', (
      SELECT json_agg(row_to_json(ci)) FROM axis6_coaching_insights ci 
      WHERE ci.user_id = target_user_id AND ci.status = 'active'
      ORDER BY ci.priority DESC, ci.created_at DESC
    ),
    'suggested_goals', (
      SELECT json_agg(row_to_json(pg)) FROM axis6_personalized_goals pg 
      WHERE pg.user_id = target_user_id AND pg.status = 'suggested'
      ORDER BY pg.success_probability DESC
    ),
    'adaptive_reminders', (
      SELECT json_agg(row_to_json(ar)) FROM axis6_adaptive_reminders ar 
      WHERE ar.user_id = target_user_id AND ar.is_active = TRUE
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for updating AI feature usage
CREATE OR REPLACE FUNCTION track_ai_feature_usage(
  target_user_id UUID,
  feature_name TEXT,
  response_time_ms INTEGER DEFAULT 0,
  was_successful BOOLEAN DEFAULT TRUE,
  confidence_score DECIMAL DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO axis6_ai_feature_analytics (
    user_id, feature_type, usage_count, success_count, 
    last_used, average_response_time_ms, ai_confidence_scores
  )
  VALUES (
    target_user_id, feature_name, 1, 
    CASE WHEN was_successful THEN 1 ELSE 0 END,
    NOW(), response_time_ms,
    CASE WHEN confidence_score IS NOT NULL THEN json_build_array(confidence_score) ELSE '[]'::json END
  )
  ON CONFLICT (user_id, feature_type) DO UPDATE SET
    usage_count = axis6_ai_feature_analytics.usage_count + 1,
    success_count = axis6_ai_feature_analytics.success_count + CASE WHEN was_successful THEN 1 ELSE 0 END,
    last_used = NOW(),
    average_response_time_ms = (
      axis6_ai_feature_analytics.average_response_time_ms * axis6_ai_feature_analytics.usage_count + response_time_ms
    ) / (axis6_ai_feature_analytics.usage_count + 1),
    ai_confidence_scores = (
      CASE WHEN confidence_score IS NOT NULL THEN
        axis6_ai_feature_analytics.ai_confidence_scores || json_build_array(confidence_score)
      ELSE
        axis6_ai_feature_analytics.ai_confidence_scores
      END
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for AI insights dashboard
CREATE OR REPLACE VIEW axis6_ai_insights_dashboard AS
SELECT 
  u.id as user_id,
  bp.last_analyzed,
  bp.analysis_version,
  json_array_length(bp.patterns::json) as pattern_count,
  (
    SELECT COUNT(*) FROM axis6_smart_notifications sn 
    WHERE sn.user_id = u.id AND NOT sn.delivered
  ) as pending_notifications,
  (
    SELECT COUNT(*) FROM axis6_coaching_insights ci 
    WHERE ci.user_id = u.id AND ci.status = 'active'
  ) as active_insights,
  (
    SELECT COUNT(*) FROM axis6_personalized_goals pg 
    WHERE pg.user_id = u.id AND pg.status IN ('suggested', 'active')
  ) as active_goals,
  (
    SELECT AVG(afa.feature_effectiveness) FROM axis6_ai_feature_analytics afa 
    WHERE afa.user_id = u.id
  ) as ai_effectiveness_score
FROM auth.users u
LEFT JOIN axis6_user_behavior_profiles bp ON bp.user_id = u.id
WHERE EXISTS (
  SELECT 1 FROM axis6_profiles p WHERE p.id = u.id
);

COMMIT;