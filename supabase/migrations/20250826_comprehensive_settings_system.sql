-- Comprehensive Settings System for AXIS6
-- Migration: 20250826_comprehensive_settings_system.sql
-- Creates all necessary tables for advanced user preferences, privacy controls, and security settings

BEGIN;

-- Create user general preferences table
CREATE TABLE IF NOT EXISTS axis6_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Display preferences
  theme_preference TEXT DEFAULT 'temperament_based' CHECK (theme_preference IN ('temperament_based', 'dark', 'light', 'auto')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es')),
  timezone TEXT DEFAULT 'America/Santo_Domingo',
  
  -- Dashboard customization
  dashboard_layout TEXT DEFAULT 'hexagon' CHECK (dashboard_layout IN ('hexagon', 'grid', 'list')),
  default_landing_page TEXT DEFAULT '/dashboard' CHECK (default_landing_page IN ('/dashboard', '/my-day', '/analytics', '/profile')),
  display_density TEXT DEFAULT 'comfortable' CHECK (display_density IN ('compact', 'comfortable', 'spacious')),
  
  -- Accessibility options
  accessibility_options JSONB DEFAULT '{}',
  -- Format: {"high_contrast": false, "large_text": false, "reduced_motion": false, "screen_reader": false}
  
  -- Quick actions configuration
  quick_actions JSONB DEFAULT '[]',
  -- Format: [{"action": "checkin", "category": "physical", "enabled": true}]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS axis6_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification type and configuration
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'daily_reminder', 'streak_milestone', 'category_focus', 'ai_insight', 
    'goal_progress', 'comeback_encouragement', 'achievement', 'social_update'
  )),
  
  -- Delivery channels
  delivery_channels TEXT[] DEFAULT ARRAY['in_app'] CHECK (
    delivery_channels <@ ARRAY['push', 'email', 'in_app', 'sms']
  ),
  
  -- Control settings
  enabled BOOLEAN DEFAULT TRUE,
  frequency TEXT DEFAULT 'optimal' CHECK (frequency IN ('high', 'optimal', 'low', 'off')),
  priority_filter TEXT DEFAULT 'medium' CHECK (priority_filter IN ('all', 'high', 'medium', 'critical')),
  
  -- Timing preferences
  quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "07:00"}',
  optimal_timing BOOLEAN DEFAULT TRUE, -- Use AI to determine best timing
  
  -- Personalization
  category_focus INTEGER[] DEFAULT NULL, -- Array of category IDs to focus on
  temperament_based BOOLEAN DEFAULT TRUE, -- Use temperament for message style
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, notification_type)
);

-- Create privacy settings table
CREATE TABLE IF NOT EXISTS axis6_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Profile visibility
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  stats_sharing BOOLEAN DEFAULT FALSE, -- Share stats in leaderboards/social features
  achievement_sharing BOOLEAN DEFAULT TRUE, -- Share achievements and milestones
  
  -- AI and analytics controls
  ai_analytics_enabled BOOLEAN DEFAULT TRUE, -- Allow AI to analyze behavior patterns
  behavioral_tracking_enabled BOOLEAN DEFAULT TRUE, -- Track usage patterns for personalization
  ai_coaching_enabled BOOLEAN DEFAULT TRUE, -- Receive AI-powered coaching insights
  personalized_content BOOLEAN DEFAULT TRUE, -- Receive personalized recommendations
  
  -- Data management
  data_retention_days INTEGER DEFAULT 365 CHECK (data_retention_days >= 30), -- How long to keep detailed data
  export_frequency TEXT DEFAULT 'monthly' CHECK (export_frequency IN ('never', 'weekly', 'monthly', 'quarterly')),
  third_party_sharing BOOLEAN DEFAULT FALSE, -- Allow sharing with integrated third-party services
  
  -- Research and improvement
  usage_analytics BOOLEAN DEFAULT TRUE, -- Anonymous usage data for app improvement
  research_participation BOOLEAN DEFAULT FALSE, -- Participate in wellness research studies
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create security settings table
CREATE TABLE IF NOT EXISTS axis6_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Authentication settings
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_method TEXT DEFAULT NULL CHECK (two_factor_method IN (NULL, 'totp', 'sms', 'email')),
  backup_codes_generated BOOLEAN DEFAULT FALSE,
  
  -- Session management
  session_timeout INTEGER DEFAULT 7200 CHECK (session_timeout >= 300), -- Session timeout in seconds
  concurrent_sessions_limit INTEGER DEFAULT 5 CHECK (concurrent_sessions_limit >= 1),
  trusted_devices JSONB DEFAULT '[]', -- Array of device fingerprints
  
  -- Security notifications
  login_notifications_enabled BOOLEAN DEFAULT TRUE, -- Notify on new logins
  security_alerts_enabled BOOLEAN DEFAULT TRUE, -- Notify on security events
  
  -- Account security
  password_changed_at TIMESTAMPTZ DEFAULT NULL,
  last_security_check TIMESTAMPTZ DEFAULT NOW(),
  security_questions_set BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create security audit log table
CREATE TABLE IF NOT EXISTS axis6_security_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Event information
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_success', 'login_failure', 'password_change', 'settings_change',
    'profile_update', 'data_export', 'account_deletion', 'suspicious_activity',
    'two_factor_setup', 'session_timeout', 'device_trust', 'security_check'
  )),
  
  -- Context information
  ip_address INET,
  user_agent TEXT,
  location_data JSONB DEFAULT '{}', -- {"country": "DO", "city": "Santo Domingo", "approximate": true}
  device_fingerprint TEXT,
  
  -- Event details
  details JSONB DEFAULT '{}', -- Specific details about the event
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  success BOOLEAN DEFAULT TRUE,
  
  -- Additional metadata
  session_id TEXT,
  related_audit_id UUID DEFAULT NULL, -- Link related events
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wellness preferences table
CREATE TABLE IF NOT EXISTS axis6_wellness_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Streak preferences
  streak_calculation TEXT DEFAULT 'standard' CHECK (streak_calculation IN ('strict', 'standard', 'flexible')),
  break_tolerance INTEGER DEFAULT 1 CHECK (break_tolerance >= 0), -- Days of grace for streaks
  weekend_counting BOOLEAN DEFAULT TRUE, -- Count weekends in streaks
  
  -- Goal setting preferences
  default_goal_difficulty TEXT DEFAULT 'medium' CHECK (default_goal_difficulty IN ('easy', 'medium', 'hard', 'adaptive')),
  auto_goal_adjustment BOOLEAN DEFAULT TRUE, -- Let AI adjust goals based on performance
  goal_reminders_enabled BOOLEAN DEFAULT TRUE,
  
  -- Progress tracking
  weekly_review_enabled BOOLEAN DEFAULT TRUE,
  monthly_summary_enabled BOOLEAN DEFAULT TRUE,
  milestone_celebrations BOOLEAN DEFAULT TRUE,
  progress_sharing BOOLEAN DEFAULT FALSE, -- Share progress with friends/community
  
  -- Motivation and coaching
  motivation_style TEXT DEFAULT 'temperament_based' CHECK (motivation_style IN ('encouraging', 'challenging', 'analytical', 'supportive', 'temperament_based')),
  coaching_frequency TEXT DEFAULT 'weekly' CHECK (coaching_frequency IN ('daily', 'weekly', 'monthly', 'as_needed')),
  feedback_sensitivity TEXT DEFAULT 'medium' CHECK (feedback_sensitivity IN ('low', 'medium', 'high')),
  
  -- Analytics preferences
  detailed_analytics BOOLEAN DEFAULT TRUE,
  mood_tracking_enabled BOOLEAN DEFAULT TRUE,
  pattern_insights BOOLEAN DEFAULT TRUE,
  comparative_analytics BOOLEAN DEFAULT FALSE, -- Compare with similar users
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create settings change log table (for audit and rollback)
CREATE TABLE IF NOT EXISTS axis6_settings_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Change information
  table_name TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  
  -- Context
  changed_by TEXT DEFAULT 'user', -- 'user', 'system', 'admin', 'migration'
  change_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all new tables
ALTER TABLE axis6_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_security_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_wellness_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_settings_changelog ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences
CREATE POLICY "Users can view own preferences" ON axis6_user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON axis6_user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON axis6_user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for notification_preferences
CREATE POLICY "Users can view own notification preferences" ON axis6_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notification preferences" ON axis6_notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for privacy_settings
CREATE POLICY "Users can view own privacy settings" ON axis6_privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own privacy settings" ON axis6_privacy_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for security_settings
CREATE POLICY "Users can view own security settings" ON axis6_security_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own security settings" ON axis6_security_settings
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for security_audit
CREATE POLICY "Users can view own security audit" ON axis6_security_audit
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" ON axis6_security_audit
  FOR INSERT WITH CHECK (TRUE); -- System inserts, users read-only

-- Create RLS policies for wellness_preferences
CREATE POLICY "Users can view own wellness preferences" ON axis6_wellness_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wellness preferences" ON axis6_wellness_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for settings_changelog
CREATE POLICY "Users can view own settings changes" ON axis6_settings_changelog
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can log settings changes" ON axis6_settings_changelog
  FOR INSERT WITH CHECK (TRUE);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON axis6_user_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON axis6_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON axis6_notification_preferences(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_enabled ON axis6_notification_preferences(enabled) WHERE enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON axis6_privacy_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON axis6_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_security_settings_2fa ON axis6_security_settings(two_factor_enabled) WHERE two_factor_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON axis6_security_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON axis6_security_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON axis6_security_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_risk ON axis6_security_audit(risk_level) WHERE risk_level IN ('high', 'critical');

CREATE INDEX IF NOT EXISTS idx_wellness_preferences_user_id ON axis6_wellness_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_settings_changelog_user_id ON axis6_settings_changelog(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_changelog_table ON axis6_settings_changelog(table_name, setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_changelog_created_at ON axis6_settings_changelog(created_at DESC);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION axis6_update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_preferences_timestamp
  BEFORE UPDATE ON axis6_user_preferences
  FOR EACH ROW EXECUTE FUNCTION axis6_update_settings_timestamp();

CREATE TRIGGER update_notification_preferences_timestamp
  BEFORE UPDATE ON axis6_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION axis6_update_settings_timestamp();

CREATE TRIGGER update_privacy_settings_timestamp
  BEFORE UPDATE ON axis6_privacy_settings
  FOR EACH ROW EXECUTE FUNCTION axis6_update_settings_timestamp();

CREATE TRIGGER update_security_settings_timestamp
  BEFORE UPDATE ON axis6_security_settings
  FOR EACH ROW EXECUTE FUNCTION axis6_update_settings_timestamp();

CREATE TRIGGER update_wellness_preferences_timestamp
  BEFORE UPDATE ON axis6_wellness_preferences
  FOR EACH ROW EXECUTE FUNCTION axis6_update_settings_timestamp();

-- Create function to log settings changes
CREATE OR REPLACE FUNCTION axis6_log_settings_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change
  INSERT INTO axis6_settings_changelog (
    user_id, table_name, setting_key, old_value, new_value, change_type,
    changed_by, ip_address, user_agent
  )
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    TG_TABLE_NAME,
    'full_record', -- We'll log the entire record for simplicity
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN row_to_json(NEW) 
         WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW)
         ELSE NULL END,
    LOWER(TG_OP),
    'user', -- Default to user, can be overridden by application
    NULL, -- IP address will be set by application
    NULL  -- User agent will be set by application
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create changelog triggers for all settings tables
CREATE TRIGGER log_user_preferences_changes
  AFTER INSERT OR UPDATE OR DELETE ON axis6_user_preferences
  FOR EACH ROW EXECUTE FUNCTION axis6_log_settings_change();

CREATE TRIGGER log_notification_preferences_changes
  AFTER INSERT OR UPDATE OR DELETE ON axis6_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION axis6_log_settings_change();

CREATE TRIGGER log_privacy_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON axis6_privacy_settings
  FOR EACH ROW EXECUTE FUNCTION axis6_log_settings_change();

CREATE TRIGGER log_security_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON axis6_security_settings
  FOR EACH ROW EXECUTE FUNCTION axis6_log_settings_change();

CREATE TRIGGER log_wellness_preferences_changes
  AFTER INSERT OR UPDATE OR DELETE ON axis6_wellness_preferences
  FOR EACH ROW EXECUTE FUNCTION axis6_log_settings_change();

-- Create RPC function to get all user settings
CREATE OR REPLACE FUNCTION get_user_comprehensive_settings(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user_preferences', (
      SELECT row_to_json(up) FROM axis6_user_preferences up 
      WHERE up.user_id = target_user_id
    ),
    'notification_preferences', (
      SELECT json_agg(row_to_json(np)) FROM axis6_notification_preferences np 
      WHERE np.user_id = target_user_id
    ),
    'privacy_settings', (
      SELECT row_to_json(ps) FROM axis6_privacy_settings ps 
      WHERE ps.user_id = target_user_id
    ),
    'security_settings', (
      SELECT row_to_json(ss) FROM axis6_security_settings ss 
      WHERE ss.user_id = target_user_id
    ),
    'wellness_preferences', (
      SELECT row_to_json(wp) FROM axis6_wellness_preferences wp 
      WHERE wp.user_id = target_user_id
    ),
    'personalization_settings', (
      SELECT row_to_json(ps) FROM axis6_personalization_settings ps 
      WHERE ps.user_id = target_user_id
    ),
    'temperament_profile', (
      SELECT row_to_json(tp) FROM axis6_temperament_profiles tp 
      WHERE tp.user_id = target_user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to initialize default settings for new users
CREATE OR REPLACE FUNCTION axis6_initialize_user_settings(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Initialize user preferences with defaults
  INSERT INTO axis6_user_preferences (user_id) 
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize privacy settings with secure defaults
  INSERT INTO axis6_privacy_settings (user_id) 
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize security settings
  INSERT INTO axis6_security_settings (user_id) 
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize wellness preferences
  INSERT INTO axis6_wellness_preferences (user_id) 
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize default notification preferences
  INSERT INTO axis6_notification_preferences (user_id, notification_type) 
  VALUES 
    (target_user_id, 'daily_reminder'),
    (target_user_id, 'streak_milestone'),
    (target_user_id, 'achievement'),
    (target_user_id, 'ai_insight')
  ON CONFLICT (user_id, notification_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to audit security events
CREATE OR REPLACE FUNCTION axis6_log_security_event(
  target_user_id UUID,
  event_type TEXT,
  details JSONB DEFAULT '{}',
  risk_level TEXT DEFAULT 'low',
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  success BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO axis6_security_audit (
    user_id, event_type, details, risk_level, ip_address, user_agent, success
  )
  VALUES (
    target_user_id, event_type, details, risk_level, ip_address, user_agent, success
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Add comments for documentation
COMMENT ON TABLE axis6_user_preferences IS 'User interface and display preferences';
COMMENT ON TABLE axis6_notification_preferences IS 'Granular notification settings for all notification types';
COMMENT ON TABLE axis6_privacy_settings IS 'Privacy controls and data sharing preferences';
COMMENT ON TABLE axis6_security_settings IS 'Account security configuration and authentication settings';
COMMENT ON TABLE axis6_security_audit IS 'Comprehensive security event logging and monitoring';
COMMENT ON TABLE axis6_wellness_preferences IS 'Wellness tracking and motivation preferences';
COMMENT ON TABLE axis6_settings_changelog IS 'Audit trail for all settings changes with rollback capability';