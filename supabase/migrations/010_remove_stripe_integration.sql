-- =====================================================
-- ROLLBACK: Remove Stripe Integration
-- =====================================================
-- This migration removes all Stripe-related tables and functions
-- that were created in migration 009_stripe_subscriptions.sql

-- Drop all dependent objects first

-- 1. Drop triggers
DROP TRIGGER IF EXISTS update_axis6_subscriptions_updated_at ON axis6_subscriptions;
DROP TRIGGER IF EXISTS update_axis6_feature_access_updated_at ON axis6_feature_access;

-- 2. Drop functions
DROP FUNCTION IF EXISTS has_feature_access(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_tier(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 3. Drop policies (if tables exist)
DO $$ 
BEGIN
    -- Drop policies for axis6_subscriptions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_subscriptions') THEN
        DROP POLICY IF EXISTS "Users can view own subscription" ON axis6_subscriptions;
        DROP POLICY IF EXISTS "Service role can manage subscriptions" ON axis6_subscriptions;
    END IF;
    
    -- Drop policies for axis6_billing_history
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_billing_history') THEN
        DROP POLICY IF EXISTS "Users can view own billing history" ON axis6_billing_history;
        DROP POLICY IF EXISTS "Service role can manage billing history" ON axis6_billing_history;
    END IF;
    
    -- Drop policies for axis6_feature_access
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_feature_access') THEN
        DROP POLICY IF EXISTS "Anyone can view feature access" ON axis6_feature_access;
        DROP POLICY IF EXISTS "Service role can manage feature access" ON axis6_feature_access;
    END IF;
    
    -- Drop policies for axis6_webhook_events
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'axis6_webhook_events') THEN
        DROP POLICY IF EXISTS "Service role can manage webhook events" ON axis6_webhook_events;
    END IF;
END $$;

-- 4. Drop tables
DROP TABLE IF EXISTS axis6_webhook_events CASCADE;
DROP TABLE IF EXISTS axis6_billing_history CASCADE;
DROP TABLE IF EXISTS axis6_feature_access CASCADE;
DROP TABLE IF EXISTS axis6_subscriptions CASCADE;

-- 5. Clean up any remaining objects
DROP INDEX IF EXISTS idx_axis6_subscriptions_user_id;
DROP INDEX IF EXISTS idx_axis6_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_axis6_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_axis6_subscriptions_status;
DROP INDEX IF EXISTS idx_axis6_subscriptions_tier;
DROP INDEX IF EXISTS idx_axis6_subscriptions_user_status;
DROP INDEX IF EXISTS idx_axis6_subscriptions_tier_status;

DROP INDEX IF EXISTS idx_axis6_billing_history_user_id;
DROP INDEX IF EXISTS idx_axis6_billing_history_subscription_id;
DROP INDEX IF EXISTS idx_axis6_billing_history_stripe_invoice_id;
DROP INDEX IF EXISTS idx_axis6_billing_history_created_at;
DROP INDEX IF EXISTS idx_axis6_billing_history_user_created;

DROP INDEX IF EXISTS idx_axis6_webhook_events_stripe_event_id;
DROP INDEX IF EXISTS idx_axis6_webhook_events_event_type;
DROP INDEX IF EXISTS idx_axis6_webhook_events_processed;
DROP INDEX IF EXISTS idx_axis6_webhook_events_created_at;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Stripe integration has been successfully removed';
END $$;