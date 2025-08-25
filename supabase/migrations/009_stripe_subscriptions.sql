-- =====================================================
-- AXIS6 Stripe Subscription Tables
-- =====================================================
-- This migration adds subscription management tables for Stripe integration

-- =====================================================
-- 1. SUBSCRIPTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS axis6_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    status TEXT NOT NULL DEFAULT 'free',
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX idx_axis6_subscriptions_user_id ON axis6_subscriptions(user_id);
CREATE INDEX idx_axis6_subscriptions_stripe_customer_id ON axis6_subscriptions(stripe_customer_id);
CREATE INDEX idx_axis6_subscriptions_stripe_subscription_id ON axis6_subscriptions(stripe_subscription_id);
CREATE INDEX idx_axis6_subscriptions_status ON axis6_subscriptions(status);
CREATE INDEX idx_axis6_subscriptions_tier ON axis6_subscriptions(tier);

-- =====================================================
-- 2. BILLING HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS axis6_billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES axis6_subscriptions(id) ON DELETE SET NULL,
    stripe_invoice_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    stripe_charge_id TEXT,
    amount_paid INTEGER, -- in cents
    currency TEXT DEFAULT 'usd',
    status TEXT NOT NULL,
    invoice_pdf TEXT,
    hosted_invoice_url TEXT,
    description TEXT,
    billing_reason TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_axis6_billing_history_user_id ON axis6_billing_history(user_id);
CREATE INDEX idx_axis6_billing_history_subscription_id ON axis6_billing_history(subscription_id);
CREATE INDEX idx_axis6_billing_history_stripe_invoice_id ON axis6_billing_history(stripe_invoice_id);
CREATE INDEX idx_axis6_billing_history_created_at ON axis6_billing_history(created_at DESC);

-- =====================================================
-- 3. FEATURE ACCESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS axis6_feature_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT NOT NULL UNIQUE,
    feature_name TEXT NOT NULL,
    description TEXT,
    tier_required TEXT NOT NULL DEFAULT 'premium' CHECK (tier_required IN ('free', 'premium')),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default feature configurations
INSERT INTO axis6_feature_access (feature_key, feature_name, description, tier_required) VALUES
('basic_tracking', 'Basic Daily Tracking', 'Track daily check-ins across all 6 dimensions', 'free'),
('streak_tracking', 'Streak Tracking', 'View and maintain your streaks', 'free'),
('basic_dashboard', 'Personal Dashboard', 'Access your personal wellness dashboard', 'free'),
('limited_history', '30-Day History', 'View your last 30 days of data', 'free'),
('unlimited_history', 'Unlimited History', 'Access all your historical data', 'premium'),
('advanced_analytics', 'Advanced Analytics', 'Detailed insights and trend analysis', 'premium'),
('goal_tracking', 'Goal Setting & Tracking', 'Set and track personal wellness goals', 'premium'),
('data_export', 'Data Export', 'Export your data as CSV or PDF', 'premium'),
('psychological_profiling', 'Psychological Profiling', 'Get personalized psychological insights', 'premium'),
('activity_suggestions', 'Activity Suggestions', 'Receive AI-powered activity recommendations', 'premium'),
('priority_support', 'Priority Support', 'Get priority customer support', 'premium'),
('early_access', 'Early Access Features', 'Try new features before general release', 'premium')
ON CONFLICT (feature_key) DO NOTHING;

-- =====================================================
-- 4. WEBHOOK EVENTS TABLE (for debugging)
-- =====================================================
CREATE TABLE IF NOT EXISTS axis6_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    api_version TEXT,
    data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_axis6_webhook_events_stripe_event_id ON axis6_webhook_events(stripe_event_id);
CREATE INDEX idx_axis6_webhook_events_event_type ON axis6_webhook_events(event_type);
CREATE INDEX idx_axis6_webhook_events_processed ON axis6_webhook_events(processed);
CREATE INDEX idx_axis6_webhook_events_created_at ON axis6_webhook_events(created_at DESC);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE axis6_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_feature_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_webhook_events ENABLE ROW LEVEL SECURITY;

-- Subscription policies
CREATE POLICY "Users can view own subscription" ON axis6_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON axis6_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Billing history policies
CREATE POLICY "Users can view own billing history" ON axis6_billing_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage billing history" ON axis6_billing_history
    FOR ALL USING (auth.role() = 'service_role');

-- Feature access policies (public read for all)
CREATE POLICY "Anyone can view feature access" ON axis6_feature_access
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage feature access" ON axis6_feature_access
    FOR ALL USING (auth.role() = 'service_role');

-- Webhook events policies (service role only)
CREATE POLICY "Service role can manage webhook events" ON axis6_webhook_events
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_user_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_tier TEXT;
BEGIN
    SELECT tier INTO user_tier
    FROM axis6_subscriptions
    WHERE user_id = user_uuid
    AND status IN ('active', 'trialing')
    LIMIT 1;
    
    RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to a feature
CREATE OR REPLACE FUNCTION has_feature_access(user_uuid UUID, feature TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    required_tier TEXT;
BEGIN
    -- Get user's tier
    user_tier := get_user_tier(user_uuid);
    
    -- Get required tier for feature
    SELECT tier_required INTO required_tier
    FROM axis6_feature_access
    WHERE feature_key = feature
    AND is_active = true;
    
    -- If feature not found, deny access
    IF required_tier IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check access
    IF required_tier = 'free' THEN
        RETURN true;
    ELSIF required_tier = 'premium' AND user_tier = 'premium' THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_axis6_subscriptions_updated_at
    BEFORE UPDATE ON axis6_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_axis6_feature_access_updated_at
    BEFORE UPDATE ON axis6_feature_access
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. INITIAL SUBSCRIPTION FOR EXISTING USERS
-- =====================================================

-- Create free tier subscription for all existing users
INSERT INTO axis6_subscriptions (user_id, status, tier)
SELECT id, 'active', 'free'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM axis6_subscriptions)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX idx_axis6_subscriptions_user_status ON axis6_subscriptions(user_id, status);
CREATE INDEX idx_axis6_subscriptions_tier_status ON axis6_subscriptions(tier, status);
CREATE INDEX idx_axis6_billing_history_user_created ON axis6_billing_history(user_id, created_at DESC);

COMMENT ON TABLE axis6_subscriptions IS 'Stores user subscription information synced with Stripe';
COMMENT ON TABLE axis6_billing_history IS 'Stores billing and payment history from Stripe';
COMMENT ON TABLE axis6_feature_access IS 'Defines feature access levels for different subscription tiers';
COMMENT ON TABLE axis6_webhook_events IS 'Logs Stripe webhook events for debugging and audit';