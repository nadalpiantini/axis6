import { createClient } from '@/lib/supabase/server';

export interface SubscriptionStatus {
  isPremium: boolean;
  tier: 'free' | 'premium';
  features: string[];
  canAccessFeature: (feature: string) => boolean;
}

/**
 * Get the current user's subscription status
 */
export async function getUserSubscriptionStatus(): Promise<SubscriptionStatus | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get subscription from database
    const { data: subscription } = await supabase
      .from('axis6_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get feature access
    const { data: features } = await supabase
      .from('axis6_feature_access')
      .select('*')
      .eq('is_active', true);

    const tier = subscription?.tier || 'free';
    const isPremium = tier === 'premium' && 
                     ['active', 'trialing'].includes(subscription?.status || '');

    // Filter features based on tier
    const userFeatures = features?.filter(feature => {
      if (feature.tier_required === 'free') return true;
      if (feature.tier_required === 'premium' && isPremium) return true;
      return false;
    }).map(f => f.feature_key) || [];

    return {
      isPremium,
      tier: isPremium ? 'premium' : 'free',
      features: userFeatures,
      canAccessFeature: (feature: string) => userFeatures.includes(feature),
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(featureKey: string): Promise<boolean> {
  const status = await getUserSubscriptionStatus();
  return status?.canAccessFeature(featureKey) || false;
}

/**
 * Get user's billing history
 */
export async function getUserBillingHistory(limit = 10) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: history } = await supabase
      .from('axis6_billing_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    return history || [];
  } catch (error) {
    console.error('Error getting billing history:', error);
    return [];
  }
}

/**
 * Feature keys for the application
 */
export const FEATURES = {
  // Free features
  BASIC_TRACKING: 'basic_tracking',
  STREAK_TRACKING: 'streak_tracking',
  BASIC_DASHBOARD: 'basic_dashboard',
  LIMITED_HISTORY: 'limited_history',
  
  // Premium features
  UNLIMITED_HISTORY: 'unlimited_history',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  GOAL_TRACKING: 'goal_tracking',
  DATA_EXPORT: 'data_export',
  PSYCHOLOGICAL_PROFILING: 'psychological_profiling',
  ACTIVITY_SUGGESTIONS: 'activity_suggestions',
  PRIORITY_SUPPORT: 'priority_support',
  EARLY_ACCESS: 'early_access',
} as const;

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES];